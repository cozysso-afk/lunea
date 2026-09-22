'use strict';

/* LUNEA Journal Header Fix V1
   Header visibility + authoritative mobile journal cleanup/performance pass.
   The advanced archive-search block duplicates the journal's own search/status/
   category controls and is intentionally hidden here. Its live-list observer is
   detached so chunked journal rendering does not rescan the whole archive on
   every appended row.
*/
(() => {
  if (window.__LUNEA_JOURNAL_HEADER_FIX_V1__) return;
  window.__LUNEA_JOURNAL_HEADER_FIX_V1__ = true;

  const W = window;
  const $ = id => document.getElementById(id);
  let searchTimer = 0;

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

    /* Let off-screen records stay cheap until scrolled into view. */
    #archiveOverlay .archive-item{
      content-visibility:auto;
      contain-intrinsic-size:auto 260px;
    }
  `;
  document.head.appendChild(style);

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

  function settleJournal() {
    patchButton();
    bindDebouncedSearch();
    detachArchiveSearchObserver();
    document.documentElement.dataset.luneaJournalFix = 'v3';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', settleJournal, { once: true });
  } else {
    settleJournal();
  }

  [120, 420, 900, 1700, 3000].forEach(ms => setTimeout(settleJournal, ms));
  document.addEventListener('pointerdown', event => {
    if (event.target?.closest?.('#archiveBtn')) settleJournal();
  }, true);

  console.info('✧ LUNEA Journal Header/Fast Fix V3 active');
})();
