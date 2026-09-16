'use strict';
(() => {
  if (window.__LUNEA_READING_SHARE_UI_V5__) return;
  if (document.getElementById('luneaReadingShareUiV5Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaReadingShareUiV5Loader';
  let build = '';
  try {
    build = new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {}
  script.src = `./lunea-reading-share-ui-v5.js?v=${encodeURIComponent(build || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA share UI V5] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();
