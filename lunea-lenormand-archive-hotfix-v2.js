'use strict';

/*
  LUNEA LENORMAND ARCHIVE HOTFIX V2
  ---------------------------------
  - Reuses the Journal's existing detail button instead of adding a fifth action row.
  - Neutralizes the legacy "레노먼드 다시 보기" nested-overlay button.
  - Keeps Lenormand rows identifiable by archive id / exact title+question.
  - Repairs iPhone archive pointer/touch state without changing saved data.
*/
(() => {
  const W = window;
  if (W.__LUNEA_LENORMAND_ARCHIVE_HOTFIX_V2__) return;
  W.__LUNEA_LENORMAND_ARCHIVE_HOTFIX_V2__ = true;

  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  let queued = false;
  let observer = null;

  function readArchive() {
    try {
      const rows = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  function isLenormand(item) {
    return !!(
      item?.lenormand?.cards?.length ||
      String(item?.category || '').toUpperCase() === 'LENORMAND' ||
      /^LENORMAND\b/i.test(String(item?.title || ''))
    );
  }

  function cleanTitle(row) {
    const title = row?.querySelector('.archive-title');
    if (!title) return '';
    const clone = title.cloneNode(true);
    clone.querySelectorAll('.lj-badge').forEach(node => node.remove());
    return norm(clone.textContent || '');
  }

  function cleanQuestion(row) {
    return norm(row?.querySelector('.archive-q')?.textContent || '');
  }

  function findItem(row, items) {
    const sourceId = String(row?.dataset?.sourceArchiveId || row?.dataset?.archiveId || '').trim();
    if (sourceId) {
      const byId = items.find(item => String(item?.id || '') === sourceId);
      if (byId) return byId;
    }
    const title = cleanTitle(row);
    const question = cleanQuestion(row);
    if (!title && !question) return null;
    const exact = items.filter(item => norm(item?.title) === title && norm(item?.q) === question);
    return exact.sort((a,b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0))[0] || null;
  }

  function detailButton(row) {
    const actions = row?.querySelector('.archive-actions');
    if (!actions) return null;
    const buttons = [...actions.querySelectorAll(':scope > button:not(.ln-archive-restore)')];
    return buttons.find(button => /카드\s*[/·]?\s*해석|리딩\s*상세|레노먼드\s*상세/.test(norm(button.textContent))) || buttons[1] || null;
  }

  function neutralizeLegacyButton(row) {
    row.querySelectorAll('.ln-archive-restore').forEach(button => {
      button.hidden = true;
      button.disabled = true;
      button.tabIndex = -1;
      button.setAttribute('aria-hidden','true');
      button.style.display = 'none';
    });
  }

  function repairInteraction() {
    const overlay = $('archiveOverlay');
    if (!overlay) return;
    const shown = overlay.classList.contains('show');
    if (!shown) return;

    overlay.style.pointerEvents = 'auto';
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');

    const modal = overlay.querySelector('.archive-modal,.modal');
    if (modal) {
      modal.style.pointerEvents = 'auto';
      modal.style.touchAction = 'pan-y';
      modal.style.webkitOverflowScrolling = 'touch';
    }
  }

  function decorate() {
    const root = $('archiveList');
    if (!root) return false;
    const items = readArchive().filter(isLenormand);

    [...root.querySelectorAll(':scope > .archive-item')].forEach(row => {
      neutralizeLegacyButton(row);
      const item = findItem(row, items);
      if (!item) {
        delete row.dataset.luneaLenormandRow;
        return;
      }

      row.dataset.luneaLenormandRow = '1';
      const button = detailButton(row);
      if (button) {
        button.classList.add('ln-lenormand-detail-v2');
        button.textContent = '레노먼드 상세';
        button.setAttribute('aria-label','저장된 레노먼드 리딩 상세 보기');
      }
    });

    repairInteraction();
    return true;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorate();
    });
  }

  function installStyle() {
    if ($('luneaLenormandArchiveHotfixV2Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaLenormandArchiveHotfixV2Style';
    style.textContent = `
      #archiveOverlay .ln-archive-restore{display:none!important}
      #archiveOverlay .archive-item[data-lunea-lenormand-row="1"] .ln-lenormand-detail-v2{
        color:#dffbf8!important;
        border-color:rgba(112,224,214,.38)!important;
        background:linear-gradient(145deg,rgba(76,199,190,.10),rgba(164,132,225,.08))!important;
      }
      #archiveOverlay.show,
      #archiveOverlay.show .archive-modal,
      #archiveOverlay.show .archive-item,
      #archiveOverlay.show .archive-actions,
      #archiveOverlay.show .archive-actions button{pointer-events:auto!important}
      #archiveOverlay.show .archive-modal{
        touch-action:pan-y!important;
        -webkit-overflow-scrolling:touch!important;
      }
      #archiveOverlay .lunea-archive-card-strip{touch-action:auto!important}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function bind() {
    installStyle();

    const list = $('archiveList');
    if (list && !list.__luneaLenormandArchiveHotfixV2Observer) {
      list.__luneaLenormandArchiveHotfixV2Observer = true;
      observer = new MutationObserver(schedule);
      observer.observe(list,{childList:true,subtree:false});
    }

    document.addEventListener('click', event => {
      const legacy = event.target?.closest?.('.ln-archive-restore');
      if (!legacy) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const row = legacy.closest('.archive-item');
      const button = detailButton(row);
      if (button && !button.disabled) button.click();
    }, true);

    document.addEventListener('click', event => {
      if (!event.target?.closest?.('#archiveBtn')) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        decorate();
        repairInteraction();
      }));
    }, true);

    W.addEventListener('pageshow',() => setTimeout(() => {
      decorate();
      repairInteraction();
    },80),{passive:true});

    document.addEventListener('visibilitychange',() => {
      if (!document.hidden) setTimeout(() => {
        decorate();
        repairInteraction();
      },80);
    });

    schedule();
  }

  W.LUNEA_LENORMAND_ARCHIVE_HOTFIX_V2 = Object.freeze({
    version:'2.0',
    decorate,
    repairInteraction,
    findItem
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
