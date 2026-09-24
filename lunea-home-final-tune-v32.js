'use strict';

/* LUNEA HOME IA V35
   Semantic Home hierarchy:
   - Tarot-related: GENERAL / LOVE / CAREER / STOCK / TIMING / INTIMACY / SIGNAL
   - Other systems: LENORMAND / MEIHUA / HORARY / THAI ASTROLOGY
   - one calm neutral surface; color is an accent, not the card body
   No reading, RNG, prompt, archive, calculation, or data changes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HOME_IA_V35__) return;
  W.__LUNEA_HOME_IA_V35__ = true;

  const STYLE_ID = 'luneaHomeIAV35Style';
  const $ = (sel, root=document) => root.querySelector(sel);

  function retireOlderHomeLayers(){
    document.documentElement.classList.remove(
      'lunea-home-readability-v31',
      'lunea-home-final-tune-v32',
      'lunea-home-compact-distinct-v32',
      'lunea-home-ia-v33',
      'lunea-home-ia-v34'
    );
    [
      'luneaHomeReadabilityV31Style',
      'luneaHomeFinalTuneV32Style',
      'luneaHomeCompactDistinctV32Style',
      'luneaHomeIAV33Style',
      'luneaHomeIAV34Style'
    ].forEach(id => document.getElementById(id)?.remove());
  }

  function addStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      html.lunea-home-ia-v35 #luneaHomePortalV8{margin-bottom:8px!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .v8-title-row{margin-bottom:9px!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .v8-title-note{display:none!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-grid{
        display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:6px!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v33-group-label,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v33-quick-dock{display:contents!important}

      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-tile,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile{
        --v35-rgb:150,157,195;
        grid-column:span 3!important;min-width:0!important;min-height:90px!important;
        padding:10px 11px!important;border-radius:17px!important;overflow:hidden!important;position:relative!important;
        border:1px solid rgba(219,223,238,.115)!important;
        background:linear-gradient(152deg,rgba(17,19,33,.965),rgba(7,9,19,.994))!important;
        box-shadow:inset 2px 0 0 rgba(var(--v35-rgb),.84),inset 0 1px 0 rgba(255,255,255,.03),0 5px 14px rgba(0,0,0,.105)!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-tile::before,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile::before{display:none!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-tile::after,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile::after{
        content:''!important;display:block!important;position:absolute!important;left:14px!important;right:14px!important;top:0!important;height:1px!important;
        background:linear-gradient(90deg,transparent,rgba(var(--v35-rgb),.28),transparent)!important;pointer-events:none!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-object,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:42px!important;height:42px!important;margin-bottom:7px!important;border-radius:14px!important;
        border:1px solid rgba(var(--v35-rgb),.34)!important;
        background:linear-gradient(145deg,rgba(var(--v35-rgb),.12),rgba(255,255,255,.016))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 13px rgba(var(--v35-rgb),.06)!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-label,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        color:#f8f7fb!important;font-size:12.75px!important;font-weight:650!important;line-height:1.1!important;letter-spacing:-.12px!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-sub,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px!important;color:#adb3c2!important;font-size:9px!important;line-height:1.22!important;font-weight:500!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-open,
      html.lunea-home-ia-v35 #luneaHomePortalV8 .thai-v24-arrow{color:rgb(var(--v35-rgb))!important;font-size:15px!important;opacity:.88!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v20-ai-chip{display:none!important}

      /* Tarot-related accents */
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="general"]{--v35-rgb:151,153,232}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="love"]{--v35-rgb:225,91,145}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="career"]{--v35-rgb:221,151,69}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="stock"]{--v35-rgb:67,183,116}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="timing"]{--v35-rgb:65,126,226}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="intimacy"]{--v35-rgb:208,69,122}

      /* Independent divination / astrology systems */
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="lenormand"]{--v35-rgb:42,187,211}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="meihua"]{--v35-rgb:143,173,83}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="horary"]{--v35-rgb:160,91,224}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile{--v35-rgb:220,183,72}
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object{
        overflow:hidden!important;color:transparent!important;
        background-image:url('assets/meihua/lunea_meihua_home_icon_v1.png?v=1')!important;
        background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;
        border-color:rgba(214,188,112,.40)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 15px rgba(143,173,83,.10)!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="meihua"] .mh-icon{opacity:0!important}

      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile{
        grid-column:span 3!important;width:auto!important;max-width:none!important;display:grid!important;
        grid-template-columns:42px minmax(0,1fr) 15px!important;gap:8px!important;align-items:start!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{align-self:end!important;padding-bottom:1px!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none!important}

      /* SIGNAL is Tarot-related but kept as one compact supplementary strip. */
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection{
        --v35-rgb:218,194,138;grid-column:1/-1!important;margin:0!important;min-width:0!important;
        border:1px solid rgba(219,223,238,.105)!important;border-radius:15px!important;
        background:linear-gradient(152deg,rgba(17,19,33,.965),rgba(7,9,19,.994))!important;
        box-shadow:inset 2px 0 0 rgba(var(--v35-rgb),.82),inset 0 1px 0 rgba(255,255,255,.025),0 4px 12px rgba(0,0,0,.10)!important
      }
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active){height:58px!important;min-height:58px!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .category-header{height:56px!important;min-height:56px!important;padding:7px 11px!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{width:36px!important;height:36px!important;flex-basis:36px!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-left{gap:9px!important;min-width:0!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3{font-size:0!important;line-height:1!important;margin:0!important;white-space:nowrap!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text h3::after{content:'SIGNAL · MESSAGE';font-size:11.8px;color:#f8f7fb;font-weight:650;letter-spacing:-.1px}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .cat-text p{display:block!important;margin-top:3px!important;color:#aeb3c1!important;font-size:8.7px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts{display:none!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection:not(.active) .toggle{color:rgb(var(--v35-rgb))!important}
      html.lunea-home-ia-v35 #luneaHomePortalV8 #luneaSignalMessageSection.active{height:auto!important;min-height:0!important;margin-top:0!important;border-radius:18px!important}

      .lunea-v35-system-divider{
        grid-column:1/-1;display:flex;align-items:center;gap:8px;height:16px;margin:2px 2px 0;
        color:#71788d;font:700 6.8px/1 'Cinzel',serif;letter-spacing:1.35px;text-transform:uppercase
      }
      .lunea-v35-system-divider::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,rgba(154,162,190,.16),transparent)}

      /* Secondary systems are slightly shorter than Tarot cards. */
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="lenormand"],
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="meihua"],
      html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="horary"],
      html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:82px!important}

      @media(max-width:390px){
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-grid{gap:5px!important}
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-tile,
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:86px!important;padding:9px 10px!important}
        html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="lenormand"],
        html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="meihua"],
        html.lunea-home-ia-v35 #luneaHomePortalV8 [data-key="horary"],
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:79px!important}
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-label,
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:12.15px!important}
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-v8-sub,
        html.lunea-home-ia-v35 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{font-size:8.7px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function enforceGridOwnership(grid){
    if (!grid) return;
    grid.style.setProperty('grid-template-columns', 'repeat(6,minmax(0,1fr))', 'important');
    grid.querySelectorAll('.lunea-v8-tile').forEach(tile => {
      tile.style.setProperty('grid-column', 'span 3', 'important');
      tile.style.setProperty('min-width', '0', 'important');
    });
    const thai = grid.querySelector('.lunea-thai-home-tile');
    if (thai) {
      thai.style.setProperty('grid-column', 'span 3', 'important');
      thai.style.setProperty('width', 'auto', 'important');
      thai.style.setProperty('max-width', 'none', 'important');
      thai.style.setProperty('min-width', '0', 'important');
      thai.style.setProperty('display', 'grid', 'important');
    }
  }

  function applyStructure(){
    const portal = $('#luneaHomePortalV8');
    const grid = $('#luneaHomePortalV8 .lunea-v8-grid');
    if (!portal || !grid) return false;

    grid.querySelectorAll('.lunea-v33-group-label,.lunea-v35-system-divider').forEach(n => n.remove());
    const oldDock = grid.querySelector('.lunea-v33-quick-dock');
    if (oldDock) {
      [...oldDock.children].forEach(n => grid.appendChild(n));
      oldDock.remove();
    }

    const pick = key => portal.querySelector(`.lunea-v8-tile[data-key="${key}"]`);
    const tarot = [
      pick('general'), pick('love'),
      pick('career'), pick('stock'),
      pick('timing'), pick('intimacy')
    ].filter(Boolean);
    tarot.forEach(n => grid.appendChild(n));

    const signal = document.getElementById('luneaSignalMessageSection');
    if (signal) grid.appendChild(signal);

    const divider = document.createElement('div');
    divider.className = 'lunea-v35-system-divider';
    divider.textContent = 'DIVINATION · ASTROLOGY';
    grid.appendChild(divider);

    const systems = [
      pick('lenormand'), pick('meihua'),
      pick('horary'), portal.querySelector('.lunea-thai-home-tile')
    ].filter(Boolean);
    systems.forEach(n => grid.appendChild(n));

    enforceGridOwnership(grid);
    if (signal) signal.style.setProperty('grid-column', '1 / -1', 'important');
    divider.style.setProperty('grid-column', '1 / -1', 'important');

    return tarot.length >= 6 && systems.length >= 4;
  }

  function apply(){
    retireOlderHomeLayers();
    document.documentElement.classList.add('lunea-home-ia-v35');
    addStyles();
    applyStructure();
  }

  apply();
  [80,220,500,1000,1800,3000,5000,8000].forEach(ms => setTimeout(apply, ms));

  let settleTries = 0;
  let stablePasses = 0;
  const settleTimer = setInterval(() => {
    settleTries += 1;
    const complete = applyStructure();
    stablePasses = complete ? stablePasses + 1 : 0;
    if (stablePasses >= 5 || settleTries >= 80) clearInterval(settleTimer);
  }, 150);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  W.addEventListener('pageshow', () => setTimeout(apply, 80), {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(apply, 80); });

  W.LUNEA_HOME_IA_V35 = Object.freeze({version:35.1, apply, applyStructure, enforceGridOwnership});
})();