'use strict';

/*
  LUNEA SHEET SCROLL FIX V1
  =========================
  iOS/PWA-safe scrolling for the tall bottom sheet.

  - Keeps the fixed bottom-sheet design.
  - Gives the sheet its own viewport-bounded vertical scroll area.
  - Prevents the page behind the sheet from scrolling while it is open.
  - Adds a persistent top-right close button without clearing form values.
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
      #luneaSheetClose{
        position:sticky;
        top:0;
        float:right;
        z-index:20;
        width:38px;
        height:38px;
        margin:-8px -4px 4px 8px;
        padding:0;
        border:1px solid rgba(189,164,248,.24);
        border-radius:50%;
        background:rgba(18,14,28,.92);
        color:#d8cff0;
        font-size:28px;
        font-weight:300;
        line-height:34px;
        text-align:center;
        cursor:pointer;
        box-shadow:0 5px 18px rgba(0,0,0,.28);
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        touch-action:manipulation;
      }
      #luneaSheetClose:active{transform:scale(.94)}
      @media(max-width:520px){
        .sheet{
          max-height:calc(100dvh - max(8px, env(safe-area-inset-top)));
          padding-bottom:calc(34px + env(safe-area-inset-bottom));
        }
        #luneaSheetClose{width:40px;height:40px;font-size:29px;line-height:36px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCloseButton(sheet) {
    let button = $('luneaSheetClose');
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'luneaSheetClose';
    button.setAttribute('aria-label', '창 닫기');
    button.title = '닫기';
    button.textContent = '×';
    sheet.insertAdjacentElement('afterbegin', button);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      sheet.classList.remove('open');
      document.body.classList.remove('lunea-sheet-open');
      button.blur();
    });
    return button;
  }

  function install() {
    const sheet = $('sheet');
    if (!sheet) return false;
    ensureCloseButton(sheet);
    if (sheet.__luneaScrollFixed) return true;
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
