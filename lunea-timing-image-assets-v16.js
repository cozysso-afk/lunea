'use strict';

/*
  LUNEA TIMING UPLOADED ART GUARD V16
  ===================================
  Confirms the uploaded 67-card artwork is the actual Timing Oracle face.
  V65 is the final semantic owner and maps all 60 cards to the canonical
  assets/timing-oracle/cards/LT-###.png set restored from the iPhone verify branch.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_UPLOADED_ART_V16__) return;
  W.__LUNEA_TIMING_UPLOADED_ART_V16__ = true;

  const RELEASE = '16.2';
  const ASSET_VERSION = '20261006-162';

  function loadCanonicalV65() {
    if (W.LUNEA_RECOVERY_UI_V65 || document.getElementById('luneaRecoveryUiV65Loader')) return;
    const script = document.createElement('script');
    script.id = 'luneaRecoveryUiV65Loader';
    let build = '20261006-v65.2-lt-final67';
    try {
      const src = document.currentScript?.src || '';
      build = new URL(src, location.href).searchParams.get('v') || build;
    } catch {}
    script.src = `./lunea-recovery-ui-v65.js?v=${encodeURIComponent(build)}`;
    script.async = false;
    script.onerror = () => console.warn('[Timing V16] canonical V65 loader failed');
    (document.head || document.documentElement).appendChild(script);
  }

  const WEEKDAY_ASSETS = Object.freeze({
    61:'timing_061_monday.jpg',
    62:'timing_062_tuesday.jpg',
    63:'timing_063_wednesday.jpg',
    64:'timing_064_thursday.jpg',
    65:'timing_065_friday.jpg',
    66:'timing_066_saturday.jpg',
    67:'timing_067_sunday.jpg'
  });

  function assetPath(index) {
    const n = Number(index);
    if (!Number.isInteger(n) || n < 1 || n > 67) return null;
    if (n <= 60) return `./assets/timing-oracle/cards/LT-${String(n).padStart(3, '0')}.png?v=${ASSET_VERSION}`;
    const filename = WEEKDAY_ASSETS[n];
    return filename ? `./assets/timing-oracle/cards/${filename}?v=${ASSET_VERSION}` : null;
  }

  function indexFrom(img) {
    if (!(img instanceof HTMLImageElement)) return null;
    const raw = `${img.getAttribute('src') || ''} ${img.currentSrc || ''} ${img.dataset?.luneaTimingAsset || ''}`;
    const direct = raw.match(/(?:LT-|timing_)(\d{3})/i);
    if (direct) {
      const n = Number(direct[1]);
      if (n >= 1 && n <= 67) return n;
    }
    const dataId = String(img.dataset?.luneaTimingCardId || '').match(/LT-(\d{3})/i);
    if (dataId) {
      const n = Number(dataId[1]);
      if (n >= 1 && n <= 67) return n;
    }
    const dataN = Number(img.dataset?.luneaTimingAsset || img.dataset?.luneaTimingAssetV16 || 0);
    return Number.isInteger(dataN) && dataN >= 1 && dataN <= 67 ? dataN : null;
  }

  function hasCorrectAssetPath(img, n) {
    try {
      const raw = img.getAttribute('src') || '';
      const wanted = assetPath(n);
      if (!raw || !wanted) return false;
      const currentUrl = new URL(raw, document.baseURI);
      const wantedUrl = new URL(wanted, document.baseURI);
      return currentUrl.pathname.toLowerCase() === wantedUrl.pathname.toLowerCase();
    } catch { return false; }
  }

  function upgradeImage(img) {
    const n = indexFrom(img);
    if (!n) return false;
    img.dataset.luneaTimingAssetV16 = String(n);
    img.dataset.luneaTimingCardId = `LT-${String(n).padStart(3, '0')}`;
    if (hasCorrectAssetPath(img, n)) return true;

    // The modal reuses one <img>. A V65 marker from the previous card must not
    // freeze a newly assigned legacy src on the old face.
    if (img.dataset?.luneaTimingArtworkV65 === '1') {
      delete img.dataset.luneaTimingArtworkV65;
      delete img.dataset.luneaTimingSemantic;
    }
    const wanted = assetPath(n);
    if (wanted) img.setAttribute('src', wanted);
    return !!wanted;
  }

  function upgradeNode(node) {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLImageElement) upgradeImage(node);
    node.querySelectorAll?.('img[src*="timing_" i],img[src*="/LT-" i],img[data-lunea-timing-asset],img[data-lunea-timing-card-id]').forEach(upgradeImage);
  }

  function upgradeAll() {
    document.querySelectorAll('img[src*="timing_" i],img[src*="/LT-" i],img[data-lunea-timing-asset],img[data-lunea-timing-card-id]').forEach(upgradeImage);
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
    loadCanonicalV65();
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
    console.info('🕰 LUNEA Timing uploaded artwork V16 verified · canonical V65 owner requested');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
