'use strict';

/* LUNEA Mobile Interaction Hotfix V1
   - blocks the journal observers that repeatedly rescan/rewrite the archive
   - restores reliable iOS hit-testing for journal action buttons
   - keeps the Home portal in a deterministic order when late tiles arrive
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

  function normalizePortalOrder() {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid) return false;
    ensureHoraryTile();

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
      const hasThai = !!document.querySelector('#luneaHomePortalV8 .lunea-thai-home-tile');
      const hasIntimacy = !!document.querySelector('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
      if ((ready && hasHorary && hasThai && hasIntimacy) || tries >= 100) clearInterval(timer);
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
    relabelJournalRows,
  });
  console.info('✦ LUNEA Mobile Interaction Hotfix V1 active');
})();
