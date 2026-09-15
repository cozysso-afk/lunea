'use strict';

/* LUNEA TRANSIT REQUEST V1
   - Gives Transit the same bounded-wait behavior as Return/Horary.
   - One calculation POST only; never retries a timed-out computation.
   - Preserves upstream cancellation from Lag Guard / reading boundaries.
   - Long-range Transit remains owned by the existing chunk/resume layer. */
(() => {
  const W = window;
  if (W.__LUNEA_TRANSIT_REQUEST_V1__ || typeof W.fetch !== 'function') return;
  W.__LUNEA_TRANSIT_REQUEST_V1__ = true;

  const previousFetch = W.fetch.bind(W);
  const TIMEOUT_MS = 120000;

  W.fetch = function luneaTransitRequestV1(input, init = {}) {
    let url = '';
    let method = String(init?.method || input?.method || 'GET').toUpperCase();
    try { url = typeof input === 'string' ? input : (input instanceof URL ? input.href : String(input?.url || '')); } catch {}
    if (method !== 'POST' || !/\/v1\/transits\/scan(?:\?|$)/i.test(url)) return previousFetch(input, init);

    const controller = new AbortController();
    const upstream = init?.signal || input?.signal || null;
    let relay = null;
    if (upstream?.aborted) {
      try { controller.abort(upstream.reason); } catch { controller.abort(); }
    } else if (upstream?.addEventListener) {
      relay = () => { try { controller.abort(upstream.reason); } catch { controller.abort(); } };
      upstream.addEventListener('abort', relay, {once:true});
    }

    let nextInput = input;
    let nextInit = {...(init || {}), signal:controller.signal};
    if (typeof input !== 'string' && !(input instanceof URL)) {
      try {
        nextInput = new Request(input, {signal:controller.signal});
        nextInit = init;
      } catch {}
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        if (upstream && relay) upstream.removeEventListener?.('abort', relay);
      };
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        error ? reject(error) : resolve(value);
      };
      const timer = setTimeout(() => {
        const error = new Error('트랜짓 계산 서버 응답이 120초 안에 오지 않아 대기를 중단했어. 잠시 후 다시 시도해줘.');
        error.name = 'TimeoutError';
        finish(error);
        try { controller.abort('lunea-transit-timeout'); } catch { controller.abort(); }
      }, TIMEOUT_MS);

      Promise.resolve()
        .then(() => previousFetch(nextInput, nextInit))
        .then(response => finish(null, response), error => finish(error));
    });
  };

  W.LUNEA_TRANSIT_REQUEST_V1 = Object.freeze({timeoutMs:TIMEOUT_MS});
})();