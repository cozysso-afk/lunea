'use strict';

/*
  LUNEA AI REPEAT FLOW V58
  ========================
  iPhone/PWA guard for repeated Universal AI custom-spread draws.

  Observed live failure:
  - First AI custom question opens the reading normally.
  - From the second question onward, confirming "이 배열로 카드 뽑기" can leave
    the user on the preview / previous screen while startSpread is deferred by
    the mobile paint-yield wrapper.

  Goals:
  - Treat every AI preview confirmation as an independent draw session.
  - Transition to the reading overlay immediately, before heavy card DOM work.
  - Invoke the existing startSpread chain exactly once; never redraw/retry RNG.
  - Await async/deferred startSpread internally so rejected second-run promises
    are caught instead of becoming unhandled rejections.
  - Keep ordinary fixed/manual/Daily/A-B paths untouched.
*/
(() => {
  const W = window;
  if (W.__LUNEA_AI_REPEAT_FLOW_V58__) return;
  W.__LUNEA_AI_REPEAT_FLOW_V58__ = true;

  const RELEASE = '58.0';
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

    // Preview/sheet must not remain above the reading on the second run.
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

    // Defensive: old close/preview callbacks must not leave the new reading
    // visually hidden after startSpread has already created its state.
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

    function wrappedStartSpread(...args) {
      if (!isAiConfirmedStart(args)) return current.apply(this, args);

      const epoch = confirmEpoch || 1;
      lastConfirmAt = 0;
      const thisArg = this;
      prepareReadingTransition(args, epoch);

      // Return a Promise even if the prior chain is synchronous. Existing
      // callers that ignore it still get the immediate overlay transition;
      // callers that await it receive the real completion/error.
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
    getState: () => ({confirmEpoch, lastConfirmAt, installed: !!installed})
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  console.info('✦ LUNEA AI Repeat Flow V58 loaded');
})();
