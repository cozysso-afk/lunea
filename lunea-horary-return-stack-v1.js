'use strict';

/* LUNEA HORARY RETURN STACK V1
   When Horary is opened from an active tarot reading, closing Horary must
   return to that reading instead of exposing Home. Standalone Horary still
   closes to Home as before.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_RETURN_STACK_V1__) return;
  W.__LUNEA_HORARY_RETURN_STACK_V1__ = true;

  const $ = id => document.getElementById(id);
  let armed = false;
  let spreadScrollTop = 0;

  function spreadIsActive() {
    return !!$('spreadOverlay')?.classList.contains('show');
  }

  function armFromTarot(event) {
    const button = event.target?.closest?.('#astroHoraryBtn');
    if (!button || !spreadIsActive()) return;

    armed = true;
    const spread = $('spreadOverlay');
    spreadScrollTop = spread?.querySelector('.modal')?.scrollTop || 0;

    const horary = $('astroHoraryOverlay');
    if (horary) horary.dataset.luneaReturnToSpread = '1';
    requestAnimationFrame(installOverlayObserver);
  }

  function restoreSpreadIfNeeded() {
    const horary = $('astroHoraryOverlay');
    if (!horary || horary.classList.contains('show')) return false;

    const shouldReturn = armed || horary.dataset.luneaReturnToSpread === '1';
    if (!shouldReturn) return false;

    const spread = $('spreadOverlay');
    armed = false;
    delete horary.dataset.luneaReturnToSpread;
    if (!spread) return false;

    spread.classList.add('show');
    spread.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const modal = spread.querySelector('.modal');
    if (modal) {
      requestAnimationFrame(() => {
        modal.scrollTop = spreadScrollTop;
      });
    }
    return true;
  }

  function syncHoraryState() {
    const horary = $('astroHoraryOverlay');
    if (!horary) return;

    if (horary.classList.contains('show')) {
      if (armed) horary.dataset.luneaReturnToSpread = '1';
      return;
    }
    restoreSpreadIfNeeded();
  }

  function installOverlayObserver() {
    const horary = $('astroHoraryOverlay');
    if (!horary) return false;
    if (horary.__luneaReturnStackObserved) return true;

    horary.__luneaReturnStackObserved = true;
    new MutationObserver(() => requestAnimationFrame(syncHoraryState)).observe(horary, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncHoraryState();
    return true;
  }

  function boot() {
    document.addEventListener('click', armFromTarot, true);

    if (!installOverlayObserver()) {
      const observer = new MutationObserver(() => {
        if (installOverlayObserver()) observer.disconnect();
      });
      observer.observe(document.documentElement, {childList:true, subtree:true});
    }

    W.addEventListener('pageshow', () => setTimeout(installOverlayObserver, 40), {passive:true});
    W.LUNEA_HORARY_RETURN_STACK_V1 = Object.freeze({
      version:'1.0',
      restore:restoreSpreadIfNeeded,
      sync:syncHoraryState
    });
    console.info('☿ LUNEA Horary return stack V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

/* LUNEA ASTRO STALE RESUME GUARD V1.1
   Retires the old V23 behavior that could automatically relaunch a Transit or
   Return calculation after a reload / foreground event. Dormant persisted jobs
   are cleared, and a queue that stayed active beyond the request owner's
   30-minute lifetime is treated as stale after an iOS/PWA suspension.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_STALE_RESUME_GUARD_V1__) return;
  W.__LUNEA_ASTRO_STALE_RESUME_GUARD_V1__ = true;

  const $ = id => document.getElementById(id);
  const PENDING_V23 = 'LUNEA_ASTRO_PENDING_V23';
  const PENDING_TRANSIT_JOB = 'LUNEA_ASTRO_PENDING_JOB_V1:transit';
  const PENDING_RETURN_JOB = 'LUNEA_ASTRO_PENDING_JOB_V1:return';
  const LONG_TRANSIT = 'LUNEA_TRANSIT_LONG_RUN_V2_CHECKPOINT';
  const MIGRATION_KEY = 'LUNEA_ASTRO_STALE_RESUME_GUARD_V1_MIGRATED';
  const ACTIVE_STALE_MS = 31 * 60 * 1000;
  const busyText = /계산.*중|대기.*중|서버.*준비|자동\s*재개|복귀\s*시|연결\s*복구|구간.*계산|재시도|계속\s*진행/;
  let lastQuestion = '';
  let questionObserver = null;
  let activeKind = '';
  let activeSince = 0;

  function queueState() {
    try { return W.LUNEA_ASTRO_JOB_QUEUE?.getState?.() || {}; }
    catch { return {}; }
  }

  function clearV23() {
    try { localStorage.removeItem(PENDING_V23); } catch {}
  }

  function clearTransitResumePointers() {
    clearV23();
    try { localStorage.removeItem(PENDING_TRANSIT_JOB); } catch {}
    try { localStorage.removeItem(LONG_TRANSIT); } catch {}
  }

  function clearReadingResumePointers() {
    clearV23();
    try { localStorage.removeItem(PENDING_TRANSIT_JOB); } catch {}
    try { localStorage.removeItem(PENDING_RETURN_JOB); } catch {}
    try { localStorage.removeItem(LONG_TRANSIT); } catch {}
  }

  function pendingCreatedAt(kind) {
    const key = kind === 'returns' ? PENDING_RETURN_JOB : PENDING_TRANSIT_JOB;
    try {
      const row = JSON.parse(localStorage.getItem(key) || 'null');
      const value = Number(row?.createdAt || 0);
      return Number.isFinite(value) ? value : 0;
    } catch { return 0; }
  }

  function trackQueueAge() {
    const q = queueState();
    const kind = String(q.active || q.queued || '');
    if (!kind) {
      activeKind = '';
      activeSince = 0;
      return;
    }
    if (kind !== activeKind) {
      activeKind = kind;
      activeSince = Date.now();
    }
  }

  function clearStaleJobPointer(kind) {
    clearV23();
    try {
      localStorage.removeItem(kind === 'returns' ? PENDING_RETURN_JOB : PENDING_TRANSIT_JOB);
    } catch {}
  }

  function recoverStaleActive() {
    const q = queueState();
    const kind = String(q.active || q.queued || '');
    if (!kind) {
      trackQueueAge();
      return false;
    }

    if (kind !== activeKind || !activeSince) {
      activeKind = kind;
      activeSince = Date.now();
    }
    const persistedAt = pendingCreatedAt(kind);
    const startedAt = persistedAt || activeSince;
    if (!startedAt || Date.now() - startedAt < ACTIVE_STALE_MS) return false;

    try { W.LUNEA_ASTRO_REQUEST_V1?.cancelScope?.('reading'); } catch {}
    try { W.LUNEA_ASTRO_JOB_QUEUE?.resetForQuestionBoundary?.(); } catch {}
    try { W.LUNEA_LAG_GUARD_V1?.abort?.(); } catch {}
    clearStaleJobPointer(kind);

    activeKind = '';
    activeSince = 0;
    resetDormantUi();
    return true;
  }

  function resetDormantUi() {
    const q = queueState();
    if (q.active || q.queued) return false;

    const transit = $('astroTransitRun');
    if (transit) {
      transit.disabled = false;
      transit.removeAttribute('aria-busy');
      transit.textContent = '🌌 트랜짓 스캔';
    }
    const returns = $('astroReturnRun');
    if (returns) {
      returns.disabled = false;
      returns.removeAttribute('aria-busy');
      returns.textContent = '↻ 리턴 계산';
    }

    ['astroTransitStatus','astroReturnStatus'].forEach(id => {
      const el = $(id);
      if (el && busyText.test(String(el.textContent || ''))) el.textContent = '';
    });

    const badge = $('luneaAstroJobBadgeV23');
    badge?.classList.remove('show','waiting');
    return true;
  }

  function purgeDormantResume() {
    const q = queueState();
    if (q.active || q.queued) return false;
    clearV23();
    resetDormantUi();
    return true;
  }

  function migrateOnce() {
    let done = false;
    try { done = localStorage.getItem(MIGRATION_KEY) === '1'; } catch {}
    if (done) return;

    clearTransitResumePointers();
    resetDormantUi();
    try { localStorage.setItem(MIGRATION_KEY, '1'); } catch {}
  }

  function currentQuestion() {
    return String($('spreadQuestion')?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function onQuestionBoundary() {
    clearReadingResumePointers();
    try { W.LUNEA_ASTRO_REQUEST_V1?.cancelScope?.('reading'); } catch {}
    try { W.LUNEA_ASTRO_REQUEST_V1?.cancelScope?.('horary-support'); } catch {}
    try { W.LUNEA_LAG_GUARD_V1?.abort?.(); } catch {}
    try { W.LUNEA_ASTRO_JOB_QUEUE?.resetForQuestionBoundary?.(); } catch {}
    activeKind = '';
    activeSince = 0;
    resetDormantUi();
  }

  function installQuestionBoundary() {
    const node = $('spreadQuestion');
    if (!node) return false;
    if (questionObserver) return true;

    lastQuestion = currentQuestion();
    questionObserver = new MutationObserver(() => {
      const next = currentQuestion();
      if (next === lastQuestion) return;
      const previous = lastQuestion;
      lastQuestion = next;
      if (previous || next) onQuestionBoundary();
    });
    questionObserver.observe(node, {childList:true, subtree:true, characterData:true});
    return true;
  }

  function scheduleDormantPurge(delay = 40) {
    setTimeout(() => {
      recoverStaleActive();
      purgeDormantResume();
      trackQueueAge();
      installQuestionBoundary();
    }, delay);
  }

  function boot() {
    migrateOnce();
    installQuestionBoundary();
    trackQueueAge();

    [0,120,350,900,1800,4000,8000,12000].forEach(scheduleDormantPurge);

    W.addEventListener('pageshow', () => scheduleDormantPurge(40), {passive:true});
    W.addEventListener('online', () => scheduleDormantPurge(60), {passive:true});
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleDormantPurge(40);
    });
    W.addEventListener('lunea:astro-job-state', () => {
      trackQueueAge();
      scheduleDormantPurge(80);
    });

    W.LUNEA_ASTRO_STALE_RESUME_GUARD_V1 = Object.freeze({
      version:'1.1',
      purge:purgeDormantResume,
      recoverStale:recoverStaleActive,
      clearTransit:clearTransitResumePointers,
      clearReading:clearReadingResumePointers
    });
    console.info('🌌 LUNEA Astro stale resume guard V1.1 loaded · stale active recovery ON');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();