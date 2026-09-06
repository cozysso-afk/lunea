'use strict';

/*
  LUNEA TIMING IMAGE ASSETS V15.1
  --------------------------------
  V57 correctness rule: timing-oracle-v1.js owns the semantic filename for a
  drawn card (for example timing_001_near_now.png). Never replace that filename
  with timing_001.jpg merely because both contain the same numeric prefix.

  The old V15 rewrite did exactly that. The generic numbered uploads are not a
  trustworthy id->meaning map, which produced #41 / 3-4 MONTHS artwork beside
  LT-001 / Near Now text and #57 / OUTSIDE WINDOW beside Dawn text.

  This file is now visual-only. It never mutates img.src.
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
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-front{
        background:#0b0d1c!important;border:1px solid rgba(237,231,215,.34)!important;overflow:hidden!important
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-front>img{
        position:absolute!important;inset:0!important;z-index:3!important;display:block!important;
        width:100%!important;height:100%!important;opacity:1!important;visibility:visible!important;
        object-fit:cover!important;object-position:center!important;filter:none!important;pointer-events:none!important
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .lunea-v7-time-art,
      html.lunea-timing-image-assets-v15 #timingOverlay .lunea-v15-time-art{display:none!important}
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-card-label{display:none!important}
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card>img{
        display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;
        max-width:132px!important;aspect-ratio:1024/1700!important;object-fit:cover!important;
        object-position:center!important;margin:0 auto 7px!important;border-radius:11px!important;filter:none!important
      }
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .lunea-v15-time-art,
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .lunea-v7-time-art{display:none!important}
      html.lunea-timing-image-assets-v15 .timing-inline img,
      html.lunea-timing-image-assets-v15 img[data-lunea-timing-asset]{opacity:1!important;visibility:visible!important;object-fit:cover!important;filter:none!important}
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

  function boot(){addStyles();tagAll();installObserver();console.info('🃏 LUNEA Timing semantic artwork guard V15.1 loaded')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();