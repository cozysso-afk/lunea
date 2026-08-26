'use strict';

/*
  LUNEA SHEET SCROLL FIX V1
  =========================
  iOS/PWA-safe scrolling for the tall bottom sheet.

  - Keeps the fixed bottom-sheet design.
  - Gives the sheet its own viewport-bounded vertical scroll area.
  - Prevents the page behind the sheet from scrolling while it is open.
  - Does not alter spread logic, form values, RNG, or overlays.
*/
(() => {
  const W = window;
  if (W.__LUNEA_SHEET_SCROLL_FIX_V1__) return;
  W.__LUNEA_SHEET_SCROLL_FIX_V1__ = true;

  const $ = id => document.getElementById(id);

  function addStyles() {
    if ($('luneaSheetScrollFixStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaSheetScrollFixStyle';
    style.textContent = `
      .sheet{
        max-height:calc(100dvh - max(10px, env(safe-area-inset-top)));
        overflow-x:hidden;
        overflow-y:auto;
        -webkit-overflow-scrolling:touch;
        overscroll-behavior:contain;
        touch-action:pan-y;
        scroll-padding-top:14px;
        scroll-padding-bottom:calc(36px + env(safe-area-inset-bottom));
      }
      .sheet.open{touch-action:pan-y}
      .sheet::-webkit-scrollbar{width:0;height:0}
      body.lunea-sheet-open{overflow:hidden!important;overscroll-behavior:none!important}
      #luneaManualPanel textarea,
      #luneaManualPanel input,
      #luneaManualPanel select{touch-action:auto}
      @media(max-width:520px){
        .sheet{
          max-height:calc(100dvh - max(8px, env(safe-area-inset-top)));
          padding-bottom:calc(34px + env(safe-area-inset-bottom));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    const sheet = $('sheet');
    if (!sheet || sheet.__luneaScrollFixed) return !!sheet;
    sheet.__luneaScrollFixed = true;

    let wasOpen = sheet.classList.contains('open');
    const sync = () => {
      const isOpen = sheet.classList.contains('open');
      document.body.classList.toggle('lunea-sheet-open', isOpen);
      if (isOpen && !wasOpen) {
        requestAnimationFrame(() => { sheet.scrollTop = 0; });
      }
      wasOpen = isOpen;
    };

    new MutationObserver(sync).observe(sheet, {attributes:true, attributeFilter:['class']});

    document.addEventListener('touchmove', event => {
      if (!sheet.classList.contains('open')) return;
      if (!sheet.contains(event.target)) event.preventDefault();
    }, {passive:false});

    window.addEventListener('pagehide', () => document.body.classList.remove('lunea-sheet-open'));
    sync();
    return true;
  }

  function boot() {
    addStyles();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 80) clearInterval(timer);
    }, 80);
    install();
    console.info('📜 LUNEA Sheet Scroll Fix V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
