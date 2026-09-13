'use strict';

/*
  LUNEA ASTRO STABILITY V2.2
  ==========================
  Purpose:
  - keep one Gemini watchdog, allowing 75s for long tarot/profile prompts
  - actively abort a timed-out Gemini request so it does not keep running
  - prime Astro Core in the background without serially blocking the user's POST
  - leave Natal V1.1's own one-tap lifecycle intact
  - preserve Lag Guard's AbortController for stale auxiliary requests

  IMPORTANT V2.2 CHANGE:
  A /health request must never sit in front of Transit / Return / Horary.
  The real calculation request is now sent on the first tap immediately while
  the health probe continues in parallel. This removes the old double-latency
  path on a cold Render instance.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_STABILITY_V2__) return;
  W.__LUNEA_ASTRO_STABILITY_V2__ = true;

  W.__LUNEA_REQUEST_WATCHDOG_V305__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const DEFAULT_API_URL = 'https://lunea-astro-api.onrender.com';
  const GEMINI_TIMEOUT_MS = 75000;
  const baseFetch = typeof W.fetch === 'function' ? W.fetch.bind(W) : null;

  if (!baseFetch) {
    console.warn('[LUNEA Astro Stability V2.2] fetch unavailable');
    return;
  }

  // ------------------------------------------------------------
  // Gemini-only watchdog. Astro requests are NOT capped here.
  // ------------------------------------------------------------
  if (!W.__LUNEA_GEMINI_WATCHDOG_V3__) {
    W.__LUNEA_GEMINI_WATCHDOG_V3__ = true;
    W.__LUNEA_GEMINI_WATCHDOG_V2__ = true;

    W.fetch = function(input, init) {
      let url = '';
      try {
        url = typeof input === 'string' ? input : String(input?.url || '');
      } catch {}

      if (!/generativelanguage\.googleapis\.com/i.test(url)) {
        return baseFetch(input, init);
      }

      const timeoutController = typeof AbortController === 'function'
        ? new AbortController()
        : null;
      const upstreamSignal = init?.signal || input?.signal || null;
      let detachUpstreamAbort = null;
      let nextInit = init;

      if (timeoutController) {
        if (upstreamSignal?.aborted) {
          try { timeoutController.abort(upstreamSignal.reason); }
          catch { timeoutController.abort(); }
        } else if (upstreamSignal?.addEventListener) {
          const forwardAbort = () => {
            try { timeoutController.abort(upstreamSignal.reason); }
            catch { timeoutController.abort(); }
          };
          upstreamSignal.addEventListener('abort', forwardAbort, {once:true});
          detachUpstreamAbort = () => {
            try { upstreamSignal.removeEventListener('abort', forwardAbort); } catch {}
          };
        }

        nextInit = Object.assign({}, init || {}, {signal: timeoutController.signal});
      }

      return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
          clearTimeout(timer);
          if (detachUpstreamAbort) detachUpstreamAbort();
        };
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          if (timeoutController && !timeoutController.signal.aborted) {
            try { timeoutController.abort('lunea-gemini-timeout'); }
            catch { timeoutController.abort(); }
          }
          cleanup();
          reject(new Error('AI 요청이 75초를 넘어 중단했어. 다시 눌러줘.'));
        }, GEMINI_TIMEOUT_MS);

        Promise.resolve()
          .then(() => baseFetch(input, nextInit))
          .then(
            value => {
              if (settled) return;
              settled = true;
              cleanup();
              resolve(value);
            },
            error => {
              if (settled) return;
              settled = true;
              cleanup();
              reject(error);
            }
          );
      });
    };
  }

  const warm = {
    api: '',
    promise: null,
    readyAt: 0,
    lastError: ''
  };

  function normalizeApi(raw) {
    return String(raw || '').trim().replace(/\/+$/, '');
  }

  function apiUrl() {
    const saved = normalizeApi(localStorage.getItem(API_KEY));
    return saved && !/your-astro-api\.example\.com/i.test(saved)
      ? saved
      : DEFAULT_API_URL;
  }

  async function fetchHealth(api) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try { controller.abort('astro-health-timeout'); }
      catch { controller.abort(); }
    }, 120000);

    try {
      const res = await baseFetch(`${api}/health`, {
        method:'GET',
        cache:'no-store',
        headers:{'Accept':'application/json'},
        signal:controller.signal
      });
      if (!res.ok) {
        const error = new Error(`Astro Core 준비 확인 실패: HTTP ${res.status}`);
        error.httpStatus = res.status;
        throw error;
      }
      let data = null;
      try { data = await res.json(); } catch {}
      if (data && data.ok === false) throw new Error('Astro Core health 응답이 정상 상태가 아니야.');
      return true;
    } finally {
      clearTimeout(timer);
    }
  }

  function ensureReadyStrict(force = false) {
    const api = apiUrl();
    const fresh = warm.api === api && warm.readyAt && Date.now() - warm.readyAt < 5 * 60 * 1000;
    if (!force && fresh) return Promise.resolve(true);
    if (!force && warm.promise && warm.api === api) return warm.promise;

    warm.api = api;
    warm.lastError = '';
    warm.promise = (async () => {
      try {
        await fetchHealth(api);
        warm.readyAt = Date.now();
        return true;
      } catch (error) {
        warm.lastError = String(error?.message || error);
        throw error;
      } finally {
        warm.promise = null;
      }
    })();
    return warm.promise;
  }

  function primeReady(force = false) {
    ensureReadyStrict(force).catch(error => {
      console.info('[LUNEA Astro Stability V2.2] warm-up pending/failed:', error?.message || error);
    });
    // Compatibility contract: callers such as Horary may await ensureReady().
    // Resolve immediately so the actual POST is never serialized behind /health.
    return Promise.resolve(true);
  }

  function wrapRunButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn || btn.dataset.luneaAstroStabilityV2 === '1') return !!btn;
    const original = btn.onclick;
    if (typeof original !== 'function') return false;

    btn.dataset.luneaAstroStabilityV2 = '1';
    btn.onclick = function(event) {
      // Fire-and-forget warm-up. The original handler owns button busy state and
      // sends the real calculation request immediately on this same first tap.
      primeReady(false);
      return original.call(this, event);
    };
    return true;
  }

  function boot() {
    wrapRunButton('astroTransitRun');
    wrapRunButton('astroReturnRun');
    wrapRunButton('astroHoraryRun');

    // Prime once at page readiness. This is never awaited by user actions.
    setTimeout(() => primeReady(false), 0);
    console.info('✦ LUNEA ASTRO STABILITY V2.2 loaded · non-blocking Astro warm-up');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

  W.LUNEA_ASTRO_STABILITY = {
    // Public compatibility method is deliberately non-blocking.
    ensureReady: primeReady,
    ensureReadyStrict,
    primeReady,
    getState: () => ({
      api:warm.api || apiUrl(),
      readyAt:warm.readyAt,
      warming:!!warm.promise,
      lastError:warm.lastError
    })
  };
})();
