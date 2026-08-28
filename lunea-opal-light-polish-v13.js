'use strict';

/*
  LUNEA OPAL LIGHT POLISH V13
  ---------------------------
  Visual-only luminous polish for reading/result UI.
  - opal reflected light rather than neon
  - moonlight edge highlights on action dock and timing signal
  - subtle aurora movement with reduced-motion fallback
  - no event interception, observers, RNG, timing, archive, AI, or routing changes
*/
(() => {
  if (window.__LUNEA_OPAL_LIGHT_POLISH_V13__) return;
  window.__LUNEA_OPAL_LIGHT_POLISH_V13__ = true;

  const style = document.createElement('style');
  style.id = 'luneaOpalLightPolishV13Style';
  style.textContent = `
    :root{
      --lunea-light-pearl:rgba(250,249,255,.86);
      --lunea-light-lilac:rgba(197,177,246,.35);
      --lunea-light-blue:rgba(125,193,231,.25);
      --lunea-light-mint:rgba(137,224,214,.16);
      --lunea-light-rose:rgba(238,183,230,.14);
    }

    @keyframes luneaV13AuroraShift{
      0%,100%{background-position:0% 50%,100% 50%,50% 50%}
      50%{background-position:100% 46%,0% 54%,50% 50%}
    }
    @keyframes luneaV13SoftGleam{
      0%{transform:translateX(-140%) skewX(-18deg);opacity:0}
      18%{opacity:0}
      42%{opacity:.34}
      68%{opacity:.12}
      100%{transform:translateX(185%) skewX(-18deg);opacity:0}
    }
    @keyframes luneaV13OrbBreath{
      0%,100%{filter:drop-shadow(0 10px 20px rgba(0,0,0,.28)) drop-shadow(0 0 8px rgba(181,161,237,.10))}
      50%{filter:drop-shadow(0 12px 23px rgba(0,0,0,.30)) drop-shadow(0 0 18px rgba(183,166,244,.20))}
    }

    /* =======================================================
       Reading backdrop — quiet moonlight, not neon
       ======================================================= */
    #spreadOverlay .modal{
      background:
        radial-gradient(circle at 52% -4%,rgba(184,160,242,.115),transparent 25%),
        radial-gradient(circle at 102% 26%,rgba(103,170,215,.075),transparent 27%),
        radial-gradient(circle at -8% 74%,rgba(188,153,224,.055),transparent 29%),
        linear-gradient(180deg,rgba(11,13,29,.99),rgba(5,7,17,.995))!important;
    }

    #spreadOverlay #cards{
      border:1px solid rgba(229,232,246,.105)!important;
      background:
        radial-gradient(ellipse at 50% 18%,rgba(214,200,250,.095),transparent 36%),
        radial-gradient(ellipse at 88% 68%,rgba(112,177,215,.06),transparent 31%),
        linear-gradient(180deg,rgba(255,255,255,.022),rgba(255,255,255,.008))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.045),
        inset 0 -28px 70px rgba(0,0,0,.12),
        0 16px 34px rgba(0,0,0,.19),
        0 0 34px rgba(137,111,201,.035)!important;
    }

    #spreadOverlay .tarot-card-wrapper:has(.tarot-card.flipped){
      filter:
        drop-shadow(0 13px 18px rgba(0,0,0,.28))
        drop-shadow(0 0 13px rgba(196,180,241,.13))
        drop-shadow(0 0 24px rgba(115,180,219,.055))!important;
    }

    /* =======================================================
       Action dock — opal glass with reflected moonlight
       ======================================================= */
    #spreadOverlay .actionbar{
      isolation:isolate!important;
      overflow:hidden!important;
      border-color:rgba(232,234,247,.18)!important;
      background:
        radial-gradient(circle at 12% -12%,rgba(228,214,255,.16),transparent 34%),
        radial-gradient(circle at 94% 112%,rgba(104,181,220,.13),transparent 38%),
        linear-gradient(150deg,rgba(23,24,46,.94),rgba(9,11,25,.965))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.12),
        inset 0 -1px 0 rgba(139,160,207,.05),
        0 16px 34px rgba(0,0,0,.34),
        0 0 29px rgba(159,130,222,.085)!important;
    }
    #spreadOverlay .actionbar::before{
      content:'';
      position:absolute;
      inset:-55% -20%;
      z-index:-1;
      pointer-events:none;
      opacity:.9;
      background:
        radial-gradient(ellipse at 24% 48%,rgba(222,198,255,.15),transparent 24%),
        radial-gradient(ellipse at 58% 46%,rgba(154,207,238,.11),transparent 23%),
        radial-gradient(ellipse at 83% 52%,rgba(244,196,231,.075),transparent 19%);
      background-size:135% 130%,145% 135%,155% 145%;
      animation:luneaV13AuroraShift 10s ease-in-out infinite;
    }
    #spreadOverlay .actionbar::after{
      content:'';
      position:absolute;
      pointer-events:none;
      z-index:4;
      left:8%;right:8%;top:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.64),rgba(209,197,247,.44),rgba(165,214,239,.32),transparent);
      box-shadow:0 0 12px rgba(220,208,255,.25);
    }

    #spreadOverlay .actionbar .mini{
      position:relative!important;
      overflow:hidden!important;
      isolation:isolate!important;
      color:#ecebf5!important;
      border-color:rgba(228,230,243,.145)!important;
      background:
        radial-gradient(circle at 25% 0%,rgba(255,255,255,.08),transparent 28%),
        linear-gradient(145deg,rgba(255,255,255,.065),rgba(143,124,198,.035))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.095),
        0 3px 10px rgba(0,0,0,.10)!important;
    }
    #spreadOverlay .actionbar .mini::after{
      content:'';
      position:absolute;
      z-index:-1;
      pointer-events:none;
      top:-30%;bottom:-30%;width:38%;left:-52%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),rgba(200,188,246,.13),transparent);
      filter:blur(.2px);
      animation:luneaV13SoftGleam 8s ease-in-out infinite;
    }
    #spreadOverlay .actionbar .mini:nth-child(2)::after{animation-delay:1.2s}
    #spreadOverlay .actionbar .mini:nth-child(3)::after{animation-delay:2.2s}
    #spreadOverlay .actionbar .mini:nth-child(4)::after{animation-delay:3.1s}
    #spreadOverlay .actionbar .mini:nth-child(5)::after{animation-delay:4.0s}
    #spreadOverlay .actionbar .mini:nth-child(6)::after{animation-delay:4.9s}

    #spreadOverlay .actionbar #aiRead{
      color:#fbf8ff!important;
      border-color:rgba(218,201,255,.29)!important;
      background:
        radial-gradient(circle at 24% 0%,rgba(255,255,255,.15),transparent 27%),
        linear-gradient(132deg,rgba(191,159,241,.22),rgba(129,140,210,.16) 52%,rgba(104,174,209,.14))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.17),
        0 0 17px rgba(168,139,226,.08)!important;
    }
    #spreadOverlay .actionbar #extraCard{
      border-color:rgba(189,230,222,.22)!important;
      background:
        radial-gradient(circle at 18% 0%,rgba(225,255,250,.11),transparent 30%),
        linear-gradient(145deg,rgba(116,188,184,.105),rgba(119,151,197,.065))!important;
    }

    /* =======================================================
       Timing signal — luminous little oracle rather than flat card
       ======================================================= */
    #luneaTimingInline.timing-inline{
      isolation:isolate!important;
      border-color:rgba(229,232,246,.19)!important;
      background:
        radial-gradient(circle at 8% 0%,rgba(222,204,255,.18),transparent 31%),
        radial-gradient(circle at 100% 100%,rgba(108,190,226,.125),transparent 37%),
        linear-gradient(151deg,rgba(23,25,49,.95),rgba(8,10,24,.97))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.10),
        0 16px 34px rgba(0,0,0,.24),
        0 0 34px rgba(161,131,222,.075)!important;
    }
    #luneaTimingInline.timing-inline::after{
      content:'';
      position:absolute;
      inset:0;
      z-index:-1;
      pointer-events:none;
      opacity:.78;
      background:
        radial-gradient(circle at 16% 18%,rgba(255,255,255,.58) 0 .7px,transparent 1.15px),
        radial-gradient(circle at 28% 80%,rgba(204,188,245,.44) 0 .65px,transparent 1.05px),
        radial-gradient(circle at 84% 24%,rgba(177,225,244,.45) 0 .75px,transparent 1.1px),
        radial-gradient(circle at 91% 71%,rgba(255,255,255,.30) 0 .55px,transparent .95px),
        linear-gradient(112deg,transparent 0 31%,rgba(255,255,255,.035) 39%,rgba(181,164,237,.025) 46%,transparent 55%);
    }

    #luneaTimingInline.timing-inline::before{
      border-color:rgba(240,241,250,.42)!important;
      background:
        radial-gradient(circle at 50% 44%,rgba(251,251,255,.98) 0 15%,rgba(216,218,233,.96) 16% 17%,#101329 18% 29%,transparent 30%),
        radial-gradient(circle at 50% 44%,transparent 0 34%,rgba(234,235,247,.39) 35% 36%,transparent 37% 48%,rgba(203,192,238,.19) 49% 50%,transparent 51%),
        radial-gradient(circle at 24% 18%,rgba(255,255,255,.92) 0 1px,transparent 1.7px),
        radial-gradient(circle at 78% 15%,rgba(209,227,250,.77) 0 1px,transparent 1.6px),
        radial-gradient(circle at 73% 71%,rgba(211,190,250,.68) 0 1px,transparent 1.6px),
        radial-gradient(circle at 20% 76%,rgba(146,218,223,.44) 0 1px,transparent 1.5px),
        conic-gradient(from 225deg at 50% 50%,rgba(191,167,239,.18),rgba(112,195,219,.15),rgba(241,190,226,.12),rgba(191,167,239,.18)),
        linear-gradient(155deg,#1b1f40 0%,#0d1129 58%,#080a18 100%)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.22),
        inset 0 0 22px rgba(188,170,237,.08),
        0 12px 25px rgba(0,0,0,.32),
        0 0 16px rgba(215,201,251,.17),
        0 0 34px rgba(111,184,220,.095)!important;
      animation:luneaV13OrbBreath 5.8s ease-in-out infinite;
    }

    #luneaTimingInline .txt small{
      color:#d7c8ff!important;
      text-shadow:0 0 12px rgba(190,163,240,.15)!important;
    }
    #luneaTimingInline .txt b{
      color:#fffefe!important;
      text-shadow:0 0 16px rgba(218,205,251,.10)!important;
    }
    #luneaTimingInline .txt span{color:#b4b3c7!important}

    /* Result/readout panels: faint top-edge reflection */
    #spreadOverlay .reading-info,
    #spreadOverlay .ai-reading,
    #spreadOverlay .card-notes,
    #spreadOverlay [class*='reading-result']{
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055)!important;
    }

    @media(max-width:390px){
      #spreadOverlay .actionbar{
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.115),
          0 13px 27px rgba(0,0,0,.31),
          0 0 25px rgba(155,129,216,.075)!important;
      }
      #luneaTimingInline.timing-inline{
        padding-top:18px!important;
        padding-bottom:18px!important;
      }
      #luneaTimingInline.timing-inline::before{
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.23),
          0 10px 21px rgba(0,0,0,.29),
          0 0 17px rgba(212,197,249,.18),
          0 0 30px rgba(108,184,219,.09)!important;
      }
    }

    @media(prefers-reduced-motion:reduce){
      #spreadOverlay .actionbar::before,
      #spreadOverlay .actionbar .mini::after,
      #luneaTimingInline.timing-inline::before{
        animation:none!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
