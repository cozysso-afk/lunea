'use strict';

/* LUNEA HOME IA V34
   Screenshot-driven Home cleanup.
   - four clear 2-column rows, no decorative group headings
   - neutral card bodies with distinct accent rails/icons
   - compact 3-item utility dock: MEIHUA / INTIMACY / SIGNAL
   - no reading, RNG, AI, archive, calculation, or data changes
*/
(() => {
  const W = window;
  if (W.__LUNEA_HOME_IA_V34__) return;
  W.__LUNEA_HOME_IA_V34__ = true;

  const STYLE_ID = 'luneaHomeIAV34Style';
  const $ = (sel, root=document) => root.querySelector(sel);

  function retireOlderHomeLayers(){
    document.documentElement.classList.remove(
      'lunea-home-readability-v31',
      'lunea-home-final-tune-v32',
      'lunea-home-compact-distinct-v32',
      'lunea-home-ia-v33'
    );
    ['luneaHomeReadabilityV31Style','luneaHomeFinalTuneV32Style','luneaHomeCompactDistinctV32Style','luneaHomeIAV33Style']
      .forEach(id => document.getElementById(id)?.remove());
  }

  function addStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      html.lunea-home-ia-v34 #luneaHomePortalV8{margin-bottom:8px!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .v8-title-row{margin-bottom:9px!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .v8-title-note{display:none!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-grid{
        display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:7px!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v33-group-label,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v33-quick-dock{display:contents!important}

      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile{
        --v34-rgb:150,157,195;
        grid-column:span 3!important;min-width:0!important;min-height:91px!important;
        padding:10px 11px!important;border-radius:17px!important;overflow:hidden!important;position:relative!important;
        border:1px solid rgba(218,223,239,.115)!important;
        background:linear-gradient(152deg,rgba(18,20,35,.96),rgba(7,9,19,.993))!important;
        box-shadow:inset 2px 0 0 rgba(var(--v34-rgb),.82),inset 0 1px 0 rgba(255,255,255,.03),0 5px 14px rgba(0,0,0,.11)!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile::before,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile::before{display:none!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile::after,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile::after{
        content:''!important;display:block!important;position:absolute!important;left:14px!important;right:14px!important;top:0!important;height:1px!important;
        background:linear-gradient(90deg,transparent,rgba(var(--v34-rgb),.34),transparent)!important;pointer-events:none!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-object,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:42px!important;height:42px!important;margin-bottom:7px!important;border-radius:14px!important;
        border:1px solid rgba(var(--v34-rgb),.32)!important;
        background:linear-gradient(145deg,rgba(var(--v34-rgb),.15),rgba(255,255,255,.018))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 14px rgba(var(--v34-rgb),.07)!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-label,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        color:#f8f7fb!important;font-size:12.8px!important;font-weight:650!important;line-height:1.1!important;letter-spacing:-.12px!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-sub,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px!important;color:#aeb4c4!important;font-size:9.1px!important;line-height:1.22!important;font-weight:500!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-open,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .thai-v24-arrow{color:rgb(var(--v34-rgb))!important;font-size:15px!important;opacity:.88!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v20-ai-chip{display:none!important}

      /* Distinct accents: card bodies stay neutral. */
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="general"]{--v34-rgb:147,151,232}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="love"]{--v34-rgb:222,91,145}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="career"]{--v34-rgb:218,151,72}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="stock"]{--v34-rgb:65,184,119}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="timing"]{--v34-rgb:66,126,222}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="horary"]{--v34-rgb:158,91,222}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="lenormand"]{--v34-rgb:46,185,207}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile{--v34-rgb:218,181,72}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="meihua"]{--v34-rgb:141,169,81}
      html.lunea-home-ia-v34 #luneaHomePortalV8 [data-key="intimacy"]{--v34-rgb:197,64,112}

      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile{
        grid-template-columns:42px minmax(0,1fr) 15px!important;gap:8px!important;align-items:start!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{align-self:end!important;padding-bottom:1px!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none!important}

      /* Bottom dock: exactly three equal compact cells. */
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"],
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"],
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active){
        grid-column:span 2!important;min-height:64px!important;height:64px!important;padding:7px!important;border-radius:15px!important;
        border:1px solid rgba(218,223,239,.105)!important;background:linear-gradient(152deg,rgba(17,19,33,.96),rgba(7,9,19,.993))!important;
        box-shadow:inset 2px 0 0 rgba(var(--v34-rgb),.82),inset 0 1px 0 rgba(255,255,255,.026),0 4px 12px rgba(0,0,0,.10)!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"],
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{
        display:grid!important;grid-template-columns:34px minmax(0,1fr)!important;grid-template-rows:1fr!important;gap:6px!important;align-items:center!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]::before,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]::before,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]::after,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]::after{display:none!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-object,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{
        grid-column:1!important;grid-row:1!important;width:33px!important;height:33px!important;margin:0!important;border-radius:11px!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-label,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-label{
        grid-column:2!important;grid-row:1!important;margin:0!important;align-self:center!important;font-size:10.4px!important;white-space:nowrap!important
      }
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-sub,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-sub,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-open,
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-open{display:none!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v39-adult-badge{font-size:5.8px!important;padding:1px 3px!important;margin-left:2px!important}

      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection{--v34-rgb:216,194,137;margin:0!important;min-width:0!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .category-header{min-height:48px!important;height:48px!important;padding:0 2px!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{width:33px!important;height:33px!important;flex-basis:33px!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-left{gap:6px!important;min-width:0!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3{font-size:0!important;line-height:1!important;margin:0!important;white-space:nowrap!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3::after{content:'SIGNAL';font-size:10.4px;color:#f8f7fb;font-weight:650;letter-spacing:-.1px}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text p,
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts,
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .toggle{display:none!important}
      html.lunea-home-ia-v34 #luneaHomePortalV8 #luneaSignalMessageSection.active{
        grid-column:1/-1!important;height:auto!important;min-height:0!important;margin-top:1px!important;border-radius:18px!important
      }

      @media(max-width:390px){
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-grid{gap:6px!important}
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-tile,
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:87px!important;padding:9px 10px!important}
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-label,
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:12.25px!important}
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-v8-sub,
        html.lunea-home-ia-v34 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{font-size:8.75px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function applyStructure(){
    const portal = $('#luneaHomePortalV8');
    const grid = $('#luneaHomePortalV8 .lunea-v8-grid');
    if (!portal || !grid) return false;

    grid.querySelectorAll('.lunea-v33-group-label').forEach(n => n.remove());
    const oldDock = grid.querySelector('.lunea-v33-quick-dock');
    if (oldDock) {
      [...oldDock.children].forEach(n => grid.appendChild(n));
      oldDock.remove();
    }

    const pick = (key) => portal.querySelector(`.lunea-v8-tile[data-key="${key}"]`);
    const nodes = [
      pick('general'), pick('love'),
      pick('career'), pick('stock'),
      pick('timing'), pick('horary'),
      pick('lenormand'), portal.querySelector('.lunea-thai-home-tile'),
      pick('meihua'), pick('intimacy'),
      document.getElementById('luneaSignalMessageSection')
    ].filter(Boolean);

    nodes.forEach(n => grid.appendChild(n));
    return nodes.length >= 10;
  }

  function apply(){
    retireOlderHomeLayers();
    document.documentElement.classList.add('lunea-home-ia-v34');
    addStyles();
    applyStructure();
  }

  apply();
  [80,220,500,1000,1800,3000].forEach(ms => setTimeout(apply, ms));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  W.addEventListener('pageshow', () => setTimeout(apply, 60), {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(apply, 60); });

  W.LUNEA_HOME_IA_V34 = Object.freeze({version:34, apply, applyStructure});
})();
