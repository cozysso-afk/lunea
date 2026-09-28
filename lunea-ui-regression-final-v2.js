'use strict';

/* LUNEA UI REGRESSION FINAL V2
   Final mobile visual owner loaded after V43/V57.
   - Timing: ivory inline result, uploaded card art only, readable text.
   - Timing: iOS/PWA nested-scroll repair for the full-screen Timing modal.
   - Horary: iOS datetime-local intrinsic-width normalization.
   - Journal: mobile verification controls and date fields fit modern iPhone widths.
*/
(() => {
  const W = window;
  if (W.__LUNEA_UI_REGRESSION_FINAL_V2__) return;
  W.__LUNEA_UI_REGRESSION_FINAL_V2__ = true;
  document.documentElement.classList.add('lunea-ui-regression-final-v2');

  const $ = id => document.getElementById(id);

  function addStyle() {
    if ($('luneaUiRegressionFinalV2Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaUiRegressionFinalV2Style';
    style.textContent = `
      html.lunea-ui-regression-final-v2 #luneaTimingInline.timing-inline{
        display:grid!important;grid-template-columns:88px minmax(0,1fr)!important;gap:14px!important;align-items:center!important;
        width:100%!important;max-width:none!important;min-height:0!important;height:auto!important;margin:11px 0 14px!important;padding:14px!important;
        border-radius:21px!important;overflow:hidden!important;text-align:left!important;color:#403346!important;
        border:1px solid rgba(199,158,84,.34)!important;background:linear-gradient(145deg,#fff8ed 0%,#f7f0eb 48%,#eee8f8 100%)!important;
        box-shadow:0 8px 22px rgba(66,47,72,.12)!important;
      }
      html.lunea-ui-regression-final-v2 #luneaTimingInline.timing-inline::before{content:none!important;display:none!important;width:0!important;height:0!important;min-width:0!important;min-height:0!important}
      html.lunea-ui-regression-final-v2 #luneaTimingInline.timing-inline > img{
        display:block!important;grid-column:1!important;grid-row:1!important;width:88px!important;max-width:88px!important;height:auto!important;aspect-ratio:3/5!important;
        margin:0!important;border:1px solid rgba(199,158,84,.32)!important;border-radius:12px!important;object-fit:cover!important;object-position:center!important;
        opacity:1!important;visibility:visible!important;filter:none!important;box-shadow:0 7px 18px rgba(67,50,73,.16)!important;
      }
      html.lunea-ui-regression-final-v2 #luneaTimingInline .txt{display:block!important;grid-column:2!important;grid-row:1!important;min-width:0!important;width:auto!important;text-align:left!important}
      html.lunea-ui-regression-final-v2 #luneaTimingInline .txt small{display:block!important;margin:0 0 5px!important;color:#9e7d47!important;opacity:1!important;font-size:9px!important;line-height:1.35!important;letter-spacing:1.25px!important}
      html.lunea-ui-regression-final-v2 #luneaTimingInline .txt b{display:block!important;margin:0 0 7px!important;color:#403346!important;opacity:1!important;font-size:17px!important;line-height:1.35!important;word-break:keep-all!important}
      html.lunea-ui-regression-final-v2 #luneaTimingInline .txt span{display:block!important;color:#756a79!important;opacity:1!important;font-size:11.5px!important;line-height:1.58!important;word-break:keep-all!important}

      html.lunea-ui-regression-final-v2 #timingOverlay .timing-modal{color:#3a3042!important;background:linear-gradient(rgba(255,252,248,.95),rgba(255,250,247,.97)),url('./bg.png') center top/cover no-repeat!important}
      html.lunea-ui-regression-final-v2 #timingOverlay .sub{color:#9d7d4a!important}
      html.lunea-ui-regression-final-v2 #timingOverlay .modal-h{color:#3c3344!important}
      html.lunea-ui-regression-final-v2 #timingOverlay .timing-help{color:#7d7182!important}
      html.lunea-ui-regression-final-v2 #timingDraw{pointer-events:auto!important;touch-action:manipulation!important;color:#4a3b51!important}

      /* iOS/PWA: body.modal-open uses touch-action:none. That blocks the nested
         Timing scroller even when the child itself says pan-y. While Timing is
         visible, explicitly unlock vertical panning on the body and give the
         inner flex scroller a definite height. */
      body.lunea-timing-overlay-open{overflow:hidden!important;touch-action:pan-y!important}
      html.lunea-ui-regression-final-v2 #timingOverlay.show{overflow:hidden!important;touch-action:pan-y!important}
      html.lunea-ui-regression-final-v2 #timingOverlay.show .timing-modal{
        display:flex!important;flex-direction:column!important;box-sizing:border-box!important;
        height:calc(100dvh - 24px)!important;max-height:calc(100dvh - 24px)!important;
        overflow:hidden!important;touch-action:pan-y!important;
      }
      html.lunea-ui-regression-final-v2 #timingOverlay.show .timing-modal-header{flex:0 0 auto!important;min-height:0!important}
      html.lunea-ui-regression-final-v2 #timingOverlay.show .timing-scroll-body{
        flex:1 1 0!important;height:0!important;min-height:0!important;max-height:none!important;
        overflow-x:hidden!important;overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;
        touch-action:pan-y!important;overscroll-behavior-y:contain!important;
        padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;
      }
      @supports not (height:100dvh){
        html.lunea-ui-regression-final-v2 #timingOverlay.show .timing-modal{height:calc(100vh - 24px)!important;max-height:calc(100vh - 24px)!important}
      }

      html.lunea-ui-regression-final-v2 #astroHoraryOverlay .horary-modal,
      html.lunea-ui-regression-final-v2 #astroHoraryOverlay .horary-grid,
      html.lunea-ui-regression-final-v2 #astroHoraryOverlay .horary-grid > *,
      html.lunea-ui-regression-final-v2 #astroHoraryOverlay .field,
      html.lunea-ui-regression-final-v2 #astroHoraryOverlay .lunea-horary-place-row-v39{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
      html.lunea-ui-regression-final-v2 #astroHoraryOverlay .horary-grid{width:100%!important;grid-template-columns:minmax(0,1fr)!important}
      html.lunea-ui-regression-final-v2 #astroHoraryMoment{
        -webkit-appearance:none!important;appearance:none!important;display:block!important;box-sizing:border-box!important;inline-size:100%!important;width:100%!important;
        min-inline-size:0!important;min-width:0!important;max-inline-size:100%!important;max-width:100%!important;padding-left:14px!important;padding-right:14px!important;
        border-radius:12px!important;background-image:none!important;text-align:center!important;overflow:hidden!important;font-size:16px!important;
      }
      html.lunea-ui-regression-final-v2 #astroHoraryMoment::-webkit-calendar-picker-indicator{display:none!important;opacity:0!important;width:0!important;min-width:0!important;max-width:0!important;margin:0!important;padding:0!important}
      html.lunea-ui-regression-final-v2 #astroHoraryMoment::-webkit-date-and-time-value{display:block!important;box-sizing:border-box!important;margin:0!important;padding:0!important;width:100%!important;min-width:0!important;max-width:100%!important;text-align:center!important}
      html.lunea-ui-regression-final-v2 #astroHoraryPlace,
      html.lunea-ui-regression-final-v2 #astroHoraryTopic,
      html.lunea-ui-regression-final-v2 #luneaHoraryManualModeV38{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important}

      /* Journal verification: the old 390px breakpoint misses 393/402/430px
         iPhones, leaving the two native date controls cramped/overlapping. */
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-review,
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-grid,
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-grid > *,
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-field{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
      html.lunea-ui-regression-final-v2 #archiveOverlay .lj-field input[type="date"]{box-sizing:border-box!important;display:block!important;width:100%!important;min-width:0!important;max-width:100%!important}

      @media(max-width:430px){
        html.lunea-ui-regression-final-v2 #archiveOverlay .lj-statuses{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
        html.lunea-ui-regression-final-v2 #archiveOverlay .lj-statuses button{min-width:0!important;min-height:36px!important;padding:7px 4px!important;font-size:8.6px!important;white-space:nowrap!important}
        html.lunea-ui-regression-final-v2 #archiveOverlay .lj-grid{grid-template-columns:minmax(0,1fr)!important;gap:0!important}
        html.lunea-ui-regression-final-v2 #archiveOverlay .lj-grid .lj-field{width:100%!important;overflow:hidden!important}
        html.lunea-ui-regression-final-v2 #archiveOverlay .lj-grid .lj-field input[type="date"]{
          height:40px!important;min-height:40px!important;padding:7px 10px!important;font-size:11px!important;line-height:1.2!important;
        }
        html.lunea-ui-regression-final-v2 #archiveOverlay .lj-grid .lj-field input[type="date"]::-webkit-date-and-time-value{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;text-align:left!important}

        html.lunea-ui-regression-final-v2 #luneaTimingInline.timing-inline{grid-template-columns:78px minmax(0,1fr)!important;gap:12px!important;min-height:0!important;padding:13px!important;text-align:left!important}
        html.lunea-ui-regression-final-v2 #luneaTimingInline.timing-inline > img{width:78px!important;max-width:78px!important}
        html.lunea-ui-regression-final-v2 #luneaTimingInline .txt b{font-size:16px!important}
        html.lunea-ui-regression-final-v2 #luneaTimingInline .txt span{font-size:11px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function stabilizeTimingTap() {
    const button = $('timingDraw');
    if (!button || button.__luneaFinalV2Tap) return !!button;
    button.__luneaFinalV2Tap = true;
    button.style.touchAction = 'manipulation';
    button.addEventListener('pointerdown', () => {
      const active = document.activeElement;
      if (active && active !== button && active.closest?.('#timingOverlay') && /^(TEXTAREA|INPUT|SELECT)$/.test(active.tagName)) {
        try { active.blur(); } catch {}
      }
    }, {capture:true, passive:true});
    return true;
  }

  function stabilizeTimingScroll() {
    const overlay = $('timingOverlay');
    if (!overlay) return false;
    const open = overlay.classList.contains('show');
    document.body?.classList.toggle('lunea-timing-overlay-open', open);
    const scroller = $('timingScrollBody');
    if (open && scroller) {
      scroller.style.setProperty('overflow-y', 'scroll', 'important');
      scroller.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
      scroller.style.setProperty('touch-action', 'pan-y', 'important');
    }
    return true;
  }

  function revealTimingResult() {
    const overlay = $('timingOverlay');
    const flip = $('timingFlip');
    const inner = $('timingInner');
    const result = $('timingResult');
    const actions = $('timingActions');
    const image = $('timingImage');
    if (!overlay?.classList.contains('show') || !flip || !inner || !result || !actions || !image) return false;
    if (!String(result.innerHTML || '').trim() || !String(image.getAttribute('src') || '').trim()) return false;

    flip.classList.add('show');
    result.classList.add('show');
    actions.classList.add('show');
    inner.style.transition = 'none';
    inner.classList.remove('flipped');
    void inner.offsetWidth;
    inner.style.removeProperty('transition');

    setTimeout(() => {
      if (!overlay.classList.contains('show')) return;
      inner.classList.add('flipped');
      const scroller = $('timingScrollBody');
      if (scroller && flip.offsetParent) {
        const target = Math.max(0, flip.offsetTop - 18);
        try { scroller.scrollTo({top:target, behavior:'smooth'}); } catch { scroller.scrollTop = target; }
      } else {
        try { flip.scrollIntoView({block:'center', behavior:'smooth'}); } catch { try { flip.scrollIntoView(); } catch {} }
      }
    }, 120);
    return true;
  }

  function stabilizeTimingResult() {
    const result = $('timingResult');
    const image = $('timingImage');
    if (!result || !image) return false;
    if (!result.__luneaFinalV2Observed) {
      result.__luneaFinalV2Observed = true;
      new MutationObserver(() => requestAnimationFrame(revealTimingResult)).observe(result, {childList:true, subtree:true, characterData:true});
    }
    if (!image.__luneaFinalV2Observed) {
      image.__luneaFinalV2Observed = true;
      new MutationObserver(() => requestAnimationFrame(revealTimingResult)).observe(image, {attributes:true, attributeFilter:['src']});
    }
    return true;
  }

  function normalizeHoraryMoment() {
    const input = $('astroHoraryMoment');
    if (!input) return false;
    input.style.setProperty('width', '100%', 'important');
    input.style.setProperty('min-width', '0', 'important');
    input.style.setProperty('max-width', '100%', 'important');
    input.style.setProperty('box-sizing', 'border-box', 'important');
    return true;
  }

  function apply() {
    addStyle();
    stabilizeTimingTap();
    stabilizeTimingScroll();
    stabilizeTimingResult();
    normalizeHoraryMoment();
  }

  function observe(id) {
    const node = $(id);
    if (!node || node.__luneaFinalV2Observed) return;
    node.__luneaFinalV2Observed = true;
    new MutationObserver(() => requestAnimationFrame(apply)).observe(node, {attributes:true, attributeFilter:['class'], childList:true, subtree:true});
  }

  function boot() {
    apply();
    observe('timingOverlay');
    observe('astroHoraryOverlay');
    [80,260,800,1800].forEach(ms => setTimeout(apply, ms));
    W.addEventListener?.('pageshow', () => setTimeout(apply, 40), {passive:true});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(apply, 40); });
    W.LUNEA_UI_REGRESSION_FINAL_V2 = Object.freeze({version:'2.3', apply, revealTimingResult, stabilizeTimingScroll});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();