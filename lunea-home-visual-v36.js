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
        --v36-a:184,188,238;--v36-b:207,187,231;--v36-strength:.22;
        grid-column:span 3;min-width:0;min-height:94px;padding:11px 12px;border-radius:19px;
        overflow:hidden;position:relative;isolation:isolate;
        border:1px solid rgba(241,243,255,.23);
        background:
          radial-gradient(112% 132% at 5% -18%,rgba(var(--v36-a),var(--v36-strength)),transparent 48%),
          radial-gradient(94% 118% at 98% 116%,rgba(var(--v36-b),calc(var(--v36-strength) * .78)),transparent 52%),
          linear-gradient(148deg,rgba(255,255,255,.13),rgba(255,255,255,.045) 34%,rgba(8,10,30,.34) 74%,rgba(4,6,20,.46)),
          rgba(12,15,39,.42);
        -webkit-backdrop-filter:blur(9px) saturate(132%);backdrop-filter:blur(9px) saturate(132%);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.34),
          inset 1px 0 0 rgba(var(--v36-a),.17),
          inset -1px 0 0 rgba(var(--v36-b),.08),
          inset 0 -1px 0 rgba(1,3,14,.50),
          inset 0 -15px 26px rgba(2,4,18,.11),
          0 10px 24px rgba(0,1,13,.23),0 2px 5px rgba(0,0,0,.15);
        transform:translateZ(0);transition:transform 180ms ease,border-color 300ms ease,box-shadow 300ms ease
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile::before{
        content:'';position:absolute;z-index:0;inset:-46% -34%;pointer-events:none;
        background:
          radial-gradient(ellipse at 24% 34%,rgba(var(--v36-a),.31),transparent 30%),
          radial-gradient(ellipse at 76% 66%,rgba(var(--v36-b),.23),transparent 34%);
        opacity:.88;transform:translate3d(-4%,2%,0) rotate(-2deg);
        animation:luneaV36AuroraDrift 12s ease-in-out infinite alternate
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile::after,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile::after{
        content:'';position:absolute;z-index:3;pointer-events:none;inset:1px;border-radius:17px;
        border:1px solid rgba(255,255,255,.055);border-top-color:rgba(255,255,255,.23);
        background:linear-gradient(112deg,transparent 10%,rgba(255,255,255,.095) 31%,transparent 49%);
        opacity:.82;transition:transform 300ms ease,opacity 300ms ease
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile>* ,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile>*{position:relative;z-index:2}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:nth-of-type(2n)::before{animation-delay:-4s}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:nth-of-type(3n)::before{animation-delay:-8s}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:active,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile:active{
        transform:scale(.985) translateZ(0);border-color:rgba(var(--v36-a),.40);
        box-shadow:inset 0 2px 6px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.22),0 4px 12px rgba(0,1,13,.17)
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile:active::after,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile:active::after{transform:translateX(9%);opacity:1}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile[aria-pressed="true"]{
        border-color:rgba(var(--v36-a),.49);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 0 24px rgba(var(--v36-a),.12),0 0 27px rgba(var(--v36-a),.14),0 10px 24px rgba(0,1,13,.23)
      }

      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-object,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:43px;height:43px;margin-bottom:8px;border-radius:15px;overflow:hidden;position:relative;
        border:1px solid rgba(var(--v36-a),.31);
        background:
          radial-gradient(circle at 29% 19%,rgba(255,255,255,.22),transparent 31%),
          linear-gradient(145deg,rgba(var(--v36-a),.14),rgba(var(--v36-b),.045));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.27),
          inset -1px -1px 0 rgba(var(--v36-b),.10),
          inset 0 -8px 15px rgba(2,4,20,.17),
          0 5px 14px rgba(0,0,0,.14),0 0 15px rgba(var(--v36-a),.055)
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-object::after,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb::after{
        content:'';position:absolute;z-index:4;inset:1px;border-radius:13px;pointer-events:none;
        border-top:1px solid rgba(255,255,255,.22);
        background:linear-gradient(128deg,rgba(255,255,255,.07),transparent 35%,rgba(var(--v36-b),.045))
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-object img,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb img{
        width:100%;height:100%;display:block;object-fit:cover;border-radius:inherit;
        opacity:.91;filter:saturate(.88) brightness(.96) contrast(.95);transform:scale(1.05);transform-origin:center
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-object svg,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb svg{opacity:.92;filter:drop-shadow(0 0 5px rgba(var(--v36-a),.09))}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-label,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        color:#fbfaff;font-size:12.8px;font-weight:650;line-height:1.1;letter-spacing:-.1px
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-sub,
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px;color:#bec2d4;font-size:9px;line-height:1.23;font-weight:500;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-open,
      html.${ROOT_CLASS} #luneaHomePortalV8 .thai-v24-arrow{color:rgb(var(--v36-a));font-size:15px;opacity:.9}
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
        min-height:84px;--v36-strength:.16
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"]::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"]::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"]::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]::before{animation-duration:14s;opacity:.69}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"]{--v36-a:117,224,241;--v36-b:213,225,239}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"]{--v36-a:114,207,159;--v36-b:207,177,99}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"]{--v36-a:190,139,255;--v36-b:134,102,255}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]{--v36-a:225,190,106;--v36-b:104,99,180}
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object{
        color:transparent;
        background-image:linear-gradient(135deg,rgba(255,255,255,.055),rgba(8,12,28,.09)),url('assets/meihua/lunea_meihua_home_icon_v1.png?v=1');
        background-size:cover,cover;background-position:center,center;background-repeat:no-repeat,no-repeat;background-blend-mode:screen,normal
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"] .mh-icon{opacity:0}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile{
        width:auto;max-width:none;display:grid;grid-template-columns:43px minmax(0,1fr) 13px;gap:7px;align-items:center
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{
        align-self:center;min-width:0;max-width:100%;overflow:hidden;padding-bottom:0;text-align:left
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none}
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        display:block;min-width:0;max-width:100%;font-size:11.4px;line-height:1.12;letter-spacing:.02px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        display:block;min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{align-self:start;justify-self:end}

      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection{
        --v36-a:235,205,143;--v36-b:175,143,230;--v36-strength:.15;
        grid-column:1/-1;margin:0;min-width:0;overflow:hidden;position:relative;isolation:isolate;
        border:1px solid rgba(241,243,255,.20);border-radius:18px;
        background:
          radial-gradient(92% 190% at 3% -8%,rgba(var(--v36-a),.17),transparent 53%),
          radial-gradient(84% 175% at 100% 112%,rgba(var(--v36-b),.12),transparent 56%),
          linear-gradient(148deg,rgba(255,255,255,.11),rgba(255,255,255,.025) 38%,rgba(7,9,27,.43));
        -webkit-backdrop-filter:blur(8px) saturate(126%);backdrop-filter:blur(8px) saturate(126%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.27),inset -1px 0 0 rgba(var(--v36-b),.06),inset 0 -1px 0 rgba(0,0,0,.34),0 8px 19px rgba(0,1,13,.19);
        transition:transform 180ms ease,border-color 300ms ease,box-shadow 300ms ease
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:active{transform:scale(.985);border-color:rgba(var(--v36-a),.36)}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active){height:60px;min-height:60px}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .category-header{height:58px;min-height:58px;padding:7px 12px}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{
        width:37px;height:37px;flex-basis:37px;border-radius:12px;opacity:.91;filter:saturate(.86) brightness(.95)
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-left{gap:10px;min-width:0;overflow:hidden}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text{min-width:0;overflow:hidden}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3{
        margin:0;min-width:0;font-size:11.9px;line-height:1.05;color:#fbfaff;font-weight:650;letter-spacing:-.1px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3::before,
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3::after{content:none!important;display:none!important}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text p{display:block;margin-top:3px;color:#bec2d4;font-size:8.8px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts{display:none}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .toggle{color:rgb(var(--v36-a))}
      html.${ROOT_CLASS} #luneaHomePortalV8 #luneaSignalMessageSection.active{height:auto;min-height:0;margin-top:0;border-radius:19px}

      .lunea-v36-system-divider{
        grid-column:1/-1;display:flex;align-items:center;gap:9px;height:17px;margin:2px 2px 0;
        color:#969bb2;font:700 6.9px/1 'Cinzel',serif;letter-spacing:1.35px;text-transform:uppercase
      }
      .lunea-v36-system-divider::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,rgba(188,194,225,.25),transparent)}

      @keyframes luneaV36AuroraDrift{
        0%{transform:translate3d(-7%,3%,0) rotate(-2deg);opacity:.72}
        55%{transform:translate3d(3%,-3%,0) rotate(1deg);opacity:.94}
        100%{transform:translate3d(8%,2%,0) rotate(3deg);opacity:.78}
      }
      @media(max-width:390px){
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-grid{gap:6px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-tile,
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile{min-height:89px;padding:10px 11px}
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="lenormand"],
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="meihua"],
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="horary"],
        html.${ROOT_CLASS} #luneaHomePortalV8 [data-key="thai"]{min-height:81px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-label{font-size:12.2px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-v8-sub{font-size:8.7px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile{grid-template-columns:41px minmax(0,1fr) 12px;gap:6px;padding-left:10px;padding-right:9px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{width:41px;height:41px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:10.9px}
        html.${ROOT_CLASS} #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{font-size:8.3px}
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
    const matches = [...grid.children].filter(node => {
      if (key === 'thai') return node.classList?.contains('lunea-thai-home-tile') || node.dataset?.key === 'thai';
      return node.classList?.contains('lunea-v8-tile') && node.dataset?.key === key;
    });
    const [tile, ...duplicates] = matches;
    duplicates.forEach(node => node.remove());
    return tile || null;
  }

  function uniqueSignal() {
    const matches = [...document.querySelectorAll('#luneaSignalMessageSection')];
    const [signal, ...duplicates] = matches;
    duplicates.forEach(node => node.remove());
    return signal || null;
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
      const signal = uniqueSignal();
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
    version:36.1,
    order:Object.freeze(['general','love','career','stock','timing','intimacy','signal','divider','lenormand','meihua','horary','thai']),
    apply,
    applyStructure,
    requestLayout,
  });
})();
