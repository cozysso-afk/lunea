'use strict';

/* LUNEA HORARY MOBILE STABILITY V42 — iOS modal position + scroll lock */
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_MOBILE_STABILITY_V42__) return;
  W.__LUNEA_HORARY_MOBILE_STABILITY_V42__ = true;
  const RELEASE = '42.0';
  let locked = false;
  let savedY = 0;
  let saved = null;

  function addStyle() {
    if (document.getElementById('luneaHoraryMobileStabilityV42Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryMobileStabilityV42Style';
    style.textContent = `
      #astroHoraryOverlay.show{
        position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;
        align-items:flex-start!important;justify-content:center!important;
        overflow:hidden!important;overscroll-behavior:none!important;
        padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important;
      }
      #astroHoraryOverlay .horary-modal{
        position:relative!important;top:0!important;left:auto!important;right:auto!important;
        transform:none!important;margin:0 auto!important;width:100%!important;max-width:448px!important;
        max-height:calc(100dvh - max(24px,env(safe-area-inset-top)) - max(24px,env(safe-area-inset-bottom)))!important;
        overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;
        overscroll-behavior:contain!important;overflow-anchor:none!important;touch-action:pan-y!important;
        scroll-behavior:auto!important;
      }
      #astroHoraryOverlay .horary-modal textarea,#astroHoraryOverlay .horary-modal input,#astroHoraryOverlay .horary-modal select{
        scroll-margin-top:88px!important;
      }
      html.lunea-horary-v42-locked,html.lunea-horary-v42-locked body{overscroll-behavior:none!important}
    `;
    document.head.appendChild(style);
  }

  function lockPage() {
    if (locked) return;
    const body = document.body;
    if (!body) return;
    locked = true;
    savedY = Math.max(0, W.scrollY || W.pageYOffset || 0);
    saved = {
      position:body.style.position, top:body.style.top, left:body.style.left,
      right:body.style.right, width:body.style.width, overflow:body.style.overflow
    };
    document.documentElement.classList.add('lunea-horary-v42-locked');
    body.style.position = 'fixed';
    body.style.top = `-${savedY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  function unlockPage() {
    if (!locked) return;
    const body = document.body;
    locked = false;
    document.documentElement.classList.remove('lunea-horary-v42-locked');
    if (body && saved) {
      body.style.position = saved.position;
      body.style.top = saved.top;
      body.style.left = saved.left;
      body.style.right = saved.right;
      body.style.width = saved.width;
      body.style.overflow = saved.overflow;
    }
    const y = savedY;
    saved = null;
    requestAnimationFrame(() => W.scrollTo?.(0, y));
  }

  function sync(overlay) {
    if (!overlay) return;
    if (overlay.classList.contains('show')) lockPage();
    else unlockPage();
  }

  function bindOverlay() {
    const overlay = document.getElementById('astroHoraryOverlay');
    if (!overlay || overlay.__luneaHoraryV42Observed) return !!overlay;
    overlay.__luneaHoraryV42Observed = true;
    new MutationObserver(() => sync(overlay)).observe(overlay, {attributes:true, attributeFilter:['class']});
    sync(overlay);
    return true;
  }

  function boot() {
    addStyle();
    if (!bindOverlay()) {
      const observer = new MutationObserver(() => { if (bindOverlay()) observer.disconnect(); });
      observer.observe(document.documentElement, {childList:true, subtree:true});
    }
    W.addEventListener?.('pagehide', unlockPage, {passive:true});
    W.LUNEA_HORARY_MOBILE_STABILITY_V42 = Object.freeze({version:RELEASE, lockPage, unlockPage});
    console.info('☿ LUNEA Horary mobile stability V42 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
