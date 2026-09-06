'use strict';

/* LUNEA ASTRO ORIGIN FAILOVER V57
   Stable-host adapter for the two official Astro Core origins.
   - V2 is preferred, legacy is automatic fallback.
   - transient network/408/425/429/5xx failures are retried with short spacing.
   - custom API URLs remain untouched.
   - no localStorage / IndexedDB writes. */
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__ || typeof W.fetch !== 'function') return;
  W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__ = true;

  const ORIGINS = Object.freeze([
    'https://lunea-astro-api-v2.onrender.com',
    'https://lunea-astro-api.onrender.com'
  ]);
  const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504]);
  const nativeFetch = W.fetch.bind(W);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function rawUrl(input) {
    try {
      if (typeof input === 'string') return input;
      if (input instanceof URL) return input.href;
      return String(input?.url || '');
    } catch { return ''; }
  }

  function official(url) {
    return ORIGINS.find(origin => url === origin || url.startsWith(origin + '/')) || '';
  }

  function targetUrl(originalUrl, targetOrigin) {
    const u = new URL(originalUrl);
    return `${targetOrigin}${u.pathname}${u.search}`;
  }

  async function runFetch(input, init, url) {
    if (typeof input === 'string' || input instanceof URL) return nativeFetch(url, init);
    try {
      const req = input.clone();
      return nativeFetch(new Request(url, req), init);
    } catch {
      return nativeFetch(url, init);
    }
  }

  W.fetch = async function luneaAstroFailoverV57(input, init) {
    const originalUrl = rawUrl(input);
    if (!official(originalUrl)) return nativeFetch(input, init);

    /* Always start with V2, regardless of a stale legacy URL stored by an older build. */
    let lastResponse = null;
    let lastError = null;
    const waits = [0, 900];

    for (const origin of ORIGINS) {
      const url = targetUrl(originalUrl, origin);
      for (let attempt = 0; attempt < waits.length; attempt += 1) {
        if (waits[attempt]) await sleep(waits[attempt]);
        try {
          const response = await runFetch(input, init, url);
          lastResponse = response;
          if (!TRANSIENT.has(response.status)) return response;
          if (response.status === 429) {
            try {
              const h = response.headers?.get?.('retry-after');
              if (h && /^\d+(?:\.\d+)?$/.test(h)) await sleep(Math.min(2200, Math.max(300, Number(h) * 1000)));
            } catch {}
          }
        } catch (error) {
          lastError = error;
          if (String(error?.name || '') === 'AbortError') throw error;
        }
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new TypeError('Astro Core network request failed');
  };

  /* Fire-and-forget wake. Failures are intentionally ignored. */
  setTimeout(() => {
    for (const origin of ORIGINS) {
      nativeFetch(`${origin}/health?t=${Date.now()}`, {method:'GET', cache:'no-store'}).catch(() => {});
    }
  }, 250);

  W.LUNEA_ASTRO_ORIGIN_FAILOVER_V57 = Object.freeze({version:57, origins:ORIGINS.slice()});
  console.info('✦ LUNEA Astro Origin Failover V57 active · V2 → legacy');
})();
