'use strict';
(() => {
  if (window.__LUNEA_HORARY_LOCATION_LOADER_V39__) return;
  window.__LUNEA_HORARY_LOCATION_LOADER_V39__ = true;
  const src = './lunea-horary-location-button-v39.js?v=39';
  if ([...document.scripts].some(s => (s.getAttribute('src') || '').includes('lunea-horary-location-button-v39.js'))) return;
  const s = document.createElement('script');
  s.src = src;
  s.defer = true;
  document.head.appendChild(s);
})();
