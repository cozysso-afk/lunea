'use strict';

/* LUNEA HOME VISUAL V36
   This module is the sole owner of Home tile placement. Feature modules may
   create tiles and announce them, but never decide their final position.
   No reading, RNG, prompt, archive, calculation, or data changes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HOME_VISUAL_V36__) return;
  W.__LUNEA_HOME_VISUAL_V36__ = true;

  const STYLE_ID = 'luneaHomeVisualV36Style';
  const ROOT_CLASS = 'lunea-home-visual-v36';
  const TILE_KEYS = Object.freeze([
    'general', 'love', 'career', 'stock', 'timing', 'intimacy',
    'lenormand', 'meihua', 'horary', 'thai',
  ]);
  const PRIMARY_KEYS = new Set(['general', 'love', 'career', 'stock', 'timing', 'intimacy']);
  const SECONDARY_KEYS = new Set(['lenormand', 'meihua', 'horary', 'thai']);
  const $ = (selector, root = document) => root.querySelector(selector);

  let observedGrid = null;
  let gridObserver = null;
  let observedApp = null;
  let appObserver = null;
  let layoutQueued = false;
  let applying = false;

  function retireOlderHomeLayers() {
    document.documentElement.classList.remove(
      'lunea-home-readability-v31',
      'lunea-home-final-tune-v32',
      'lunea-home-compact-distinct-v32',
      'lunea-home-ia-v33',
      'lunea-home-ia-v34',
      'lunea-home-ia-v35'
    );
    [
      'luneaHomeReadabilityV31Style',
      'luneaHomeFinalTuneV32Style',
      'luneaHomeCompactDistinctV32Style',
      'luneaHomeIAV33Style',
      'luneaHomeIAV34Style',
      'luneaHomeIAV35Style',
    ].forEach(id => document.getElementById(id)?.remove());
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html.${ROOT_CLASS} #luneaHomePortalV8{margin-bottom:9px;isolation:isolate}
      html.${ROOT_CLASS} #luneaHomePortalV8 .v8-title-row{margin-bottom:10px}
      html.${ROOT_CLASS} #luneaHomePortalV8 .v8-title-note{display:none}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-grid{
        display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;position:relative
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v33-group-label,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v33-quick-dock{display:contents}

      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile{
        --v36-a:184,188,238;--v36-b:207,187,231;--v36-strength:.17;
        grid-column:span 3;min-width:0;min-height:94px;padding:11px 12px;border-radius:19px;
        overflow:hidden;position:relative;isolation:isolate;
        border:1px solid rgba(239,241,255,.19);
        background:
          radial-gradient(120% 120% at 8% -20%,rgba(var(--v36-a),var(--v36-strength)),transparent 52%),
          radial-gradient(105% 110% at 104% 120%,rgba(var(--v36-b),calc(var(--v36-strength) * .72)),transparent 57%),
          linear-gradient(145deg,rgba(255,255,255,.105),rgba(255,255,255,.025) 38%,rgba(5,8,25,.56) 82%),
          rgba(11,14,36,.58);
        -webkit-backdrop-filter:blur(9px) saturate(128%);backdrop-filter:blur(9px) saturate(128%);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.25),
          inset 1px 0 0 rgba(var(--v36-a),.13),
          inset 0 -1px 0 rgba(1,3,14,.42),
          0 9px 22px rgba(0,1,13,.24),0 2px 5px rgba(0,0,0,.18);
        transform:translateZ(0);transition:transform 180ms ease,border-color 300ms ease,box-shadow 300ms ease
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile::before{
        content:'';position:absolute;z-index:-1;inset:-48% -35%;pointer-events:none;
        background:
          radial-gradient(ellipse at 27% 38%,rgba(var(--v36-a),.18),transparent 31%),
          radial-gradient(ellipse at 74% 62%,rgba(var(--v36-b),.13),transparent 34%);
        opacity:.78;transform:translate3d(-3%,1%,0) rotate(-2deg);
        animation:luneaV36AuroraDrift 12s ease-in-out infinite alternate
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile::after,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile::after{
        content:'';position:absolute;z-index:3;pointer-events:none;inset:1px;border-radius:17px;
        border-top:1px solid rgba(255,255,255,.18);
        background:linear-gradient(112deg,transparent 12%,rgba(255,255,255,.075) 32%,transparent 48%);
        opacity:.72;transition:transform 300ms ease,opacity 300ms ease
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:nth-of-type(2n)::before{animation-delay:-4s}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:nth-of-type(3n)::before{animation-delay:-8s}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:active,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile:active{
        transform:scale(.985) translateZ(0);border-color:rgba(var(--v36-a),.34);
        box-shadow:inset 0 2px 5px rgba(0,0,0,.19),inset 0 1px 0 rgba(255,255,255,.18),0 4px 12px rgba(0,1,13,.18)
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:active::after,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile:active::after{transform:translateX(9%);opacity:1}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile[aria-pressed="true"]{
        border-color:rgba(var(--v36-a),.46);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 20px rgba(var(--v36-a),.1),0 0 25px rgba(var(--v36-a),.13),0 9px 22px rgba(0,1,13,.24)
      }

      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-object,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:43px;height:43px;margin-bottom:8px;border-radius:15px;
        border:1px solid rgba(var(--v36-a),.34);
        background:
          radial-gradient(circle at 30% 20%,rgba(255,255,255,.2),transparent 34%),
          linear-gradient(145deg,rgba(var(--v36-a),.17),rgba(var(--v36-b),.055));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.23),inset 0 -5px 12px rgba(0,0,0,.13),0 5px 13px rgba(0,0,0,.15)
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-label,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        color:#fbfaff;font-size:12.8px;font-weight:650;line-height:1.1;letter-spacing:-.1px
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-sub,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px;color:#b9bdd0;font-size:9px;line-height:1.23;font-weight:500;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-open,
      html.${ROOT_CLASS} #luneaHomePortalV8 .thai-v24-arrow{color:rgb(var(--v36-a));font-size:15px;opacity:.92}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v20-ai-chip{display:none}

      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="general"]{--v36-a:200,196,255;--v36-b:231,208,255}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="love"]{--v36-a:255,154,196;--v36-b:231,91,165}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="career"]{--v36-a:255,207,132;--v36-b:224,166,86}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="stock"]{--v36-a:105,233,209;--v36-b:66,191,156}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="timing"]{--v36-a:151,207,255;--v36-b:146,154,255}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="intimacy"]{--v36-a:244,117,169;--v36-b:151,63,132}

      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"],
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"],
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"],
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]{
        min-height:84px;--v36-strength:.12
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"]::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"]::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"]::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]::before{animation-duration:14s;opacity:.58}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"]{--v36-a:117,224,241;--v36-b:213,225,239}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"]{--v36-a:114,207,159;--v36-b:207,177,99}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"]{--v36-a:190,139,255;--v36-b:134,102,255}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]{--v36-a:225,190,106;--v36-b:104,99,180}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object{
        overflow:hidden;color:transparent;background-image:url('assets/meihua/lunea_meihua_home_icon_v1.png?v=1');
        background-size:cover;background-position:center;background-repeat:no-repeat
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"] .mh-icon{opacity:0}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile{
        width:auto;max-width:none;display:grid;grid-template-columns:43px minmax(0,1fr) 15px;gap:8px;align-items:start
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{align-self:end;padding-bottom:1px}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none}

      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection{
        --v36-a:235,205,143;--v36-b:175,143,230;--v36-strength:.115;
        grid-column:1/-1;margin:0;min-width:0;overflow:hidden;position:relative;isolation:isolate;
        border:1px solid rgba(239,241,255,.16);border-radius:18px;
        background:
          radial-gradient(90% 180% at 4% 0,rgba(var(--v36-a),.12),transparent 58%),
          radial-gradient(80% 160% at 100% 100%,rgba(var(--v36-b),.08),transparent 60%),
          linear-gradient(145deg,rgba(255,255,255,.085),rgba(7,9,27,.55));
        -webkit-backdrop-filter:blur(8px) saturate(122%);backdrop-filter:blur(8px) saturate(122%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 0 -1px 0 rgba(0,0,0,.3),0 7px 18px rgba(0,1,13,.2);
        transition:transform 180ms ease,border-color 300ms ease,box-shadow 300ms ease
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:active{transform:scale(.985);border-color:rgba(var(--v36-a),.32)}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active){height:60px;min-height:60px}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .category-header{height:58px;min-height:58px;padding:7px 12px}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{width:37px;height:37px;flex-basis:37px}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-left{gap:10px;min-width:0}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3{font-size:0;line-height:1;margin:0;white-space:nowrap}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3::after{content:'SIGNAL · MESSAGE';font-size:11.9px;color:#fbfaff;font-weight:650;letter-spacing:-.1px}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text p{display:block;margin-top:3px;color:#b9bdd0;font-size:8.8px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts{display:none}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .toggle{color:rgb(var(--v36-a))}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection.active{height:auto;min-height:0;margin-top:0;border-radius:19px}

      .lunea-v36-system-divider{
        grid-column:1/-1;display:flex;align-items:center;gap:9px;height:17px;margin:2px 2px 0;
        color:#8e93aa;font:700 6.9px/1 'Cinzel',serif;letter-spacing:1.35px;text-transform:uppercase
      }
      .lunea-v36-system-divider::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,rgba(181,187,218,.22),transparent)}

      @keyframes luneaV36AuroraDrift{
        0%{transform:translate3d(-4%,2%,0) rotate(-2deg);opacity:.6}
        55%{transform:translate3d(3%,-2%,0) rotate(1deg);opacity:.82}
        100%{transform:translate3d(6%,2%,0) rotate(3deg);opacity:.67}
      }
      @media(max-width:390px){
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-grid{gap:6px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile,
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile{min-height:89px;padding:10px 11px}
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"],
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"],
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"],
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]{min-height:81px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-label,
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:12.2px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-sub,
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{font-size:8.7px}
      }
      @media(prefers-reduced-motion:reduce){
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile,
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile,
        html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection{transition:none}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile::before,
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile::before{animation:none;transform:none}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function tileForKey(grid, key) {
    if (key === 'thai') return grid.querySelector('.lunea-thai-home-tile,[data-key="thai"]');
    return grid.querySelector(`.lunea-v8-tile[data-key="${key}"]`);
  }

  function unwrapLegacyDock(grid) {
    const dock = grid.querySelector('.lunea-v33-quick-dock');
    if (!dock) return;
    [...dock.children].forEach(node => grid.insertBefore(node, dock));
    dock.remove();
  }

  function removeLegacyInlineOwnership(grid) {
    grid.style.removeProperty('grid-template-columns');
    grid.querySelectorAll('.lunea-v8-tile,.lunea-thai-home-tile').forEach(tile => {
      ['grid-column', 'min-width', 'width', 'max-width', 'display'].forEach(name => tile.style.removeProperty(name));
    });
    document.getElementById('luneaSignalMessageSection')?.style.removeProperty('grid-column');
  }

  function ensureDivider(grid) {
    const dividers = [...grid.querySelectorAll('.lunea-v35-system-divider,.lunea-v36-system-divider')];
    const divider = dividers.find(node => node.classList.contains('lunea-v36-system-divider')) || document.createElement('div');
    dividers.filter(node => node !== divider).forEach(node => node.remove());
    divider.className = 'lunea-v36-system-divider';
    divider.textContent = 'DIVINATION · ASTROLOGY';
    return divider;
  }

  function applyStructure() {
    if (applying) return false;
    const portal = $('#luneaHomePortalV8');
    const grid = $('#luneaHomePortalV8 .lunea-v8-grid');
    if (!portal || !grid) return false;
    applying = true;
    try {
      unwrapLegacyDock(grid);
      grid.querySelectorAll('.lunea-v33-group-label').forEach(node => node.remove());
      removeLegacyInlineOwnership(grid);

      const primary = TILE_KEYS.filter(key => PRIMARY_KEYS.has(key)).map(key => tileForKey(grid, key)).filter(Boolean);
      const secondary = TILE_KEYS.filter(key => SECONDARY_KEYS.has(key)).map(key => tileForKey(grid, key)).filter(Boolean);
      const signal = document.getElementById('luneaSignalMessageSection');
      const divider = ensureDivider(grid);
      const desired = [...primary, ...(signal ? [signal] : []), divider, ...secondary];
      const desiredSet = new Set(desired);
      const unmanaged = [...grid.children].filter(node => !desiredSet.has(node));
      const fullOrder = [...desired, ...unmanaged];
      const current = [...grid.children];
      const changed = fullOrder.length !== current.length || fullOrder.some((node, index) => current[index] !== node);
      if (changed) {
        const fragment = document.createDocumentFragment();
        fullOrder.forEach(node => fragment.appendChild(node));
        grid.appendChild(fragment);
      }

      secondary.forEach(tile => {
        if (tile.classList.contains('lunea-thai-home-tile')) tile.dataset.key = 'thai';
      });
      observeGrid(grid);
      return primary.length === 6 && secondary.length === 4 && !!signal;
    } finally {
      applying = false;
    }
  }

  function requestLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    const run = () => {
      layoutQueued = false;
      applyStructure();
    };
    if (typeof W.requestAnimationFrame === 'function') W.requestAnimationFrame(run);
    else queueMicrotask(run);
  }

  function observeGrid(grid) {
    if (!grid || observedGrid === grid) return;
    gridObserver?.disconnect();
    observedGrid = grid;
    gridObserver = new MutationObserver(requestLayout);
    gridObserver.observe(grid, {childList:true});
  }

  function observeApp() {
    const app = $('.app');
    if (!app || observedApp === app) return;
    appObserver?.disconnect();
    observedApp = app;
    appObserver = new MutationObserver(requestLayout);
    appObserver.observe(app, {childList:true});
  }

  function apply() {
    retireOlderHomeLayers();
    document.documentElement.classList.add(ROOT_CLASS);
    addStyles();
    observeApp();
    return applyStructure();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  [120, 480].forEach(ms => setTimeout(requestLayout, ms));
  W.addEventListener('lunea:home-portal-ready', requestLayout);
  W.addEventListener('lunea:home-tile-ready', requestLayout);
  W.addEventListener('pageshow', apply, {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });

  W.LUNEA_HOME_LAYOUT_V36 = Object.freeze({
    version:36,
    order:Object.freeze(['general','love','career','stock','timing','intimacy','signal','divider','lenormand','meihua','horary','thai']),
    apply,
    applyStructure,
    requestLayout,
  });
})();
