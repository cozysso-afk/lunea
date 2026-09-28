'use strict';

/* LUNEA ARCHIVE CARD RESTORE V46
   ---------------------------------------------------------------
   Regression repair for archive rows after Horary V44.
   - Auxiliary Horary data inside Tarot/Daily readings must NOT turn the whole
     reading into a standalone Horary row.
   - Only explicit standalone HORARY and MEIHUA rows are non-card systems.
   - Tarot/Daily/Love/Career/Stock/General/Lenormand rows keep their saved card
     artwork, including legacy rows that V44 temporarily labelled non-card.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ARCHIVE_CARD_RESTORE_V46__) return;
  W.__LUNEA_ARCHIVE_CARD_RESTORE_V46__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function readArchive() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  }

  function cleanRowTitle(row) {
    const title = row?.querySelector?.('.archive-title');
    if (!title) return '';
    const clone = title.cloneNode(true);
    clone.querySelectorAll?.('.lj-badge').forEach(node => node.remove());
    return clean(clone.textContent || '');
  }

  function findReading(row, rows) {
    const sourceId = String(row?.dataset?.sourceArchiveId || row?.dataset?.archiveId || '').trim();
    if (sourceId) {
      const byId = rows.find(item => String(item?.id || '') === sourceId);
      if (byId) return byId;
    }
    const title = cleanRowTitle(row);
    const question = clean(row?.querySelector?.('.archive-q')?.textContent || '');
    if (!title && !question) return null;
    return rows.find(item => clean(item?.title) === title && clean(item?.q) === question) || null;
  }

  function isStandaloneHorary(reading) {
    return /^HORARY\b/i.test(clean(reading?.title));
  }

  function isMeihua(reading) {
    return !!(reading?.meihua?.version === 1 || /^MEIHUA\b/i.test(clean(reading?.title)));
  }

  function isExplicitNonCard(reading) {
    return isStandaloneHorary(reading) || isMeihua(reading);
  }

  function repair() {
    const list = $('archiveList');
    if (!list) return false;

    // First let the canonical card decorator rebuild strips from the saved
    // reading identity. V46 then removes strips only from true non-card rows.
    try { W.LUNEA_ARCHIVE_CARD_IMAGES_V1?.decorateArchive?.(); } catch {}

    const rows = readArchive();
    list.querySelectorAll(':scope > .archive-item').forEach(row => {
      const reading = findReading(row, rows);
      if (!reading) return;

      if (isExplicitNonCard(reading)) {
        row.querySelector(':scope > .lunea-archive-card-strip')?.remove();
        return;
      }

      const cards = Array.isArray(reading?.cards) ? reading.cards : [];
      if (!cards.length) return;

      // V44 used this marker and summary for any text-only cards, which caught
      // valid Tarot/Daily records that merely carried auxiliary Horary data.
      delete row.dataset.luneaNoncardV44;
      row.removeAttribute('data-lunea-noncard-v44');
      row.querySelector(':scope > .lunea-narrative-summary-v44')?.remove();
    });
    return true;
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    // V44 uses a single rAF. Run one frame later so our narrower classification
    // owns the final archive presentation without creating an observer loop.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(() => {
        scheduled = false;
        repair();
      }, 0);
    }));
  }

  function bind() {
    const list = $('archiveList');
    if (!list) return false;
    if (!list.__luneaArchiveCardRestoreV46Observer) {
      list.__luneaArchiveCardRestoreV46Observer = true;
      new MutationObserver(schedule).observe(list, {childList:true, subtree:false});
      ['archiveSearch','ljStatus','ljCat','archiveCategoryFilter','archiveStatusFilter'].forEach(id => {
        $(id)?.addEventListener('input', schedule, {passive:true});
        $(id)?.addEventListener('change', schedule, {passive:true});
      });
    }
    schedule();
    return true;
  }

  function boot() {
    bind();
    // Late-loaded Journal/Card modules are common on iPhone/PWA. Re-check only
    // during startup, then stop completely.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      bind();
      schedule();
      if (tries >= 32) clearInterval(timer);
    }, 150);

    W.LUNEA_ARCHIVE_CARD_RESTORE_V46 = Object.freeze({
      version:'46.0',
      repair,
      isStandaloneHorary,
      isMeihua,
      isExplicitNonCard
    });
    console.info('🃏 LUNEA Archive Card Restore V46 active');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
