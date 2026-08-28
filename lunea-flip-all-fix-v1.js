'use strict';

/*
  LUNEA FLIP ALL FIX V2
  =====================
  Keeps the action-bar flip button consistent and reveals the current reading
  as a soft left-to-right sequence instead of flipping every card at once.

  - 110ms stagger between visible cards
  - existing single-card flipAt behavior remains the source of truth
  - Structural V4 future pages are still marked revealed after the visible sweep
  - guards against rapid double taps while a sweep is running
*/
(() => {
  const W = window;
  if (W.__LUNEA_FLIP_ALL_FIX_V2__) return;
  W.__LUNEA_FLIP_ALL_FIX_V2__ = true;

  const $ = id => document.getElementById(id);
  const GAP = 110;
  let running = false;

  function getState() {
    try { return state; } catch { return null; }
  }

  function labelFor(s) {
    const n = Array.isArray(s?.drawn) ? s.drawn.length : 0;
    return running ? '✦ 카드를 여는 중…' : (n ? `✦ 전체 ${n}장 뒤집기` : '✦ 전체 뒤집기');
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
    btn.disabled = running;
    btn.setAttribute('aria-busy', running ? 'true' : 'false');
  }

  function flipVisibleIndex(i) {
    const card = $('card-' + i);
    if (!card || card.classList.contains('flipped')) return false;
    try {
      const fn = W.flipAt || flipAt;
      fn(i);
    } catch {
      card.classList.add('flipped');
    }
    return true;
  }

  function visibleIndexes() {
    const mounted = [...document.querySelectorAll('#cards .tarot-card-wrapper')];
    const indexes = [];
    mounted.forEach((wrapper, order) => {
      const raw = wrapper.dataset?.index;
      const parsed = raw == null || raw === '' ? order : Number(raw);
      if (Number.isInteger(parsed) && $('card-' + parsed) && !$('card-' + parsed).classList.contains('flipped')) indexes.push(parsed);
    });
    return [...new Set(indexes)];
  }

  function finishSweep(s, pg) {
    // Structural V4 may render large spreads page by page. Once the mounted
    // page has finished its visible sweep, mark the remaining indexes revealed
    // so later pages arrive face-up, matching the original "flip all" contract.
    if (pg?.flipped instanceof Set) s.drawn.forEach((_, i) => pg.flipped.add(i));
    running = false;
    syncLabel();
  }

  function flipEverything() {
    const s = getState();
    if (running || !s || !Array.isArray(s.drawn) || !s.drawn.length) return;

    clearStalePagerForManual(s);
    const pg = s.__luneaStructuralV4Page;
    const indexes = visibleIndexes();

    if (!indexes.length) {
      if (pg?.flipped instanceof Set) s.drawn.forEach((_, i) => pg.flipped.add(i));
      syncLabel();
      return;
    }

    running = true;
    syncLabel();

    indexes.forEach((i, order) => {
      setTimeout(() => {
        flipVisibleIndex(i);
        if (order === indexes.length - 1) {
          // Give the final card a tiny beat before restoring the control.
          setTimeout(() => finishSweep(s, pg), 180);
        }
      }, order * GAP);
    });
  }

  function install() {
    const btn = $('flipAll');
    const cards = $('cards');
    const overlay = $('spreadOverlay');
    if (!btn || !cards || !overlay) return false;
    if (btn.dataset.luneaFlipAllFixV2 === '1') return true;
    btn.dataset.luneaFlipAllFixV2 = '1';

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
    console.info('✦ LUNEA Flip All Fix V2 loaded · 110ms sequential reveal');
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
