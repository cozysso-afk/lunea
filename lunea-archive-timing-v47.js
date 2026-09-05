'use strict';

/* LUNEA ARCHIVE FULL COPY + INLINE TIMING V47
   1) Journal/archive copy keeps Tarot AND attached astrology evidence.
   2) Inline Timing Oracle uses the real artwork as the primary card, not the legacy moon placeholder.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ARCHIVE_TIMING_V47__) return;
  W.__LUNEA_ARCHIVE_TIMING_V47__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const DB_NAME = 'LUNEA_READING_DB';
  const STORE = 'journal';
  const STATUS = {
    pending: '○ 미확인',
    hit: '✓ 맞음',
    partial: '△ 부분',
    miss: '× 틀림',
    unverifiable: '? 판정불가'
  };
  const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function localRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  function titleOf(item) {
    const el = item?.querySelector('.archive-title');
    if (!el) return '';
    return norm(Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent || '')
      .join(' '));
  }

  function matchLocalRow(item) {
    const rows = localRows().slice().sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
    const title = titleOf(item);
    const question = norm(item?.querySelector('.archive-q')?.textContent || '');
    return rows.find(row => norm(row?.title) === title && norm(row?.q) === question)
      || rows.find(row => question && norm(row?.q) === question)
      || rows.find(row => title && norm(row?.title) === title)
      || null;
  }

  function archiveText(row) {
    try {
      const api = W.LUNEA_EMERGENCY_REPAIR_V43;
      if (api?.archiveText) return String(api.archiveText(row) || '');
    } catch {}
    try { return JSON.stringify(row, null, 2); }
    catch { return String(row || ''); }
  }

  function validationTextFromDom(item) {
    const panel = item?.querySelector('.lj-review');
    if (!panel) return '';
    const lines = [];
    const status = norm(panel.querySelector('.lj-statuses .on')?.textContent || '');
    if (status) lines.push(`판정: ${status}`);
    panel.querySelectorAll('.lj-field').forEach(wrap => {
      const label = norm(wrap.querySelector('label')?.textContent || '');
      const input = wrap.querySelector('input, textarea');
      const value = norm(input?.value || '');
      if (label && value) lines.push(`${label}: ${value}`);
    });
    return lines.length ? `[검증]\n${lines.join('\n')}` : '';
  }

  function fullItemText(item, row) {
    return [archiveText(row), validationTextFromDom(item)].filter(Boolean).join('\n\n');
  }

  async function writeClipboard(text) {
    const value = String(text || '');
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('clipboard unavailable');
  }

  function readJournalRows() {
    return new Promise(resolve => {
      if (!('indexedDB' in W)) return resolve([]);
      let req;
      try { req = indexedDB.open(DB_NAME, 1); }
      catch { return resolve([]); }
      req.onerror = () => resolve([]);
      req.onupgradeneeded = () => {};
      req.onsuccess = () => {
        const db = req.result;
        try {
          if (!db.objectStoreNames.contains(STORE)) { db.close(); return resolve([]); }
          const tx = db.transaction(STORE, 'readonly');
          const get = tx.objectStore(STORE).getAll();
          get.onerror = () => { db.close(); resolve([]); };
          get.onsuccess = () => {
            const rows = Array.isArray(get.result) ? get.result : [];
            db.close();
            resolve(rows.sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0)));
          };
        } catch {
          try { db.close(); } catch {}
          resolve([]);
        }
      };
    });
  }

  function validationTextFromEntry(entry) {
    if (!entry || typeof entry !== 'object') return '';
    const lines = [`판정: ${STATUS[entry.status] || entry.status || '○ 미확인'}`];
    if (entry.resultDate) lines.push(`실제 결과 날짜: ${entry.resultDate}`);
    if (entry.dueDate) lines.push(`확인 예정일: ${entry.dueDate}`);
    if (entry.outcome) lines.push(`실제 결과: ${entry.outcome}`);
    if (entry.note) lines.push(`메모: ${entry.note}`);
    if (Array.isArray(entry.tags) && entry.tags.length) lines.push(`태그: ${entry.tags.join(', ')}`);
    return `[검증]\n${lines.join('\n')}`;
  }

  async function allJournalText() {
    const journal = await readJournalRows();
    const local = localRows();
    const byId = new Map(local.filter(x => x?.id).map(x => [String(x.id), x]));
    const blocks = journal.map(entry => {
      const reading = entry?.reading || {};
      const rich = (entry?.sourceArchiveId && byId.get(String(entry.sourceArchiveId)))
        || local.find(x => norm(x?.title) === norm(reading?.title) && norm(x?.q) === norm(reading?.q))
        || reading;
      return [archiveText(rich), validationTextFromEntry(entry)].filter(Boolean).join('\n\n');
    }).filter(Boolean);
    if (blocks.length) return blocks.join('\n\n────────────\n\n');
    return local.map(archiveText).filter(Boolean).join('\n\n────────────\n\n');
  }

  document.addEventListener('click', async event => {
    const copyButton = event.target?.closest?.('#archiveOverlay .archive-item .archive-actions button');
    if (copyButton && !copyButton.dataset.v43 && /복사/.test(norm(copyButton.textContent))) {
      const item = copyButton.closest('.archive-item');
      const row = matchLocalRow(item);
      if (row) {
        event.preventDefault();
        event.stopImmediatePropagation();
        try {
          await writeClipboard(fullItemText(item, row));
          const old = copyButton.textContent;
          copyButton.textContent = '✓ 전체 근거 복사됨';
          setTimeout(() => { if (copyButton.isConnected) copyButton.textContent = old || '복사'; }, 1000);
        } catch {
          alert('복사 권한을 확인해줘.');
        }
        return;
      }
    }

    const allButton = event.target?.closest?.('#copyAllArchive');
    if (allButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        const text = await allJournalText();
        if (!text) return alert('복사할 기록이 없어.');
        await writeClipboard(text);
        const old = allButton.textContent;
        allButton.textContent = '✓ 전체 근거 복사됨';
        setTimeout(() => { if (allButton.isConnected) allButton.textContent = old || '전체 복사'; }, 1000);
      } catch {
        alert('복사 권한을 확인해줘.');
      }
    }
  }, true);

  function installTimingStyle() {
    let style = document.getElementById('luneaArchiveTimingV47Style');
    if (style) style.remove();
    style = document.createElement('style');
    style.id = 'luneaArchiveTimingV47Style';
    style.textContent = `
      #luneaTimingInline.timing-inline{
        width:100%!important;
        max-width:none!important;
        display:grid!important;
        grid-template-columns:1fr!important;
        justify-items:center!important;
        align-items:start!important;
        gap:14px!important;
        padding:18px 16px!important;
        text-align:center!important;
      }
      #luneaTimingInline.timing-inline::before{
        content:none!important;
        display:none!important;
        width:0!important;
        height:0!important;
        min-width:0!important;
        min-height:0!important;
        background:none!important;
        border:0!important;
        box-shadow:none!important;
      }
      #luneaTimingInline.timing-inline>img{
        display:block!important;
        width:clamp(160px,48vw,190px)!important;
        height:auto!important;
        max-width:190px!important;
        min-width:160px!important;
        aspect-ratio:3/5!important;
        margin:0 auto!important;
        object-fit:contain!important;
        object-position:center!important;
        border-radius:14px!important;
        border:1px solid rgba(239,226,200,.30)!important;
        background:transparent!important;
        box-shadow:0 14px 30px rgba(0,0,0,.34),0 0 24px rgba(190,160,228,.09)!important;
        opacity:1!important;
        visibility:visible!important;
      }
      #luneaTimingInline .txt{
        width:min(100%,330px)!important;
        min-width:0!important;
        max-width:330px!important;
        text-align:center!important;
        margin:0 auto!important;
      }
      #luneaTimingInline .txt small{
        display:block!important;
        font-size:10px!important;
        line-height:1.45!important;
        letter-spacing:1.4px!important;
      }
      #luneaTimingInline .txt b{
        display:block!important;
        font-size:20px!important;
        line-height:1.38!important;
        margin:7px 0 8px!important;
      }
      #luneaTimingInline .txt span{
        display:block!important;
        font-size:12.5px!important;
        line-height:1.68!important;
      }
    `;
    document.head.appendChild(style);
  }

  function refreshTiming() {
    installTimingStyle();
    try { W.LUNEA_TIMING_UPLOADED_ART_V16?.upgradeAll?.(); } catch {}
    try { W.LUNEA_EMERGENCY_REPAIR_V43?.syncTimingArt?.(); } catch {}
  }

  function boot() {
    refreshTiming();
    [180, 550, 1200, 2400].forEach(ms => setTimeout(refreshTiming, ms));
    const observer = new MutationObserver(() => {
      if (document.getElementById('luneaTimingInline')) refreshTiming();
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
    console.info('📚 LUNEA archive full-copy + inline timing V47 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  W.addEventListener('pageshow', () => setTimeout(refreshTiming, 80), { passive: true });
})();
