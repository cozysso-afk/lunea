'use strict';

function luneaShareUiBuildToken() {
  try {
    return new URL(document.currentScript?.src || '', location.href).searchParams.get('v') || '';
  } catch {
    return '';
  }
}

(() => {
  if (window.__LUNEA_READING_SHARE_UI_V6__) return;
  if (document.getElementById('luneaReadingShareUiV6Loader')) return;
  const script = document.createElement('script');
  script.id = 'luneaReadingShareUiV6Loader';
  script.src = `./lunea-reading-share-ui-v6.js?v=${encodeURIComponent(luneaShareUiBuildToken() || Date.now())}`;
  script.async = false;
  script.onerror = () => console.info('[LUNEA share UI V6] loader skipped');
  (document.head || document.documentElement).appendChild(script);
})();
