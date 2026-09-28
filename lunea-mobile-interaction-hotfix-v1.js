'use strict';

/* LUNEA Mobile Interaction Hotfix V1
   - blocks the journal observers that repeatedly rescan/rewrite the archive
   - restores reliable iOS hit-testing for journal action buttons
   - creates the Horary Home tile while leaving final placement to Home V36
   - normalizes Lenormand artwork and Thai Home copy without moving tiles
   Loaded parser-time before Structural Routing so the observer guard is active
   before Journal Detail / Archive Search attach their observers.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MOBILE_INTERACTION_HOTFIX_V1__) return;
  W.__LUNEA_MOBILE_INTERACTION_HOTFIX_V1__ = true;

  const NativeMutationObserver = W.MutationObserver;
  if (typeof NativeMutationObserver === 'function' && !W.__LUNEA_ARCHIVE_OBSERVER_GUARD_V1__) {
    W.__LUNEA_ARCHIVE_OBSERVER_GUARD_V1__ = true;

    function GuardedMutationObserver(callback) {
      const callbackName = String(callback?.name || '');
      const observer = new NativeMutationObserver(callback);
      const nativeObserve = observer.observe.bind(observer);

      observer.observe = (target, options = {}) => {
        const id = String(target?.id || '');

        // Advanced archive search is visually retired. Its subtree observer
        // rescans every journal row after each chunk and is pure overhead now.
        if (id === 'archiveList' && (options?.subtree || options?.characterData)) return;

        // The two journal performance layers also install date-filter observers.
        // The date controls are hidden, so these full-list passes are unnecessary.
        if (id === 'archiveList' && /scheduleDateFilter/i.test(callbackName)) return;

        // Journal Detail V51 observes the entire overlay and normalizeToolbar()
        // rewrites its own recovery row, which can create a perpetual mutation loop.
        if (id === 'archiveOverlay' && callbackName === 'normalizeSoon' && options?.subtree) return;

        return nativeObserve(target, options);
      };
      return observer;
    }

    GuardedMutationObserver.prototype = NativeMutationObserver.prototype;
    try { Object.setPrototypeOf(GuardedMutationObserver, NativeMutationObserver); } catch {}
    W.MutationObserver = GuardedMutationObserver;
  }

  const style = document.createElement('style');
  style.id = 'luneaMobileInteractionHotfixV1Style';
  style.textContent = `
    #archiveOverlay .archive-item{
      content-visibility:visible!important;
      contain-intrinsic-size:none!important;
    }
    #archiveOverlay .archive-actions button,
    #archiveOverlay .lj-statuses button,
    #archiveOverlay .lj-save,
    #archiveOverlay .archive-toolbar button,
    #archiveOverlay .lj-tools button{
      pointer-events:auto!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent;
    }
    #archiveOverlay .archive-modal{
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
    }

    /* Thai is a standard secondary Home card in V36. Keep its feature-owned
       markup, but make the final visual geometry identical to sibling tiles. */
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile{
      display:block!important;
      grid-template-columns:none!important;
      gap:0!important;
      align-items:initial!important;
      text-align:left!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
      display:grid!important;
      place-items:center!important;
      width:43px!important;
      height:43px!important;
      margin:0 0 8px 0!important;
      border-radius:15px!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb img{
      width:100%!important;
      height:100%!important;
      object-fit:cover!important;
      object-position:50% 48%!important;
      transform:scale(1.20)!important;
      transform-origin:center!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{
      display:block!important;
      min-width:0!important;
      max-width:none!important;
      width:auto!important;
      overflow:visible!important;
      padding:0!important;
      text-align:left!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{
      display:none!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
      display:block!important;
      max-width:none!important;
      margin:0!important;
      color:#fbfaff!important;
      font-family:'Cinzel','Pretendard',sans-serif!important;
      font-size:12.8px!important;
      font-weight:650!important;
      line-height:1.1!important;
      letter-spacing:-.1px!important;
      white-space:nowrap!important;
      overflow:visible!important;
      text-overflow:clip!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
      display:block!important;
      min-width:0!important;
      max-width:100%!important;
      margin-top:4px!important;
      color:#bec2d4!important;
      font-size:9px!important;
      line-height:1.23!important;
      font-weight:500!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }
    html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{
      position:absolute!important;
      top:14px!important;
      right:12px!important;
      align-self:auto!important;
      justify-self:auto!important;
      color:rgb(var(--v36-a))!important;
      font-size:15px!important;
      font-weight:300!important;
      line-height:1!important;
      opacity:.9!important;
    }
    @media(max-width:390px){
      html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile{
        padding:10px 11px!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:43px!important;
        height:43px!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        font-size:12.2px!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        font-size:8.7px!important;
      }
      html.lunea-home-visual-v36 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{
        top:14px!important;
        right:11px!important;
      }
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function ensureHoraryTile() {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid || grid.querySelector('.lunea-v8-tile[data-key="horary"]')) return false;

    const category = [...document.querySelectorAll('.category')].find(cat =>
      /HORARY/i.test(cat.querySelector('.cat-text h3,h3')?.textContent || '')
    );
    if (!category) return false;

    category.classList.add('lunea-v8-source-category');
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'lunea-v8-tile';
    tile.dataset.key = 'horary';
    tile.setAttribute('aria-pressed', 'false');

    const sourceArt = category.querySelector('.cat-icon img');
    const art = sourceArt
      ? `<img src="${String(sourceArt.getAttribute('src') || '')}" alt="" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`
      : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="9" ry="4.1"/><ellipse cx="12" cy="12" rx="4.1" ry="9" transform="rotate(45 12 12)"/></svg>';

    tile.innerHTML = `<span class="lunea-v8-object">${art}</span><span class="lunea-v8-label">HORARY</span><span class="lunea-v8-sub">성사 · 상황 · 리셉션 · 타이밍</span><span class="lunea-v8-open">＋</span>`;
    tile.addEventListener('click', () => {
      document.querySelectorAll('.category.lunea-v8-source-category').forEach(node => {
        node.classList.toggle('lunea-v8-source-active', node === category);
      });
      document.querySelectorAll('#luneaHomePortalV8 .lunea-v8-tile').forEach(node => {
        node.setAttribute('aria-pressed', node === tile ? 'true' : 'false');
      });
      const header = category.querySelector('.category-header');
      const toggle = category.querySelector('.toggle');
      if (header && (!category.classList.contains('active') || !toggle || toggle.textContent.trim() === '+')) header.click();
      setTimeout(() => category.scrollIntoView({behavior:'smooth', block:'start'}), 70);
    });
    grid.appendChild(tile);
    W.dispatchEvent(new CustomEvent('lunea:home-tile-ready', {detail:{key:'horary'}}));
    return true;
  }

  function normalizePortalVisuals(grid) {
    if (!grid) return false;

    const lenormand = grid.querySelector('.lunea-v8-tile[data-key="lenormand"]');
    const lenormandImg = lenormand?.querySelector('.lunea-v8-object img');
    if (lenormandImg) {
      const icon = './assets/lenormand/lunea_lenormand_home_icon_v1.svg';
      if (lenormandImg.getAttribute('src') !== icon) lenormandImg.setAttribute('src', icon);
      lenormandImg.setAttribute('width', '512');
      lenormandImg.setAttribute('height', '512');
    }

    const thai = grid.querySelector('.lunea-thai-home-tile');
    if (thai) {
      thai.dataset.key = 'thai';
      thai.setAttribute('aria-pressed', 'false');
      const kicker = thai.querySelector('.thai-v24-copy small');
      const title = thai.querySelector('.thai-v24-copy b');
      const sub = thai.querySelector('.thai-v24-copy span');
      const arrow = thai.querySelector('.thai-v24-arrow');
      if (kicker) kicker.textContent = 'THAI ASTROLOGY';
      if (title) title.textContent = 'THAI ASTROLOGY';
      if (sub) sub.textContent = '출생운 · 8영역 · 보조 흐름';
      if (arrow) arrow.textContent = '＋';
    }
    return !!(lenormand || thai);
  }

  function normalizePortalOrder() {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid) return false;
    ensureHoraryTile();
    normalizePortalVisuals(grid);
    W.LUNEA_HOME_LAYOUT_V36?.requestLayout?.();
    const oracleCount = grid.querySelectorAll('.lunea-v8-tile[data-key]').length;
    const note = document.querySelector('#luneaHomePortalV8 .v8-title-note');
    if (note && oracleCount) note.textContent = `${oracleCount} ORACLES`;
    return true;
  }

  function relabelJournalRows() {
    document.querySelectorAll('#archiveOverlay .archive-item .archive-actions').forEach(actions => {
      const buttons = [...actions.querySelectorAll(':scope > button')];
      const detail = buttons.find(btn => /카드\s*[/·]?\s*해석|리딩\s*상세/.test(String(btn.textContent || '').trim())) ||
        (buttons.length >= 4 ? buttons[1] : null);
      if (detail && detail.textContent !== '리딩 상세') detail.textContent = '리딩 상세';
    });
  }

  function settleHome() {
    normalizePortalOrder();
    [120,480].forEach(ms => setTimeout(normalizePortalOrder,ms));
  }

  function scheduleJournalRelabel() {
    [0, 50, 120, 240, 420].forEach(ms => setTimeout(relabelJournalRows, ms));
  }

  document.addEventListener('pointerdown', event => {
    if (event.target?.closest?.('#archiveBtn')) scheduleJournalRelabel();
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', settleHome, {once:true});
  } else {
    settleHome();
  }
  W.addEventListener('lunea:home-portal-ready', normalizePortalOrder);

  W.LUNEA_MOBILE_INTERACTION_HOTFIX_V1 = Object.freeze({
    normalizePortalOrder,
    normalizePortalVisuals,
    relabelJournalRows,
  });
  console.info('✦ LUNEA Mobile Interaction Hotfix V1 active');
})();