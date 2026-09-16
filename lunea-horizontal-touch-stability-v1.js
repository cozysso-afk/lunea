'use strict';

/*
  LUNEA Horizontal Touch Stability V1
  -----------------------------------
  Prevents the whole iPhone/PWA viewport from drifting sideways while the user
  scrolls or touches reading / archive surfaces.

  Preserves intentional horizontal scrollers such as profile tags and compact
  action bars. No reading logic, RNG, archive data, auth, or calculation logic
  is changed.
*/
(() => {
  if (window.__LUNEA_HORIZONTAL_TOUCH_STABILITY_V1__) return;
  window.__LUNEA_HORIZONTAL_TOUCH_STABILITY_V1__ = true;

  const style = document.createElement('style');
  style.id = 'luneaHorizontalTouchStabilityV1Style';
  style.textContent = `
    html,body{
      width:100%;
      max-width:100%;
      overflow-x:hidden!important;
      overscroll-behavior-x:none!important;
    }
    body{position:relative}
    @supports (overflow:clip){
      html,body{overflow-x:clip!important}
    }

    .app,.overlay,.modal,.sheet,
    #archiveOverlay,#spreadOverlay,#profileOverlay{
      max-width:100vw;
      min-width:0;
      overscroll-behavior-x:none;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  const HORIZONTAL_SCROLL_SELECTOR = [
    '.profile-tags',
    '.actionbar',
    '[data-horizontal-scroll]',
    '[style*="overflow-x: auto"]',
    '[style*="overflow-x:auto"]',
    '[style*="overflow-x: scroll"]',
    '[style*="overflow-x:scroll"]'
  ].join(',');

  let startX = 0;
  let startY = 0;
  let guardGesture = false;

  function isHorizontalScroller(target) {
    const el = target?.closest?.(HORIZONTAL_SCROLL_SELECTOR);
    if (!el) return false;
    return el.scrollWidth > el.clientWidth + 2;
  }

  document.addEventListener('touchstart', event => {
    const t = event.touches?.[0];
    if (!t) return;
    startX = t.clientX;
    startY = t.clientY;
    guardGesture = !isHorizontalScroller(event.target);
  }, {passive:true, capture:true});

  document.addEventListener('touchmove', event => {
    if (!guardGesture || event.touches?.length !== 1) return;
    const t = event.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // Only suppress a deliberate horizontal drag. Vertical page scrolling,
    // taps and small finger jitter continue normally.
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.08) {
      event.preventDefault();
    }
  }, {passive:false, capture:true});

  document.addEventListener('touchend', () => { guardGesture = false; }, {passive:true, capture:true});
  document.addEventListener('touchcancel', () => { guardGesture = false; }, {passive:true, capture:true});

  // Defensive recovery for browsers that briefly expose a non-zero pageXOffset.
  let correcting = false;
  window.addEventListener('scroll', () => {
    if (correcting || Math.abs(window.scrollX || 0) < 1) return;
    correcting = true;
    const y = window.scrollY || 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      correcting = false;
    });
  }, {passive:true});
})();

// Archive card artwork support is isolated in its own module; this already-loaded
// runtime helper only bootstraps it so no archive code needs to live in index.html.
(() => {
  if (window.__LUNEA_ARCHIVE_CARD_IMAGES_V1__) return;
  if (document.getElementById('luneaArchiveCardImagesV1Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaArchiveCardImagesV1Loader';
  let build = '';
  try {
    build = new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {}
  script.src = `./lunea-archive-card-images-v1.js?v=${encodeURIComponent(build || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA archive card images] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();
