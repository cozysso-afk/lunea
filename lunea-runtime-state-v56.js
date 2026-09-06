'use strict';

/* LUNEA RUNTIME STATE V56.1
   Question boundaries are hard state boundaries. No Transit / Return / Thai
   request, busy label, inline result, or auto-resume marker from a previous
   tarot question may survive into the next reading.
*/
(() => {
  const W = window;
  if (W.__LUNEA_RUNTIME_STATE_V56__) return;
  W.__LUNEA_RUNTIME_STATE_V56__ = true;

  const PENDING_KEY = 'LUNEA_ASTRO_PENDING_V23';
  const LONG_KEY = 'LUNEA_TRANSIT_LONG_RUN_V2_CHECKPOINT';
  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const unquote = value => clean(value).replace(/^["']+|["']+$/g, '').trim();

  let lastQuestion = '';
  let observer = null;

  function currentQuestion() {
    let q = unquote($('spreadQuestion')?.textContent || '');
    if (!q) { try { q = unquote(W.state?.question || ''); } catch {} }
    return q;
  }

  function pendingRows() {
    try {
      const value = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  function pendingQuestion(rows = pendingRows()) {
    return unquote(rows?.transit?.question || rows?.returns?.question || '');
  }

  function statusLooksBusy(value) {
    return /계산.*중|대기.*중|서버.*준비|자동\s*재개|복귀\s*시|연결\s*복구|구간.*계산|재시도/.test(clean(value));
  }

  function resetButton(id, label) {
    const btn = $(id);
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.removeAttribute('data-lunea-warm-busy');
    delete btn.dataset.luneaWarmBusy;
    btn.textContent = label;
  }

  function resetResult(id) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('show');
    el.innerHTML = '';
  }

  function resetThaiRangeUi() {
    resetButton('luneaThaiTarotRangeBtn', '🇹🇭 Thai 기간');
    document.querySelectorAll('.thai-v33-run').forEach(btn => {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (/계산.*중|대기.*중|재시도/.test(clean(btn.textContent))) btn.textContent = '기간 계산';
    });
    document.querySelectorAll('.thai-v33-status').forEach(el => {
      if (statusLooksBusy(el.textContent)) el.textContent = '';
    });
  }

  function resetVisibleUi() {
    resetButton('astroTransitRun', '🌌 트랜짓 스캔');
    resetButton('astroReturnRun', '↻ 리턴 계산');
    resetButton('thaiTaksaRun', '🇹🇭 태국점성술 계산');
    resetButton('luneaThaiTarotBridgeBtn', '🇹🇭 Thai 보조');
    resetThaiRangeUi();

    const transitTop = $('astroTransitBtn');
    if (transitTop) transitTop.textContent = '🌌 Astro Timing';
    const returnTop = $('astroReturnBtn');
    if (returnTop && /완료|계산|대기|중/.test(clean(returnTop.textContent))) returnTop.textContent = '↻ Return';

    ['astroTransitStatus','astroReturnStatus','thaiTaksaStatus'].forEach(id => {
      const el = $(id);
      if (el && statusLooksBusy(el.textContent)) el.textContent = '';
    });

    resetResult('astroTransitResult');
    resetResult('astroReturnResult');
    resetResult('thaiTaksaResult');

    $('luneaAstroTransitInline')?.remove();
    $('luneaReturnInline')?.remove();
    $('luneaThaiTarotBridgeInline')?.remove();
    $('luneaThaiInline')?.remove();
    $('luneaThaiRangeInline')?.remove();

    const badge = $('luneaAstroJobBadgeV23');
    badge?.classList.remove('show','waiting');
  }

  function clearAuxiliaryState(reason = 'question-boundary') {
    try { W.LUNEA_ASTRO_JOB_QUEUE?.resetForQuestionBoundary?.(); } catch {}
    try { W.LUNEA_ASTRO_RESUME_V23?.clear?.(); } catch {}
    try { W.LUNEA_THAI_TAROT_BRIDGE_V32?.clear?.(); } catch {}
    try { localStorage.removeItem(PENDING_KEY); } catch {}
    try { localStorage.removeItem(LONG_KEY); } catch {}
    resetVisibleUi();
    [60,220,700,1600].forEach(ms => setTimeout(resetVisibleUi,ms));
    try { document.documentElement.dataset.luneaAuxBoundary = reason; } catch {}
  }

  function inspectForStaleState() {
    const live = currentQuestion();
    if (!live) return false;

    const rows = pendingRows();
    const old = pendingQuestion(rows);
    const transitQ = unquote($('astroTransitQuestion')?.value || '');
    const returnQ = unquote($('astroReturnQuestion')?.value || '');
    const thaiBridgeBusy = statusLooksBusy($('luneaThaiTarotBridgeBtn')?.textContent || '')
      || $('luneaThaiTarotBridgeBtn')?.getAttribute('aria-busy') === 'true';
    const thaiRangeBusy = statusLooksBusy($('luneaThaiTarotRangeBtn')?.textContent || '')
      || $('luneaThaiTarotRangeBtn')?.getAttribute('aria-busy') === 'true';

    const mismatch = Boolean(
      (old && old !== live)
      || (transitQ && transitQ !== live)
      || (returnQ && returnQ !== live)
    );

    /* A restored page cannot safely resume Thai bridge/range against a different
       reading. If a button is still busy at page-show/question boundary, release it. */
    if (mismatch || thaiBridgeBusy || thaiRangeBusy) {
      clearAuxiliaryState(mismatch ? 'stale-question' : 'stale-thai-busy');
      return true;
    }
    return false;
  }

  function installQuestionObserver() {
    const node = $('spreadQuestion');
    if (!node) return false;
    if (observer) return true;
    lastQuestion = currentQuestion();
    observer = new MutationObserver(() => {
      const next = currentQuestion();
      if (next === lastQuestion) return;
      const previous = lastQuestion;
      lastQuestion = next;
      if (previous || next) clearAuxiliaryState('question-change');
    });
    observer.observe(node,{childList:true,subtree:true,characterData:true});
    return true;
  }

  function installResultMutationGate() {
    ['astroTransitStatus','astroTransitResult','astroReturnStatus','astroReturnResult'].forEach(id => {
      const el = $(id);
      if (!el || el.dataset.luneaQuestionGateV56 === '1') return;
      el.dataset.luneaQuestionGateV56 = '1';
      new MutationObserver(() => {
        const live = currentQuestion();
        if (!live) return;
        const field = id.startsWith('astroTransit') ? $('astroTransitQuestion') : $('astroReturnQuestion');
        const requestQ = unquote(field?.value || '');
        if (requestQ && requestQ !== live) resetVisibleUi();
      }).observe(el,{childList:true,subtree:true,characterData:true,attributes:true});
    });
  }

  function bootPass(){installQuestionObserver();installResultMutationGate();inspectForStaleState()}
  function boot(){
    bootPass();
    let tries=0;
    const timer=setInterval(()=>{tries+=1;bootPass();if(tries>=80&&observer)clearInterval(timer)},100);
  }

  W.addEventListener('pageshow',()=>setTimeout(bootPass,30),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(bootPass,30)});

  W.LUNEA_RUNTIME_STATE_V56=Object.freeze({clear:clearAuxiliaryState,inspect:inspectForStaleState,currentQuestion,version:'56.1'});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();