'use strict';

/*
  LUNEA FLIP ALL FIX V1
  =====================
  Restores the action-bar flip button to one consistent meaning:
  flip every card in the current reading.

  Fixes stale Structural V4 page state leaking into Manual / restored readings,
  where the button could keep saying e.g. "현재 2장 전체 뒤집기" even when
  the current reading had 6 or 12 cards.
*/
(() => {
  const W = window;
  if (W.__LUNEA_FLIP_ALL_FIX_V1__) return;
  W.__LUNEA_FLIP_ALL_FIX_V1__ = true;

  const $ = id => document.getElementById(id);

  function getState() {
    try { return state; } catch { return null; }
  }

  function labelFor(s) {
    const n = Array.isArray(s?.drawn) ? s.drawn.length : 0;
    return n ? `✦ 전체 ${n}장 뒤집기` : '✦ 전체 뒤집기';
  }

  function clearStalePagerForManual(s) {
    if (!s?.__luneaManualReading) return;
    if (s.__luneaStructuralV4Page) {
      try { delete s.__luneaStructuralV4Page; } catch { s.__luneaStructuralV4Page = null; }
    }
    $('luneaStructuralV4Pager')?.classList.remove('show');
  }

  function syncLabel() {
    const btn = $('flipAll');
    const s = getState();
    if (!btn || !s) return;
    clearStalePagerForManual(s);
    btn.textContent = labelFor(s);
  }

  function flipVisibleIndex(i) {
    const card = $('card-' + i);
    if (!card || card.classList.contains('flipped')) return;
    try {
      const fn = W.flipAt || flipAt;
      fn(i);
    } catch {
      card.classList.add('flipped');
    }
  }

  function flipEverything() {
    const s = getState();
    if (!s || !Array.isArray(s.drawn) || !s.drawn.length) return;

    clearStalePagerForManual(s);
    const pg = s.__luneaStructuralV4Page;

    // Structural V4 large spreads render only one page at a time. Mark every
    // index as revealed so future pages also open face-up, then animate the
    // currently mounted cards only.
    if (pg?.flipped instanceof Set) {
      s.drawn.forEach((_, i) => pg.flipped.add(i));
      document.querySelectorAll('#cards .tarot-card-wrapper[data-index]').forEach(wrapper => {
        const i = Number(wrapper.dataset.index);
        if (Number.isInteger(i)) flipVisibleIndex(i);
      });
    } else {
      s.drawn.forEach((_, i) => flipVisibleIndex(i));
    }

    requestAnimationFrame(syncLabel);
  }

  function install() {
    const btn = $('flipAll');
    const cards = $('cards');
    const overlay = $('spreadOverlay');
    if (!btn || !cards || !overlay) return false;
    if (btn.dataset.luneaFlipAllFixV1 === '1') return true;
    btn.dataset.luneaFlipAllFixV1 = '1';

    // Capture phase intentionally outranks stale .onclick handlers left by the
    // Structural V4 page renderer.
    document.addEventListener('click', event => {
      const target = event.target?.closest?.('#flipAll');
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      flipEverything();
    }, true);

    const observer = new MutationObserver(() => queueMicrotask(syncLabel));
    observer.observe(cards, {childList:true, subtree:false});
    observer.observe(overlay, {attributes:true, attributeFilter:['class']});

    window.addEventListener('pageshow', () => setTimeout(syncLabel, 0));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(syncLabel, 0);
    });

    syncLabel();
    console.info('✦ LUNEA Flip All Fix V1 loaded · whole-reading flip restored');
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 120) clearInterval(timer);
    }, 50);
    install();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
