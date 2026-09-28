'use strict';

/* LUNEA ASTRO ORIGIN FAILOVER V56.1
   GitHub Pages talks to Astro Core directly.
   - Keep the lighter v2 service as the default for shared core routes.
   - Route endpoints that only exist on the full Docker service directly there.
   - Treat 404/405 from one official service as a capability mismatch and retry
     once on the other official service.
   - Gemini and arbitrary custom API URLs are never intercepted.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V56__) return;
  W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V56__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const V2 = 'https://lunea-astro-api-v2.onrender.com';
  const LEGACY = 'https://lunea-astro-api.onrender.com';
  const KNOWN = [V2, LEGACY];
  const RECOVERABLE = new Set([404, 405, 408, 425, 429, 500, 502, 503, 504]);
  const FULL_SERVICE_PATHS = [
    /^\/v1\/prashna(?:\/|\?|$)/i,
    /^\/v1\/vedic\/profile(?:\/|\?|$)/i,
    /^\/v1\/profile\/four-pillars(?:\/|\?|$)/i,
    /^\/v1\/jobs\/astro(?:\/|\?|$)/i,
  ];
  const previousFetch = typeof W.fetch === 'function' ? W.fetch.bind(W) : null;
  if (!previousFetch) return;

  const clean = value => String(value || '').trim().replace(/\/+$/, '');

  function knownOrigin(url) {
    return KNOWN.find(origin => url === origin || url.startsWith(origin + '/')) || '';
  }

  function rewrite(url, from, to) {
    return to + url.slice(from.length);
  }

  function pathOf(url) {
    try {
      const parsed = new URL(String(url), location.href);
      return `${parsed.pathname}${parsed.search || ''}`;
    } catch {
      return String(url || '').replace(/^https?:\/\/[^/]+/i, '');
    }
  }

  function needsFullService(url) {
    const path = pathOf(url);
    return FULL_SERVICE_PATHS.some(pattern => pattern.test(path));
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

  function targets(raw, origin) {
    if (needsFullService(raw)) {
      return {
        first: origin === LEGACY ? raw : rewrite(raw, V2, LEGACY),
        second: origin === V2 ? raw : rewrite(raw, LEGACY, V2),
      };
    }
    return {
      first: origin === LEGACY ? rewrite(raw, LEGACY, V2) : raw,
      second: origin === LEGACY ? raw : rewrite(raw, V2, LEGACY),
    };
  }

  W.fetch = async function(input, init) {
    let raw = '';
    try {
      raw = typeof input === 'string' ? input : (input instanceof URL ? input.href : String(input?.url || ''));
    } catch {}

    const origin = knownOrigin(raw);
    if (!origin) return previousFetch(input, init);

    const {first:firstTarget, second:secondTarget} = targets(raw, origin);

    let firstResponse = null;
    let firstError = null;
    try {
      firstResponse = await tryFetch(firstTarget, input, init);
      if (!RECOVERABLE.has(firstResponse.status)) return firstResponse;
    } catch (error) {
      firstError = error;
    }

    try {
      const secondResponse = await tryFetch(secondTarget, input, init);
      if (secondResponse.ok || !firstResponse) return secondResponse;
      if (!RECOVERABLE.has(secondResponse.status)) return secondResponse;
      return firstResponse;
    } catch (secondError) {
      if (firstResponse) return firstResponse;
      throw firstError || secondError;
    }
  };

  // Only migrate the two official LUNEA origins. A genuinely custom endpoint is
  // left untouched. Shared core routes still prefer v2; capability-only routes
  // are selected per request by needsFullService().
  try {
    const saved = clean(localStorage.getItem(API_KEY));
    if (!saved || saved === LEGACY || saved === V2) localStorage.setItem(API_KEY, V2);
  } catch {}

  W.LUNEA_ASTRO_ORIGIN_FAILOVER_V56 = Object.freeze({
    preferred: V2,
    fallback: LEGACY,
    fullService: LEGACY,
    version: '56.1',
    needsFullService,
  });
})();
