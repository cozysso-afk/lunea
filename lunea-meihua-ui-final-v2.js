'use strict';

/*
  LUNEA MEIHUA UI FINAL V2
  ========================
  Image-free visual polish for Meihua V1.
  - Keeps the home tile intentionally full-width, but compact and balanced.
  - Replaces the placeholder glyph with a CSS/DOM hexagram emblem (no image asset).
  - Tightens mobile result spacing and makes the AI reading easier to scan.
  - Compacts the PNG preview sheet without changing the deterministic 1080x1350 export.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MEIHUA_UI_FINAL_V2__) return;
  W.__LUNEA_MEIHUA_UI_FINAL_V2__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);

  function installStyle() {
    if ($('#luneaMeihuaUiFinalV2Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaMeihuaUiFinalV2Style';
    style.textContent = `
      html.lunea-meihua-ui-final-v2{}

      /* Home: keep the solo row intentional instead of looking like a stretched 2-column tile. */
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{
        grid-column:1/-1!important;
        min-height:88px!important;
        padding:12px 18px!important;
        display:grid!important;
        grid-template-columns:62px minmax(0,1fr) 26px!important;
        grid-template-rows:auto auto!important;
        column-gap:12px!important;
        row-gap:2px!important;
        align-items:center!important;
        border-color:rgba(151,205,171,.20)!important;
        background:
          radial-gradient(circle at 8% 18%,rgba(110,187,145,.12),transparent 26%),
          radial-gradient(circle at 92% 84%,rgba(164,132,205,.075),transparent 34%),
          linear-gradient(145deg,rgba(17,35,31,.94),rgba(8,10,23,.99))!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-object{
        grid-column:1!important;grid-row:1/3!important;
        width:54px!important;height:54px!important;margin:0!important;
        display:grid!important;place-items:center!important;
        border:1px solid rgba(179,220,192,.26)!important;
        border-radius:17px!important;
        background:
          radial-gradient(circle at 30% 20%,rgba(255,255,255,.23),transparent 20%),
          linear-gradient(145deg,rgba(80,143,108,.22),rgba(105,83,146,.16))!important;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.035),0 8px 22px rgba(0,0,0,.13)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-label{
        grid-column:2!important;grid-row:1!important;align-self:end!important;
        margin:0!important;line-height:1.15!important;letter-spacing:.25px!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-sub{
        grid-column:2!important;grid-row:2!important;align-self:start!important;
        margin:2px 0 0!important;line-height:1.3!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-open{
        grid-column:3!important;grid-row:1/3!important;align-self:center!important;justify-self:end!important;
      }

      /* Image-free Meihua emblem. */
      .mh-icon.mh-emblem-v2{
        position:relative!important;width:34px!important;height:34px!important;
        display:flex!important;flex-direction:column-reverse!important;justify-content:center!important;gap:2.5px!important;
        font-size:0!important;color:transparent!important;
      }
      .mh-icon.mh-emblem-v2::before{
        content:''!important;position:absolute!important;inset:-6px!important;border-radius:12px!important;
        border:1px solid rgba(203,227,210,.10)!important;box-shadow:0 0 16px rgba(131,205,161,.08)!important;
      }
      .mh-icon.mh-emblem-v2::after{
        content:'✦'!important;position:absolute!important;right:-8px!important;top:-8px!important;
        color:#ccb0e7!important;font-size:8px!important;line-height:1!important;text-shadow:0 0 8px rgba(204,176,231,.28)!important;
      }
      .mh-icon.mh-emblem-v2 i{height:3px;display:flex;justify-content:center;gap:4px}
      .mh-icon.mh-emblem-v2 i::before,.mh-icon.mh-emblem-v2 i::after{content:'';display:block;height:3px;border-radius:3px;background:#e0eadf;box-shadow:0 0 5px rgba(192,226,201,.08)}
      .mh-icon.mh-emblem-v2 i.yang::before{width:27px}.mh-icon.mh-emblem-v2 i.yang::after{display:none}
      .mh-icon.mh-emblem-v2 i.yin::before,.mh-icon.mh-emblem-v2 i.yin::after{width:11.5px}
      .mh-icon.mh-emblem-v2 i:nth-child(2)::before,.mh-icon.mh-emblem-v2 i:nth-child(2)::after{background:#e6c987}

      /* Main Meihua sheet: slightly tighter, with reading emphasized after interpretation. */
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
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      }
      #luneaMeihuaOverlay .mh-provenance{margin-top:8px!important;padding:8px 9px!important}

      /* PNG preview: this is a preview/action sheet, not another full reading page. */
      #luneaMeihuaPngPreview{padding:18px!important;overscroll-behavior:contain!important}
      #luneaMeihuaPngPreview .mhp-sheet{
        width:min(92vw,368px)!important;
        max-height:calc(100dvh - 36px)!important;
        padding:13px!important;border-radius:20px!important;
        overflow:auto!important;-webkit-overflow-scrolling:touch!important;
        scrollbar-width:none!important;
      }
      #luneaMeihuaPngPreview .mhp-sheet::-webkit-scrollbar{display:none!important}
      #luneaMeihuaPngPreview .mhp-head{align-items:flex-start!important;gap:9px!important}
      #luneaMeihuaPngPreview .mhp-head small{font-size:9px!important;letter-spacing:.35px!important;color:#b7c9bc!important}
      #luneaMeihuaPngPreview .mhp-head h3{margin:2px 0 2px!important;font-size:15px!important;line-height:1.25!important}
      #luneaMeihuaPngPreview .mhp-head p{font-size:9.7px!important;line-height:1.4!important}
      #luneaMeihuaPngPreview .mhp-x{padding:0 2px!important;min-width:28px!important;min-height:28px!important;font-size:23px!important;line-height:1!important}
      #luneaMeihuaPngPreview img{
        width:min(100%,238px)!important;
        margin:10px auto 8px!important;
        border-radius:12px!important;
        box-shadow:0 10px 30px rgba(0,0,0,.20)!important;
      }
      #luneaMeihuaPngPreview .mhp-share,#luneaMeihuaPngPreview .mhp-down{
        min-height:43px!important;margin-top:7px!important;border-radius:12px!important;font-size:14px!important;
      }

      @media(max-width:520px){
        #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{min-height:84px!important;padding:11px 15px!important;grid-template-columns:58px minmax(0,1fr) 22px!important;column-gap:10px!important}
        #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-object{width:50px!important;height:50px!important;border-radius:16px!important}
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

  function applyEmblem() {
    const icon = $('#luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .mh-icon');
    if (!icon || icon.classList.contains('mh-emblem-v2')) return false;
    icon.classList.add('mh-emblem-v2');
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML = '<i class="yang"></i><i class="yin"></i><i class="yang"></i><i class="yin"></i><i class="yang"></i><i class="yin"></i>';
    return true;
  }

  function apply() {
    document.documentElement.classList.add('lunea-meihua-ui-final-v2');
    installStyle();
    applyEmblem();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  W.addEventListener('pageshow',()=>setTimeout(apply,80),{passive:true});
  document.addEventListener('visibilitychange',()=>{ if (!document.hidden) setTimeout(apply,80); });

  const mo = new MutationObserver(() => applyEmblem());
  const startObserver = () => mo.observe(document.body || document.documentElement,{childList:true,subtree:true});
  if (document.body) startObserver(); else document.addEventListener('DOMContentLoaded',startObserver,{once:true});

  W.LUNEA_MEIHUA_UI_FINAL_V2 = Object.freeze({version:2,apply});
})();