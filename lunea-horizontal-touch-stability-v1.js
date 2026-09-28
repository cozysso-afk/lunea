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

    /* CSS-only reading tail. Existing controls remain 3-up (2/6 tracks each),
       while the final two actions share one row exactly 50:50. No DOM moving,
       observer, timer, or reading-state mutation is involved. */
    body #spreadOverlay .actionbar.actionbar{
      grid-template-columns:repeat(6,minmax(0,1fr))!important;
    }
    body #spreadOverlay .actionbar.actionbar > button{
      grid-column:span 2!important;
    }
    body #spreadOverlay .actionbar.actionbar #luneaTopCopyPrompt{
      grid-column:span 3!important;
      order:9998!important;
      width:100%!important;
      min-width:0!important;
    }
    body #spreadOverlay .actionbar.actionbar #luneaShareReadingPng{
      grid-column:span 3!important;
      order:9999!important;
      width:100%!important;
      min-width:0!important;
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

// V46 restores card artwork that Horary V44 could mistakenly suppress when a
// Tarot/Daily reading carried auxiliary Horary data. It intentionally runs as a
// separate, late presentation repair layer so card and calculation data stay untouched.
(() => {
  if (window.__LUNEA_ARCHIVE_CARD_RESTORE_V46__) return;
  if (document.getElementById('luneaArchiveCardRestoreV46Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaArchiveCardRestoreV46Loader';
  let build = '';
  try {
    build = new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {}
  script.src = `./lunea-archive-card-restore-v46.js?v=${encodeURIComponent(build || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA archive card restore V46] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();

// Lenormand archive V2 removes the duplicate fifth action button and repairs
// the iPhone archive interaction state after Journal V2 renders.
(() => {
  if (window.__LUNEA_LENORMAND_ARCHIVE_HOTFIX_V2__) return;
  if (document.getElementById('luneaLenormandArchiveHotfixV2Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaLenormandArchiveHotfixV2Loader';
  let build = '';
  try {
    build = new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {}
  script.src = `./lunea-lenormand-archive-hotfix-v2.js?v=${encodeURIComponent(build || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA Lenormand archive hotfix V2] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();

// Reading PNG share has one owner now: lunea-cache-refresh-v1.js loads
// lunea-reading-share-v1.js. V3 owns only the presentation/export layout.
(() => {
  if (window.__LUNEA_READING_SHARE_POLISH_V3__) return;
  if (document.getElementById('luneaReadingSharePolishV3Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaReadingSharePolishV3Loader';
  let build = '';
  try {
    build = new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {}
  script.src = `./lunea-reading-share-polish-v3.js?v=${encodeURIComponent(build || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA share polish V3] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();

// V4 is the stable loader entry. It now routes to the user-facing V6 share UI,
// which validates and flattens every page before opening the native share sheet.
(() => {
  if (window.__LUNEA_READING_SHARE_UI_V6__) return;
  if (document.getElementById('luneaReadingShareUiV4Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaReadingShareUiV4Loader';
  let build = '';
  try {
    build = new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {}
  script.src = `./lunea-reading-share-ui-v4.js?v=${encodeURIComponent(build || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA share UI loader] skipped');
  (document.head || document.documentElement).appendChild(script);
})();
