'use strict';

/* LUNEA HOME COMPACT + DISTINCT V32
   Home-only visual layer. Reduces boxed-card density, separates sector accents,
   hides redundant AI chips, and places MEIHUA + INTIMACY on one compact row.
   No reading logic, RNG, AI prompt, archive, calculation, or data changes. */
(() => {
  const W = window;
  if (W.__LUNEA_HOME_COMPACT_DISTINCT_V32__) return;
  W.__LUNEA_HOME_COMPACT_DISTINCT_V32__ = true;

  const STYLE_ID = 'luneaHomeCompactDistinctV32Style';
  const $ = (sel, root=document) => root.querySelector(sel);

  function installStyle(){
    if ($(('#' + STYLE_ID))) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8{margin-bottom:8px!important}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .v8-title-row{margin-bottom:9px!important}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-grid{gap:6px!important}

      /* Less visual boxing: same dark base, sector identity comes from a clear accent edge/glow. */
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-tile{
        --v32-rgb:160,165,195;
        min-height:98px!important;padding:10px 11px 10px!important;border-radius:17px!important;
        border:1px solid rgba(var(--v32-rgb),.24)!important;
        background:
          radial-gradient(circle at 8% 3%,rgba(var(--v32-rgb),.18),transparent 33%),
          linear-gradient(150deg,rgba(18,20,36,.92),rgba(7,9,20,.985))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 6px 15px rgba(0,0,0,.11)!important;
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-tile::before{
        content:''!important;position:absolute!important;left:0!important;top:16px!important;bottom:16px!important;width:2px!important;
        border-radius:0 3px 3px 0!important;background:rgba(var(--v32-rgb),.82)!important;
        box-shadow:0 0 11px rgba(var(--v32-rgb),.22)!important;pointer-events:none!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-tile::after{
        left:10px!important;right:10px!important;background:linear-gradient(90deg,transparent,rgba(var(--v32-rgb),.28),transparent)!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-object{
        width:43px!important;height:43px!important;margin-bottom:7px!important;border-radius:14px!important;
        border-color:rgba(var(--v32-rgb),.32)!important;
        background:radial-gradient(circle at 28% 20%,rgba(255,255,255,.24),transparent 20%),linear-gradient(145deg,rgba(var(--v32-rgb),.22),rgba(var(--v32-rgb),.07))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 15px rgba(var(--v32-rgb),.07)!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-label,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{
        font-size:13.4px!important;font-weight:650!important;line-height:1.1!important;letter-spacing:-.12px!important;color:#fbfaff!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-sub,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{
        margin-top:4px!important;font-size:9.35px!important;line-height:1.25!important;font-weight:500!important;color:#b6bac9!important;
        white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-open,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .thai-v24-arrow{
        color:rgb(var(--v32-rgb))!important;font-size:16px!important;opacity:.84!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v20-ai-chip{
        display:none!important
      }

      /* Strong hue separation. Adjacent tiles intentionally use different color families. */
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="general"]{--v32-rgb:184,187,222}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="career"]{--v32-rgb:214,145,78}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="love"]{--v32-rgb:224,87,145}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="stock"]{--v32-rgb:55,180,111}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="timing"]{--v32-rgb:62,126,219}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="horary"]{--v32-rgb:146,92,224}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="lenormand"]{--v32-rgb:38,176,207}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile{--v32-rgb:216,177,65}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"]{--v32-rgb:127,157,74}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"]{--v32-rgb:193,55,105}

      /* Thai should behave like the other compact core tiles. */
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile{
        grid-column:auto!important;min-height:98px!important;padding:10px 11px!important;border-radius:17px!important;
        grid-template-columns:43px minmax(0,1fr) 16px!important;gap:8px!important;align-items:start!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-orb{
        width:43px!important;height:43px!important;border-radius:14px!important;border-color:rgba(var(--v32-rgb),.32)!important;
        background:linear-gradient(145deg,rgba(var(--v32-rgb),.22),rgba(var(--v32-rgb),.07))!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy{align-self:end!important;padding-bottom:2px!important}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy small{display:none!important}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{white-space:nowrap!important}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-arrow{align-self:start!important;justify-self:end!important}

      /* Reduce one whole row: MEIHUA + INTIMACY share the same 2-column row. */
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"],
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"]{
        grid-column:auto!important;min-height:74px!important;padding:9px 10px!important;border-radius:16px!important;
        display:grid!important;grid-template-columns:42px minmax(0,1fr) 14px!important;grid-template-rows:1fr!important;
        gap:8px!important;align-items:center!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-object{
        grid-column:1!important;grid-row:1!important;width:40px!important;height:40px!important;margin:0!important;border-radius:13px!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-label,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-label{
        grid-column:2!important;grid-row:1!important;align-self:center!important;margin:0!important;font-size:12.1px!important;white-space:nowrap!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-sub,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-sub{display:none!important}
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-open,
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-open{
        grid-column:3!important;grid-row:1!important;position:static!important;align-self:center!important;justify-self:end!important
      }
      html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v39-adult-badge{
        font-size:6.4px!important;padding:1px 4px!important;margin-left:3px!important;vertical-align:1px!important
      }

      /* SIGNAL is a utility row, not another giant card. */
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection{
        margin:6px 0 0!important;border-radius:16px!important;border-color:rgba(225,199,139,.22)!important;
        background:radial-gradient(circle at 8% 15%,rgba(225,199,139,.12),transparent 31%),linear-gradient(150deg,rgba(23,21,28,.92),rgba(8,9,19,.985))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 5px 13px rgba(0,0,0,.10)!important
      }
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection:not(.active) .category-header{
        min-height:66px!important;padding:8px 12px!important
      }
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection:not(.active) .message-oracle-home-logo{
        width:42px!important;height:42px!important;flex-basis:42px!important
      }
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection .cat-left{gap:9px!important}
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection .cat-text h3{font-size:12.6px!important;line-height:1.15!important;color:#fbf8ef!important}
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection .cat-text p{font-size:9.3px!important;line-height:1.2!important;margin-top:3px!important;color:#c5c0b7!important}
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection:not(.active) .message-oracle-home-contexts{display:none!important}
      html.lunea-home-compact-distinct-v32 #luneaSignalMessageSection .toggle{color:#dfc384!important;font-size:17px!important}

      @media(max-width:390px){
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-grid{gap:5px!important}
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-tile,
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile{min-height:94px!important;padding:9px 10px!important}
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-label,
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy b{font-size:12.7px!important}
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-v8-sub,
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 .lunea-thai-home-tile .thai-v24-copy span{font-size:8.9px!important}
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"],
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"]{min-height:70px!important;grid-template-columns:38px minmax(0,1fr) 12px!important;padding:8px!important;gap:7px!important}
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-object,
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-object{width:37px!important;height:37px!important}
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="meihua"] .lunea-v8-label,
        html.lunea-home-compact-distinct-v32 #luneaHomePortalV8 [data-key="intimacy"] .lunea-v8-label{font-size:11.3px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function apply(){
    document.documentElement.classList.add('lunea-home-compact-distinct-v32');
    installStyle();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  W.addEventListener('pageshow', () => setTimeout(apply, 40), {passive:true});

  W.LUNEA_HOME_COMPACT_DISTINCT_V32 = Object.freeze({version:32, apply});
})();
