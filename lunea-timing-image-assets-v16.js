'use strict';

/*
  LUNEA TIMING UPLOADED ART GUARD V16
  ===================================
  Confirms the uploaded 60-card artwork is the actual Timing Oracle face.
  This guard intentionally accepts a correct timing_XXX.jpg/PNG pathname even
  when an older V15 cache query is present, avoiding observer ping-pong.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_UPLOADED_ART_V16__) return;
  W.__LUNEA_TIMING_UPLOADED_ART_V16__ = true;

  const RELEASE = '16.0';
  const ASSET_VERSION = '20260905-2130';

  function assetPath(index) {
    const n = Number(index);
    if (!Number.isInteger(n) || n < 1 || n > 60) return null;
    const stem = `timing_${String(n).padStart(3, '0')}`;
    const ext = n >= 41 && n <= 50 ? 'PNG' : 'jpg';
    return `./${stem}.${ext}?v=${ASSET_VERSION}`;
  }

  function indexFrom(img) {
    if (!(img instanceof HTMLImageElement)) return null;
    const raw = `${img.getAttribute('src') || ''} ${img.currentSrc || ''} ${img.dataset?.luneaTimingAsset || ''}`;
    const direct = raw.match(/timing_(\d{3})/i);
    if (direct) {
      const n = Number(direct[1]);
      if (n >= 1 && n <= 60) return n;
    }
    const dataN = Number(img.dataset?.luneaTimingAsset || 0);
    return Number.isInteger(dataN) && dataN >= 1 && dataN <= 60 ? dataN : null;
  }

  function expectedPathname(n) {
    const ext = n >= 41 && n <= 50 ? 'PNG' : 'jpg';
    return `/timing_${String(n).padStart(3, '0')}.${ext}`.toLowerCase();
  }

  function hasCorrectAssetPath(img, n) {
    try {
      const raw = img.getAttribute('src') || '';
      if (!raw) return false;
      const url = new URL(raw, document.baseURI);
      return url.pathname.toLowerCase().endsWith(expectedPathname(n));
    } catch { return false; }
  }

  function upgradeImage(img) {
    const n = indexFrom(img);
    if (!n) return false;
    img.dataset.luneaTimingAssetV16 = String(n);
    if (!hasCorrectAssetPath(img, n)) img.setAttribute('src', assetPath(n));
    return true;
  }

  function upgradeNode(node) {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLImageElement) upgradeImage(node);
    node.querySelectorAll?.('img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(upgradeImage);
  }

  function upgradeAll() {
    document.querySelectorAll('img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(upgradeImage);
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
      img[data-lunea-timing-asset-v16]{
        display:block!important;opacity:1!important;visibility:visible!important;
        object-fit:cover!important;object-position:center!important;filter:none!important;
      }
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
        if (record.type === 'childList') for (const node of record.addedNodes || []) upgradeNode(node);
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) upgradeImage(record.target);
      }
    }).observe(root, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  }

  function boot() {
    addStyle();
    upgradeAll();
    installObserver();
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#timingRefine,#luneaTimingABAIButton,#luneaTimingABPanel,.lunea-timing-category')) {
        requestAnimationFrame(upgradeAll);
        setTimeout(upgradeAll, 80);
        setTimeout(upgradeAll, 260);
      }
    }, {passive:true});
    W.addEventListener?.('pageshow', () => setTimeout(upgradeAll, 0), {passive:true});
    W.LUNEA_TIMING_UPLOADED_ART_V16 = Object.freeze({version:RELEASE, assetPath, upgradeAll});
    console.info('🕰 LUNEA Timing uploaded artwork V16 verified');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
