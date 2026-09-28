'use strict';

/*
  LUNEA TIMING IMAGE ASSETS V15
  -----------------------------
  Restores the uploaded 60-card Timing Oracle artwork as the actual card face.
  - 001~040, 051~060 use uploaded JPG assets.
  - 041~050 use the separately re-uploaded PNG assets.
  - Existing timing RNG/filtering/prompt/archive logic stays untouched.
  - Overrides the older CSS Moon Dial replacement visuals only.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_MOONDIAL_SYNC_V15__) return;
  W.__LUNEA_TIMING_MOONDIAL_SYNC_V15__ = true;
  document.documentElement.classList.add('lunea-timing-image-assets-v15');

  const ASSET_VERSION = '20260905-2104';

  function assetPath(index) {
    const n = Number(index);
    if (!Number.isInteger(n) || n < 1 || n > 60) return null;
    const stem = `timing_${String(n).padStart(3, '0')}`;
    const ext = n >= 41 && n <= 50 ? 'PNG' : 'jpg';
    return `./${stem}.${ext}?v=${ASSET_VERSION}`;
  }

  function timingIndexFromImage(img) {
    if (!(img instanceof HTMLImageElement)) return null;
    const raw = `${img.getAttribute('src') || ''} ${img.currentSrc || ''}`;
    const match = raw.match(/timing_(\d{3})/i);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isInteger(n) && n >= 1 && n <= 60 ? n : null;
  }

  function upgradeImage(img) {
    const n = timingIndexFromImage(img);
    if (!n) return false;
    const wanted = assetPath(n);
    if (!wanted) return false;
    const current = img.getAttribute('src') || '';
    if (current !== wanted) img.setAttribute('src', wanted);
    img.dataset.luneaTimingAsset = String(n);
    return true;
  }

  function upgradeNode(node) {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLImageElement) upgradeImage(node);
    node.querySelectorAll?.('img[src*="timing_" i]').forEach(upgradeImage);
  }

  function upgradeAll() {
    document.querySelectorAll('img[src*="timing_" i]').forEach(upgradeImage);
  }

  function addStyles() {
    if (document.getElementById('luneaTimingImageAssetsV15Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaTimingImageAssetsV15Style';
    style.textContent = `
      /* Use the uploaded artwork itself as the Timing Oracle face. */
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-front{
        background:#0b0d1c!important;
        border:1px solid rgba(237,231,215,.34)!important;
        overflow:hidden!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-front>img{
        position:absolute!important;
        inset:0!important;
        z-index:3!important;
        display:block!important;
        width:100%!important;
        height:100%!important;
        opacity:1!important;
        visibility:visible!important;
        object-fit:cover!important;
        object-position:center!important;
        filter:none!important;
        pointer-events:none!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .lunea-v7-time-art,
      html.lunea-timing-image-assets-v15 #timingOverlay .lunea-v15-time-art{
        display:none!important;
      }
      /* The artwork already contains its own number and time label. */
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-card-label{
        display:none!important;
      }
      html.lunea-timing-image-assets-v15 #timingOverlay .timing-inner.flipped .timing-front::after{
        z-index:6!important;
      }

      /* A/B timing cards: restore the uploaded art instead of CSS mini Moon Dial. */
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .tab-card>img{
        display:block!important;
        opacity:1!important;
        visibility:visible!important;
        width:100%!important;
        max-width:132px!important;
        aspect-ratio:1024/1700!important;
        object-fit:cover!important;
        object-position:center!important;
        margin:0 auto 7px!important;
        border-radius:11px!important;
        filter:none!important;
      }
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .lunea-v15-time-art,
      html.lunea-timing-image-assets-v15 #luneaTimingABPanel .lunea-v7-time-art{
        display:none!important;
      }

      /* Saved/inline Timing results also use the same new artwork. */
      html.lunea-timing-image-assets-v15 .timing-inline img,
      html.lunea-timing-image-assets-v15 img[data-lunea-timing-asset]{
        opacity:1!important;
        visibility:visible!important;
        object-fit:cover!important;
        filter:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  function installObserver() {
    const root = document.documentElement;
    if (!root || root.__luneaTimingImageObserverV15) return;
    root.__luneaTimingImageObserverV15 = true;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) upgradeNode(node);
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
          upgradeImage(record.target);
        }
      }
    });
    observer.observe(root, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['src']
    });
  }

  function boot() {
    addStyles();
    upgradeAll();
    installObserver();

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#timingRefine,#luneaTimingABAIButton,#luneaTimingABPanel,.lunea-timing-category')) {
        requestAnimationFrame(upgradeAll);
        setTimeout(upgradeAll, 60);
        setTimeout(upgradeAll, 220);
      }
    }, {passive:true});

    window.addEventListener('pageshow', () => setTimeout(upgradeAll, 0), {passive:true});
    console.info('🃏 LUNEA Timing uploaded artwork V15 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
