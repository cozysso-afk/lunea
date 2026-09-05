'use strict';

/* LUNEA ASTRO REAL WARM V53
   The frontend's /__lunea_api/health endpoint is intentionally local-fast.
   This layer warms the real Render Astro backend through /openapi.json before
   calculation POSTs, so Transit / Returns / Thai / Horary / Natal do not spend
   the user's first calculation request waking a sleeping free instance.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_REAL_WARM_V53__) return;
  W.__LUNEA_ASTRO_REAL_WARM_V53__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const ASTRO_POST_RE = /\/v1\/(?:natal|transits\/scan|returns\/context|thai\/taksa(?:\/range)?|horary)(?:\?|$)/i;
  const RETRYABLE = new Set([408, 425, 429, 502, 503, 504]);
  const DELAYS = [0, 1200, 2500, 4500, 7000];
  const FRESH_MS = 4 * 60 * 1000;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const prior = typeof W.fetch === 'function' ? W.fetch.bind(W) : null;
  if (!prior) return;

  let readyAt = 0;
  let warmPromise = null;
  let lastError = '';

  function apiBase() {
    const saved = String(localStorage.getItem(API_KEY) || '').trim().replace(/\/+$/, '');
    return saved || `${location.origin}/__lunea_api`;
  }

  function warmUrl() {
    const base = apiBase();
    return `${base}/openapi.json?lunea_real_warm=${Date.now()}`;
  }

  async function runWarm() {
    let last = null;
    for (let i = 0; i < DELAYS.length; i += 1) {
      if (DELAYS[i]) await sleep(DELAYS[i]);
      try {
        const response = await prior(warmUrl(), {
          method: 'GET',
          cache: 'no-store',
          headers: {Accept: 'application/json'}
        });
        if (response.ok) {
          readyAt = Date.now();
          lastError = '';
          return true;
        }
        last = new Error(`Astro backend warm HTTP ${response.status}`);
        if (!RETRYABLE.has(response.status)) throw last;
      } catch (error) {
        last = error;
        lastError = String(error?.message || error);
      }
    }
    throw last || new Error('Astro backend warm failed');
  }

  function ensureReady(force = false) {
    if (!force && readyAt && Date.now() - readyAt < FRESH_MS) return Promise.resolve(true);
    if (!force && warmPromise) return warmPromise;
    warmPromise = runWarm().finally(() => { warmPromise = null; });
    return warmPromise;
  }

  W.fetch = async function(input, init) {
    let url = '';
    let method = String(init?.method || '').toUpperCase();
    try {
      url = typeof input === 'string' ? input : String(input?.url || '');
      if (!method && input?.method) method = String(input.method).toUpperCase();
    } catch {}
    if (!method) method = 'GET';

    if (method === 'POST' && ASTRO_POST_RE.test(url)) {
      try {
        await ensureReady(false);
      } catch (error) {
        // Do not consume the click on a warm-up failure. The existing V48/V52
        // retry chain still gets the real calculation request and final say.
        console.warn('[LUNEA Astro Warm V53] preflight warning:', error?.message || error);
      }
    }
    return prior(input, init);
  };

  function backgroundWarm() {
    setTimeout(() => {
      ensureReady(false).catch(error => {
        console.info('[LUNEA Astro Warm V53] background warm pending/failed:', error?.message || error);
      });
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', backgroundWarm, {once:true});
  else backgroundWarm();
  W.addEventListener('pageshow', () => {
    if (!readyAt || Date.now() - readyAt >= FRESH_MS) backgroundWarm();
  }, {passive:true});

  W.LUNEA_ASTRO_REAL_WARM_V53 = Object.freeze({
    ensureReady,
    getState: () => ({readyAt, warming: Boolean(warmPromise), lastError, api: apiBase()})
  });
  console.info('🌌 LUNEA Astro real backend warm V53 loaded');
})();
