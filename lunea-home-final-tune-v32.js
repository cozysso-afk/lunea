'use strict';

/* LUNEA HOME FINAL TUNE V32 · COMPACT/DISTINCT REVISION
   Screenshot-driven Home-only visual layer.
   - reduces card density and boxiness
   - hides redundant AI SPREAD chips on Home
   - separates sector hues more aggressively
   - puts MEIHUA + INTIMACY on one compact row
   - keeps SIGNAL · MESSAGE as a compact utility row
   No reading/RNG/archive/AI/calculation/data changes. */
(() => {
  const W = window;
  if (W.__LUNEA_HOME_FINAL_TUNE_V32__) return;
  W.__LUNEA_HOME_FINAL_TUNE_V32__ = true;
  const STYLE_ID = 'luneaHomeFinalTuneV32Style';

  function addStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-grid{gap:6px!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v20-ai-chip{display:none!important}

      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile{
        --v32-rgb:170,175,205;
        min-height:98px!important;padding:10px 11px!important;border-radius:17px!important;
        border:1px solid rgba(var(--v32-rgb),.24)!important;
        background:radial-gradient(circle at 8% 3%,rgba(var(--v32-rgb),.18),transparent 33%),linear-gradient(150deg,rgba(18,20,36,.92),rgba(7,9,20,.985))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 6px 15px rgba(0,0,0,.11)!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile::before{
        content:''!important;position:absolute!important;left:0!important;top:16px!important;bottom:16px!important;width:2px!important;
        border-radius:0 3px 3px 0!important;background:rgba(var(--v32-rgb),.84)!important;box-shadow:0 0 11px rgba(var(--v32-rgb),.22)!important;pointer-events:none!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-object{
        width:43px!important;height:43px!important;margin-bottom:7px!important;border-radius:14px!important;
        border-color:rgba(var(--v32-rgb),.34)!important;
        background:radial-gradient(circle at 28% 20%,rgba(255,255,255,.24),transparent 20%),linear-gradient(145deg,rgba(var(--v32-rgb),.22),rgba(var(--v32-rgb),.07))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 15px rgba(var(--v32-rgb),.07)!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-label,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        color:#fbfaff!important;font-size:13.4px!important;font-weight:650!important;line-height:1.1!important;letter-spacing:-.12px!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-sub,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px!important;color:#b8bccb!important;font-size:9.35px!important;font-weight:500!important;line-height:1.25!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-open,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .thai-v24-arrow{color:rgb(var(--v32-rgb))!important;font-size:16px!important;opacity:.84!important}

      /* Deliberately separated hue families. */
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="general"]{--v32-rgb:188,190,220}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="career"]{--v32-rgb:215,137,68}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="love"]{--v32-rgb:225,77,139}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="stock"]{--v32-rgb:53,181,104}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="timing"]{--v32-rgb:57,120,222}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="horary"]{--v32-rgb:151,85,226}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="lenormand"]{--v32-rgb:30,180,211}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile{--v32-rgb:218,177,57}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"]{--v32-rgb:132,160,67}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"]{--v32-rgb:194,48,101}

      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile{
        grid-column:auto!important;min-height:98px!important;padding:10px 11px!important;border-radius:17px!important;
        grid-template-columns:43px minmax(0,1fr) 16px!important;gap:8px!important;align-items:start!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:43px!important;height:43px!important;border-radius:14px!important;border-color:rgba(var(--v32-rgb),.34)!important;
        background:linear-gradient(145deg,rgba(var(--v32-rgb),.23),rgba(var(--v32-rgb),.07))!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{align-self:end!important;padding-bottom:2px!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{align-self:start!important;justify-self:end!important}

      /* One less full-width row: MEIHUA and INTIMACY sit side-by-side. */
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"],
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"]{
        grid-column:auto!important;min-height:74px!important;padding:9px 10px!important;border-radius:16px!important;
        display:grid!important;grid-template-columns:42px minmax(0,1fr) 14px!important;grid-template-rows:1fr!important;gap:8px!important;align-items:center!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-object{
        grid-column:1!important;grid-row:1!important;width:40px!important;height:40px!important;margin:0!important;border-radius:13px!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-label,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-label{
        grid-column:2!important;grid-row:1!important;align-self:center!important;margin:0!important;font-size:12px!important;white-space:nowrap!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-sub,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-sub{display:none!important}
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-open,
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-open{
        grid-column:3!important;grid-row:1!important;position:static!important;align-self:center!important;justify-self:end!important
      }
      html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v39-adult-badge{font-size:6.2px!important;padding:1px 4px!important;margin-left:2px!important}

      /* SIGNAL reads as a utility row rather than another big cabinet. */
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection{
        margin:6px 0 0!important;border-radius:16px!important;border-color:rgba(225,199,139,.22)!important;
        background:radial-gradient(circle at 8% 15%,rgba(225,199,139,.12),transparent 31%),linear-gradient(150deg,rgba(23,21,28,.92),rgba(8,9,19,.985))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 5px 13px rgba(0,0,0,.10)!important
      }
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection:not(.active) .category-header{min-height:66px!important;padding:8px 12px!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{width:42px!important;height:42px!important;flex-basis:42px!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection .cat-left{gap:9px!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection .cat-text h3{font-size:12.6px!important;line-height:1.15!important;color:#fbf8ef!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection .cat-text p{font-size:9.3px!important;line-height:1.2!important;margin-top:3px!important;color:#c5c0b7!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts{display:none!important}
      html.lunea-home-final-tune-v32 #luneaSignalMessageSection .toggle{color:#dfc384!important;font-size:17px!important}

      @media(max-width:390px){
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-grid{gap:5px!important}
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-tile,
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:94px!important;padding:9px 10px!important}
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-v8-label,
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:12.7px!important}
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"],
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"]{min-height:70px!important;grid-template-columns:38px minmax(0,1fr) 12px!important;padding:8px!important;gap:7px!important}
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object,
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-object{width:37px!important;height:37px!important}
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-label,
        html.lunea-home-final-tune-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-label{font-size:11.2px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function apply(){document.documentElement.classList.add('lunea-home-final-tune-v32');addStyles();}
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  W.addEventListener('pageshow', apply, {passive:true});
  W.LUNEA_HOME_FINAL_TUNE_V32 = Object.freeze({version:'32-compact-distinct', apply});
})();
