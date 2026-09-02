'use strict';

/*
  LUNEA READING BOUNDARY RESET V31.1
  ===================================
  Prevent a Timing Oracle card/result from a previous tarot question from
  surviving beside a newly started manual/fixed/AI spread or a direct restore.

  This is intentionally a UI/state-boundary guard only:
  - does NOT change Tarot RNG or Timing Oracle selection RNG
  - does NOT delete Timing Oracle history
  - does NOT touch archive/journal/learning data
  - clears stale single-target + A/B Timing mirrors/source DOM on a new reading
  - also resets Timing Oracle's closure state through its own support-button
    entrypoint for direct render paths that bypass startSpread
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_BOUNDARY_RESET_V31__) return;
  W.__LUNEA_READING_BOUNDARY_RESET_V31__ = true;

  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  let lastQuestion = '';
  let startWrapped = null;
  let resetEpoch = 0;

  function closeTimingOverlayAfterStateReset() {
    const ov = $('timingOverlay');
    if (ov) {
      ov.classList.remove('show');
      ov.setAttribute?.('aria-hidden', 'true');
    }
    try {
      if (!document.querySelector?.('.overlay.show')) document.body?.classList?.remove('modal-open');
    } catch {}
  }

  function resetSingleTimingClosureState() {
    // Timing Oracle V1 intentionally keeps timingState inside a closure. Its
    // support button calls openTimingModal('support', ...), and that function
    // synchronously clears primary/refine/AI/analysis before showing the modal.
    // Calling the already-installed handler directly gives direct-render paths
    // (Manual <=12, Manual 13-20, Daily restore, Draft restore) the same state
    // reset that the Timing startSpread wrapper provides, without drawing a card.
    const btn = $('timingSupportBtn');
    if (!btn || typeof btn.onclick !== 'function') return false;
    try {
      btn.onclick.call(btn);
      closeTimingOverlayAfterStateReset();
      return true;
    } catch {
      closeTimingOverlayAfterStateReset();
      return false;
    }
  }

  function resetSingleTimingVisuals() {
    // Main-spread support mirror. This node is a sibling of #cards, so the base
    // startSpread() clearing cards.innerHTML does not remove it by itself.
    $('luneaTimingInline')?.remove();

    // Reset the hidden Timing overlay too, so opening it for the next reading
    // cannot flash the previous card before the next draw.
    $('timingFlip')?.classList.remove('show');
    $('timingInner')?.classList.remove('flipped');
    $('timingResult')?.classList.remove('show');
    $('timingActions')?.classList.remove('show');
    const ai = $('timingAIText');
    if (ai) {
      ai.classList.remove('show');
      ai.textContent = '';
    }

    // The original Timing module changes this button to the drawn card label.
    // A new reading must never keep e.g. "오늘 밤" from the prior question.
    const support = $('timingSupportBtn');
    if (support) support.textContent = '◐ 시기 오라클';
  }

  function resetABTimingVisuals() {
    $('luneaTimingABInline')?.remove();

    // V16 mirrors #luneaTimingABCards into the reading. Clear the source, not
    // merely the visible mirror, or an observer can recreate the old cards.
    const cards = $('luneaTimingABCards');
    if (cards) cards.replaceChildren();

    const panel = $('luneaTimingABPanel');
    if (panel) panel.classList.remove('show');

    const ai = $('luneaTimingABAI');
    if (ai) {
      ai.classList.remove('show');
      ai.textContent = '';
    }

    try { W.LUNEA_TIMING_AB_LAST = null; } catch {}
  }

  function resetTimingBoundary(reason = 'new-reading') {
    resetEpoch += 1;

    // Clear the hidden single-card closure state first. Direct/manual restore
    // paths do not necessarily traverse Timing Oracle's own startSpread wrapper.
    resetSingleTimingClosureState();

    // Reuse the older V27 cleanup if it is present, then perform the complete
    // first-class cleanup below. V31 must not depend on Thai/V27 being loaded.
    try { W.LUNEA_V27?.resetTimingDOM?.(); } catch {}
    resetSingleTimingVisuals();
    resetABTimingVisuals();
    closeTimingOverlayAfterStateReset();

    // A mirror MutationObserver may already have queued a callback in this
    // microtask/frame. Sweep once more after it has had a chance to run.
    const epoch = resetEpoch;
    queueMicrotask(() => {
      if (epoch !== resetEpoch) return;
      resetSingleTimingVisuals();
      resetABTimingVisuals();
      closeTimingOverlayAfterStateReset();
    });
    requestAnimationFrame(() => {
      if (epoch !== resetEpoch) return;
      resetSingleTimingVisuals();
      resetABTimingVisuals();
      closeTimingOverlayAfterStateReset();
    });

    document.documentElement.dataset.luneaTimingBoundary = reason;
  }

  function installStartSpreadBoundary() {
    const current = W.startSpread;
    if (typeof current !== 'function') return false;
    if (current.__luneaReadingBoundaryV31) {
      startWrapped = current;
      return true;
    }
    if (current === startWrapped) return true;

    function wrappedStartSpread(...args) {
      resetTimingBoundary('start-spread');
      return current.apply(this, args);
    }
    wrappedStartSpread.__luneaReadingBoundaryV31 = true;
    wrappedStartSpread.__luneaReadingBoundaryV31Original = current;
    W.startSpread = wrappedStartSpread;
    startWrapped = wrappedStartSpread;
    return true;
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
      resetTimingBoundary('question-change');
    }).observe(question, {childList:true, subtree:true, characterData:true});
    return true;
  }

  function isDirectReadingBoundaryButton(btn) {
    if (!btn) return false;

    // These paths can render/restore cards without calling startSpread.
    if (btn.id === 'dailyBtn' || btn.id === 'luneaDraftRestore' || btn.id === 'retry') return true;

    // Manual spreads (both <=12 and the V17 13-20 extension) own drawBtn and
    // render directly. Fixed/AI drawBtn paths already go through startSpread,
    // so avoid clearing a current Timing result merely for opening AI preview.
    if (btn.id === 'drawBtn') {
      try { if (state?.__luneaManualMode) return true; } catch {}
    }

    const text = clean(btn.textContent);
    return /다시\s*뽑기|새\s*리딩|새\s*질문/.test(text);
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
    installStartSpreadBoundary();
    observeSpreadQuestion();

    // Timing Oracle and several older LUNEA modules install their own
    // startSpread wrappers after the structural loader. Re-check briefly so
    // V31 stays the outer boundary guard after all wrappers settle.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      installStartSpreadBoundary();
      observeSpreadQuestion();
      if (tries >= 80) clearInterval(timer);
    }, 100);
  }

  W.LUNEA_READING_BOUNDARY_V31 = {
    version: 31.1,
    resetTimingBoundary,
    resetSingleTimingClosureState,
    resetSingleTimingVisuals,
    resetABTimingVisuals
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
