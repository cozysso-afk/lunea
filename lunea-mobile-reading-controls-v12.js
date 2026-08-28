'use strict';

/*
  LUNEA MOBILE READING CONTROLS V12
  ---------------------------------
  Visual/mobile usability patch only.
  - replaces the horizontally scrolling tiny spread action chips with a stable action dock
  - larger touch targets and readable labels
  - mobile-friendly Timing inline card with a CSS Moon Dial visual (no blank legacy PNG thumbnail)
  - no RNG / reading / timing / archive / astrology logic changes
*/
(() => {
  if (window.__LUNEA_MOBILE_READING_CONTROLS_V12__) return;
  window.__LUNEA_MOBILE_READING_CONTROLS_V12__ = true;

  const style = document.createElement('style');
  style.id = 'luneaMobileReadingControlsV12Style';
  style.textContent = `
    /* =======================================================
       Spread result actions — stable, readable mobile dock
       ======================================================= */
    #spreadOverlay .actionbar{
      display:grid!important;
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:7px!important;
      width:100%!important;
      margin:10px 0 14px!important;
      padding:8px!important;
      overflow:visible!important;
      flex-wrap:initial!important;
      position:sticky!important;
      bottom:max(7px,env(safe-area-inset-bottom))!important;
      z-index:28!important;
      border:1px solid rgba(223,226,241,.12)!important;
      border-radius:19px!important;
      background:
        radial-gradient(circle at 15% 0%,rgba(168,143,226,.10),transparent 31%),
        linear-gradient(155deg,rgba(16,18,35,.94),rgba(7,9,20,.96))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.055),
        0 12px 30px rgba(0,0,0,.35),
        0 0 24px rgba(120,99,177,.055)!important;
      backdrop-filter:blur(18px)!important;
      -webkit-backdrop-filter:blur(18px)!important;
      scrollbar-width:none!important;
    }
    #spreadOverlay .actionbar::-webkit-scrollbar{display:none!important}
    #spreadOverlay .actionbar .mini{
      width:100%!important;
      min-width:0!important;
      min-height:46px!important;
      padding:8px 8px!important;
      border-radius:13px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      line-height:1.22!important;
      font-size:11.2px!important;
      font-weight:650!important;
      letter-spacing:-.08px!important;
      color:#e5e4ee!important;
      background:linear-gradient(145deg,rgba(255,255,255,.050),rgba(149,126,207,.025))!important;
      border:1px solid rgba(221,224,239,.11)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
      transform:none!important;
      transition:background .16s ease,border-color .16s ease,opacity .16s ease!important;
      touch-action:manipulation!important;
    }
    #spreadOverlay .actionbar .mini:active{
      transform:none!important;
      background:rgba(171,146,226,.105)!important;
      border-color:rgba(205,190,241,.22)!important;
    }
    #spreadOverlay .actionbar .mini:disabled{
      opacity:.44!important;
      transform:none!important;
    }
    #spreadOverlay .actionbar #aiRead{
      color:#f4efff!important;
      border-color:rgba(193,176,235,.19)!important;
      background:linear-gradient(145deg,rgba(157,129,217,.13),rgba(95,129,173,.07))!important;
    }
    #spreadOverlay .actionbar #extraCard{
      color:#e9f3f3!important;
      border-color:rgba(174,216,211,.15)!important;
    }

    /* Give the reading content enough breathing room around the sticky dock. */
    #spreadOverlay .modal{padding-bottom:calc(28px + env(safe-area-inset-bottom))!important}

    /* =======================================================
       Inline Timing signal — replace tiny/blank legacy image
       ======================================================= */
    #luneaTimingInline.timing-inline{
      width:100%!important;
      max-width:none!important;
      min-height:154px!important;
      margin:11px 0 14px!important;
      padding:14px 15px!important;
      border-radius:21px!important;
      display:grid!important;
      grid-template-columns:94px minmax(0,1fr)!important;
      gap:15px!important;
      align-items:center!important;
      text-align:left!important;
      position:relative!important;
      overflow:hidden!important;
      border:1px solid rgba(217,221,239,.14)!important;
      background:
        radial-gradient(circle at 14% 16%,rgba(165,139,226,.13),transparent 28%),
        radial-gradient(circle at 92% 78%,rgba(92,151,197,.09),transparent 31%),
        linear-gradient(151deg,rgba(18,21,41,.93),rgba(8,10,24,.96))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 12px 30px rgba(0,0,0,.20)!important;
    }
    #luneaTimingInline.timing-inline>img{display:none!important}
    #luneaTimingInline.timing-inline::before{
      content:'';
      display:block;
      width:88px;
      height:126px;
      border-radius:17px;
      justify-self:center;
      border:1px solid rgba(230,233,245,.25);
      background:
        radial-gradient(circle at 50% 44%,#f4f4f9 0 17%,#0d1022 18% 29%,transparent 30%),
        radial-gradient(circle at 50% 44%,transparent 0 35%,rgba(223,226,241,.27) 36% 37%,transparent 38% 49%,rgba(210,204,235,.14) 50% 51%,transparent 52%),
        radial-gradient(circle at 24% 18%,rgba(255,255,255,.72) 0 1px,transparent 1.5px),
        radial-gradient(circle at 77% 15%,rgba(211,221,246,.58) 0 1px,transparent 1.4px),
        radial-gradient(circle at 72% 71%,rgba(191,176,234,.55) 0 1px,transparent 1.4px),
        linear-gradient(155deg,#181b38 0%,#0c1025 57%,#080a18 100%);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.11),
        0 9px 22px rgba(0,0,0,.31),
        0 0 22px rgba(151,126,214,.09);
    }
    #luneaTimingInline .txt{min-width:0!important}
    #luneaTimingInline .txt small{
      display:block!important;
      margin-bottom:6px!important;
      color:#c8b8ef!important;
      font:700 9px 'Cinzel',serif!important;
      letter-spacing:1.55px!important;
    }
    #luneaTimingInline .txt b{
      display:block!important;
      margin:0 0 9px!important;
      color:#f7f6fb!important;
      font:650 18px/1.30 'Noto Serif KR',serif!important;
      letter-spacing:-.25px!important;
      word-break:keep-all!important;
    }
    #luneaTimingInline .txt span{
      display:block!important;
      color:#aaa9bc!important;
      font-size:11.5px!important;
      line-height:1.62!important;
      word-break:keep-all!important;
    }

    @media(max-width:390px){
      #spreadOverlay .actionbar{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:7px!important;
        padding:8px!important;
      }
      #spreadOverlay .actionbar .mini{
        min-height:48px!important;
        font-size:11.5px!important;
        padding:8px 9px!important;
      }

      #luneaTimingInline.timing-inline{
        min-height:0!important;
        grid-template-columns:1fr!important;
        gap:11px!important;
        padding:16px 15px 15px!important;
        text-align:center!important;
      }
      #luneaTimingInline.timing-inline::before{
        width:82px!important;
        height:116px!important;
      }
      #luneaTimingInline .txt small{font-size:8.7px!important;margin-bottom:5px!important}
      #luneaTimingInline .txt b{font-size:17px!important;margin-bottom:7px!important}
      #luneaTimingInline .txt span{font-size:11.5px!important;line-height:1.58!important}
    }

    @media(prefers-reduced-motion:reduce){
      #spreadOverlay .actionbar .mini{transition:none!important}
    }
  `;
  document.head.appendChild(style);
})();
