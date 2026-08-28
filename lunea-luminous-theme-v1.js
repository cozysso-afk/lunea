'use strict';

/*
  LUNEA Luminous Theme V1
  Visual-only enhancement layer.
  - midnight navy/plum foundation
  - iridescent lavender light
  - cool silver accents
  - restrained glass surfaces
  - mobile/iPhone-first spacing

  No tarot RNG, spread routing, interpretation, Horary, astrology,
  archive, or profile logic is changed here.
*/
(() => {
  if (window.__LUNEA_LUMINOUS_THEME_V1__) return;
  window.__LUNEA_LUMINOUS_THEME_V1__ = true;

  document.documentElement.classList.add('lunea-luminous-v1');

  const style = document.createElement('style');
  style.id = 'luneaLuminousThemeV1Style';
  style.textContent = `
    :root{
      --bg:#070916!important;
      --bg2:#03040b!important;
      --moon:#d8c9ff!important;
      --gold:#dfe3ee!important;
      --panel:rgba(16,18,36,.72)!important;
      --border:rgba(220,225,244,.19)!important;
      --text:#fafbff!important;
      --dim:#aaa9bc!important;
      --danger:#ff9aac!important;
      --ok:#a7ead5!important;
      --r:22px!important;
      --silver:#e8ebf4;
      --silver2:#aeb7cf;
      --lav:#bda8ff;
      --lav2:#8f79df;
      --aurora:#91b9e9;
      --violet:#7d5fd0;
      --ink:#070916;
    }

    html.lunea-luminous-v1,
    html.lunea-luminous-v1 body{
      background:#050712!important;
      color:var(--text)!important;
    }

    html.lunea-luminous-v1 body{
      background-image:
        radial-gradient(circle at 18% 3%,rgba(147,117,224,.23),transparent 31%),
        radial-gradient(circle at 88% 8%,rgba(97,151,211,.16),transparent 28%),
        radial-gradient(circle at 50% 37%,rgba(95,67,153,.10),transparent 42%),
        linear-gradient(180deg,#070916 0%,#080817 42%,#04050d 100%)!important;
      background-attachment:fixed!important;
      position:relative;
      isolation:isolate;
    }

    html.lunea-luminous-v1 body::before{
      content:'';
      position:fixed;
      inset:-18vh -18vw auto;
      height:62vh;
      pointer-events:none;
      z-index:0;
      opacity:.72;
      filter:blur(8px);
      background:
        radial-gradient(ellipse at 35% 45%,rgba(172,137,255,.20),transparent 37%),
        radial-gradient(ellipse at 65% 28%,rgba(111,177,226,.14),transparent 35%),
        radial-gradient(ellipse at 50% 70%,rgba(226,218,255,.08),transparent 28%);
      transform:translateZ(0);
    }

    html.lunea-luminous-v1 body::after{
      content:'';
      position:fixed;
      inset:0;
      pointer-events:none;
      z-index:0;
      opacity:.46;
      background-image:
        radial-gradient(circle at 11% 14%,rgba(255,255,255,.85) 0 1px,transparent 1.4px),
        radial-gradient(circle at 80% 11%,rgba(220,227,255,.7) 0 1px,transparent 1.3px),
        radial-gradient(circle at 63% 23%,rgba(203,185,255,.72) 0 1px,transparent 1.4px),
        radial-gradient(circle at 29% 31%,rgba(255,255,255,.42) 0 1px,transparent 1.3px),
        radial-gradient(circle at 91% 38%,rgba(198,214,255,.5) 0 1px,transparent 1.3px),
        radial-gradient(circle at 16% 57%,rgba(228,219,255,.45) 0 1px,transparent 1.3px);
      background-size:170px 170px,220px 220px,260px 260px,310px 310px,350px 350px,390px 390px;
    }

    html.lunea-luminous-v1 .app{
      position:relative!important;
      z-index:1!important;
      max-width:500px!important;
      padding:18px 15px 132px!important;
    }

    /* HEADER */
    html.lunea-luminous-v1 header{
      margin-bottom:13px!important;
      padding:3px 1px 1px;
    }

    html.lunea-luminous-v1 .brand{
      gap:10px!important;
    }

    html.lunea-luminous-v1 .moon-logo{
      width:40px!important;
      height:40px!important;
      background:
        radial-gradient(circle at 35% 27%,rgba(255,255,255,.96),rgba(231,224,255,.72) 15%,transparent 32%),
        conic-gradient(from 215deg,#6c58ad,#d7caff,#8db5db,#eef1fa,#9f87e4,#6c58ad)!important;
      border:1px solid rgba(243,245,255,.62)!important;
      box-shadow:
        0 0 0 1px rgba(160,139,222,.16),
        0 0 23px rgba(178,151,255,.32),
        inset 0 0 18px rgba(255,255,255,.22)!important;
    }

    html.lunea-luminous-v1 .brand h1{
      font-size:20px!important;
      letter-spacing:2.8px!important;
      background:linear-gradient(105deg,#ffffff 0%,#c9cfdf 28%,#ffffff 49%,#b6a7dd 70%,#eef1f8 100%)!important;
      -webkit-background-clip:text!important;
      -webkit-text-fill-color:transparent!important;
      text-shadow:0 0 24px rgba(205,193,255,.16);
    }

    html.lunea-luminous-v1 .brand p{
      color:#9f9eb2!important;
      letter-spacing:1.35px!important;
    }

    html.lunea-luminous-v1 .icon-btn{
      color:#e9eaf3!important;
      border:1px solid rgba(219,224,242,.18)!important;
      background:linear-gradient(145deg,rgba(27,29,52,.78),rgba(12,14,29,.64))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.07),
        0 7px 20px rgba(0,0,0,.19)!important;
      backdrop-filter:blur(11px)!important;
      -webkit-backdrop-filter:blur(11px)!important;
    }

    html.lunea-luminous-v1 .icon-btn:active,
    html.lunea-luminous-v1 .primary:active,
    html.lunea-luminous-v1 .mini:active{
      transform:translateY(1px) scale(.99);
    }

    /* PROFILE / ENGINE STRIPS */
    html.lunea-luminous-v1 .profile-strip,
    html.lunea-luminous-v1 .engine-strip{
      position:relative;
      overflow:hidden;
      background:
        linear-gradient(135deg,rgba(31,29,57,.70),rgba(12,15,31,.72))!important;
      border:1px solid rgba(207,211,233,.17)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.055),
        0 12px 30px rgba(0,0,0,.14)!important;
    }

    html.lunea-luminous-v1 .profile-strip::before,
    html.lunea-luminous-v1 .engine-strip::before{
      content:'';
      position:absolute;
      inset:0 auto auto 10%;
      width:48%;
      height:1px;
      background:linear-gradient(90deg,transparent,rgba(242,243,255,.6),transparent);
      opacity:.58;
    }

    html.lunea-luminous-v1 .tag{
      color:#e3e5ef!important;
      background:rgba(218,220,239,.07)!important;
      border:1px solid rgba(224,226,243,.10);
    }

    html.lunea-luminous-v1 .engine-dot{
      background:#b9f0db!important;
      box-shadow:0 0 10px rgba(151,234,205,.65)!important;
    }

    /* HERO / DAILY */
    html.lunea-luminous-v1 .daily{
      position:relative!important;
      overflow:hidden!important;
      isolation:isolate;
      border:1px solid rgba(224,227,243,.24)!important;
      background:
        radial-gradient(circle at 82% 18%,rgba(169,137,255,.20),transparent 30%),
        radial-gradient(circle at 16% 0%,rgba(130,183,224,.12),transparent 30%),
        linear-gradient(145deg,rgba(35,31,65,.78),rgba(12,14,29,.86))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.10),
        inset 0 -1px 0 rgba(136,118,196,.08),
        0 18px 42px rgba(0,0,0,.28),
        0 0 28px rgba(136,104,213,.08)!important;
    }

    html.lunea-luminous-v1 .daily::before{
      content:'';
      position:absolute;
      z-index:-1;
      width:150px;
      height:150px;
      right:-62px;
      top:-88px;
      border-radius:50%;
      background:radial-gradient(circle,rgba(240,238,255,.22),rgba(164,141,228,.08) 42%,transparent 70%);
      box-shadow:0 0 42px rgba(177,153,240,.13);
    }

    html.lunea-luminous-v1 .daily::after{
      content:'✦';
      position:absolute;
      right:20px;
      top:12px;
      color:rgba(244,245,255,.70);
      font-size:9px;
      text-shadow:0 0 10px rgba(211,197,255,.86);
    }

    html.lunea-luminous-v1 .daily h3{
      color:#fbfaff!important;
      letter-spacing:-.15px;
      text-shadow:0 0 18px rgba(197,178,255,.12);
    }

    html.lunea-luminous-v1 .daily p{
      color:#aaa8bc!important;
    }

    html.lunea-luminous-v1 .primary{
      color:#fff!important;
      border:1px solid rgba(244,245,255,.34)!important;
      background:
        linear-gradient(112deg,rgba(168,143,239,.96),rgba(111,95,184,.96) 55%,rgba(97,132,183,.94))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.25),
        0 10px 27px rgba(102,82,174,.30),
        0 0 17px rgba(190,169,255,.10)!important;
      transition:transform .16s ease,filter .16s ease,box-shadow .16s ease!important;
    }

    html.lunea-luminous-v1 .primary:hover{
      filter:brightness(1.07);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.30),
        0 12px 30px rgba(102,82,174,.36),
        0 0 24px rgba(190,169,255,.15)!important;
    }

    html.lunea-luminous-v1 .eyebrow,
    html.lunea-luminous-v1 .sub,
    html.lunea-luminous-v1 .pos{
      color:#cfc2f7!important;
    }

    html.lunea-luminous-v1 .section-title{
      color:#f5f3fb!important;
    }

    /* CATEGORY CARDS */
    html.lunea-luminous-v1 .category{
      position:relative;
      border:1px solid rgba(219,223,239,.17)!important;
      background:
        linear-gradient(145deg,rgba(22,23,44,.74),rgba(11,13,27,.77))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.045),
        0 12px 30px rgba(0,0,0,.16)!important;
      backdrop-filter:blur(12px)!important;
      -webkit-backdrop-filter:blur(12px)!important;
      transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease;
    }

    html.lunea-luminous-v1 .category.active{
      border-color:rgba(201,189,238,.30)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.06),
        0 16px 38px rgba(0,0,0,.22),
        0 0 26px rgba(143,112,215,.07)!important;
    }

    html.lunea-luminous-v1 .category-header{
      min-height:64px;
    }

    html.lunea-luminous-v1 .cat-icon{
      width:36px!important;
      height:36px!important;
      color:#e9e4fb!important;
      background:
        radial-gradient(circle at 32% 24%,rgba(255,255,255,.18),transparent 27%),
        linear-gradient(145deg,rgba(177,156,233,.18),rgba(105,136,189,.09))!important;
      border:1px solid rgba(224,226,242,.20)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 0 18px rgba(156,126,225,.08);
    }

    html.lunea-luminous-v1 .cat-text h3{
      color:#f2f0f7!important;
      letter-spacing:.85px!important;
    }

    html.lunea-luminous-v1 .cat-text p,
    html.lunea-luminous-v1 .reading-item p{
      color:#9e9caf!important;
    }

    html.lunea-luminous-v1 .toggle{
      color:#9a99ad!important;
    }

    html.lunea-luminous-v1 .category.active .toggle{
      color:#ddd2ff!important;
      text-shadow:0 0 11px rgba(193,169,255,.45);
    }

    html.lunea-luminous-v1 .reading-item{
      border-top-color:rgba(225,228,242,.07)!important;
      padding:13px 0!important;
    }

    html.lunea-luminous-v1 .reading-item h4{
      color:#eeeef7!important;
    }

    html.lunea-luminous-v1 .count{
      color:#e4e1ef!important;
      background:linear-gradient(145deg,rgba(184,162,235,.12),rgba(113,141,189,.08))!important;
      border:1px solid rgba(217,218,235,.16)!important;
    }

    /* SHEETS + OVERLAYS */
    html.lunea-luminous-v1 .sheet{
      background:
        radial-gradient(circle at 50% 0%,rgba(123,92,191,.13),transparent 24%),
        linear-gradient(180deg,rgba(17,18,36,.992),rgba(8,9,20,.995))!important;
      border:1px solid rgba(220,223,240,.20)!important;
      border-bottom:0!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.07),
        0 -22px 55px rgba(0,0,0,.60),
        0 -3px 30px rgba(126,96,198,.07)!important;
    }

    html.lunea-luminous-v1 .overlay{
      background:rgba(3,4,11,.92)!important;
    }

    html.lunea-luminous-v1 .modal{
      background:
        radial-gradient(circle at 80% 0%,rgba(129,99,201,.12),transparent 27%),
        linear-gradient(160deg,#111327,#090b18 66%,#080914)!important;
      border:1px solid rgba(221,224,240,.19)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.055),
        0 26px 70px rgba(0,0,0,.72),
        0 0 34px rgba(135,104,205,.07)!important;
    }

    html.lunea-luminous-v1 .modal-h,
    html.lunea-luminous-v1 .sheet-title{
      color:#f6f5fb!important;
    }

    html.lunea-luminous-v1 .close{
      color:#aaa9bc!important;
    }

    /* INPUTS */
    html.lunea-luminous-v1 textarea,
    html.lunea-luminous-v1 input,
    html.lunea-luminous-v1 select{
      color:#f7f7fc!important;
      background:linear-gradient(145deg,rgba(255,255,255,.050),rgba(166,150,223,.025))!important;
      border:1px solid rgba(223,225,239,.13)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      caret-color:#d9c9ff;
      transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important;
    }

    html.lunea-luminous-v1 textarea::placeholder,
    html.lunea-luminous-v1 input::placeholder{
      color:#77778a!important;
    }

    html.lunea-luminous-v1 textarea:focus,
    html.lunea-luminous-v1 input:focus,
    html.lunea-luminous-v1 select:focus{
      border-color:rgba(198,180,248,.56)!important;
      background:rgba(255,255,255,.058)!important;
      box-shadow:0 0 0 3px rgba(151,126,220,.09),0 0 21px rgba(148,119,220,.07)!important;
    }

    html.lunea-luminous-v1 select option{
      background:#111327!important;
    }

    html.lunea-luminous-v1 .radio-box{
      background:rgba(255,255,255,.035)!important;
      border:1px solid rgba(222,224,239,.10)!important;
      transition:.18s ease!important;
    }

    html.lunea-luminous-v1 .radio-box.selected{
      background:linear-gradient(145deg,rgba(171,145,238,.13),rgba(105,137,190,.07))!important;
      border-color:rgba(205,191,242,.43)!important;
      box-shadow:0 0 0 2px rgba(169,143,232,.05),inset 0 1px 0 rgba(255,255,255,.045)!important;
    }

    /* TAROT CARDS */
    html.lunea-luminous-v1 .cards{
      gap:8px!important;
    }

    html.lunea-luminous-v1 .tarot-card{
      border-radius:11px!important;
      box-shadow:
        0 8px 21px rgba(0,0,0,.52),
        0 0 0 1px rgba(235,236,246,.06),
        0 0 17px rgba(158,128,225,.045)!important;
    }

    html.lunea-luminous-v1 .back,
    html.lunea-luminous-v1 .front{
      border-radius:11px!important;
    }

    html.lunea-luminous-v1 .back{
      background:
        radial-gradient(circle at 50% 45%,rgba(155,128,222,.15),transparent 36%),
        linear-gradient(145deg,#171a34,#090b18)!important;
      border:1px solid rgba(226,227,240,.30)!important;
      box-shadow:inset 0 0 18px rgba(171,147,232,.05)!important;
    }

    html.lunea-luminous-v1 .back::after{
      color:#f0f1f7!important;
      text-shadow:
        0 0 6px rgba(255,255,255,.65),
        0 0 14px rgba(184,160,242,.58)!important;
    }

    html.lunea-luminous-v1 .front{
      border:1px solid rgba(228,229,239,.54)!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)!important;
    }

    html.lunea-luminous-v1 .tarot-card-wrapper:has(.tarot-card.flipped){
      filter:drop-shadow(0 0 7px rgba(174,149,230,.08));
    }

    /* RESULT / INTERPRETATION PANELS */
    html.lunea-luminous-v1 .info,
    html.lunea-luminous-v1 .ai-card,
    html.lunea-luminous-v1 .copybox,
    html.lunea-luminous-v1 .archive-item,
    html.lunea-luminous-v1 .spread-rationale{
      border-color:rgba(220,223,239,.13)!important;
      background:
        linear-gradient(145deg,rgba(255,255,255,.047),rgba(164,144,215,.025))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
    }

    html.lunea-luminous-v1 .ai-card{
      border-color:rgba(197,183,235,.22)!important;
      background:
        radial-gradient(circle at 85% 0%,rgba(150,119,221,.12),transparent 28%),
        linear-gradient(145deg,rgba(28,27,52,.76),rgba(12,14,29,.86))!important;
    }

    html.lunea-luminous-v1 .ai-card h4{
      color:#e8e9f2!important;
      border-bottom-color:rgba(224,226,239,.08)!important;
    }

    html.lunea-luminous-v1 .res-badge{
      color:#e3e6ee!important;
      border-color:rgba(226,229,238,.34)!important;
      background:rgba(225,228,239,.055)!important;
    }

    html.lunea-luminous-v1 .clar{
      border-left-color:#b9a7e8!important;
      background:rgba(160,139,215,.07)!important;
    }

    html.lunea-luminous-v1 .mini{
      color:#e4e3ee!important;
      background:linear-gradient(145deg,rgba(179,158,226,.10),rgba(111,139,184,.055))!important;
      border:1px solid rgba(216,218,234,.15)!important;
      transition:transform .15s ease,background .15s ease,border-color .15s ease!important;
    }

    html.lunea-luminous-v1 .mini:hover{
      background:rgba(185,164,235,.14)!important;
      border-color:rgba(215,204,243,.25)!important;
    }

    html.lunea-luminous-v1 .danger{
      color:#ffc2cc!important;
      border-color:rgba(255,154,172,.28)!important;
      background:rgba(255,118,144,.055)!important;
    }

    html.lunea-luminous-v1 .archive-meta{
      color:#c6b8ed!important;
    }

    /* SCROLLBARS */
    html.lunea-luminous-v1 *{
      scrollbar-color:rgba(178,160,219,.30) transparent;
    }

    html.lunea-luminous-v1 ::-webkit-scrollbar{
      width:5px;
      height:5px;
    }
    html.lunea-luminous-v1 ::-webkit-scrollbar-track{background:transparent}
    html.lunea-luminous-v1 ::-webkit-scrollbar-thumb{
      background:rgba(178,160,219,.25);
      border-radius:20px;
    }

    /* MICRO MOTION */
    @keyframes luneaSilverPulse{
      0%,100%{box-shadow:0 0 0 rgba(180,158,238,0)}
      50%{box-shadow:0 0 22px rgba(180,158,238,.09)}
    }

    html.lunea-luminous-v1 .moon-logo{
      animation:luneaSilverPulse 4.8s ease-in-out infinite;
    }

    @media(max-width:390px){
      html.lunea-luminous-v1 .app{padding-left:12px!important;padding-right:12px!important}
      html.lunea-luminous-v1 .brand h1{font-size:18.5px!important;letter-spacing:2.3px!important}
      html.lunea-luminous-v1 .moon-logo{width:38px!important;height:38px!important}
      html.lunea-luminous-v1 .daily{padding:15px 13px!important}
    }

    @media(prefers-reduced-motion:reduce){
      html.lunea-luminous-v1 .moon-logo{animation:none!important}
      html.lunea-luminous-v1 *,
      html.lunea-luminous-v1 *::before,
      html.lunea-luminous-v1 *::after{scroll-behavior:auto!important}
    }
  `;

  document.head.appendChild(style);
  console.info('✦ LUNEA Luminous Theme V1 active');
})();
