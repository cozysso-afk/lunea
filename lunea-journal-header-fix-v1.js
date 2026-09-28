'use strict';

/* LUNEA Journal Header Fix V1
   Header visibility + authoritative mobile journal cleanup/performance pass.
   The advanced archive-search block duplicates the journal's own search/status/
   category controls and is intentionally hidden here. Its live-list observer is
   detached so chunked journal rendering does not rescan the whole archive on
   every appended row.

   V4 adds two iPhone journal safeguards:
   - compact two-column result/due date controls instead of full-width mobile rows
   - in-place validation status updates so the archive list is not rebuilt and the
     actual .archive-modal scroll position/open review panel are preserved
*/
(() => {
  if (window.__LUNEA_JOURNAL_HEADER_FIX_V1__) return;
  window.__LUNEA_JOURNAL_HEADER_FIX_V1__ = true;

  const W = window;
  const $ = id => document.getElementById(id);
  const DB_NAME = 'LUNEA_READING_DB';
  const DB_VERSION = 1;
  const STORE = 'journal';
  const STATUS = Object.freeze({
    pending:'○ 미확인',
    hit:'✓ 맞음',
    partial:'△ 부분',
    miss:'× 틀림',
    unverifiable:'? 판정불가'
  });
  const STATUS_BY_LABEL = Object.freeze(Object.fromEntries(Object.entries(STATUS).map(([key, label]) => [label, key])));
  let searchTimer = 0;
  let annotateTimer = 0;
  let journalDbPromise = null;

  const style = document.createElement('style');
  style.id = 'luneaJournalHeaderFixV1Style';
  style.textContent = `
    html.lunea-luminous-layout-v2 #archiveBtn{
      position:relative!important;
      overflow:visible!important;
      color:#9fe7dc!important;
      border-color:rgba(159,231,220,.20)!important;
      background:
        radial-gradient(circle at 50% 28%,rgba(159,231,220,.08),transparent 47%),
        linear-gradient(145deg,rgba(25,28,49,.78),rgba(11,13,27,.74))!important;
    }
    html.lunea-luminous-layout-v2 #archiveBtn > svg{display:none!important}
    html.lunea-luminous-layout-v2 #archiveBtn::before{
      content:'';width:18px;height:18px;display:block;background:currentColor;
      -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5z'/%3E%3Cpath d='M8 7.5h7M8 11h7M8 14.5h4.5'/%3E%3Cpath d='M5 16.5A2.5 2.5 0 0 1 7.5 14H19'/%3E%3C/svg%3E") center/contain no-repeat;
      mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5z'/%3E%3Cpath d='M8 7.5h7M8 11h7M8 14.5h4.5'/%3E%3Cpath d='M5 16.5A2.5 2.5 0 0 1 7.5 14H19'/%3E%3C/svg%3E") center/contain no-repeat;
      filter:drop-shadow(0 0 6px rgba(159,231,220,.20));
    }
    html.lunea-luminous-layout-v2 #archiveBtn::after{
      content:'기록';position:absolute;left:50%;bottom:3px;transform:translateX(-50%);
      font:700 6.6px/1 'Pretendard',sans-serif;letter-spacing:.1px;color:#cda8bd;white-space:nowrap;
    }
    html.lunea-luminous-layout-v2 #archiveBtn:active{
      border-color:rgba(159,231,220,.42)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 18px rgba(159,231,220,.10)!important;
    }

    /* Journal V2 already has search + status + category filters. The legacy
       advanced block is redundant and was the source of the two long blank
       date bars shown on iPhone. Remove it from the visual flow completely. */
    #archiveOverlay #archiveSearchAdvanced,
    #archiveOverlay .archive-search-foot{
      display:none!important;
    }

    /* Keep post-validation dates compact on iPhone. The final mobile regression
       owner intentionally used a one-column journal grid, so this selector is
       more specific and is the authoritative post-validation override. */
    @media (max-width:430px){
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid,
      #archiveOverlay .lj-review .lj-grid{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:6px!important;
        align-items:start!important;
      }
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid .lj-field,
      #archiveOverlay .lj-review .lj-grid .lj-field{
        min-width:0!important;
        width:auto!important;
        overflow:visible!important;
      }
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid .lj-field input[type='date'],
      #archiveOverlay .lj-review .lj-grid .lj-field input[type='date']{
        min-width:0!important;
        width:100%!important;
        max-width:158px!important;
        padding-left:6px!important;
        padding-right:4px!important;
        font-size:10px!important;
        justify-self:start!important;
      }
    }
    @media (max-width:330px){
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review .lj-grid,
      #archiveOverlay .lj-review .lj-grid{grid-template-columns:minmax(0,1fr)!important}
    }

    /* Let off-screen records stay cheap until scrolled into view. */
    #archiveOverlay .archive-item{
      content-visibility:auto;
      contain-intrinsic-size:auto 260px;
    }
  `;
  document.head.appendChild(style);

  const normalize = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const localDay = () => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  function patchButton() {
    const btn = $('archiveBtn');
    if (!btn) return false;
    btn.title = '타로 기록 · 검증 일지';
    btn.setAttribute('aria-label', '타로 기록 · 검증 일지');
    btn.dataset.journalEntry = 'visible';
    return true;
  }

  function detachArchiveSearchObserver() {
    const advanced = $('archiveSearchAdvanced');
    const list = $('archiveList');
    if (!advanced || !list || list.dataset.luneaJournalFastV3 === '1') return false;

    /* lunea-archive-search-v1 observes the old node with subtree:true.
       Replacing only the list node cleanly detaches that observer without
       touching stored data or the journal renderer, which resolves #archiveList
       fresh on every render. */
    const fresh = list.cloneNode(false);
    fresh.dataset.luneaJournalFastV3 = '1';
    list.replaceWith(fresh);
    return true;
  }

  function bindDebouncedSearch() {
    const input = $('archiveSearch');
    if (!input || input.dataset.luneaJournalFastV3 === '1') return false;
    input.dataset.luneaJournalFastV3 = '1';

    input.addEventListener('input', event => {
      /* Stop both the legacy archive-search listener and Journal V2's immediate
         oninput render. One render after typing settles is enough. */
      event.stopImmediatePropagation();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        try {
          const render = W.LUNEA_READING_JOURNAL?.render;
          if (typeof render === 'function') render();
        } catch (error) {
          console.error('[LUNEA Journal fast search]', error);
        }
      }, 180);
    }, true);
    return true;
  }

  function filteredJournalRows(rows) {
    const query = normalize($('archiveSearch')?.value).toLowerCase();
    const status = $('ljStatus')?.value || '';
    const category = $('ljCat')?.value || '';
    return (rows || []).filter(entry => {
      if (status && entry.status !== status) return false;
      if (category && entry.category !== category) return false;
      if (!query) return true;
      const reading = entry.reading || {};
      return [
        reading.title,
        reading.q,
        reading.ai,
        entry.outcome,
        entry.note,
        (entry.tags || []).join(' '),
        (reading.cards || []).map(card => card.name || card.text).join(' ')
      ].join(' ').toLowerCase().includes(query);
    });
  }

  async function annotateVisibleRows() {
    clearTimeout(annotateTimer);
    const list = $('archiveList');
    const journal = W.LUNEA_READING_JOURNAL;
    if (!list || typeof journal?.getAll !== 'function') return false;
    try {
      const rows = filteredJournalRows(await journal.getAll());
      const cards = [...list.children].filter(node => node.classList?.contains('archive-item'));
      cards.forEach((card, index) => {
        const row = rows[index];
        if (row?.id) card.dataset.luneaJournalId = String(row.id);
      });
      return true;
    } catch (error) {
      console.warn('[LUNEA Journal V4] row annotation skipped', error);
      return false;
    }
  }

  function queueAnnotation(delay = 0) {
    clearTimeout(annotateTimer);
    annotateTimer = setTimeout(() => { void annotateVisibleRows(); }, delay);
  }

  function installListAnnotator() {
    const list = $('archiveList');
    if (!list || list.dataset.luneaValidationObserverV4 === '1') return false;
    list.dataset.luneaValidationObserverV4 = '1';
    const observer = new MutationObserver(() => queueAnnotation(0));
    observer.observe(list, {childList:true});
    list.__luneaValidationObserverV4 = observer;
    queueAnnotation(0);
    return true;
  }

  function openJournalDb() {
    if (journalDbPromise) return journalDbPromise;
    journalDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('journal db open failed'));
    });
    return journalDbPromise;
  }

  async function patchStatus(id, status) {
    if (!STATUS[status]) throw new Error(`unknown journal status: ${status}`);
    const db = await openJournalDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const get = store.get(id);
      let updated = null;
      get.onsuccess = () => {
        const row = get.result;
        if (!row) {
          tx.abort();
          reject(new Error('journal row not found'));
          return;
        }
        row.status = status;
        if (status !== 'pending' && !row.resultDate) row.resultDate = localDay();
        row.updatedAt = Date.now();
        updated = row;
        store.put(row);
      };
      get.onerror = () => reject(get.error || new Error('journal row read failed'));
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => reject(tx.error || new Error('journal status save failed'));
      tx.onabort = () => reject(tx.error || new Error('journal status save aborted'));
    });
  }

  function syncSummary(rows) {
    const counts = {pending:0, hit:0, partial:0, miss:0, unverifiable:0};
    (rows || []).forEach(row => {
      if (Object.hasOwn(counts, row.status)) counts[row.status] += 1;
    });
    const verified = counts.hit + counts.partial + counts.miss;
    const score = verified ? Math.round((counts.hit + counts.partial * 0.5) / verified * 100) : null;
    const values = [(rows || []).length, verified, score == null ? '—' : `${score}%`, counts.pending];
    [...document.querySelectorAll('#ljStats .lj-stat b')].forEach((node, index) => {
      if (index < values.length) node.textContent = values[index];
    });
    const note = $('ljNote');
    if (note) {
      note.textContent = `IndexedDB 장기 보관 · 맞음 ${counts.hit} · 부분 ${counts.partial} · 틀림 ${counts.miss} · 판정불가 ${counts.unverifiable} · 점수=(맞음+부분×0.5)/확인 완료`;
    }
    const count = $('archiveCount');
    if (count) count.textContent = `${(rows || []).length}개`;
  }

  async function applyStatusInPlace(button, card, id, status) {
    if (button.dataset.luneaStatusSaving === '1') return;
    button.dataset.luneaStatusSaving = '1';
    const modal = $('archiveOverlay')?.querySelector('.archive-modal');
    const scrollTop = modal?.scrollTop || 0;
    try {
      const updated = await patchStatus(id, status);
      if (!updated) return;

      const badge = card.querySelector('.lj-badge');
      if (badge) {
        badge.dataset.s = status;
        badge.textContent = STATUS[status];
      }
      card.querySelectorAll('.lj-statuses button').forEach(node => {
        node.classList.toggle('on', STATUS_BY_LABEL[normalize(node.textContent)] === status);
      });
      const reviewButton = card.querySelector('.archive-actions button');
      if (reviewButton) reviewButton.textContent = status === 'pending' ? '검증하기' : '검증 수정';
      const resultDate = card.querySelector('.lj-grid input[type="date"]');
      if (resultDate && !resultDate.value && updated.resultDate) resultDate.value = updated.resultDate;

      const rows = await W.LUNEA_READING_JOURNAL?.getAll?.();
      if (Array.isArray(rows)) syncSummary(rows);

      /* If the user is looking at a status-filtered list and changes the row out
         of that filter, remove only this card. Never rebuild #archiveList. */
      const activeStatus = $('ljStatus')?.value || '';
      if (activeStatus && activeStatus !== status) card.remove();

      if (modal) {
        modal.scrollTop = scrollTop;
        requestAnimationFrame(() => { modal.scrollTop = scrollTop; });
        setTimeout(() => { modal.scrollTop = scrollTop; }, 60);
      }
      document.documentElement.dataset.luneaJournalValidationUpdate = 'in-place-v4';
    } catch (error) {
      console.error('[LUNEA Journal V4] status update failed', error);
      /* Do not invoke the old rerendering onclick after a failed intercepted save.
         Surface the failure and keep the user's current scroll/panel untouched. */
      try { alert('검증 상태 저장에 실패했어. 다시 눌러줘.'); } catch {}
    } finally {
      delete button.dataset.luneaStatusSaving;
    }
  }

  function bindInPlaceStatusUpdates() {
    if (document.documentElement.dataset.luneaJournalStatusV4 === '1') return false;
    document.documentElement.dataset.luneaJournalStatusV4 = '1';
    document.addEventListener('click', event => {
      const button = event.target?.closest?.('#archiveOverlay .lj-statuses button');
      if (!button) return;
      const card = button.closest('.archive-item');
      const id = card?.dataset?.luneaJournalId || '';
      const status = STATUS_BY_LABEL[normalize(button.textContent)] || '';
      /* If a just-rendered chunk has not been annotated yet, let Journal V2's
         original handler run rather than risking a write to the wrong record. */
      if (!card || !id || !status) {
        queueAnnotation(0);
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      void applyStatusInPlace(button, card, id, status);
    }, true);
    return true;
  }

  function settleJournal() {
    patchButton();
    bindDebouncedSearch();
    detachArchiveSearchObserver();
    installListAnnotator();
    bindInPlaceStatusUpdates();
    queueAnnotation(20);
    document.documentElement.dataset.luneaJournalFix = 'v4';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', settleJournal, { once: true });
  } else {
    settleJournal();
  }

  [120, 420, 900, 1700, 3000].forEach(ms => setTimeout(settleJournal, ms));
  document.addEventListener('pointerdown', event => {
    if (event.target?.closest?.('#archiveBtn')) {
      settleJournal();
      queueAnnotation(80);
    }
  }, true);

  console.info('✧ LUNEA Journal Header/Fast Fix V4 active · compact dates + in-place validation');
})();