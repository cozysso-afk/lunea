'use strict';
/* LUNEA deterministic Vercel recovery.
   This historical bootstrap used to inject a second generation of Timing/Astro/
   Horary modules after the structural loader. That is the source of mixed UI.
   On this recovery branch it is intentionally a no-op; one loader owns runtime. */
(()=>{
  if(window.__LUNEA_CACHE_REFRESH_V1__)return;
  window.__LUNEA_CACHE_REFRESH_V1__=true;
  window.__LUNEA_DETERMINISTIC_CACHE_REFRESH_DISABLED__=true;
  console.info('✦ LUNEA deterministic host · secondary cache/feature injector disabled');
})();
