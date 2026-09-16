'use strict';

function luneaShareUiBuildToken() {
  try {
    return new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {
    return '';
  }
}

(() => {
  if (window.__LUNEA_READING_SHARE_UI_V5__) return;
  if (document.getElementById('luneaReadingShareUiV5Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaReadingShareUiV5Loader';
  script.src = `./lunea-reading-share-ui-v5.js?v=${encodeURIComponent(luneaShareUiBuildToken() || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA share UI V5] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();
