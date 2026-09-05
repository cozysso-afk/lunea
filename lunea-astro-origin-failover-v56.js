'use strict';

/* LUNEA ASTRO ORIGIN FAILOVER V56
   GitHub Pages talks to Astro Core directly. Prefer the v2 service and retry
   once against the legacy service only for transient network/server failures.
   Gemini and arbitrary custom API URLs are never intercepted.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V56__) return;
  W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V56__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const V2 = 'https://lunea-astro-api-v2.onrender.com';
  const LEGACY = 'https://lunea-astro-api.onrender.com';
  const KNOWN = [V2, LEGACY];
  const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504]);
  const previousFetch = typeof W.fetch === 'function' ? W.fetch.bind(W) : null;
  if (!previousFetch) return;

  const clean = value => String(value || '').trim().replace(/\/+$/, '');

  function knownOrigin(url) {
    return KNOWN.find(origin => url === origin || url.startsWith(origin + '/')) || '';
  }

  function rewrite(url, from, to) {
    return to + url.slice(from.length);
  }

  function requestFor(target, input, init) {
    if (typeof input === 'string' || input instanceof URL) {
      return previousFetch(target, init);
    }
    try {
      const cloned = typeof input?.clone === 'function' ? input.clone() : input;
      return previousFetch(new Request(target, cloned), init);
    } catch {
      return previousFetch(target, init);
    }
  }

  async function tryFetch(target, input, init) {
    return requestFor(target, input, init);
  }

  W.fetch = async function(input, init) {
    let raw = '';
    try {
      raw = typeof input === 'string' ? input : (input instanceof URL ? input.href : String(input?.url || ''));
    } catch {}

    const origin = knownOrigin(raw);
    if (!origin) return previousFetch(input, init);

    const alternate = origin === V2 ? LEGACY : V2;
    const firstTarget = origin === LEGACY ? rewrite(raw, LEGACY, V2) : raw;
    const secondTarget = origin === LEGACY ? raw : rewrite(raw, V2, LEGACY);

    let firstResponse = null;
    let firstError = null;
    try {
      firstResponse = await tryFetch(firstTarget, input, init);
      if (!TRANSIENT.has(firstResponse.status)) return firstResponse;
    } catch (error) {
      firstError = error;
    }

    try {
      const secondResponse = await tryFetch(secondTarget, input, init);
      if (secondResponse.ok || !firstResponse) return secondResponse;
      if (!TRANSIENT.has(secondResponse.status)) return secondResponse;
      return firstResponse;
    } catch (secondError) {
      if (firstResponse) return firstResponse;
      throw firstError || secondError;
    }
  };

  // Only migrate the two official LUNEA origins. A genuinely custom endpoint is
  // left untouched.
  try {
    const saved = clean(localStorage.getItem(API_KEY));
    if (!saved || saved === LEGACY || saved === V2) localStorage.setItem(API_KEY, V2);
  } catch {}

  W.LUNEA_ASTRO_ORIGIN_FAILOVER_V56 = Object.freeze({
    preferred: V2,
    fallback: LEGACY,
    version: 56,
  });
})();
