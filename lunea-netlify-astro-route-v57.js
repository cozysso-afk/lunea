'use strict';

/* LUNEA Netlify Astro Route V57
   Host adapter only: routes the two known Render Astro origins through the
   same-origin Netlify proxy. No localStorage / IndexedDB writes. */
(() => {
  const W = window;
  if (W.__LUNEA_NETLIFY_ASTRO_ROUTE_V57__) return;
  if (!/\.netlify\.app$/i.test(location.hostname)) return;
  W.__LUNEA_NETLIFY_ASTRO_ROUTE_V57__ = true;

  const nativeFetch = W.fetch.bind(W);
  const ORIGINS = [
    'https://lunea-astro-api-v2.onrender.com',
    'https://lunea-astro-api.onrender.com'
  ];

  function routedUrl(input) {
    let raw = '';
    try {
      raw = typeof input === 'string' ? input :
        (input instanceof URL ? input.href : String(input?.url || ''));
      const origin = ORIGINS.find(base => raw === base || raw.startsWith(base + '/'));
      if (!origin) return '';
      const upstream = new URL(raw);
      return `${location.origin}/__lunea_api${upstream.pathname}${upstream.search}`;
    } catch { return ''; }
  }

  W.fetch = function luneaNetlifyAstroFetch(input, init) {
    const routed = routedUrl(input);
    if (!routed) return nativeFetch(input, init);

    /* LUNEA Astro clients use URL strings for health / POST calculations.
       Keep Request-object calls untouched rather than risking body mutation. */
    if (typeof input !== 'string' && !(input instanceof URL)) {
      return nativeFetch(input, init);
    }
    return nativeFetch(routed, init);
  };

  W.LUNEA_NETLIFY_ASTRO_ROUTE_V57 = Object.freeze({
    version:'57.0',
    origins:ORIGINS.slice()
  });
  console.info('✦ LUNEA Netlify Astro route V57 active');
})();
