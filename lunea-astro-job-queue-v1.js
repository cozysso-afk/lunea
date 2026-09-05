'use strict';

/*
  LUNEA ASTRO JOB QUEUE V1.1
  ==========================
  Serializes Transit and Return calculations and exposes a hard reset hook for
  reading-question boundaries. A job from question A must never keep question B
  visually busy or auto-launch a queued request after the reading changed.
*/
(() => {
  const W = window;
  if (W.__LUNEA_ASTRO_JOB_QUEUE_V1__) return;
  W.__LUNEA_ASTRO_JOB_QUEUE_V1__ = true;

  const $ = id => document.getElementById(id);
  const jobs = {
    transit: {
      buttonId: 'astroTransitRun',
      statusId: 'astroTransitStatus',
      waitingText: '리턴 계산 중 · 트랜짓은 자동 대기 중이야. 다시 누르지 않아도 돼.',
      queuedLabel: '🌌 트랜짓 대기 중…',
      normalLabel: '🌌 트랜짓 스캔'
    },
    returns: {
      buttonId: 'astroReturnRun',
      statusId: 'astroReturnStatus',
      waitingText: '트랜짓 계산 중 · 리턴은 자동 대기 중이야. 다시 누르지 않아도 돼.',
      queuedLabel: '↻ 리턴 대기 중…',
      normalLabel: '↻ 리턴 계산'
    }
  };

  const state = {
    active: null,
    queued: null,
    runningPromise: null,
    installed: false,
    generation: 0
  };

  function setStatus(kind, text) {
    const el = $(jobs[kind]?.statusId);
    if (el) el.textContent = text;
  }

  function dispatch() {
    try {
      W.dispatchEvent(new CustomEvent('lunea:astro-job-state', {
        detail: {active:state.active, queued:state.queued?.kind || null, generation:state.generation}
      }));
    } catch {}
  }

  function prepareQueuedButton(job) {
    const btn = $(jobs[job.kind]?.buttonId);
    if (!btn) return;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = jobs[job.kind].queuedLabel;
  }

  function prepareRunButton(job) {
    const btn = $(jobs[job.kind]?.buttonId);
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.textContent = jobs[job.kind].normalLabel;
  }

  function scheduleNext(next, generation) {
    setTimeout(async () => {
      if (generation !== state.generation) {
        try { next.resolveQueued?.(); } catch {}
        return;
      }
      try {
        const value = await startJob(next);
        next.resolveQueued?.(value);
      } catch (err) {
        next.rejectQueued?.(err);
      }
    }, 120);
  }

  async function startJob(job) {
    const generation = state.generation;
    state.active = job.kind;
    state.runningPromise = null;
    prepareRunButton(job);
    dispatch();

    try {
      state.runningPromise = Promise.resolve(job.original.call(job.thisArg, job.event));
      return await state.runningPromise;
    } finally {
      if (generation !== state.generation) return;

      state.runningPromise = null;
      state.active = null;
      dispatch();

      const next = state.queued;
      if (next) {
        state.queued = null;
        prepareRunButton(next);
        scheduleNext(next, generation);
      }
    }
  }

  function enqueue(job) {
    if (state.queued) {
      if (state.queued.kind === job.kind) {
        setStatus(job.kind, jobs[job.kind].waitingText);
        prepareQueuedButton(state.queued);
        return state.queued.promise;
      }
      return state.queued.promise;
    }

    let resolveQueued;
    let rejectQueued;
    const promise = new Promise((resolve, reject) => {
      resolveQueued = resolve;
      rejectQueued = reject;
    });

    state.queued = {...job, promise, resolveQueued, rejectQueued};
    prepareQueuedButton(state.queued);
    setStatus(job.kind, jobs[job.kind].waitingText);
    dispatch();
    return promise;
  }

  function resetForQuestionBoundary() {
    state.generation += 1;
    const queued = state.queued;
    state.queued = null;
    state.active = null;
    state.runningPromise = null;
    try { queued?.resolveQueued?.(); } catch {}

    ['transit','returns'].forEach(kind => {
      prepareRunButton({kind});
      const text = String($(jobs[kind].statusId)?.textContent || '');
      if (/계산.*중|대기.*중|자동\s*재개|복귀\s*시|서버.*준비|연결\s*복구/.test(text)) {
        setStatus(kind, '');
      }
    });
    dispatch();
  }

  function wrap(kind) {
    const spec = jobs[kind];
    const btn = $(spec.buttonId);
    if (!btn || btn.dataset.luneaAstroJobQueueV1 === '1') return false;

    if (btn.dataset.luneaAstroStabilityV2 !== '1') return false;
    if (kind === 'transit' && !btn.__luneaLongRunV2) return false;

    const original = btn.onclick;
    if (typeof original !== 'function') return false;

    btn.dataset.luneaAstroJobQueueV1 = '1';
    btn.onclick = function(event) {
      const job = {kind, original, thisArg:this, event};

      if (!state.active) return startJob(job);
      if (state.active === kind) return state.runningPromise || Promise.resolve();
      return enqueue(job);
    };
    return true;
  }

  function install() {
    wrap('transit');
    wrap('returns');
    state.installed = !!(
      $('astroTransitRun')?.dataset.luneaAstroJobQueueV1 === '1' &&
      $('astroReturnRun')?.dataset.luneaAstroJobQueueV1 === '1'
    );
    if (state.installed && !W.__LUNEA_ASTRO_JOB_QUEUE_LOGGED__) {
      W.__LUNEA_ASTRO_JOB_QUEUE_LOGGED__ = true;
      console.info('🌌 LUNEA Astro Job Queue V1.1 installed · question-boundary reset ON');
    }
    return state.installed;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 240) clearInterval(timer);
    }, 50);
    setTimeout(install, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

  W.LUNEA_ASTRO_JOB_QUEUE = {
    getState: () => ({
      active:state.active,
      queued:state.queued?.kind || null,
      installed:state.installed,
      generation:state.generation
    }),
    resetForQuestionBoundary
  };
})();
