'use strict';

/* LUNEA Journal Performance V1
   - opens the journal before rendering so iOS gets immediate visual feedback
   - skips legacy archive migration during ordinary journal re-renders
   - debounces journal search/filter renders
   - detaches the archive-search subtree observer from the live list
   - keeps date filters compact and labeled on mobile
*/
(() => {
  const W = window;
  if (W.__LUNEA_JOURNAL_PERFORMANCE_V1__) return;
  W.__LUNEA_JOURNAL_PERFORMANCE_V1__ = true;

  const $ = id => document.getElementById(id);
  const LEGACY_KEYS = new Set(['LUNEA_READING_JOURNAL_V1', 'LUNEA_ARCHIVE_V3']);
  let searchTimer = 0;
  let filterFrame = 0;
  let listObserver = null;

  function addStyles() {
    if ($('luneaJournalPerformanceV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaJournalPerformanceV1Style';
    style.textContent = `
      #archiveOverlay #archiveSearchAdvanced{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:7px!important;
        margin:7px 0 6px!important;
      }
      #archiveOverlay #archiveSearchAdvanced > #archiveCategoryFilter,
      #archiveOverlay #archiveSearchAdvanced > #archiveStatusFilter{
        display:none!important;
      }
      #archiveOverlay .lunea-date-filter-v1{
        min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:7px;
        padding:0 9px;border:1px solid rgba(130,234,220,.18);border-radius:12px;
        background:rgba(7,13,21,.62);min-height:39px
      }
      #archiveOverlay .lunea-date-filter-v1 > span{
        color:#9fc8c4;font-size:9px;white-space:nowrap;letter-spacing:-.1px
      }
      #archiveOverlay .lunea-date-filter-v1 > input{
        min-width:0!important;width:100%!important;border:0!important;background:transparent!important;
        box-shadow:none!important;padding:7px 0!important;min-height:37px!important;color:#eefafa!important;
        font-size:10px!important
      }
      #archiveOverlay .archive-search-foot{
        position:static!important;display:flex!important;align-items:center!important;
        justify-content:space-between!important;gap:8px!important;margin:0 0 9px!important
      }
      #archiveOverlay #archiveSearchReset{flex:0 0 auto!important}
      @media(max-width:430px){
        #archiveOverlay #archiveSearchAdvanced{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
        #archiveOverlay .lunea-date-filter-v1{padding:0 7px!important;gap:5px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function wrapDateInput(id, label) {
    const input = $(id);
    if (!input || input.closest('.lunea-date-filter-v1')) return;
    const wrap = document.createElement('label');
    wrap.className = 'lunea-date-filter-v1';
    const text = document.createElement('span');
    text.textContent = label;
    input.replaceWith(wrap);
    wrap.append(text, input);
  }

  function polishControls() {
    addStyles();
    wrapDateInput('archiveDateFrom', '시작');
    wrapDateInput('archiveDateTo', '종료');
  }

  function canonicalDate(value) {
    const s = String(value || '');
    let m = s.match(/(20\d{2})[-\/.]\s*(\d{1,2})[-\/.]\s*(\d{1,2})/);
    if (!m) m = s.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (!m) return '';
    return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }

  function applyDateFilter() {
    filterFrame = 0;
    const list = $('archiveList');
    if (!list) return;
    const from = $('archiveDateFrom')?.value || '';
    const to = $('archiveDateTo')?.value || '';
    const items = [...list.querySelectorAll('.archive-item')];
    let visible = 0;

    items.forEach(item => {
      const date = canonicalDate(item.querySelector('.archive-meta')?.textContent || item.textContent || '');
      const show = (!from || (date && date >= from)) && (!to || (date && date <= to));
      item.hidden = !show;
      item.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    const summary = $('archiveSearchSummary');
    if (summary) summary.textContent = items.length ? `${visible}건 표시` : '검색 결과 없음';
  }

  function scheduleDateFilter() {
    if (filterFrame) cancelAnimationFrame(filterFrame);
    filterFrame = requestAnimationFrame(applyDateFilter);
  }

  function detachHeavyArchiveObserver() {
    const list = $('archiveList');
    if (!list) return null;
    if (list.dataset.luneaJournalPerfV1 === '1') return list;

    const fresh = list.cloneNode(false);
    fresh.dataset.luneaJournalPerfV1 = '1';
    list.replaceWith(fresh);

    if (listObserver) listObserver.disconnect();
    listObserver = new MutationObserver(scheduleDateFilter);
    listObserver.observe(fresh, { childList: true });
    return fresh;
  }

  function withoutLegacyMigration(fn) {
    const proto = W.Storage?.prototype;
    if (!proto || typeof proto.getItem !== 'function') return Promise.resolve().then(fn);

    const original = proto.getItem;
    let remaining = 2;
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      if (proto.getItem === patched) proto.getItem = original;
    };
    function patched(key) {
      if (this === W.localStorage && LEGACY_KEYS.has(String(key))) {
        remaining -= 1;
        if (remaining <= 0) restore();
        return '[]';
      }
      return original.call(this, key);
    }

    proto.getItem = patched;
    try {
      const result = fn();
      return Promise.resolve(result).finally(restore);
    } catch (error) {
      restore();
      return Promise.reject(error);
    }
  }

  async function waitForJournal() {
    for (let i = 0; i < 30; i += 1) {
      if (W.LUNEA_READING_JOURNAL?.render) return W.LUNEA_READING_JOURNAL;
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    return null;
  }

  async function fastRender() {
    polishControls();
    detachHeavyArchiveObserver();
    const journal = await waitForJournal();
    if (!journal?.render) return;
    await withoutLegacyMigration(() => journal.render());
    scheduleDateFilter();
  }

  async function openFast() {
    polishControls();
    detachHeavyArchiveObserver();
    const overlay = $('archiveOverlay');
    if (!overlay) return;

    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const modal = overlay.querySelector('.modal');
    if (modal) modal.scrollTop = 0;

    await new Promise(resolve => requestAnimationFrame(resolve));
    await fastRender();
  }

  function resetFilters() {
    const search = $('archiveSearch');
    if (search) search.value = '';
    ['archiveDateFrom', 'archiveDateTo', 'ljStatus', 'ljCat', 'archiveCategoryFilter', 'archiveStatusFilter'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    fastRender();
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.('#archiveBtn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openFast();
      return;
    }
    if (event.target?.closest?.('#archiveSearchReset')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      resetFilters();
    }
  }, true);

  document.addEventListener('input', event => {
    if (event.target?.id !== 'archiveSearch') return;
    event.stopImmediatePropagation();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(fastRender, 150);
  }, true);

  document.addEventListener('change', event => {
    const id = event.target?.id || '';
    if (!['archiveDateFrom', 'archiveDateTo', 'ljStatus', 'ljCat', 'archiveCategoryFilter', 'archiveStatusFilter'].includes(id)) return;
    event.stopImmediatePropagation();
    fastRender();
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(polishControls, 0), { once: true });
  } else {
    setTimeout(polishControls, 0);
  }
})();