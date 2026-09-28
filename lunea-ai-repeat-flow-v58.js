'use strict';

/*
  LUNEA AI REPEAT FLOW V58
  ========================
  iPhone/PWA guard for repeated Universal AI custom-spread draws.

  Live root cause addressed here:
  - V31 Reading Boundary and V57 Mobile Runtime both re-check startSpread on a
    timer and only recognized their own marker on the OUTERMOST wrapper.
  - When both were active they could alternately wrap each other many times.
  - The first AI question could still work, while the second question later in
    the same session traversed a very deep wrapper stack and appeared frozen
    after "이 배열로 카드 뽑기".

  Goals:
  - Stabilize the wrapper chain by advertising markers that already exist inside
    the chain on one outer compatibility wrapper.
  - Treat every AI preview confirmation as an independent draw session.
  - Transition to the reading overlay immediately, before heavy card DOM work.
  - Invoke the existing startSpread chain exactly once; never redraw/retry RNG.
  - Catch async/deferred startSpread failures instead of leaving unhandled
    promise rejections on repeat draws.
  - Keep ordinary fixed/manual/Daily/A-B paths untouched.
*/
(() => {
  const W = window;
  if (W.__LUNEA_AI_REPEAT_FLOW_V58__) return;
  W.__LUNEA_AI_REPEAT_FLOW_V58__ = true;

  const RELEASE = '58.1';
  const $ = id => document.getElementById(id);
  const clean = value => String(value || '')
    .normalize('NFKC')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  let confirmEpoch = 0;
  let lastConfirmAt = 0;
  let installed = null;
  let installTimer = 0;

  const PRIOR_KEYS = [
    '__luneaAiRepeatFlowV58Prior',
    '__luneaMobileV57Prior',
    '__luneaReadingBoundaryV31Original',
    '__luneaPriorStart',
    '__luneaV14PriorStart',
    '__luneaManualPriorStart'
  ];

  function chainHas(fn, marker) {
    let cur = fn;
    const seen = new Set();
    for (let depth = 0; typeof cur === 'function' && depth < 256; depth += 1) {
      if (cur[marker]) return true;
      if (seen.has(cur)) return false;
      seen.add(cur);
      let next = null;
      for (const key of PRIOR_KEYS) {
        if (typeof cur[key] === 'function') { next = cur[key]; break; }
      }
      cur = next;
    }
    return false;
  }

  function isAiConfirmedStart(args) {
    const rationale = String(args?.[3] || '');
    const recent = lastConfirmAt > 0 && performance.now() - lastConfirmAt < 5000;
    return recent || /PRE-DRAW USER CONFIRMED|USER_EDIT_MAX_20|LUNEA AI/i.test(rationale);
  }

  function currentQuestionFallback(args) {
    const fromArgs = clean(args?.[0] || '');
    if (fromArgs) return fromArgs;
    try {
      const q = clean(W.state?.question || state?.question || '');
      if (q) return q;
    } catch {}
    return clean($('question')?.value || $('spreadQuestion')?.textContent || '')
      .replace(/^["']+|["']+$/g, '');
  }

  function prepareReadingTransition(args, epoch) {
    const question = currentQuestionFallback(args);
    const title = clean(args?.[2] || '') || '질문 맞춤 배열';

    const preview = $('luneaV20PreviewOverlay');
    preview?.classList.remove('show');
    preview?.setAttribute('aria-hidden', 'true');
    $('luneaSpreadPreviewOverlay')?.classList.remove('show');
    $('sheet')?.classList.remove('open');

    const spread = $('spreadOverlay');
    if (!spread) return;

    spread.classList.add('show');
    spread.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    spread.dataset.luneaAiRepeatEpoch = String(epoch);

    if ($('spreadType')) $('spreadType').textContent = title;
    if ($('spreadQuestion')) $('spreadQuestion').textContent = question ? `“${question}”` : '카드를 펼치는 중…';

    let status = $('luneaAiRepeatStatusV58');
    if (!status) {
      status = document.createElement('div');
      status.id = 'luneaAiRepeatStatusV58';
      status.setAttribute('role', 'status');
      status.style.cssText = 'margin:8px 0 10px;padding:9px 11px;border-radius:12px;background:rgba(189,164,248,.07);border:1px solid rgba(189,164,248,.15);color:#cfc6de;font-size:10px;line-height:1.45;text-align:center';
      const cards = $('cards');
      if (cards?.parentNode) cards.parentNode.insertBefore(status, cards);
    }
    status.textContent = '카드를 펼치는 중…';
    status.style.display = 'block';
  }

  function finishReadingTransition(epoch) {
    const spread = $('spreadOverlay');
    if (!spread || spread.dataset.luneaAiRepeatEpoch !== String(epoch)) return;
    spread.classList.add('show');
    spread.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const status = $('luneaAiRepeatStatusV58');
    if (status) status.style.display = 'none';

    requestAnimationFrame(() => {
      if (spread.dataset.luneaAiRepeatEpoch !== String(epoch)) return;
      spread.classList.add('show');
      spread.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    });
  }

  function failReadingTransition(epoch, error) {
    const spread = $('spreadOverlay');
    if (!spread || spread.dataset.luneaAiRepeatEpoch !== String(epoch)) return;
    spread.classList.add('show');
    spread.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const status = $('luneaAiRepeatStatusV58');
    if (status) {
      status.style.display = 'block';
      status.textContent = '카드 화면 전환 중 오류가 났어. 같은 질문에서 다시 한 번만 눌러줘.';
    }
    console.error('[LUNEA V58] repeated AI draw failed', error);
  }

  function markConfirm(event) {
    const button = event.target?.closest?.('#luneaV20PreviewConfirm,#luneaSpreadPreviewConfirm');
    if (!button) return;
    lastConfirmAt = performance.now();
    confirmEpoch += 1;
  }

  function wrapStartSpread() {
    const current = W.startSpread;
    if (typeof current !== 'function') return false;
    if (current.__luneaAiRepeatFlowV58) {
      installed = current;
      return true;
    }
    if (current === installed) return true;

    const hasV31 = chainHas(current, '__luneaReadingBoundaryV31');
    const hasV57 = chainHas(current, '__luneaMobileV57Yield');
    const hasLearningGate = chainHas(current, '__luneaLearningSuccessGate');

    function wrappedStartSpread(...args) {
      if (!isAiConfirmedStart(args)) return current.apply(this, args);

      const epoch = confirmEpoch || 1;
      lastConfirmAt = 0;
      const thisArg = this;
      prepareReadingTransition(args, epoch);

      return Promise.resolve()
        .then(() => current.apply(thisArg, args))
        .then(value => {
          finishReadingTransition(epoch);
          return value;
        })
        .catch(error => {
          failReadingTransition(epoch, error);
          throw error;
        });
    }

    wrappedStartSpread.__luneaAiRepeatFlowV58 = true;
    wrappedStartSpread.__luneaAiRepeatFlowV58Prior = current;

    // Compatibility markers are propagated ONLY when the behavior is already
    // present below us. This stops V31/V57 timer installers from endlessly
    // wrapping each other while never suppressing a behavior that is not yet
    // installed.
    if (hasV31) wrappedStartSpread.__luneaReadingBoundaryV31 = true;
    if (hasV57) wrappedStartSpread.__luneaMobileV57Yield = true;
    if (hasLearningGate) wrappedStartSpread.__luneaLearningSuccessGate = true;

    W.startSpread = wrappedStartSpread;
    try { startSpread = wrappedStartSpread; } catch {}
    installed = wrappedStartSpread;
    return true;
  }

  function installGuards() {
    if (document.documentElement.dataset.luneaAiRepeatV58 !== '1') {
      document.documentElement.dataset.luneaAiRepeatV58 = '1';
      document.addEventListener('click', markConfirm, true);
    }
    return wrapStartSpread();
  }

  function boot() {
    installGuards();
    let tries = 0;
    installTimer = setInterval(() => {
      tries += 1;
      installGuards();
      if (tries >= 180) clearInterval(installTimer);
    }, 100);
  }

  W.LUNEA_AI_REPEAT_FLOW_V58 = Object.freeze({
    version: RELEASE,
    install: installGuards,
    chainHas,
    getState: () => ({confirmEpoch, lastConfirmAt, installed: !!installed})
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  console.info('✦ LUNEA AI Repeat Flow V58.1 loaded · wrapper chain stabilized');
})();
