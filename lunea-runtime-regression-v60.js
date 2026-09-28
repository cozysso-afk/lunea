'use strict';

/*
  LUNEA RUNTIME REGRESSION V60
  ============================
  Two narrow mobile/PWA repairs without wrapping startSpread or replacing the
  Horary request owner.

  1) Universal AI preview confirmation:
     keep the reading overlay visible while V20 yields across paint frames before
     startSpread. This removes the temporary Home-screen exposure that can occur
     between preview close and card render, especially on repeated STOCK AI runs.
     Once the confirmed card render actually starts, release V20's draw-button
     busy lock as well. Some legacy startSpread wrappers return long-lived promises;
     keeping the hidden sheet button disabled until those promises settle can make
     the next AI reading look frozen even though the cards already rendered.

  2) Horary modal re-entry:
     closing the Horary overlay does not cancel the request, but the legacy
     openModal path cancels the active Horary scope whenever the user reopens it.
     While a hidden calculation is still pending, reopen the existing overlay
     directly so the in-flight request survives. After it finishes, allow one
     preserved reopen to show the completed result, then return to normal new-
     question behavior.
*/
(() => {
  const W = window;
  if (W.__LUNEA_RUNTIME_REGRESSION_V60__) return;
  W.__LUNEA_RUNTIME_REGRESSION_V60__ = true;

  const RELEASE = '60.2';
  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  let aiEpoch = 0;
  let aiMutationEpoch = 0;
  let aiBaselineFirstNode = null;
  let aiBaselineCount = -1;
  let aiExpectedQuestion = '';
  let horaryPreservePending = false;
  let horaryWasVisible = false;
  let horaryObserver = null;
  let cardsObserver = null;

  function aiPositionsValid() {
    const raw = String($('luneaV20PreviewPositions')?.value || '');
    const count = raw.split(/\n+/).map(line => line.trim()).filter(Boolean).length;
    return count >= 2 && count <= 20;
  }

  function ensureAiTransitionStatus() {
    let status = $('luneaAiTransitionStatusV60');
    if (status) return status;
    status = document.createElement('div');
    status.id = 'luneaAiTransitionStatusV60';
    status.setAttribute('role', 'status');
    status.style.cssText = 'display:none;margin:8px 0 10px;padding:9px 11px;border-radius:12px;background:rgba(189,164,248,.07);border:1px solid rgba(189,164,248,.15);color:#cfc6de;font-size:10px;line-height:1.45;text-align:center';
    const cards = $('cards');
    if (cards?.parentNode) cards.parentNode.insertBefore(status, cards);
    return status;
  }

  function releaseAiDrawLock() {
    const draw = $('drawBtn');
    if (draw?.disabled) draw.disabled = false;
    const label = $('drawLabel');
    if (label && /설계\s*중/.test(clean(label.textContent))) {
      label.textContent = '질문 분석 & 맞춤 배열 설계';
    }
  }

  function aiRenderChanged() {
    const cards = $('cards');
    if (!cards?.children?.length) return false;
    // Capture runs before V20's confirm handler. A real startSpread clears and
    // rebuilds #cards, so either the first node identity or child count must
    // differ from the preview-confirm baseline. This avoids treating cards left
    // over from the previous reading as completion of the new AI reading.
    let renderedQuestion = '';
    try { renderedQuestion = clean(state?.question || ''); } catch {}
    if (!aiExpectedQuestion || renderedQuestion !== aiExpectedQuestion) return false;
    return cards.firstElementChild !== aiBaselineFirstNode || cards.children.length !== aiBaselineCount;
  }

  function settleAiTransitionIfDrawn(fromMutation = false) {
    if (fromMutation) aiMutationEpoch = aiEpoch;
    if (!aiEpoch || !aiRenderChanged()) return false;
    const status = $('luneaAiTransitionStatusV60');
    if (status) status.style.display = 'none';
    releaseAiDrawLock();
    return true;
  }

  function watchAiTransition(epoch) {
    const startedAt = performance.now();
    const tick = () => {
      if (epoch !== aiEpoch || settleAiTransitionIfDrawn()) return;
      if (performance.now() - startedAt < 6000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function prepareAiTransition(event) {
    const button = event.target?.closest?.('#luneaV20PreviewConfirm');
    if (!button || button.disabled || !aiPositionsValid()) return;

    const preview = $('luneaV20PreviewOverlay');
    const spread = $('spreadOverlay');
    if (!preview?.classList.contains('show') || !spread) return;

    const cards = $('cards');
    const epoch = ++aiEpoch;
    aiMutationEpoch = 0;
    aiBaselineFirstNode = cards?.firstElementChild || null;
    aiBaselineCount = cards?.children?.length ?? -1;
    const question = clean($('question')?.value || '');
    aiExpectedQuestion = question;
    const title = clean($('luneaV20PreviewTitle')?.value || $('spreadType')?.textContent || '') || '질문 맞춤 배열';

    // V20 closes the preview and then intentionally yields across paint frames.
    // Show the destination first so there is never a frame where Home is exposed.
    $('sheet')?.classList.remove('open');
    document.body?.classList?.remove('lunea-sheet-open');
    spread.classList.add('show');
    spread.setAttribute('aria-hidden', 'false');
    document.body?.classList?.add('modal-open');

    if ($('spreadType')) $('spreadType').textContent = title;
    if ($('spreadQuestion')) $('spreadQuestion').textContent = question ? `“${question}”` : '카드를 펼치는 중…';

    const status = ensureAiTransitionStatus();
    if (status) {
      status.textContent = '카드를 펼치는 중…';
      status.style.display = 'block';
    }

    // MutationObserver is the fast path, while rAF polling is a WebKit-safe
    // fallback for render paths where the observer callback can be missed or
    // delayed behind legacy async wrappers.
    watchAiTransition(epoch);

    setTimeout(() => {
      if (epoch !== aiEpoch || settleAiTransitionIfDrawn()) return;
      const draw = $('drawBtn');
      if (!draw?.disabled && !$('luneaV20PreviewOverlay')?.classList.contains('show')) {
        const pending = $('luneaAiTransitionStatusV60');
        if (pending) pending.textContent = '카드 화면 전환이 중단됐어. 같은 질문에서 카드 뽑기를 다시 눌러줘.';
      }
    }, 3500);
  }

  function installCardsObserver() {
    const cards = $('cards');
    if (!cards || cardsObserver) return !!cards;
    cardsObserver = new MutationObserver(() => settleAiTransitionIfDrawn(true));
    cardsObserver.observe(cards, {childList:true});
    return true;
  }

  function horaryIsBusy() {
    const button = $('astroHoraryRun');
    const status = clean($('astroHoraryStatus')?.textContent || '');
    return !!button?.disabled || /계산\s*중|계산하고\s*있/.test(status);
  }

  function showExistingHorary(event) {
    const opener = event.target?.closest?.('#horaryStandaloneItem,#astroHoraryBtn');
    if (!opener || !horaryPreservePending) return;

    const overlay = $('astroHoraryOverlay');
    if (!overlay || overlay.classList.contains('show')) return;

    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body?.classList?.add('modal-open');
    try { W.LUNEA_HORARY_MOBILE_STABILITY_V42?.lockPage?.(); } catch {}

    // Keep interception armed while the request is still pending so the user can
    // close/reopen repeatedly. Once a hidden request has completed, consume one
    // preserved reopen so the next deliberate visit can start a fresh Horary.
    if (!horaryIsBusy()) horaryPreservePending = false;
  }

  function installHoraryObserver() {
    const overlay = $('astroHoraryOverlay');
    if (!overlay || horaryObserver) return !!overlay;

    horaryWasVisible = overlay.classList.contains('show');
    horaryObserver = new MutationObserver(() => {
      const visible = overlay.classList.contains('show');
      if (horaryWasVisible && !visible && horaryIsBusy()) {
        horaryPreservePending = true;
      }
      horaryWasVisible = visible;
    });
    horaryObserver.observe(overlay, {attributes:true, attributeFilter:['class']});
    return true;
  }

  function install() {
    installCardsObserver();
    installHoraryObserver();
  }

  document.addEventListener('click', prepareAiTransition, true);
  document.addEventListener('click', showExistingHorary, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, {once:true});
  } else {
    install();
  }

  // Horary is injected after boot. Watch only until the required targets exist;
  // this observer never rewrites reading rows or startSpread.
  const lateObserver = new MutationObserver(() => {
    install();
    if ($('astroHoraryOverlay') && $('cards')) lateObserver.disconnect();
  });
  lateObserver.observe(document.documentElement, {childList:true, subtree:true});

  W.LUNEA_RUNTIME_REGRESSION_V60 = Object.freeze({
    version: RELEASE,
    install,
    getState: () => ({aiEpoch, aiMutationEpoch, aiBaselineCount, aiExpectedQuestion, horaryPreservePending})
  });

  console.info('✦ LUNEA Runtime Regression V60.2 loaded · AI transition lock + Horary re-entry guarded');
})();
