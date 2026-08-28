'use strict';

/*
  LUNEA SHEET SCROLL FIX V2.3
  ===========================
  iOS/PWA-safe scrolling for the tall bottom sheet.

  - Keeps the fixed bottom-sheet design.
  - Gives the sheet its own viewport-bounded vertical scroll area.
  - Prevents the page behind the sheet from scrolling while it is open.
  - Keeps the close button inside the sheet header area instead of floating at viewport top-right.
  - Preserves an easy 44px-class touch target without clearing form values.
  - Does not alter spread logic, form values, RNG, or overlays.
*/
(() => {
  const W = window;
  if (W.__LUNEA_SHEET_SCROLL_FIX_V2__) return;
  W.__LUNEA_SHEET_SCROLL_FIX_V2__ = true;

  const $ = id => document.getElementById(id);

  function addStyles() {
    $('luneaSheetScrollFixStyle')?.remove();
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

      /* Close belongs to the sheet itself — no more detached viewport X. */
      #luneaSheetClose{
        display:none;
        position:absolute;
        top:13px;
        right:14px;
        z-index:18;
        width:40px;
        height:40px;
        padding:0;
        border:1px solid rgba(220,213,244,.18);
        border-radius:50%;
        background:
          radial-gradient(circle at 34% 26%,rgba(255,255,255,.09),transparent 30%),
          linear-gradient(145deg,rgba(34,34,59,.86),rgba(16,18,35,.91));
        color:#e7e5ef;
        font-size:21px;
        font-weight:300;
        line-height:1;
        place-items:center;
        cursor:pointer;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.07),
          0 7px 18px rgba(0,0,0,.24),
          0 0 16px rgba(164,143,224,.055);
        -webkit-backdrop-filter:blur(12px);
        backdrop-filter:blur(12px);
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      .sheet.open #luneaSheetClose{display:grid}
      #luneaSheetClose:active{transform:scale(.95)}
      #sheet>.sub{padding-right:48px!important}
      #sheet>.sheet-title{padding-right:48px!important}

      @media(max-width:520px){
        .sheet{
          max-height:calc(100dvh - max(8px, env(safe-area-inset-top)));
          padding-bottom:calc(34px + env(safe-area-inset-bottom));
        }
        #luneaSheetClose{
          top:12px;
          right:13px;
          width:40px;
          height:40px;
          font-size:21px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCloseButton(sheet) {
    let button = $('luneaSheetClose');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'luneaSheetClose';
      button.setAttribute('aria-label', '시트 닫기');
      button.title = '닫기';
      button.textContent = '×';
      sheet.appendChild(button);
    } else if (button.parentElement !== sheet) {
      sheet.appendChild(button);
    }

    if (!button.__luneaCloseBound) {
      button.__luneaCloseBound = true;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        sheet.classList.remove('open');
        document.body.classList.remove('lunea-sheet-open');
        button.blur();
      });
    }
    return button;
  }

  function install() {
    const sheet = $('sheet');
    if (!sheet) return false;
    ensureCloseButton(sheet);

    if (!sheet.__luneaScrollFixedV2) {
      sheet.__luneaScrollFixedV2 = true;
      let wasOpen = sheet.classList.contains('open');
      const sync = () => {
        const isOpen = sheet.classList.contains('open');
        document.body.classList.toggle('lunea-sheet-open', isOpen);
        ensureCloseButton(sheet);
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
    }
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
    console.info('📜 LUNEA Sheet Scroll Fix V2.3 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
