'use strict';

/* LUNEA HOME IA V33
   Screenshot-driven Home redesign.
   - groups Tarot/Core and Oracle/Astro by task
   - moves MEIHUA / INTIMACY / SIGNAL into one compact quick dock
   - uses one neutral card surface with accent-only sector color
   - removes the stale oracle count and reduces visual box density
   No draw/RNG/AI/archive/calculation/data changes. */
(() => {
  const W = window;
  if (W.__LUNEA_HOME_IA_V33__) return;
  W.__LUNEA_HOME_IA_V33__ = true;

  const STYLE_ID = 'luneaHomeIAV33Style';
  const $ = (sel, root=document) => root.querySelector(sel);

  function addStyles(){
    if ($('#' + STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      html.lunea-home-ia-v33 #luneaHomePortalV8{margin-bottom:8px!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .v8-title-row{margin-bottom:8px!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .v8-title-note{display:none!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-grid{gap:6px!important}

      .lunea-v33-group-label{
        grid-column:1/-1;display:flex;align-items:center;gap:8px;min-height:17px;margin:2px 2px 0;
        color:#777d91;font:700 7px/1 'Cinzel',serif;letter-spacing:1.5px;text-transform:uppercase
      }
      .lunea-v33-group-label::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,rgba(159,166,193,.18),transparent)}

      /* One calm surface. Sector color is accent only, not a tinted card body. */
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-tile{
        --v33-rgb:176,181,207;
        min-height:92px!important;padding:10px 11px!important;border-radius:17px!important;
        border:1px solid rgba(217,222,239,.12)!important;
        background:linear-gradient(150deg,rgba(18,21,36,.94),rgba(7,9,20,.988))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 5px 14px rgba(0,0,0,.10)!important;
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-tile::before{display:none!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-tile::after{
        content:''!important;display:block!important;position:absolute!important;left:14px!important;right:14px!important;top:0!important;height:1px!important;
        background:linear-gradient(90deg,transparent,rgba(var(--v33-rgb),.58),transparent)!important;opacity:.92!important;pointer-events:none!important
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-object{
        width:42px!important;height:42px!important;margin-bottom:7px!important;border-radius:14px!important;
        border-color:rgba(var(--v33-rgb),.32)!important;
        background:linear-gradient(145deg,rgba(var(--v33-rgb),.14),rgba(255,255,255,.018))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 13px rgba(var(--v33-rgb),.06)!important
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-label,
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        color:#f7f6fb!important;font-size:13.1px!important;font-weight:650!important;line-height:1.1!important;letter-spacing:-.1px!important
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-sub,
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px!important;color:#aeb3c2!important;font-size:9.2px!important;line-height:1.22!important;font-weight:500!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-open,
      html.lunea-home-ia-v33 #luneaHomePortalV8 .thai-v24-arrow{color:rgb(var(--v33-rgb))!important;font-size:15px!important;opacity:.84!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v20-ai-chip{display:none!important}

      /* Deliberately separated accents. */
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="general"]{--v33-rgb:190,195,228}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="love"]{--v33-rgb:232,137,176}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="career"]{--v33-rgb:213,169,106}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="stock"]{--v33-rgb:104,193,151}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="timing"]{--v33-rgb:109,155,225}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="lenormand"]{--v33-rgb:94,203,215}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="horary"]{--v33-rgb:169,128,229}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile{--v33-rgb:216,188,104}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="meihua"]{--v33-rgb:161,184,118}
      html.lunea-home-ia-v33 #luneaHomePortalV8 [data-key="intimacy"]{--v33-rgb:211,101,143}

      /* Thai follows the same calm 2-column tile geometry. */
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile{
        grid-column:auto!important;min-height:92px!important;padding:10px 11px!important;border-radius:17px!important;
        grid-template-columns:42px minmax(0,1fr) 15px!important;gap:8px!important;align-items:start!important;
        border:1px solid rgba(217,222,239,.12)!important;background:linear-gradient(150deg,rgba(18,21,36,.94),rgba(7,9,20,.988))!important
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile::before{display:none!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:42px!important;height:42px!important;border-radius:14px!important;border-color:rgba(var(--v33-rgb),.32)!important;background:rgba(var(--v33-rgb),.10)!important
      }
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{align-self:end!important;padding-bottom:1px!important}
      html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none!important}

      /* Three secondary tools share one dock instead of three separate big rows. */
      .lunea-v33-quick-dock{
        grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:2px
      }
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="meihua"],
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"]{
        grid-column:auto!important;min-height:67px!important;padding:8px!important;border-radius:15px!important;
        display:grid!important;grid-template-columns:35px minmax(0,1fr)!important;grid-template-rows:1fr!important;gap:6px!important;align-items:center!important
      }
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="meihua"] .lunea-v8-object,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"] .lunea-v8-object{
        grid-column:1!important;grid-row:1!important;width:34px!important;height:34px!important;margin:0!important;border-radius:11px!important
      }
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="meihua"] .lunea-v8-label,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"] .lunea-v8-label{
        grid-column:2!important;grid-row:1!important;align-self:center!important;margin:0!important;font-size:10.7px!important;white-space:nowrap!important
      }
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="meihua"] .lunea-v8-sub,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"] .lunea-v8-sub,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="meihua"] .lunea-v8-open,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"] .lunea-v8-open{display:none!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"] .lunea-v39-adult-badge{font-size:6px!important;padding:1px 3px!important;margin-left:2px!important}

      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection{
        --v33-rgb:213,196,158;margin:0!important;min-width:0!important;border-radius:15px!important;
        border:1px solid rgba(217,222,239,.12)!important;background:linear-gradient(150deg,rgba(18,21,36,.94),rgba(7,9,20,.988))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 5px 14px rgba(0,0,0,.10)!important
      }
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .category-header{min-height:67px!important;padding:8px!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{width:34px!important;height:34px!important;flex-basis:34px!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .cat-left{gap:6px!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .cat-text h3{font-size:0!important;line-height:1!important;margin:0!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .cat-text h3::after{content:'SIGNAL';font-size:10.7px;color:#f7f6fb;font-weight:650;letter-spacing:-.1px}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .cat-text p,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts,
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .toggle{display:none!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection.active{grid-column:1/-1!important;margin-top:2px!important}
      html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection.active .cat-text h3{font-size:13px!important}

      @media(max-width:390px){
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-grid{gap:5px!important}
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-tile,
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:88px!important;padding:9px 10px!important}
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-label,
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:12.5px!important}
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-v8-sub,
        html.lunea-home-ia-v33 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{font-size:8.8px!important}
        .lunea-v33-quick-dock{gap:5px!important}
        html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="meihua"],
        html.lunea-home-ia-v33 .lunea-v33-quick-dock > [data-key="intimacy"],
        html.lunea-home-ia-v33 .lunea-v33-quick-dock #luneaSignalMessageSection:not(.active) .category-header{min-height:63px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function label(text){
    const el = document.createElement('div');
    el.className = 'lunea-v33-group-label';
    el.textContent = text;
    return el;
  }

  function applyStructure(){
    const portal = $('#luneaHomePortalV8');
    const grid = $('#luneaHomePortalV8 .lunea-v8-grid');
    if (!portal || !grid) return false;

    const pick = (key) => grid.querySelector(`.lunea-v8-tile[data-key="${key}"]`);
    const general = pick('general');
    const love = pick('love');
    const career = pick('career');
    const stock = pick('stock');
    const timing = pick('timing');
    const lenormand = pick('lenormand');
    const horary = pick('horary');
    const thai = grid.querySelector('.lunea-thai-home-tile');
    const meihua = pick('meihua');
    const intimacy = pick('intimacy');
    const signal = document.getElementById('luneaSignalMessageSection');

    grid.querySelectorAll('.lunea-v33-group-label').forEach(n => n.remove());
    let dock = grid.querySelector('.lunea-v33-quick-dock');
    if (!dock){ dock = document.createElement('div'); dock.className = 'lunea-v33-quick-dock'; }

    grid.appendChild(label('TAROT · CORE'));
    [general, love, career, stock].forEach(n => n && grid.appendChild(n));
    grid.appendChild(label('ORACLE · ASTRO'));
    [timing, lenormand, horary, thai].forEach(n => n && grid.appendChild(n));
    grid.appendChild(dock);
    [meihua, intimacy, signal].forEach(n => n && dock.appendChild(n));

    return !!(general && love && career && stock && timing && horary);
  }

  function apply(){
    document.documentElement.classList.add('lunea-home-ia-v33');
    addStyles();
    applyStructure();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  [120,360,780,1450,2600,4200].forEach(ms => setTimeout(apply, ms));
  W.addEventListener('pageshow', () => setTimeout(apply, 80), {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(apply, 80); });

  W.LUNEA_HOME_IA_V33 = Object.freeze({version:33, apply});
})();
