'use strict';

/* LUNEA Mobile Interaction Hotfix V1
   - blocks the journal observers that repeatedly rescan/rewrite the archive
   - restores reliable iOS hit-testing for journal action buttons
   - keeps the Home portal in a deterministic order when late tiles arrive
   - normalizes Lenormand / Thai Astrology visual weight in the Home grid
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

    /* Home portal: Lenormand gets its own teal / silver / lavender identity. */
    #luneaHomePortalV8 .lunea-v8-grid .lunea-v8-tile[data-key="lenormand"]{
      border-color:rgba(140,213,218,.23)!important;
      background:
        radial-gradient(circle at 16% 5%,rgba(132,220,221,.13),transparent 28%),
        radial-gradient(circle at 92% 93%,rgba(199,178,255,.08),transparent 34%),
        linear-gradient(148deg,rgba(14,37,48,.91),rgba(8,11,25,.985))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 10px 26px rgba(0,0,0,.16),0 0 22px rgba(98,197,202,.045)!important;
    }
    #luneaHomePortalV8 .lunea-v8-grid .lunea-v8-tile[data-key="lenormand"] .lunea-v8-object{
      width:49px!important;height:49px!important;padding:0!important;overflow:hidden!important;border-radius:16px!important;
      border:1px solid rgba(193,235,237,.36)!important;
      background:linear-gradient(145deg,rgba(65,152,160,.30),rgba(116,99,164,.22))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 0 19px rgba(94,203,206,.10)!important;
    }
    #luneaHomePortalV8 .lunea-v8-grid .lunea-v8-tile[data-key="lenormand"] .lunea-v8-object img{
      display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:inherit!important;
    }

    /* Thai Astrology becomes a normal half-width portal tile beside Lenormand. */
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile{
      grid-column:auto!important;min-height:116px!important;padding:12px 11px!important;display:block!important;
      position:relative!important;overflow:hidden!important;text-align:left!important;
      border-color:rgba(219,195,132,.20)!important;
      background:
        radial-gradient(circle at 16% 5%,rgba(224,190,108,.11),transparent 28%),
        radial-gradient(circle at 92% 92%,rgba(148,116,206,.075),transparent 34%),
        linear-gradient(148deg,rgba(31,26,47,.91),rgba(8,10,23,.985))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 26px rgba(0,0,0,.15),0 0 22px rgba(203,171,92,.04)!important;
    }
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-orb{
      width:47px!important;height:47px!important;border-radius:16px!important;margin:0 0 10px 0!important;
      display:grid!important;place-items:center!important;color:#ead9a2!important;
      border:1px solid rgba(234,214,158,.28)!important;
      background:radial-gradient(circle at 32% 24%,rgba(255,255,255,.22),transparent 18%),linear-gradient(145deg,rgba(205,172,92,.20),rgba(115,88,165,.12))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 0 18px rgba(214,181,100,.07)!important;
    }
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-orb svg{width:31px!important;height:31px!important}
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-copy{display:block!important;text-align:left!important;min-width:0!important}
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-copy small{display:none!important}
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-copy b{
      display:block!important;color:#f3f1f7!important;font:650 13px/1.2 'Cinzel','Noto Serif KR',serif!important;letter-spacing:.2px!important;
      white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;
    }
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-copy span{
      display:block!important;color:#9293a4!important;font-size:9.4px!important;line-height:1.35!important;margin-top:5px!important;
      white-space:normal!important;overflow-wrap:anywhere!important;
    }
    #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-arrow{
      position:absolute!important;right:11px!important;top:10px!important;color:#ccb776!important;font-size:18px!important;line-height:1!important;opacity:.78!important;
    }
    @media(max-width:390px){
      #luneaHomePortalV8 .lunea-v8-grid .lunea-v8-tile[data-key="lenormand"] .lunea-v8-object,
      #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-orb{width:45px!important;height:45px!important}
      #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile{min-height:110px!important;padding:11px 10px!important}
      #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-copy b{font-size:12px!important}
      #luneaHomePortalV8 .lunea-v8-grid .lunea-thai-home-tile .thai-v24-copy span{font-size:9px!important}
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  const PORTAL_RANK = Object.freeze({
    general: 0,
    career: 1,
    love: 2,
    stock: 3,
    timing: 4,
    horary: 5,
    lenormand: 6,
    thai: 7,
    intimacy: 8,
  });

  function portalKey(node) {
    if (!node) return '';
    if (node.classList?.contains('lunea-thai-home-tile')) return 'thai';
    return String(node.dataset?.key || '').toLowerCase();
  }

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

    const current = [...grid.children];
    const desired = current
      .map((node, index) => ({node, index, rank: PORTAL_RANK[portalKey(node)] ?? 100 + index}))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(x => x.node);

    const changed = desired.some((node, index) => node !== current[index]);
    if (changed) desired.forEach(node => grid.appendChild(node));

    const oracleCount = desired.filter(node => {
      const key = portalKey(node);
      return key && key !== 'thai';
    }).length;
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
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ready = normalizePortalOrder();
      const hasHorary = !!document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="horary"]');
      const hasLenormand = !!document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"]');
      const hasThai = !!document.querySelector('#luneaHomePortalV8 .lunea-thai-home-tile');
      const hasIntimacy = !!document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
      if ((ready && hasHorary && hasLenormand && hasThai && hasIntimacy) || tries >= 100) clearInterval(timer);
    }, 120);
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
  W.addEventListener('pageshow', () => setTimeout(normalizePortalOrder, 60), {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(normalizePortalOrder, 60);
  });

  W.LUNEA_MOBILE_INTERACTION_HOTFIX_V1 = Object.freeze({
    normalizePortalOrder,
    normalizePortalVisuals,
    relabelJournalRows,
  });
  console.info('✦ LUNEA Mobile Interaction Hotfix V1 active');
})();
