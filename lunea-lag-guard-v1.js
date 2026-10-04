'use strict';

/*
  LUNEA LAG GUARD V1.2
  iPhone Safari / auxiliary cleanup + stale draw-lock guard.

  V1.2 no longer owns startSpread. Reading Lifecycle V59 calls reset() at the
  beginning of every reading session, so fixed/AI/manual/daily/restore share
  the same auxiliary cleanup without adding another function wrapper.

  AI rendering deliberately keeps #drawBtn disabled through its handoff. If a
  repeated mixed AI/manual flow abandons that handoff before V60 releases it,
  the disabled HTML button cannot emit the next click and therefore cannot
  reach the V59 session boundary. Mode-entry capture only releases that stale
  UI lock; it does not draw cards, change spread state, or alter calculations.
*/
(() => {
  const W = window;
  if (W.__LUNEA_LAG_GUARD_V1__) return;
  W.__LUNEA_LAG_GUARD_V1__ = true;

  const $ = id => document.getElementById(id);
  const AUX_ENDPOINTS = ['/v1/transits/scan','/v1/returns/context','/v1/thai/taksa'];
  const READING_MODE_SELECTOR = '.reading-item[data-lunea-universal-ai="1"],.reading-item[data-manual-spread="1"],.lunea-v20-ai-entry,.lunea-manual-anywhere-item';
  const pendingControllers = new Set();
  let cleanupEpoch = 0;
  let lastResetAt = 0;

  function lifecycle() { return W.LUNEA_READING_LIFECYCLE_V59 || null; }
  function currentSessionId() { return lifecycle()?.currentSessionId?.() || 0; }

  function isAuxRequest(input) {
    let url = '';
    try { url = typeof input === 'string' ? input : (input?.url || ''); } catch {}
    return AUX_ENDPOINTS.some(path => String(url).includes(path));
  }

  function installFetchAbortGuard() {
    if (W.__LUNEA_LAG_GUARD_FETCH_WRAPPED__ || typeof W.fetch !== 'function') return;
    W.__LUNEA_LAG_GUARD_FETCH_WRAPPED__ = true;
    const originalFetch = W.fetch.bind(W);
    W.fetch = function(input, init = {}) {
      if (!isAuxRequest(input)) return originalFetch(input, init);
      if (init?.signal) return originalFetch(input, init);
      const controller = new AbortController();
      pendingControllers.add(controller);
      const nextInit = Object.assign({}, init, {signal:controller.signal});
      return originalFetch(input, nextInit).finally(() => pendingControllers.delete(controller));
    };
  }

  function abortPendingAuxRequests() {
    for (const controller of pendingControllers) {
      try { controller.abort('new-reading-reset'); }
      catch { try { controller.abort(); } catch {} }
    }
    pendingControllers.clear();
  }

  function closeAuxOverlays() {
    ['astroTransitOverlay','astroReturnOverlay','thaiTaksaOverlay'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.classList.remove('show');
      el.setAttribute?.('aria-hidden','true');
    });
  }

  function clearHeavyAuxDOM() {
    ['astroTransitResult','astroReturnResult','thaiTaksaResult'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.classList?.remove('show');
      el.replaceChildren();
    });
    ['luneaAstroTransitInline','luneaReturnInline','luneaThaiInline'].forEach(id => $(id)?.remove());
  }

  function resetAuxButtons() {
    const labels = {
      astroTransitBtn:'🌌 Astro Timing',
      astroReturnBtn:'↻ Returns',
      thaiTaksaBtn:'🇹🇭 Thai Taksa',
      astroTransitRun:'🌌 트랜짓 스캔',
      astroReturnRun:'↻ 리턴 계산',
      thaiTaksaRun:'🇹🇭 태국점성술 계산'
    };
    Object.entries(labels).forEach(([id,label]) => {
      const btn = $(id);
      if (!btn) return;
      btn.disabled = false;
      btn.textContent = label;
      btn.removeAttribute('aria-busy');
    });
  }

  function releaseStaleReadingDrawLock() {
    const btn = $('drawBtn');
    if (!btn) return false;
    const wasLocked = !!btn.disabled || btn.getAttribute?.('aria-busy') === 'true';
    btn.disabled = false;
    btn.removeAttribute?.('aria-busy');
    return wasLocked;
  }

  function modeEntryFrom(target) {
    try { return target?.closest?.(READING_MODE_SELECTOR) || null; }
    catch { return null; }
  }

  function installReadingModeEntryRepair() {
    if (W.__LUNEA_LAG_GUARD_MODE_ENTRY_REPAIR__) return;
    W.__LUNEA_LAG_GUARD_MODE_ENTRY_REPAIR__ = true;
    const repair = event => {
      if (!modeEntryFrom(event.target)) return;
      releaseStaleReadingDrawLock();
    };
    // document capture runs before V59's item-level capture owner, so a stale
    // disabled draw control is usable again before the next sheet mode opens.
    document.addEventListener('pointerdown', repair, true);
    document.addEventListener('click', repair, true);
  }

  function clearAuxStatusText() {
    ['astroTransitStatus','astroReturnStatus','thaiTaksaStatus'].forEach(id => {
      const el = $(id);
      if (el) el.textContent = '';
    });
  }

  function repairModalLock() {
    if (lifecycle()?.syncModalLock) {
      lifecycle().syncModalLock();
      return;
    }
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
    if (now - lastResetAt < 16) return;
    lastResetAt = now;
    cleanupEpoch += 1;
    const epoch = cleanupEpoch;
    const session = currentSessionId();

    abortPendingAuxRequests();
    closeAuxOverlays();
    clearHeavyAuxDOM();
    resetAuxButtons();
    clearAuxStatusText();
    repairModalLock();

    const finish = () => {
      if (epoch !== cleanupEpoch) return;
      if (lifecycle()?.isCurrent && !lifecycle().isCurrent(session)) return;
      closeAuxOverlays();
      repairModalLock();
    };
    if (lifecycle()?.frame) lifecycle().frame(finish, session);
    else requestAnimationFrame(finish);

    console.info(`✦ LUNEA Lag Guard reset (${reason})`);
  }

  function installPerformanceCSS() {
    if ($('luneaLagGuardStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaLagGuardStyle';
    style.textContent = `
      #astroTransitOverlay:not(.show),#astroReturnOverlay:not(.show),#thaiTaksaOverlay:not(.show){
        -webkit-backdrop-filter:none!important;backdrop-filter:none!important
      }
      #astroTransitResult,#astroReturnResult,#thaiTaksaResult,#luneaAstroTransitInline,#luneaReturnInline,#luneaThaiInline{
        contain:layout paint style
      }
      @supports (content-visibility:auto){
        #astroTransitResult,#astroReturnResult,#thaiTaksaResult{content-visibility:auto;contain-intrinsic-size:1px 500px}
      }
    `;
    document.head.appendChild(style);
  }

  function installPageShowRepair() {
    if (W.__LUNEA_LAG_GUARD_PAGESHOW__) return;
    W.__LUNEA_LAG_GUARD_PAGESHOW__ = true;
    W.addEventListener('pageshow', () => {
      closeAuxOverlays();
      repairModalLock();
      resetAuxButtons();
    });
  }

  function boot() {
    installPerformanceCSS();
    installFetchAbortGuard();
    installReadingModeEntryRepair();
    installPageShowRepair();
    W.LUNEA_LAG_GUARD_V1 = Object.freeze({
      version:1.2,
      reset:hardResetAux,
      abort:abortPendingAuxRequests,
      repairModalLock,
      releaseStaleReadingDrawLock
    });
    console.info('✦ LUNEA LAG GUARD V1.2 loaded · lifecycle hook · stale draw-lock repair · no startSpread wrapper');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();