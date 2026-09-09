'use strict';

/*
  LUNEA TIMING IMAGE ASSETS V15.2
  --------------------------------
  Visual-only Timing Oracle presentation.
  - Keeps timing-oracle-v1.js as semantic/card-flow owner.
  - Never mutates img.src.
  - Keeps V65 artwork mapping/load readiness untouched.
  - Adds the ivory/cream celestial Oracle presentation around the existing deck.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_MOONDIAL_SYNC_V15__) return;
  W.__LUNEA_TIMING_MOONDIAL_SYNC_V15__ = true;
  document.documentElement.classList.add('lunea-timing-image-assets-v15');

  function tagImage(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const raw = img.getAttribute('src') || '';
    const match = raw.match(/timing_(\d{3})(?:_[^./?]+)?\.(?:png|jpe?g)/i);
    if (!match) return false;
    img.dataset.luneaTimingAsset = String(Number(match[1]));
    img.dataset.luneaTimingSemanticSrc = raw;
    return true;
  }

  function tagNode(node) {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLImageElement) tagImage(node);
    node.querySelectorAll?.('img[src*="timing_" i]').forEach(tagImage);
  }

  function tagAll() {
    document.querySelectorAll('img[src*="timing_" i]').forEach(tagImage);
  }

  function addStyles() {
    if (document.getElementById('luneaTimingImageAssetsV15Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaTimingImageAssetsV15Style';
    style.textContent = `
      /* ======================================================
         TIMING ORACLE · IVORY CELESTIAL PRESENTATION
         visual-only; no semantic/artwork ownership changes
         ====================================================== */
      html.lunea-timing-image-assets-v15 #timingOverlay{
        background:rgba(20,16,26,.70)!important;
        backdrop-filter:blur(18px) saturate(.88)!important;
        -webkit-backdrop-filter:blur(18px) saturate(.88)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-modal{
        position:relative!important;overflow:hidden!important;
        color:#433945!important;
        border:1px solid rgba(187,145,74,.43)!important;
        background:
          radial-gradient(circle at 50% -7%,rgba(255,255,255,.96),transparent 34%),
          radial-gradient(circle at 10% 21%,rgba(221,207,247,.26),transparent 30%),
          radial-gradient(circle at 94% 34%,rgba(205,227,229,.20),transparent 28%),
          radial-gradient(circle at 17% 89%,rgba(247,220,226,.18),transparent 34%),
          linear-gradient(180deg,rgba(255,253,248,.985),rgba(249,243,232,.985) 72%,rgba(246,239,225,.99))!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.92),
          inset 0 0 42px rgba(212,182,125,.055),
          0 28px 75px rgba(19,13,27,.42)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-modal::before{
        content:'';position:absolute;inset:10px;pointer-events:none;z-index:0;border-radius:inherit;
        border:1px solid rgba(194,151,80,.20);
        background:
          radial-gradient(circle at 50% 2%,rgba(191,148,75,.18) 0 1px,transparent 2px),
          linear-gradient(90deg,transparent 10%,rgba(194,151,80,.12) 25%,transparent 40%,transparent 60%,rgba(194,151,80,.12) 75%,transparent 90%);
        background-size:18px 18px,100% 1px;background-repeat:repeat,no-repeat;background-position:0 0,center 31px;
        opacity:.68;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-modal>*{position:relative;z-index:1}
      html.lunea-timing-image-assets-v15 #timingOverlay .sub{
        color:#a38150!important;font-size:10px!important;letter-spacing:2.2px!important;font-weight:700!important;
        text-transform:uppercase!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .modal-h{
        color:#40323c!important;font-family:'Cinzel','Noto Serif KR',Georgia,serif!important;
        font-size:27px!important;line-height:1.18!important;font-weight:600!important;letter-spacing:.15px!important;
        text-shadow:0 1px 0 rgba(255,255,255,.75)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .close{
        color:#8f755e!important;background:rgba(255,255,255,.46)!important;
        border:1px solid rgba(181,145,92,.18)!important;border-radius:999px!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay #timingQuestionField{
        padding:11px 12px 12px!important;border-radius:18px!important;
        border:1px solid rgba(182,147,96,.20)!important;
        background:linear-gradient(145deg,rgba(255,255,255,.68),rgba(248,239,226,.54))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.84)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay #timingQuestionField label{
        color:#967950!important;font-size:10px!important;letter-spacing:1.25px!important;text-transform:uppercase!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay textarea{
        color:#463b47!important;background:rgba(255,255,255,.74)!important;
        border:1px solid rgba(178,145,96,.22)!important;border-radius:14px!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.82)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay textarea::placeholder{color:#a99ca8!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-help{
        color:#776d77!important;font-size:11.5px!important;line-height:1.6!important;
      }
      html.lunea-timing-image-assets-v15 #timingDraw{
        min-height:52px!important;border-radius:17px!important;color:#55475c!important;font-weight:760!important;
        border:1px solid rgba(177,137,82,.36)!important;
        background:
          radial-gradient(circle at 18% 20%,rgba(255,255,255,.62),transparent 28%),
          linear-gradient(110deg,#f4e9d5 0%,#e8def4 45%,#dce9e8 100%)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.88),0 8px 19px rgba(104,74,119,.12)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-stage{
        position:relative!important;padding:20px 6px 8px!important;min-height:310px!important;
      }
      /* Collapse the decorative dial while neither a decoded single card nor
         a completed A/B panel is ready to own the stage. */
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-stage:not(:has(.timing-flip.show)):not(:has(#luneaTimingABPanel.show)){
        min-height:0!important;padding-top:0!important;padding-bottom:0!important;gap:0!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-stage:not(:has(.timing-flip.show)):not(:has(#luneaTimingABPanel.show))::before{
        content:none!important;display:none!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-stage::before{
        content:'';position:absolute;left:50%;top:48%;width:min(330px,84vw);aspect-ratio:1;transform:translate(-50%,-50%);
        pointer-events:none;opacity:.55;
        background:
          radial-gradient(circle,transparent 0 35%,rgba(188,151,88,.16) 35.5% 35.9%,transparent 36.4% 49%,rgba(177,150,204,.12) 49.5% 49.9%,transparent 50.4%),
          conic-gradient(from 0deg,transparent 0 8%,rgba(190,150,82,.16) 8.3% 8.7%,transparent 9% 24%,rgba(167,146,197,.13) 24.3% 24.7%,transparent 25% 49%,rgba(190,150,82,.16) 49.3% 49.7%,transparent 50% 74%,rgba(167,146,197,.13) 74.3% 74.7%,transparent 75%);
        border-radius:50%;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-flip{
        width:min(206px,58vw)!important;height:auto!important;aspect-ratio:3/5!important;
        filter:drop-shadow(0 16px 24px rgba(67,43,65,.18)) drop-shadow(0 0 24px rgba(208,180,123,.10))!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-face{border-radius:21px!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-back{
        border:1px solid rgba(190,145,75,.58)!important;
        background:
          radial-gradient(circle at 50% 39%,rgba(255,255,255,.92),transparent 18%),
          radial-gradient(circle at 23% 18%,rgba(221,205,245,.55),transparent 32%),
          radial-gradient(circle at 82% 78%,rgba(205,227,229,.48),transparent 30%),
          linear-gradient(155deg,#fffaf0,#f0e8f7 51%,#e5f0ee)!important;
        box-shadow:inset 0 0 0 6px rgba(255,253,247,.42),inset 0 0 0 7px rgba(191,148,77,.18)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-back::before{
        content:'☾   ✦   ☽'!important;color:#bd9251!important;font-size:26px!important;letter-spacing:6px!important;
        text-shadow:0 0 18px rgba(210,172,103,.26)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-front{
        background:#fbf6ed!important;border:1px solid rgba(190,146,78,.53)!important;overflow:hidden!important;
        box-shadow:inset 0 0 0 4px rgba(255,253,247,.55),0 12px 28px rgba(74,48,71,.17)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-front>img{
        position:absolute!important;inset:0!important;z-index:3!important;display:block!important;
        width:100%!important;height:100%!important;opacity:1!important;visibility:visible!important;
        object-fit:cover!important;object-position:center!important;filter:none!important;pointer-events:none!important
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .lunea-v7-time-art,
      html.lunea-timing-image-assets-v15 #timingOverlay .lunea-v15-time-art{display:none!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-card-label{display:none!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result{
        position:relative!important;padding:16px 15px!important;border-radius:18px!important;color:#554b55!important;
        border:1px solid rgba(183,145,88,.22)!important;
        background:
          radial-gradient(circle at 94% 10%,rgba(219,205,240,.18),transparent 33%),
          linear-gradient(145deg,rgba(255,255,255,.72),rgba(248,240,226,.72))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.83)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result::before{
        content:'✦';position:absolute;right:14px;top:10px;color:rgba(187,145,75,.46);font-size:14px
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result .group,
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result small{color:#aa824c!important;letter-spacing:1.1px!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result h4,
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result strong{color:#403744!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-result p{color:#696069!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-actions .mini,
      html.lunea-timing-image-assets-v15 #timingOverlay .tab-actions .mini{
        min-height:44px!important;border-radius:14px!important;color:#5d5260!important;
        border:1px solid rgba(179,144,95,.24)!important;
        background:linear-gradient(145deg,rgba(255,255,255,.68),rgba(241,232,221,.60))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.80)!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay #timingRefine{
        border-color:rgba(157,128,182,.34)!important;
        background:linear-gradient(112deg,rgba(235,225,245,.92),rgba(247,238,224,.94))!important;
        color:#5c4d67!important;font-weight:720!important;
      }
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card{
        color:#514755!important;border:1px solid rgba(185,147,90,.22)!important;border-radius:18px!important;
        background:
          radial-gradient(circle at 16% 0%,rgba(222,208,245,.24),transparent 31%),
          linear-gradient(155deg,rgba(255,253,249,.92),rgba(246,238,225,.92))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 10px 25px rgba(73,48,70,.10)!important;
      }
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card small{color:#9a7950!important}
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card b{color:#433a46!important}
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card em{color:#8b718e!important}
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card p{color:#6f6671!important}
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card>img{
        display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;
        max-width:132px!important;aspect-ratio:1024/1700!important;object-fit:cover!important;
        object-position:center!important;margin:0 auto 8px!important;border-radius:11px!important;filter:none!important;
        border:1px solid rgba(190,145,77,.42)!important;
        box-shadow:0 9px 22px rgba(74,47,70,.15),0 0 0 3px rgba(255,252,246,.34)!important
      }
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .lunea-v15-time-art,
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .lunea-v7-time-art{display:none!important}
      html.lunea-timing-image-assets-v15 .timing-inline img,
      html.lunea-timing-image-assets-v15 img[data-lunea-timing-asset]{opacity:1!important;visibility:visible!important;object-fit:cover!important;filter:none!important}
      @media(max-width:390px){
        html.lunea-timing-image-assets-v15 #timingOverlay .timing-modal{padding-left:14px!important;padding-right:14px!important}
        html.lunea-timing-image-assets-v15 #timingOverlay .modal-h{font-size:24px!important}
        html.lunea-timing-image-assets-v15 #timingOverlay .timing-stage{min-height:292px!important;padding-top:16px!important}
        html.lunea-timing-image-assets-v15 #timingOverlay .timing-flip{width:min(190px,56vw)!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installObserver() {
    const root = document.documentElement;
    if (!root || root.__luneaTimingImageObserverV15) return;
    root.__luneaTimingImageObserverV15 = true;
    new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes || []) tagNode(node);
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) tagImage(record.target);
      }
    }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  }

  function boot(){addStyles();tagAll();installObserver();console.info('🃏 LUNEA Timing semantic artwork guard V15.2 loaded')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
