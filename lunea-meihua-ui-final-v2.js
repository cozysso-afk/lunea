'use strict';

/*
  LUNEA MEIHUA UI FINAL V3 (filename kept for loader compatibility)
  ===============================================================
  - Home hierarchy/geometry is owned by the current Home IA layer (V35+).
  - Uses the generated Meihua logo asset; never replaces it with the legacy CSS hexagram emblem.
  - Keeps mobile result readability and PNG preview polish.
  - No calculation, interpretation, archive, or export-data changes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MEIHUA_UI_FINAL_V2__) return;
  W.__LUNEA_MEIHUA_UI_FINAL_V2__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);
  const LOGO_SRC = './assets/meihua/meihua_logo_v1.png';

  function installStyle() {
    if ($('#luneaMeihuaUiFinalV2Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaMeihuaUiFinalV2Style';
    style.textContent = `
      html.lunea-meihua-ui-final-v2{}

      /* Home layout is intentionally NOT controlled here. V35+ owns placement and tile size. */
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-object{overflow:hidden!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .mh-icon.mh-logo-v3{
        position:relative!important;width:100%!important;height:100%!important;display:block!important;
        font-size:0!important;color:transparent!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .mh-icon.mh-logo-v3::before,
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .mh-icon.mh-logo-v3::after{display:none!important;content:none!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .mh-icon.mh-logo-v3 img{
        display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:inherit!important
      }

      /* Main Meihua sheet: tighter spacing, reading emphasized after interpretation. */
      #luneaMeihuaOverlay .mh-modal{width:min(94vw,700px)!important;padding:16px!important}
      #luneaMeihuaOverlay .mh-board{margin-top:10px!important}
      #luneaMeihuaOverlay .mh-flow{gap:7px!important}
      #luneaMeihuaOverlay .mh-evidence{gap:7px!important;margin-top:8px!important}
      #luneaMeihuaOverlay .mh-relation{margin-top:8px!important;padding:10px 11px!important}
      #luneaMeihuaOverlay .mh-actions{margin:9px 0!important}
      #luneaMeihuaOverlay .mh-ai.show{
        margin-top:9px!important;padding:14px!important;
        border-color:rgba(190,164,221,.18)!important;
        background:linear-gradient(145deg,rgba(126,98,164,.085),rgba(63,107,83,.045))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important
      }
      #luneaMeihuaOverlay .mh-provenance{margin-top:8px!important;padding:8px 9px!important}

      /* PNG preview is an action sheet, not another full reading page. */
      #luneaMeihuaPngPreview{padding:18px!important;overscroll-behavior:contain!important}
      #luneaMeihuaPngPreview .mhp-sheet{
        width:min(92vw,368px)!important;max-height:calc(100dvh - 36px)!important;
        padding:13px!important;border-radius:20px!important;overflow:auto!important;
        -webkit-overflow-scrolling:touch!important;scrollbar-width:none!important
      }
      #luneaMeihuaPngPreview .mhp-sheet::-webkit-scrollbar{display:none!important}
      #luneaMeihuaPngPreview .mhp-head{align-items:flex-start!important;gap:9px!important}
      #luneaMeihuaPngPreview .mhp-head small{font-size:9px!important;letter-spacing:.35px!important;color:#b7c9bc!important}
      #luneaMeihuaPngPreview .mhp-head h3{margin:2px 0 2px!important;font-size:15px!important;line-height:1.25!important}
      #luneaMeihuaPngPreview .mhp-head p{font-size:9.7px!important;line-height:1.4!important}
      #luneaMeihuaPngPreview .mhp-x{padding:0 2px!important;min-width:28px!important;min-height:28px!important;font-size:23px!important;line-height:1!important}
      #luneaMeihuaPngPreview img{
        width:min(100%,238px)!important;margin:10px auto 8px!important;border-radius:12px!important;
        box-shadow:0 10px 30px rgba(0,0,0,.20)!important
      }
      #luneaMeihuaPngPreview .mhp-share,#luneaMeihuaPngPreview .mhp-down{
        min-height:43px!important;margin-top:7px!important;border-radius:12px!important;font-size:14px!important
      }

      @media(max-width:520px){
        #luneaMeihuaOverlay .mh-modal{padding:14px!important}
        #luneaMeihuaOverlay .mh-hex{padding:9px 4px 8px!important}
        #luneaMeihuaOverlay .mh-ai.show{padding:12px!important;line-height:1.7!important}
        #luneaMeihuaPngPreview{padding:14px!important}
        #luneaMeihuaPngPreview .mhp-sheet{width:min(94vw,350px)!important;max-height:calc(100dvh - 28px)!important;padding:12px!important}
        #luneaMeihuaPngPreview img{width:min(100%,224px)!important;margin:9px auto 7px!important}
      }
      @media(max-height:760px){
        #luneaMeihuaPngPreview .mhp-head p{display:none!important}
        #luneaMeihuaPngPreview img{width:min(100%,196px)!important;margin:7px auto 5px!important}
        #luneaMeihuaPngPreview .mhp-share,#luneaMeihuaPngPreview .mhp-down{min-height:39px!important;margin-top:5px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function applyLogo() {
    const icon = $('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .mh-icon');
    if (!icon) return false;
    icon.classList.remove('mh-emblem-v2');
    icon.classList.add('mh-logo-v3');
    icon.setAttribute('aria-hidden','true');
    const img = icon.querySelector('img');
    if (!img || !/assets\/meihua\/meihua_logo_v1\.png(?:\?|$)/.test(img.getAttribute('src') || '')) {
      icon.innerHTML = `<img src="${LOGO_SRC}" alt="" draggable="false">`;
    }
    return true;
  }

  function apply() {
    document.documentElement.classList.add('lunea-meihua-ui-final-v2');
    installStyle();
    applyLogo();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  W.addEventListener('pageshow',()=>setTimeout(apply,80),{passive:true});
  document.addEventListener('visibilitychange',()=>{ if (!document.hidden) setTimeout(apply,80); });

  const mo = new MutationObserver(() => applyLogo());
  const startObserver = () => mo.observe(document.body || document.documentElement,{childList:true,subtree:true});
  if (document.body) startObserver(); else document.addEventListener('DOMContentLoaded',startObserver,{once:true});

  W.LUNEA_MEIHUA_UI_FINAL_V2 = Object.freeze({version:3,apply,applyLogo});
})();
