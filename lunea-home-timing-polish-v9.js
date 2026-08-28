'use strict';

/*
  LUNEA HOME + TIMING POLISH V9
  =============================
  Final screenshot-driven visual polish only.

  - keeps sequential tarot flip behavior untouched
  - makes upper home utilities quieter / less box-heavy
  - gives portal icons a more pearl-opal object identity
  - slightly tightens portal tiles without shrinking tap targets
  - improves Moon Dial result contrast and removes utility-emoji feel
  - no RNG / draw / spread / Horary / archive / profile logic changes
  - no MutationObserver
*/
(() => {
  if (window.__LUNEA_HOME_TIMING_POLISH_V9__) return;
  window.__LUNEA_HOME_TIMING_POLISH_V9__ = true;
  document.documentElement.classList.add('lunea-home-timing-polish-v9');

  const style = document.createElement('style');
  style.id = 'luneaHomeTimingPolishV9Style';
  style.textContent = `
    /* -------------------------------------------------------
       HOME TOP · keep information, lose the stacked-box feel
       ------------------------------------------------------- */
    html.lunea-home-timing-polish-v9 .profile-strip{
      margin-bottom:8px!important;
      min-height:44px!important;
      padding:7px 10px!important;
      border-color:rgba(220,223,239,.095)!important;
      background:linear-gradient(145deg,rgba(22,24,44,.46),rgba(10,12,25,.48))!important;
    }
    html.lunea-home-timing-polish-v9 .engine-strip{
      min-height:25px!important;
      margin:0 2px 8px!important;
      padding:4px 2px!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      font-size:8.3px!important;
      color:#878b9d!important;
    }
    html.lunea-home-timing-polish-v9 .engine-strip b{color:#b6c9c3!important}
    html.lunea-home-timing-polish-v9 #luneaReadingDraftResume{
      min-height:46px!important;
      margin-bottom:11px!important;
      padding:7px 8px 7px 10px!important;
      border-color:rgba(208,213,232,.085)!important;
      background:linear-gradient(145deg,rgba(19,21,40,.42),rgba(9,11,23,.46))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.022)!important;
    }
    html.lunea-home-timing-polish-v9 .lrd-title{font-size:9.9px!important}
    html.lunea-home-timing-polish-v9 .lrd-q{font-size:8.2px!important;opacity:.84}

    /* -------------------------------------------------------
       DAILY RELIC · a little more luminous / less CSS-object-ish
       ------------------------------------------------------- */
    html.lunea-home-timing-polish-v9 .daily{
      min-height:148px!important;
      padding-right:126px!important;
      border-color:rgba(232,234,246,.205)!important;
      background:
        radial-gradient(circle at 83% 17%,rgba(239,225,255,.22),transparent 24%),
        radial-gradient(circle at 95% 75%,rgba(139,220,229,.12),transparent 31%),
        radial-gradient(circle at 7% 104%,rgba(255,207,225,.07),transparent 34%),
        linear-gradient(142deg,rgba(43,35,77,.88),rgba(13,16,34,.96) 59%,rgba(7,9,22,.99))!important;
    }
    html.lunea-home-timing-polish-v9 .lunea-daily-relic-v8{
      width:94px!important;height:108px!important;right:18px!important;top:10px!important;
      filter:drop-shadow(0 14px 24px rgba(0,0,0,.27)) drop-shadow(0 0 18px rgba(216,198,255,.15))!important;
    }
    html.lunea-home-timing-polish-v9 .lunea-daily-relic-v8 .v8-arch{
      border-color:rgba(239,240,249,.30)!important;
      background:
        radial-gradient(circle at 50% 14%,rgba(255,255,255,.34),transparent 17%),
        radial-gradient(circle at 72% 74%,rgba(147,224,229,.12),transparent 33%),
        linear-gradient(150deg,rgba(242,232,255,.20),rgba(126,156,205,.085) 48%,rgba(255,211,226,.065))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 28px rgba(221,206,255,.09),0 0 18px rgba(199,184,246,.08)!important;
    }
    html.lunea-home-timing-polish-v9 .lunea-daily-relic-v8 .v8-card{
      width:46px!important;height:65px!important;top:29px!important;
      border-color:rgba(250,250,255,.58)!important;
      background:
        radial-gradient(circle at 30% 18%,rgba(255,255,255,.72),transparent 17%),
        linear-gradient(145deg,rgba(246,239,255,.98),rgba(194,219,238,.88) 49%,rgba(218,193,242,.89))!important;
      box-shadow:inset 0 0 0 3px rgba(255,255,255,.19),0 8px 17px rgba(0,0,0,.18),0 0 14px rgba(221,205,255,.14)!important;
    }
    html.lunea-home-timing-polish-v9 .daily .primary{
      right:17px!important;bottom:15px!important;
      min-width:108px!important;
      border-color:rgba(255,255,255,.46)!important;
      background:linear-gradient(112deg,rgba(250,244,255,.98),rgba(215,197,250,.97) 39%,rgba(174,219,235,.95) 72%,rgba(246,218,230,.94))!important;
    }

    /* -------------------------------------------------------
       READING CABINET · reference-like mini opal app objects
       ------------------------------------------------------- */
    html.lunea-home-timing-polish-v9 #luneaHomePortalV8{margin-top:4px!important}
    html.lunea-home-timing-polish-v9 #luneaHomePortalV8 .v8-eyebrow{color:#c2b8d8!important;letter-spacing:2.45px!important}
    html.lunea-home-timing-polish-v9 #luneaHomePortalV8 .v8-title-note{color:#85879a!important}
    html.lunea-home-timing-polish-v9 .lunea-v8-grid{gap:9px!important}
    html.lunea-home-timing-polish-v9 .lunea-v8-tile{
      min-height:116px!important;
      padding:12px 11px 11px!important;
      border-radius:22px!important;
      border-color:rgba(225,228,241,.135)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 10px 24px rgba(0,0,0,.13)!important;
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-object{
      position:relative!important;
      width:51px!important;height:51px!important;
      margin-bottom:10px!important;
      border-radius:17px!important;
      overflow:hidden!important;
      border-color:rgba(246,247,252,.31)!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.36),
        inset 0 0 17px rgba(255,255,255,.055),
        0 7px 17px rgba(0,0,0,.15),
        0 0 16px rgba(204,188,246,.09)!important;
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-object::before{
      content:'';position:absolute;inset:3px;border-radius:14px;pointer-events:none;z-index:0;
      border:1px solid rgba(255,255,255,.08);
      background:radial-gradient(circle at 27% 18%,rgba(255,255,255,.38),transparent 21%);
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-object svg{position:relative;z-index:2;width:24px!important;height:24px!important;filter:drop-shadow(0 0 7px rgba(255,255,255,.18))}
    html.lunea-home-timing-polish-v9 .lunea-v8-label{font-size:12.4px!important;letter-spacing:.15px!important}
    html.lunea-home-timing-polish-v9 .lunea-v8-sub{font-size:8.5px!important;line-height:1.45!important;color:#8f91a4!important}
    html.lunea-home-timing-polish-v9 .lunea-v8-open{color:#8e91a3!important;top:12px!important;right:12px!important}

    /* Each portal gets its own opal material, not merely another gray icon. */
    html.lunea-home-timing-polish-v9 .lunea-v8-tile[data-key='general'] .lunea-v8-object{
      color:#fff7ff!important;background:radial-gradient(circle at 31% 23%,rgba(255,255,255,.62),transparent 21%),linear-gradient(145deg,rgba(238,211,251,.46),rgba(174,159,226,.30) 48%,rgba(160,214,229,.20))!important
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-tile[data-key='career'] .lunea-v8-object{
      color:#fffaf2!important;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.63),transparent 21%),linear-gradient(145deg,rgba(248,231,209,.38),rgba(215,204,232,.26) 48%,rgba(176,212,224,.17))!important
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-tile[data-key='love'] .lunea-v8-object{
      color:#fff8fd!important;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.64),transparent 21%),linear-gradient(145deg,rgba(248,210,229,.43),rgba(204,178,232,.28) 50%,rgba(191,219,231,.16))!important
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-tile[data-key='stock'] .lunea-v8-object{
      color:#f4ffff!important;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.62),transparent 21%),linear-gradient(145deg,rgba(179,232,230,.38),rgba(149,192,219,.27) 48%,rgba(189,168,225,.20))!important
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-tile[data-key='timing'] .lunea-v8-object{
      color:#f8f6ff!important;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.62),transparent 21%),linear-gradient(145deg,rgba(195,189,246,.42),rgba(133,154,216,.27) 50%,rgba(192,215,234,.17))!important
    }
    html.lunea-home-timing-polish-v9 .lunea-v8-tile[data-key='horary'] .lunea-v8-object{
      color:#fff9ff!important;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.61),transparent 21%),linear-gradient(145deg,rgba(225,201,244,.40),rgba(155,135,198,.30) 51%,rgba(151,205,221,.15))!important
    }

    /* -------------------------------------------------------
       MOON DIAL · screenshot contrast + cleaner utility controls
       ------------------------------------------------------- */
    html.lunea-home-timing-polish-v9 #timingOverlay .timing-modal{
      border-color:rgba(230,232,244,.205)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.075),0 30px 78px rgba(0,0,0,.70),0 0 36px rgba(133,106,209,.06)!important;
    }
    html.lunea-home-timing-polish-v9 #timingDraw{
      color:#fff!important;font-weight:750!important;
      border-color:rgba(248,249,254,.37)!important;
      background:linear-gradient(112deg,rgba(190,165,241,.98),rgba(132,120,205,.98) 48%,rgba(103,158,207,.96))!important;
    }
    html.lunea-home-timing-polish-v9 .timing-result{
      padding:12px 13px!important;
      color:#bbbccb!important;
      border-color:rgba(224,226,240,.15)!important;
      background:linear-gradient(145deg,rgba(255,255,255,.052),rgba(150,126,205,.025))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
    }
    html.lunea-home-timing-polish-v9 .timing-result small,
    html.lunea-home-timing-polish-v9 .timing-result .group,
    html.lunea-home-timing-polish-v9 .timing-result>div:first-child{
      color:#c9a977!important;
    }
    html.lunea-home-timing-polish-v9 .timing-result b,
    html.lunea-home-timing-polish-v9 .timing-result strong{
      color:#eee9f7!important;
      opacity:1!important;
    }
    html.lunea-home-timing-polish-v9 .timing-actions .mini{
      min-height:34px!important;
      border-radius:12px!important;
      color:#dedee8!important;
      background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(140,118,196,.035))!important;
    }

    @media(max-width:390px){
      html.lunea-home-timing-polish-v9 .lunea-v8-tile{min-height:110px!important}
      html.lunea-home-timing-polish-v9 .lunea-v8-object{width:47px!important;height:47px!important}
      html.lunea-home-timing-polish-v9 .daily{padding-right:116px!important}
      html.lunea-home-timing-polish-v9 .lunea-daily-relic-v8{right:14px!important;transform:scale(.94);transform-origin:top right}
    }
  `;
  document.head.appendChild(style);

  function polishCopy(){
    const eyebrow = document.querySelector('#luneaHomePortalV8 .v8-eyebrow');
    if (eyebrow) eyebrow.textContent = 'LUNEA · CELESTIAL CABINET';

    const draw = document.getElementById('timingDraw');
    if (draw && /시기/.test(draw.textContent || '')) draw.textContent = '✦ 시기 카드 한 장 열기';

    const buttons = [...document.querySelectorAll('#timingOverlay .timing-actions .mini')];
    buttons.forEach(btn => {
      const t = (btn.textContent || '').trim();
      if (/AI.*시기.*해석/.test(t)) btn.textContent = '✦ AI 시기 해석';
      else if (/기록/.test(t)) btn.textContent = '기록';
    });
  }

  function boot(){
    polishCopy();
    [180,520,1100,2200].forEach(ms => setTimeout(polishCopy, ms));
    window.addEventListener('pageshow', () => setTimeout(polishCopy, 80));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(polishCopy, 80); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
