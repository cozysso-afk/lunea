'use strict';

/* LUNEA RUNTIME STATE V55
   - Detect a newly published build when an already-open iOS/PWA webview returns.
   - Clear Transit/Return resume state when the tarot question changes.
   - Remove stale "calculation in progress" UI that belongs to a previous reading.
   - Re-assert iOS Thai-period date centering as a runtime fallback.
*/
(() => {
  const W = window;
  if (W.__LUNEA_RUNTIME_STATE_V55__) return;
  W.__LUNEA_RUNTIME_STATE_V55__ = true;

  const BUILD_FILE = './lunea-build.json';
  const BUILD_KEY = 'LUNEA_RUNTIME_BUILD_V55';
  const ASTRO_PENDING_KEY = 'LUNEA_ASTRO_PENDING_V23';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  let lastQuestion = '';
  let checkingBuild = false;
  let lastBuildCheckAt = 0;

  function currentQuestion() {
    let value = clean($('spreadQuestion')?.textContent || '');
    if (!value) {
      try { value = clean(W.state?.question || ''); } catch {}
    }
    return value;
  }

  function pendingRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(ASTRO_PENDING_KEY) || '{}');
      return rows && typeof rows === 'object' ? rows : {};
    } catch { return {}; }
  }

  function pendingQuestion(rows = pendingRows()) {
    return clean(rows?.transit?.question || rows?.returns?.question || '');
  }

  function queueState() {
    try { return W.LUNEA_ASTRO_JOB_QUEUE?.getState?.() || {}; }
    catch { return {}; }
  }

  function resetButton(id, label) {
    const btn = $(id);
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.removeAttribute('data-lunea-warm-busy');
    btn.textContent = label;
  }

  function resetStatus(id) {
    const el = $(id);
    if (!el) return;
    const text = clean(el.textContent);
    if (/계산.*중|대기.*중|자동\s*재개|복귀\s*시|서버\s*준비|다음\s*구간\s*계산/.test(text)) {
      el.textContent = '';
    }
  }

  function finishAstroUiReset() {
    const queue = queueState();
    if (queue.active || queue.queued) return false;

    resetButton('astroTransitRun', '🌌 트랜짓 스캔');
    resetButton('astroReturnRun', '↻ 리턴 계산');
    resetStatus('astroTransitStatus');
    resetStatus('astroReturnStatus');

    const badge = $('luneaAstroJobBadgeV23');
    if (badge) badge.classList.remove('show', 'waiting');
    return true;
  }

  function clearPriorAstro(reason = 'question-change') {
    try { W.LUNEA_ASTRO_RESUME_V23?.clear?.(); } catch {}
    try { localStorage.removeItem(ASTRO_PENDING_KEY); } catch {}

    finishAstroUiReset();
    setTimeout(finishAstroUiReset, 120);
    setTimeout(finishAstroUiReset, 700);
    setTimeout(finishAstroUiReset, 1800);

    try { document.documentElement.dataset.luneaAstroBoundary = reason; } catch {}
  }

  function inspectExistingPending() {
    const rows = pendingRows();
    if (!rows.transit && !rows.returns) return;

    const nowQuestion = currentQuestion();
    const oldQuestion = pendingQuestion(rows);
    if (nowQuestion && oldQuestion && nowQuestion !== oldQuestion) {
      clearPriorAstro('stale-pending-question');
    }
  }

  function observeQuestion() {
    const node = $('spreadQuestion');
    if (!node || node.__luneaRuntimeStateV55Observed) return false;
    node.__luneaRuntimeStateV55Observed = true;
    lastQuestion = currentQuestion();

    new MutationObserver(() => {
      const now = currentQuestion();
      if (now === lastQuestion) return;
      const previous = lastQuestion;
      lastQuestion = now;
      if (previous || now) clearPriorAstro('question-change');
    }).observe(node, {childList:true, subtree:true, characterData:true});
    return true;
  }

  function ensureThaiDateCenter() {
    if ($('luneaRuntimeThaiDateCenterV55Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaRuntimeThaiDateCenterV55Style';
    style.textContent = `
      .thai-v33-field input[type="date"]{
        text-align:center!important;text-align-last:center!important;
        line-height:1.2!important;padding-left:8px!important;padding-right:8px!important;
      }
      .thai-v33-field input[type="date"]::-webkit-date-and-time-value{
        width:100%!important;min-width:100%!important;text-align:center!important;margin:0!important;
      }
      .thai-v33-field input[type="date"]::-webkit-datetime-edit,
      .thai-v33-field input[type="date"]::-webkit-datetime-edit-fields-wrapper{
        width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;
      }
    `;
    document.head.appendChild(style);
  }

  function refreshTo(build) {
    try {
      const url = new URL(location.href);
      url.searchParams.set('lunea_v', build);
      url.searchParams.set('fresh', String(Date.now()));
      location.replace(url.toString());
    } catch {
      location.reload();
    }
  }

  async function checkPublishedBuild(force = false) {
    if (checkingBuild) return;
    const now = Date.now();
    if (!force && now - lastBuildCheckAt < 15000) return;
    lastBuildCheckAt = now;
    checkingBuild = true;

    try {
      const response = await fetch(`${BUILD_FILE}?t=${now}`, {
        cache:'no-store', headers:{'cache-control':'no-cache', 'accept':'application/json'}
      });
      if (!response.ok) return;
      const data = await response.json();
      const remote = clean(data?.version || '');
      if (!remote) return;

      let seen = '';
      try { seen = clean(localStorage.getItem(BUILD_KEY) || ''); } catch {}
      if (!seen) {
        try { localStorage.setItem(BUILD_KEY, remote); } catch {}
        return;
      }
      if (seen !== remote) {
        try { localStorage.setItem(BUILD_KEY, remote); } catch {}
        refreshTo(remote);
      }
    } catch (error) {
      console.info('[LUNEA Runtime V55] build check skipped', error?.message || error);
    } finally {
      checkingBuild = false;
    }
  }

  function assertProxy() {
    try {
      if (W.__LUNEA_RENDER_CANONICAL__) {
        localStorage.setItem(API_KEY, `${location.origin}/__lunea_api`);
      }
    } catch {}
  }

  function boot() {
    assertProxy();
    ensureThaiDateCenter();
    observeQuestion();
    inspectExistingPending();
    setTimeout(() => { observeQuestion(); inspectExistingPending(); }, 250);
    setTimeout(() => { observeQuestion(); inspectExistingPending(); }, 1200);
    checkPublishedBuild(true);
  }

  W.addEventListener('pageshow', () => {
    assertProxy();
    ensureThaiDateCenter();
    inspectExistingPending();
    checkPublishedBuild(true);
  }, {passive:true});

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    assertProxy();
    inspectExistingPending();
    checkPublishedBuild(true);
  });

  W.LUNEA_RUNTIME_STATE_V55 = Object.freeze({
    clearPriorAstro,
    checkPublishedBuild,
    inspectExistingPending,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
