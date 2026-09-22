'use strict';

/* LUNEA HORARY RETURN STACK V1
   When Horary is opened from an active tarot reading, closing Horary must
   return to that reading instead of exposing Home. Standalone Horary still
   closes to Home as before.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_RETURN_STACK_V1__) return;
  W.__LUNEA_HORARY_RETURN_STACK_V1__ = true;

  const $ = id => document.getElementById(id);
  let armed = false;
  let spreadScrollTop = 0;

  function spreadIsActive() {
    return !!$('spreadOverlay')?.classList.contains('show');
  }

  function armFromTarot(event) {
    const button = event.target?.closest?.('#astroHoraryBtn');
    if (!button || !spreadIsActive()) return;

    armed = true;
    const spread = $('spreadOverlay');
    spreadScrollTop = spread?.querySelector('.modal')?.scrollTop || 0;

    // The Horary overlay may be injected a moment later; mark it again from
    // the class observer when it becomes visible.
    const horary = $('astroHoraryOverlay');
    if (horary) horary.dataset.luneaReturnToSpread = '1';
    requestAnimationFrame(installOverlayObserver);
  }

  function restoreSpreadIfNeeded() {
    const horary = $('astroHoraryOverlay');
    if (!horary || horary.classList.contains('show')) return false;

    const shouldReturn = armed || horary.dataset.luneaReturnToSpread === '1';
    if (!shouldReturn) return false;

    const spread = $('spreadOverlay');
    armed = false;
    delete horary.dataset.luneaReturnToSpread;
    if (!spread) return false;

    spread.classList.add('show');
    spread.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const modal = spread.querySelector('.modal');
    if (modal) {
      requestAnimationFrame(() => {
        modal.scrollTop = spreadScrollTop;
      });
    }
    return true;
  }

  function syncHoraryState() {
    const horary = $('astroHoraryOverlay');
    if (!horary) return;

    if (horary.classList.contains('show')) {
      if (armed) horary.dataset.luneaReturnToSpread = '1';
      return;
    }
    restoreSpreadIfNeeded();
  }

  function installOverlayObserver() {
    const horary = $('astroHoraryOverlay');
    if (!horary) return false;
    if (horary.__luneaReturnStackObserved) return true;

    horary.__luneaReturnStackObserved = true;
    new MutationObserver(() => requestAnimationFrame(syncHoraryState)).observe(horary, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncHoraryState();
    return true;
  }

  function boot() {
    document.addEventListener('click', armFromTarot, true);

    if (!installOverlayObserver()) {
      const observer = new MutationObserver(() => {
        if (installOverlayObserver()) observer.disconnect();
      });
      observer.observe(document.documentElement, {childList:true, subtree:true});
    }

    W.addEventListener('pageshow', () => setTimeout(installOverlayObserver, 40), {passive:true});
    W.LUNEA_HORARY_RETURN_STACK_V1 = Object.freeze({
      version:'1.0',
      restore:restoreSpreadIfNeeded,
      sync:syncHoraryState
    });
    console.info('☿ LUNEA Horary return stack V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
