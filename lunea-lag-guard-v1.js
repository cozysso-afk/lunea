'use strict';

/*
  LUNEA LAG GUARD V1.1
  iPhone Safari / multi-module cleanup guard.

  Purpose:
  - Abort stale astrology requests as soon as the user enters a new reading.
  - Invalidate an Astro Core warm-up so an old click cannot start later.
  - Clear persisted Transit / Return queue + resume state at the reading boundary.
  - Clear heavy hidden result DOM from Transit / Return / Thai Taksa.
  - Reset stale "완료" button labels and inline summary cards.
  - Close auxiliary overlays before the next reading is rendered.
  - Recover auxiliary buttons after an interrupted request.
  - Avoid touching RWS RNG, cards, Spread V7.4, archive, prompts, or calculations.

  Load AFTER:
    timing-oracle-v1.js
    astro-transit-v1.js
    astro-return-v1.js
    thai-taksa-v1.js
  and BEFORE:
    interpretation-gloss-v1.js
*/
(() => {
  if (window.__LUNEA_LAG_GUARD_V1__) return;
  window.__LUNEA_LAG_GUARD_V1__ = true;

  const W = window;
  const $ = id => document.getElementById(id);
  const ASTRO_PENDING_KEY = 'LUNEA_ASTRO_PENDING_V23';
  const TRANSIT_LONG_KEY = 'LUNEA_TRANSIT_LONG_RUN_V2_CHECKPOINT';

  const AUX_ENDPOINTS = [
    '/v1/transits/scan',
    '/v1/returns/context',
    '/v1/thai/taksa'
  ];

  const pendingControllers = new Set();
  let cleanupEpoch = 0;
  let lastResetAt = 0;

  function isAuxRequest(input) {
    let url = '';
    try {
      url = typeof input === 'string' ? input : (input?.url || '');
    } catch {}
    return AUX_ENDPOINTS.some(path => String(url).includes(path));
  }

  function installFetchAbortGuard() {
    if (W.__LUNEA_LAG_GUARD_FETCH_WRAPPED__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_LAG_GUARD_FETCH_WRAPPED__ = true;

    const originalFetch = W.fetch.bind(W);

    W.fetch = function(input, init = {}) {
      if (!isAuxRequest(input)) return originalFetch(input, init);

      // Current LUNEA astrology modules do not supply their own signal.
      // If a future module does, preserve it instead of overriding it.
      if (init?.signal) return originalFetch(input, init);

      const controller = new AbortController();
      pendingControllers.add(controller);

      const nextInit = Object.assign({}, init, {signal: controller.signal});
      return originalFetch(input, nextInit)
        .finally(() => pendingControllers.delete(controller));
    };
  }

  function abortPendingAuxRequests() {
    for (const controller of pendingControllers) {
      try { controller.abort('new-reading-reset'); } catch { try { controller.abort(); } catch {} }
    }
    pendingControllers.clear();
  }

  function invalidateAsyncAstroState() {
    // A Return/Transit click can still be inside the Render health warm-up and
    // have no POST request to abort yet. Advance the Stability generation first
    // so that old click is dropped after warm-up instead of starting late.
    try { W.LUNEA_ASTRO_REQUEST_V1?.cancelScope('reading'); W.LUNEA_ASTRO_REQUEST_V1?.cancelScope('horary-support'); } catch {}
    try { W.LUNEA_ASTRO_STABILITY?.cancelForQuestionBoundary?.(); } catch {}
    try { W.LUNEA_ASTRO_JOB_QUEUE?.resetForQuestionBoundary?.(); } catch {}
    try { W.LUNEA_ASTRO_RESUME_V23?.clear?.(); } catch {}
    try { W.LUNEA_THAI_TAROT_BRIDGE_V32?.clear?.(); } catch {}
    try { localStorage.removeItem(ASTRO_PENDING_KEY); } catch {}
    try { localStorage.removeItem(TRANSIT_LONG_KEY); } catch {}

    const badge = $('luneaAstroJobBadgeV23');
    badge?.classList.remove('show','waiting');
  }

  function closeAuxOverlays() {
    ['astroTransitOverlay', 'astroReturnOverlay', 'thaiTaksaOverlay'].forEach(id => {
      const el = $(id);
      if (el) el.classList.remove('show');
    });
  }

  function clearHeavyAuxDOM() {
    const targets = [
      'astroTransitResult',
      'astroReturnResult',
      'thaiTaksaResult'
    ];

    for (const id of targets) {
      const el = $(id);
      if (!el) continue;
      el.classList?.remove('show');
      el.replaceChildren();
    }

    // Old reading summaries live directly below the RWS cards.
    [
      'luneaAstroTransitInline',
      'luneaReturnInline',
      'luneaThaiInline'
    ].forEach(id => $(id)?.remove());
  }

  function resetAuxButtons() {
    const labels = {
      astroTransitBtn: '🌌 Astro Timing',
      astroReturnBtn: '↻ Returns',
      thaiTaksaBtn: '🇹🇭 Thai Taksa'
    };

    Object.entries(labels).forEach(([id, label]) => {
      const btn = $(id);
      if (!btn) return;
      btn.disabled = false;
      btn.textContent = label;
      btn.removeAttribute('aria-busy');
    });

    const runLabels = {
      astroTransitRun: '🌌 트랜짓 스캔',
      astroReturnRun: '↻ 리턴 계산',
      thaiTaksaRun: '🇹🇭 태국점성술 계산'
    };

    Object.entries(runLabels).forEach(([id, label]) => {
      const btn = $(id);
      if (!btn) return;
      btn.disabled = false;
      btn.textContent = label;
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('data-lunea-warm-busy');
      delete btn.dataset.luneaWarmBusy;
    });
  }

  function clearAuxStatusText() {
    [
      'astroTransitStatus',
      'astroReturnStatus',
      'thaiTaksaStatus'
    ].forEach(id => {
      const el = $(id);
      if (el) el.textContent = '';
    });
  }

  function repairModalLock() {
    // Never unlock the page if some real overlay is still open
    // (e.g. the main spread overlay).
    const anyVisibleOverlay = document.querySelector('.overlay.show');
    if (!anyVisibleOverlay) {
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.body.style.removeProperty('pointer-events');
    }
  }

  function hardResetAux(reason = 'new-reading') {
    const now = performance.now();
    // Several wrapped startSpread functions can cascade; one cleanup per frame is enough.
    if (now - lastResetAt < 16) return;
    lastResetAt = now;
    cleanupEpoch += 1;

    invalidateAsyncAstroState();
    abortPendingAuxRequests();
    closeAuxOverlays();
    clearHeavyAuxDOM();
    resetAuxButtons();
    clearAuxStatusText();
    repairModalLock();

    // Yield one paint so iOS Safari can drop old layout/paint work.
    const epoch = cleanupEpoch;
    requestAnimationFrame(() => {
      if (epoch !== cleanupEpoch) return;
      closeAuxOverlays();
      repairModalLock();
    });

    console.info(`✦ LUNEA Lag Guard reset (${reason})`);
  }

  function installStartSpreadReset() {
    if (W.__LUNEA_LAG_GUARD_START_WRAPPED__) return;
    if (typeof startSpread !== 'function') return;

    W.__LUNEA_LAG_GUARD_START_WRAPPED__ = true;
    const previousStartSpread = startSpread;

    startSpread = function(...args) {
      hardResetAux('startSpread');
      return previousStartSpread.apply(this, args);
    };
  }

  function installRerollCapture() {
    if (W.__LUNEA_LAG_GUARD_REROLL_CAPTURE__) return;
    W.__LUNEA_LAG_GUARD_REROLL_CAPTURE__ = true;

    // Selecting a different reading opens only the bottom sheet first. Waiting
    // until startSpread is too late: an old Return warm-up/POST can keep running
    // and its global badge can leak into the new question sheet.
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest('.reading-item,#dailyBtn,#luneaDraftRestore')) {
        hardResetAux('reading-entry');
        return;
      }

      const btn = target.closest('button');
      if (!btn) return;
      const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      if (/다시\s*뽑기|새\s*리딩|새\s*질문/.test(text)) {
        hardResetAux('reroll-capture');
      }
    }, true);
  }

  function installPerformanceCSS() {
    if ($('luneaLagGuardStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaLagGuardStyle';
    style.textContent = `
      /* Hidden auxiliary overlays should not keep expensive blur/paint work alive. */
      #astroTransitOverlay:not(.show),
      #astroReturnOverlay:not(.show),
      #thaiTaksaOverlay:not(.show){
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
      }

      /* Isolate large computed result trees from the RWS card layout. */
      #astroTransitResult,
      #astroReturnResult,
      #thaiTaksaResult,
      #luneaAstroTransitInline,
      #luneaReturnInline,
      #luneaThaiInline{
        contain:layout paint style;
      }

      @supports (content-visibility:auto){
        #astroTransitResult,
        #astroReturnResult,
        #thaiTaksaResult{
          content-visibility:auto;
          contain-intrinsic-size:1px 500px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installPageShowRepair() {
    if (W.__LUNEA_LAG_GUARD_PAGESHOW__) return;
    W.__LUNEA_LAG_GUARD_PAGESHOW__ = true;

    // iOS Safari can restore a page from back/forward cache with stale UI locks.
    W.addEventListener('pageshow', () => {
      closeAuxOverlays();
      repairModalLock();
      resetAuxButtons();
    });
  }

  function boot() {
    installPerformanceCSS();
    installFetchAbortGuard();
    installStartSpreadReset();
    installRerollCapture();
    installPageShowRepair();
    console.info('✦ LUNEA LAG GUARD V1.1 loaded · reading-entry Astro reset ON');
  }

  W.LUNEA_LAG_GUARD = Object.freeze({
    hardResetAux,
    version:'1.1'
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
