'use strict';

/*
  LUNEA ASTRO STABILITY V2
  ========================
  Purpose:
  - remove the old global 60s cutoff from Astro requests without touching
    iOS card/compositor code
  - keep the old Gemini 40s protection
  - warm Astro Core before Transit / Return buttons run
  - leave Natal V1.1's own one-tap lifecycle intact
  - preserve Lag Guard's AbortController for stale auxiliary requests

  Load order:
    astro-natal-client-v1.js
    astro-transit-v1.js
    astro-return-v1.js
    thai-taksa-v1.js
    lunea-lag-guard-v1.js
    lunea-astro-stability-v2.js   <-- HERE
    lunea-ios-performance-v3.js

  No MutationObserver.
  No card DOM/CSS changes.
  No routing/RNG changes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_STABILITY_V2__) return;
  W.__LUNEA_ASTRO_STABILITY_V2__ = true;

  /*
    iOS Performance V306 installs one global watchdog for Gemini + every Astro
    endpoint and rejects Astro requests at 60s. Transit/Return can legitimately
    exceed that while the Python ephemeris/refinement work is still running.
    Pre-claim the flag so V306 skips that old combined wrapper.
  */
  W.__LUNEA_REQUEST_WATCHDOG_V305__ = true;

  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const DEFAULT_API_URL = 'https://lunea-astro-api.onrender.com';

  // At this point Lag Guard is already loaded, so this retains its stale-request
  // AbortController behavior for Transit / Return / Thai.
  const baseFetch = typeof W.fetch === 'function' ? W.fetch.bind(W) : null;

  if (!baseFetch) {
    console.warn('[LUNEA Astro Stability V2] fetch unavailable');
    return;
  }

  // ------------------------------------------------------------
  // Gemini-only watchdog: replaces the part of V306 we intentionally skipped.
  // Astro requests are NOT capped here.
  // ------------------------------------------------------------
  if (!W.__LUNEA_GEMINI_WATCHDOG_V2__) {
    W.__LUNEA_GEMINI_WATCHDOG_V2__ = true;

    W.fetch = function(input, init) {
      let url = '';
      try {
        url = typeof input === 'string' ? input : String(input?.url || '');
      } catch {}

      if (!/generativelanguage\.googleapis\.com/i.test(url)) {
        return baseFetch(input, init);
      }

      return new Promise((resolve, reject) => {
        let settled = false;

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error('AI 요청 시간이 너무 길어 중단했어. 다시 눌러줘.'));
        }, 40000);

        Promise.resolve()
          .then(() => baseFetch(input, init))
          .then(
            value => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              resolve(value);
            },
            error => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
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
        method: 'GET',
        cache: 'no-store',
        headers: {'Accept':'application/json'},
        signal: controller.signal
      });

      if (!res.ok) {
        const e = new Error(`Astro Core 준비 확인 실패: HTTP ${res.status}`);
        e.httpStatus = res.status;
        throw e;
      }

      let data = null;
      try { data = await res.json(); } catch {}
      if (data && data.ok === false) {
        throw new Error('Astro Core health 응답이 정상 상태가 아니야.');
      }
      return true;
    } finally {
      clearTimeout(timer);
    }
  }

  function ensureReady(force = false) {
    const api = apiUrl();
    const fresh =
      warm.api === api &&
      warm.readyAt &&
      Date.now() - warm.readyAt < 5 * 60 * 1000;

    if (!force && fresh) return Promise.resolve(true);
    if (!force && warm.promise && warm.api === api) return warm.promise;

    warm.api = api;
    warm.lastError = '';

    warm.promise = (async () => {
      try {
        await fetchHealth(api);
        warm.readyAt = Date.now();
        return true;
      } catch (err) {
        warm.lastError = String(err?.message || err);
        throw err;
      } finally {
        warm.promise = null;
      }
    })();

    return warm.promise;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /*
    Wrap only the RUN buttons. This does not replace Transit/Return calculation
    functions or their fetch/result rendering. It merely wakes/verifies the
    server before the existing handler starts.
  */
  function wrapRunButton(buttonId, statusId, waitingText) {
    const btn = document.getElementById(buttonId);
    if (!btn || btn.dataset.luneaAstroStabilityV2 === '1') return;

    const original = btn.onclick;
    if (typeof original !== 'function') return;

    btn.dataset.luneaAstroStabilityV2 = '1';

    btn.onclick = async function(event) {
      if (btn.dataset.luneaWarmBusy === '1') return;

      btn.dataset.luneaWarmBusy = '1';
      const oldDisabled = btn.disabled;
      const oldText = btn.textContent;

      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = '🌌 서버 준비 중…';
      setText(statusId, waitingText);

      try {
        await ensureReady(false);
      } catch (err) {
        /*
          Do not spend the user's click. A health probe can fail transiently
          while the actual POST endpoint is already reachable. Continue once
          with the existing calculation handler and let it report the real error.
        */
        console.warn('[LUNEA Astro Stability V2] warm-up warning:', err);
      } finally {
        btn.dataset.luneaWarmBusy = '0';
        btn.disabled = oldDisabled;
        btn.removeAttribute('aria-busy');
        btn.textContent = oldText;
      }

      return original.call(this, event);
    };
  }

  function boot() {
    wrapRunButton(
      'astroTransitRun',
      'astroTransitStatus',
      'Astro Core 서버 준비 확인 중… 준비되면 트랜짓 계산을 자동으로 이어서 시작해.'
    );

    wrapRunButton(
      'astroReturnRun',
      'astroReturnStatus',
      'Astro Core 서버 준비 확인 중… 준비되면 회귀 계산을 자동으로 이어서 시작해.'
    );

    // Warm in the background. Network I/O only; no synchronous ephemeris or DOM work.
    setTimeout(() => {
      ensureReady(false).catch(err => {
        console.info('[LUNEA Astro Stability V2] background warm pending/failed:', err?.message || err);
      });
    }, 0);

    console.info('✦ LUNEA ASTRO STABILITY V2 loaded · Astro 60s global cutoff disabled');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

  W.LUNEA_ASTRO_STABILITY = {
    ensureReady,
    getState: () => ({
      api: warm.api || apiUrl(),
      readyAt: warm.readyAt,
      warming: !!warm.promise,
      lastError: warm.lastError
    })
  };
})();
