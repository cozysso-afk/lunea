'use strict';

/* LUNEA Timing Scroll Fix V1
   iOS/PWA nested-scroll repair for Timing Oracle.
   The base app locks body.modal-open with touch-action:none, while Timing uses
   an inner flex scroller. On iOS that ancestor lock can cancel the pan gesture.
   This module gives the Timing overlay an explicit viewport height and owns the
   body touch-action only while Timing is visible.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_SCROLL_FIX_V1__) return;
  W.__LUNEA_TIMING_SCROLL_FIX_V1__ = true;

  const STYLE_ID = 'luneaTimingScrollFixV1Style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.lunea-timing-overlay-open{
        overflow:hidden!important;
        touch-action:pan-y!important;
      }
      #timingOverlay.show{
        overflow:hidden!important;
        touch-action:pan-y!important;
      }
      #timingOverlay.show .timing-modal{
        display:flex!important;
        flex-direction:column!important;
        box-sizing:border-box!important;
        height:calc(100dvh - 24px)!important;
        max-height:calc(100dvh - 24px)!important;
        overflow:hidden!important;
        touch-action:pan-y!important;
      }
      #timingOverlay.show .timing-modal-header{
        flex:0 0 auto!important;
        min-height:0!important;
      }
      #timingOverlay.show .timing-scroll-body{
        flex:1 1 0!important;
        height:0!important;
        min-height:0!important;
        max-height:none!important;
        overflow-x:hidden!important;
        overflow-y:scroll!important;
        -webkit-overflow-scrolling:touch!important;
        touch-action:pan-y!important;
        overscroll-behavior-y:contain!important;
        padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;
      }
      #timingOverlay.show .timing-scroll-body > *{
        touch-action:auto;
      }
      @supports not (height:100dvh){
        #timingOverlay.show .timing-modal{
          height:calc(100vh - 24px)!important;
          max-height:calc(100vh - 24px)!important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function sync() {
    addStyle();
    const overlay = document.getElementById('timingOverlay');
    const open = !!overlay?.classList.contains('show');
    document.body?.classList.toggle('lunea-timing-overlay-open', open);

    const scroller = document.getElementById('timingScrollBody');
    if (open && scroller) {
      scroller.style.setProperty('overflow-y', 'scroll', 'important');
      scroller.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
      scroller.style.setProperty('touch-action', 'pan-y', 'important');
    }
    return open;
  }

  function install() {
    addStyle();
    const overlay = document.getElementById('timingOverlay');
    if (!overlay) return false;
    if (!overlay.__luneaTimingScrollFixV1Observed) {
      overlay.__luneaTimingScrollFixV1Observed = true;
      new MutationObserver(() => requestAnimationFrame(sync)).observe(overlay, {
        attributes:true,
        attributeFilter:['class']
      });
    }
    sync();
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 120) clearInterval(timer);
  }, 80);

  W.addEventListener('pageshow', () => setTimeout(sync, 40), {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(sync, 40);
  });

  install();
  W.LUNEA_TIMING_SCROLL_FIX_V1 = Object.freeze({version:'1.0', sync});
})();
