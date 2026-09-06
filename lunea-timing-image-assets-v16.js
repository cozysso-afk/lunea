'use strict';

/*
  LUNEA TIMING UPLOADED ART GUARD V16.1
  ======================================
  Visual guard only. The semantic filename chosen by timing-oracle-v1.js is the
  source of truth. Never collapse timing_001_near_now.png to timing_001.jpg.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_UPLOADED_ART_V16__) return;
  W.__LUNEA_TIMING_UPLOADED_ART_V16__ = true;
  const RELEASE = '16.1';

  function tagImage(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const raw = img.getAttribute('src') || '';
    const match = raw.match(/timing_(\d{3})(?:_[^./?]+)?\.(?:png|jpe?g)/i);
    if (!match) return false;
    const n = Number(match[1]);
    if (!Number.isInteger(n) || n < 1 || n > 60) return false;
    img.dataset.luneaTimingAssetV16 = String(n);
    return true;
  }

  function tagNode(node) {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLImageElement) tagImage(node);
    node.querySelectorAll?.('img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(tagImage);
  }

  function upgradeAll() {
    document.querySelectorAll('img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(tagImage);
  }

  function addStyle() {
    if (document.getElementById('luneaTimingUploadedArtV16Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaTimingUploadedArtV16Style';
    style.textContent = `
      #timingOverlay .timing-front{overflow:hidden!important;background:#0b0d1c!important}
      #timingOverlay .timing-front>img,
      #luneaTimingABPanel .tab-card>img,
      .timing-inline img,
      img[data-lunea-timing-asset-v16]{display:block!important;opacity:1!important;visibility:visible!important;object-fit:cover!important;object-position:center!important;filter:none!important}
      #timingOverlay .timing-front>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:9!important}
      #timingOverlay .lunea-v7-time-art,#timingOverlay .lunea-v15-time-art,
      #luneaTimingABPanel .lunea-v7-time-art,#luneaTimingABPanel .lunea-v15-time-art{display:none!important}
      #timingOverlay .timing-card-label{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function installObserver() {
    const root = document.documentElement;
    if (!root || root.__luneaTimingUploadedV16Observed) return;
    root.__luneaTimingUploadedV16Observed = true;
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') for (const node of record.addedNodes || []) tagNode(node);
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) tagImage(record.target);
      }
    }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  }

  function boot(){addStyle();upgradeAll();installObserver();W.LUNEA_TIMING_UPLOADED_ART_V16=Object.freeze({version:RELEASE,upgradeAll});console.info('🕰 LUNEA Timing semantic artwork V16.1 verified')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();