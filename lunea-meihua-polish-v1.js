'use strict';

/*
  LUNEA MEIHUA POLISH V1 loader shim
  Contract markers kept for branch QA: LUNEA_MEIHUA_POLISH_V1 · 1080 · 1350
  The original implementation lives in lunea-meihua-polish-runtime-v1.js.
  UI-only image-free polish is loaded after the runtime so archive/PNG behavior stays unchanged.
*/
(() => {
  if (document.getElementById('luneaMeihuaPolishRuntimeV1Loader')) return;
  const current = document.currentScript?.src || '';
  let version = 'meihua-ui-v2';
  try { version = new URL(current,location.href).searchParams.get('v') || version; } catch {}

  const runtime = document.createElement('script');
  runtime.id = 'luneaMeihuaPolishRuntimeV1Loader';
  runtime.async = false;
  runtime.src = `./lunea-meihua-polish-runtime-v1.js?v=${encodeURIComponent(version)}`;
  runtime.onerror = () => console.error('[LUNEA] Meihua polish runtime failed to load');
  runtime.onload = () => {
    if (document.getElementById('luneaMeihuaUiFinalV2Loader')) return;
    const ui = document.createElement('script');
    ui.id = 'luneaMeihuaUiFinalV2Loader';
    ui.async = false;
    ui.src = `./lunea-meihua-ui-final-v2.js?v=${encodeURIComponent(version)}`;
    ui.onerror = () => console.info('[LUNEA] Meihua UI Final V2 skipped');
    (document.head || document.documentElement).appendChild(ui);
  };
  (document.head || document.documentElement).appendChild(runtime);
})();