'use strict';

/*
  LUNEA READING BOUNDARY RESET V31.2
  ===================================
  Synchronous, non-wrapping Timing cleanup for reading boundaries.

  V31.1 used timingSupportBtn.onclick() as a back door into Timing Oracle's
  closure state. That handler opens the full-screen Timing overlay before V31
  hides it again, and V31 also wrapped startSpread on a retry timer. In a
  long-lived mobile/PWA session those two behaviors could race the next tarot
  overlay and contribute to the "first reading works, second reading stalls"
  failure.

  V31.2 therefore:
  - never calls the Timing button handler
  - never wraps/replaces startSpread
  - never polls to become the outermost wrapper
  - performs only synchronous DOM/source cleanup
  - leaves Timing Oracle's own one-time startSpread reset responsible for its
    private closure state on normal fixed/AI starts
  - covers manual/direct restore paths with a capture safety net + question
    observer, without opening any auxiliary modal
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_BOUNDARY_RESET_V31__) return;
  W.__LUNEA_READING_BOUNDARY_RESET_V31__ = true;

  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  let lastQuestion = '';

  function syncModalLock() {
    try {
      const anyVisible = !!document.querySelector('.overlay.show');
      document.body?.classList?.toggle('modal-open', anyVisible);
      if (!anyVisible) {
        document.body?.style?.removeProperty('pointer-events');
        document.body?.style?.removeProperty('touch-action');
        document.body?.style?.removeProperty('overflow');
        document.documentElement?.style?.removeProperty('overflow');
      }
    } catch {}
  }

  function closeTimingOverlay() {
    const ov = $('timingOverlay');
    if (!ov) return;
    ov.classList.remove('show');
    ov.setAttribute?.('aria-hidden', 'true');
  }

  function resetSingleTimingVisuals() {
    $('luneaTimingInline')?.remove();
    $('timingFlip')?.classList.remove('show');
    $('timingInner')?.classList.remove('flipped');
    $('timingResult')?.classList.remove('show');
    $('timingActions')?.classList.remove('show');

    const ai = $('timingAIText');
    if (ai) {
      ai.classList.remove('show');
      ai.textContent = '';
    }

    const support = $('timingSupportBtn');
    if (support) support.textContent = '⏳ 시기 카드';
  }

  function resetABTimingVisuals() {
    $('luneaTimingABInline')?.remove();

    const cards = $('luneaTimingABCards');
    if (cards) cards.replaceChildren();

    $('luneaTimingABPanel')?.classList.remove('show');

    const ai = $('luneaTimingABAI');
    if (ai) {
      ai.classList.remove('show');
      ai.textContent = '';
    }

    try { W.LUNEA_TIMING_AB_LAST = null; } catch {}
  }

  function resetTimingBoundary(reason = 'new-reading') {
    // Reuse V27's source-DOM cleanup when available. V27.resetTimingDOM is
    // synchronous and does not open an overlay or draw a card.
    try { W.LUNEA_V27?.resetTimingDOM?.(); } catch {}

    resetSingleTimingVisuals();
    resetABTimingVisuals();
    closeTimingOverlay();
    syncModalLock();

    document.documentElement.dataset.luneaTimingBoundary = reason;
  }

  function observeSpreadQuestion() {
    const question = $('spreadQuestion');
    if (!question || question.__luneaReadingBoundaryV31Observed) return false;
    question.__luneaReadingBoundaryV31Observed = true;
    lastQuestion = clean(question.textContent);

    new MutationObserver(() => {
      const now = clean(question.textContent);
      if (now === lastQuestion) return;
      lastQuestion = now;
      // Synchronous only. No microtask/rAF cleanup is allowed to outlive this
      // question boundary and mutate the next reading.
      resetTimingBoundary('question-change');
    }).observe(question, {childList:true, subtree:true, characterData:true});
    return true;
  }

  function isDirectReadingBoundaryButton(btn) {
    if (!btn) return false;
    if (btn.id === 'drawBtn' || btn.id === 'dailyBtn' || btn.id === 'luneaDraftRestore' || btn.id === 'retry') return true;
    return /다시\s*뽑기|새\s*리딩|새\s*질문/.test(clean(btn.textContent));
  }

  function installCaptureSafetyNet() {
    if (document.__luneaReadingBoundaryV31Capture) return;
    document.__luneaReadingBoundaryV31Capture = true;
    document.addEventListener('click', event => {
      const btn = event.target?.closest?.('button');
      if (!isDirectReadingBoundaryButton(btn)) return;
      resetTimingBoundary('direct-reading-entry');
    }, true);
  }

  function boot() {
    installCaptureSafetyNet();
    observeSpreadQuestion();
    console.info('✦ LUNEA Reading Boundary V31.2 loaded · synchronous / no startSpread wrapper');
  }

  W.LUNEA_READING_BOUNDARY_V31 = {
    version: 31.2,
    resetTimingBoundary,
    resetSingleTimingVisuals,
    resetABTimingVisuals
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
