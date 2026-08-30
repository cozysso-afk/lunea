'use strict';

/*
  LUNEA DAILY CELESTIAL V22
  =========================
  Visual-only companion for DAILY ORBIT 6 V21.

  Goal: bring the implemented Daily home card much closer to the approved
  celestial mockup without changing draw, RNG, lock, archive, AI, or position
  semantics.

  - Large luminous crescent above a reflective horizon.
  - Opal crystal clusters + constellation lines.
  - Separate glass title plaque.
  - Deeper 2x3 celestial object cards.
  - Pearl / opal CTA and independent daily-lock footer note.
*/
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_CELESTIAL_V22__) return;
  W.__LUNEA_DAILY_CELESTIAL_V22__ = true;
  document.documentElement.classList.add('lunea-daily-celestial-v22');

  const $ = (sel, root = document) => root.querySelector(sel);

  function weekend() {
    const d = new Date().getDay();
    return d === 0 || d === 6;
  }

  function addStyles() {
    if ($('#luneaDailyCelestialV22Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaDailyCelestialV22Style';
    style.textContent = `
      @keyframes luneaV22MoonPulse{
        0%,100%{filter:drop-shadow(0 0 13px rgba(226,216,255,.38)) drop-shadow(0 0 28px rgba(161,132,230,.16));transform:translateX(-50%) scale(1)}
        50%{filter:drop-shadow(0 0 22px rgba(236,228,255,.57)) drop-shadow(0 0 42px rgba(155,126,226,.26)) drop-shadow(0 0 20px rgba(108,187,218,.12));transform:translateX(-50%) scale(1.025)}
      }
      @keyframes luneaV22Water{
        0%,100%{opacity:.55;transform:scaleX(.94)}
        50%{opacity:.9;transform:scaleX(1.04)}
      }
      @keyframes luneaV22Star{
        0%,100%{opacity:.32;transform:scale(.82)}
        50%{opacity:1;transform:scale(1.18)}
      }
      @keyframes luneaV22TileGlow{
        0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 24px rgba(180,153,231,.025),0 8px 22px rgba(0,0,0,.22),0 0 14px rgba(167,141,224,.035)}
        50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 30px rgba(180,153,231,.055),0 10px 26px rgba(0,0,0,.24),0 0 24px rgba(173,146,230,.08),0 0 14px rgba(112,188,216,.035)}
      }
      @keyframes luneaV22ButtonSweep{
        0%,18%{transform:translateX(-150%) skewX(-18deg);opacity:0}
        32%{opacity:.12}50%{opacity:.58}68%{opacity:.10}
        78%,100%{transform:translateX(170%) skewX(-18deg);opacity:0}
      }

      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6{
        padding:0 13px 15px!important;
        overflow:hidden!important;
        border-radius:32px!important;
        border:1px solid rgba(224,228,245,.21)!important;
        background:
          radial-gradient(circle at 50% 0%,rgba(98,84,165,.15),transparent 29%),
          radial-gradient(circle at 12% 66%,rgba(83,158,194,.075),transparent 29%),
          radial-gradient(circle at 88% 70%,rgba(204,143,196,.055),transparent 30%),
          linear-gradient(180deg,rgba(7,10,27,.996),rgba(9,11,29,.997) 45%,rgba(6,8,20,.998))!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.10),
          inset 0 0 62px rgba(139,115,207,.045),
          0 24px 58px rgba(0,0,0,.35),
          0 0 44px rgba(139,112,207,.10)!important;
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6::before{
        opacity:.74!important;
        background-image:
          radial-gradient(circle at 7% 8%,rgba(255,255,255,.82) 0 1px,transparent 1.5px),
          radial-gradient(circle at 17% 20%,rgba(202,220,250,.66) 0 1px,transparent 1.5px),
          radial-gradient(circle at 30% 7%,rgba(255,255,255,.50) 0 1px,transparent 1.4px),
          radial-gradient(circle at 64% 11%,rgba(233,222,255,.62) 0 1px,transparent 1.5px),
          radial-gradient(circle at 83% 17%,rgba(255,255,255,.67) 0 1px,transparent 1.6px),
          radial-gradient(circle at 95% 8%,rgba(194,220,244,.60) 0 1px,transparent 1.5px),
          radial-gradient(circle at 74% 42%,rgba(213,191,246,.43) 0 1px,transparent 1.4px),
          radial-gradient(circle at 10% 44%,rgba(178,217,235,.40) 0 1px,transparent 1.4px)!important;
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6::after{display:none!important}
      html.lunea-daily-celestial-v22 .lunea-daily-orbit6-moon{display:none!important}

      .lunea-v22-sky{
        position:relative;z-index:2;height:150px;margin:0 -13px 12px;overflow:hidden;
        border-radius:31px 31px 20px 20px;
        background:
          radial-gradient(ellipse at 50% 92%,rgba(122,115,206,.18),transparent 42%),
          radial-gradient(circle at 50% 23%,rgba(142,112,213,.14),transparent 26%),
          linear-gradient(180deg,rgba(8,12,37,.98),rgba(10,14,42,.93) 58%,rgba(15,16,42,.84) 100%);
      }
      .lunea-v22-sky::before{
        content:'';position:absolute;inset:0;opacity:.78;pointer-events:none;
        background-image:
          radial-gradient(circle at 14% 18%,#fff 0 1px,transparent 1.5px),
          radial-gradient(circle at 24% 33%,rgba(194,215,247,.8) 0 1px,transparent 1.5px),
          radial-gradient(circle at 36% 12%,rgba(255,255,255,.7) 0 1px,transparent 1.5px),
          radial-gradient(circle at 68% 19%,rgba(227,213,255,.85) 0 1px,transparent 1.6px),
          radial-gradient(circle at 79% 31%,rgba(255,255,255,.78) 0 1px,transparent 1.5px),
          radial-gradient(circle at 90% 12%,rgba(182,215,240,.76) 0 1px,transparent 1.5px)
      }
      .lunea-v22-constellation{position:absolute;left:16px;top:16px;width:82px;height:56px;opacity:.56}
      .lunea-v22-constellation path{fill:none;stroke:rgba(213,222,248,.66);stroke-width:.7}
      .lunea-v22-constellation circle{fill:#f7f6ff;filter:drop-shadow(0 0 3px rgba(217,205,255,.7))}
      .lunea-v22-orbit{
        position:absolute;left:50%;top:2px;transform:translateX(-50%);width:150px;height:104px;border-radius:50%;
        border:1px dashed rgba(191,175,236,.17);box-shadow:0 0 0 18px rgba(184,166,232,.015),0 0 0 37px rgba(124,175,209,.012)
      }
      .lunea-v22-moon{
        position:absolute;left:50%;top:17px;transform:translateX(-50%);width:80px;height:80px;border-radius:50%;
        background:
          radial-gradient(circle at 33% 27%,rgba(255,255,255,.95) 0 5%,rgba(242,237,255,.94) 18%,rgba(210,202,236,.93) 47%,rgba(151,139,193,.94) 72%,rgba(91,82,140,.97) 100%);
        box-shadow:inset -10px -9px 18px rgba(69,59,112,.35),inset 7px 6px 14px rgba(255,255,255,.40);
        animation:luneaV22MoonPulse 6.8s ease-in-out infinite
      }
      .lunea-v22-moon::before{
        content:'';position:absolute;width:76px;height:76px;border-radius:50%;left:27px;top:-5px;
        background:linear-gradient(160deg,#0c1030,#111535 70%,#121536);
        box-shadow:-7px 3px 14px rgba(9,11,30,.88)
      }
      .lunea-v22-moon::after{
        content:'';position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(228,224,247,.18);
        box-shadow:0 0 0 10px rgba(202,183,243,.025),0 0 0 23px rgba(118,181,211,.018)
      }
      .lunea-v22-horizon{
        position:absolute;left:0;right:0;bottom:31px;height:1px;
        background:linear-gradient(90deg,transparent,rgba(128,176,216,.30),rgba(221,192,255,.78),rgba(255,255,255,.94),rgba(198,172,247,.72),rgba(118,178,211,.30),transparent);
        box-shadow:0 0 9px rgba(198,175,247,.58)
      }
      .lunea-v22-water{
        position:absolute;left:50%;bottom:4px;transform:translateX(-50%);width:56%;height:31px;opacity:.72;
        background:
          linear-gradient(90deg,transparent,rgba(183,203,239,.12),rgba(255,247,255,.82),rgba(187,196,239,.16),transparent),
          repeating-linear-gradient(180deg,rgba(221,214,255,.22) 0 1px,transparent 1px 5px);
        clip-path:polygon(44% 0,56% 0,73% 100%,27% 100%);
        filter:blur(.15px) drop-shadow(0 0 8px rgba(209,189,251,.38));
        animation:luneaV22Water 5.8s ease-in-out infinite
      }
      .lunea-v22-starburst{
        position:absolute;left:50%;bottom:25px;transform:translateX(-50%);width:7px;height:7px;border-radius:50%;background:#fff;
        box-shadow:0 0 7px #fff,0 0 17px rgba(215,194,255,.95),0 0 30px rgba(123,195,219,.44);animation:luneaV22Star 3.8s ease-in-out infinite
      }
      .lunea-v22-starburst::before,.lunea-v22-starburst::after{content:'';position:absolute;left:50%;top:50%;background:rgba(255,255,255,.9);transform:translate(-50%,-50%)}
      .lunea-v22-starburst::before{width:28px;height:1px}.lunea-v22-starburst::after{width:1px;height:28px}

      .lunea-v22-crystal{position:absolute;bottom:24px;width:65px;height:49px;filter:drop-shadow(0 0 10px rgba(154,178,233,.17));opacity:.86}
      .lunea-v22-crystal.left{left:5px}.lunea-v22-crystal.right{right:5px;transform:scaleX(-1)}
      .lunea-v22-crystal i{position:absolute;bottom:0;display:block;clip-path:polygon(50% 0,100% 32%,78% 100%,20% 100%,0 32%);border:1px solid rgba(239,235,255,.34);background:linear-gradient(145deg,rgba(241,229,255,.68),rgba(141,183,226,.43) 45%,rgba(202,158,231,.32) 72%,rgba(255,211,230,.30));box-shadow:inset 0 0 9px rgba(255,255,255,.18)}
      .lunea-v22-crystal i:nth-child(1){left:4px;width:19px;height:37px;transform:rotate(-8deg)}
      .lunea-v22-crystal i:nth-child(2){left:23px;width:22px;height:48px}
      .lunea-v22-crystal i:nth-child(3){left:44px;width:15px;height:29px;transform:rotate(8deg)}

      .lunea-v22-title-panel{
        position:relative;z-index:4;margin:0 2px 13px;padding:18px 14px 14px;border-radius:23px;text-align:center;
        border:1px solid rgba(229,231,245,.25);
        background:
          radial-gradient(circle at 50% 0%,rgba(218,199,255,.12),transparent 32%),
          linear-gradient(155deg,rgba(32,36,72,.80),rgba(14,17,40,.82));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.10),inset 0 0 28px rgba(182,159,231,.035),0 11px 26px rgba(0,0,0,.20),0 0 18px rgba(164,137,222,.07)
      }
      .lunea-v22-title-panel::before{
        content:'';position:absolute;inset:5px;border:1px solid rgba(222,222,242,.08);border-radius:18px;pointer-events:none
      }
      .lunea-v22-title-panel::after{
        content:'✦';position:absolute;left:50%;top:4px;transform:translate(-50%,-50%);color:#f3ecff;font-size:12px;text-shadow:0 0 9px rgba(221,201,255,.85);background:#141731;padding:0 8px
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6 .lunea-v22-title-panel>h3{
        margin:0!important;color:#f8f6ff!important;font:500 30px/1.08 'Cinzel','Noto Serif KR',serif!important;letter-spacing:1.5px!important;
        text-shadow:0 0 18px rgba(220,201,255,.25),0 0 28px rgba(122,183,217,.08)!important
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6 .lunea-v22-title-panel>h3::before{
        content:'LUNEA · CELESTIAL DAILY'!important;display:block!important;margin:0 0 8px!important;color:#c7bddf!important;font:700 8px/1 'Cinzel',serif!important;letter-spacing:2.2px!important
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6 .lunea-v22-title-panel>p{
        margin:8px 0 0!important;color:#c1bfd0!important;font-size:11px!important;line-height:1.5!important
      }
      .lunea-v22-title-panel .lunea-daily-lock-note{display:none!important}

      html.lunea-daily-celestial-v22 .lunea-daily-six-grid{
        position:relative;z-index:4;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:0 1px 12px!important
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis{
        min-height:124px!important;padding:9px 5px 10px!important;border-radius:19px!important;
        border:1px solid rgba(226,229,244,.20)!important;
        background:
          radial-gradient(circle at 50% 29%,rgba(226,210,255,.13),transparent 26%),
          radial-gradient(circle at 80% 86%,rgba(111,184,214,.055),transparent 29%),
          linear-gradient(157deg,rgba(28,34,69,.91),rgba(8,11,29,.96))!important;
        animation:luneaV22TileGlow 8s ease-in-out infinite
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis:nth-child(2n){animation-delay:-2.6s}
      html.lunea-daily-celestial-v22 .lunea-daily-axis:nth-child(3n){animation-delay:-5.2s}
      html.lunea-daily-celestial-v22 .lunea-daily-axis::before{
        content:'';position:absolute;inset:4px;border:1px solid rgba(230,228,247,.055);border-radius:15px;pointer-events:none
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis::after{
        content:'';position:absolute;left:17%;right:17%;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(247,242,255,.50),rgba(162,210,230,.18),transparent);box-shadow:0 0 6px rgba(218,200,255,.28)
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis .axis-num{position:relative;z-index:2;color:#d2cbe3!important;font:500 13px/1 'Cinzel',serif!important;letter-spacing:.3px!important}
      html.lunea-daily-celestial-v22 .lunea-daily-axis .axis-icon{
        position:relative;z-index:2;width:45px!important;height:45px!important;margin:8px auto 6px!important;border-radius:50%;display:grid;place-items:center;
        color:#f0e8ff!important;
        background:radial-gradient(circle,rgba(235,223,255,.18),rgba(133,162,217,.05) 48%,transparent 70%);
        filter:drop-shadow(0 0 9px rgba(218,198,255,.38)) drop-shadow(0 0 16px rgba(117,190,216,.09))!important
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis .axis-icon::before{
        content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid rgba(223,215,246,.12);box-shadow:0 0 0 5px rgba(150,175,222,.018)
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis .axis-icon svg{width:34px!important;height:34px!important;stroke-width:1.05!important}
      html.lunea-daily-celestial-v22 .lunea-daily-axis b{
        position:relative;z-index:2;min-height:23px!important;color:#faf8ff!important;font:600 9px/1.17 'Cinzel',serif!important;letter-spacing:.25px!important;text-shadow:0 0 9px rgba(215,198,255,.12)
      }
      html.lunea-daily-celestial-v22 .lunea-daily-axis span{position:relative;z-index:2;margin-top:3px!important;color:#b5b2c3!important;font-size:8.4px!important;line-height:1.25!important}
      html.lunea-daily-celestial-v22 .lunea-daily-axis:nth-child(5) b{font-size:7.2px!important;letter-spacing:.02px!important}

      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6>#dailyBtn{
        position:relative!important;z-index:5!important;overflow:hidden!important;min-height:59px!important;margin:0 1px!important;border-radius:20px!important;
        color:#26213d!important;font-size:14px!important;font-weight:850!important;letter-spacing:.05px!important;
        background:
          radial-gradient(circle at 15% 20%,rgba(255,255,255,.74),transparent 19%),
          linear-gradient(108deg,#eee5ff 0%,#c9b8f2 22%,#eef0f6 44%,#a8d7e8 62%,#f1d8ea 80%,#c8b5f4 100%)!important;
        background-size:180% 180%!important;
        border:1px solid rgba(255,255,255,.62)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.78),inset 0 -1px 0 rgba(118,102,170,.12),0 12px 31px rgba(83,70,145,.31),0 0 31px rgba(202,181,247,.22),0 0 18px rgba(128,201,224,.11)!important
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6>#dailyBtn::before{
        content:'';position:absolute;top:-55%;bottom:-55%;left:-30%;width:28%;pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),rgba(217,237,248,.30),transparent);filter:blur(4px);animation:luneaV22ButtonSweep 6.5s ease-in-out infinite
      }
      html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6>#dailyBtn::after{content:'→'!important;margin-left:11px!important;width:29px;height:29px;border-radius:50%;display:inline-grid;place-items:center;border:1px solid rgba(79,68,130,.28);font-size:17px!important;line-height:1!important}

      .lunea-v22-daily-foot{
        position:relative;z-index:4;display:flex;align-items:center;justify-content:center;gap:7px;margin:11px 2px 1px;color:#a9a8bb;font-size:9.4px;line-height:1.35;text-align:center
      }
      .lunea-v22-daily-foot::before{content:'◷';color:#d6c8ef;font-size:13px;text-shadow:0 0 8px rgba(208,189,247,.25)}
      .lunea-v22-daily-foot::after{content:'✦';color:#a9c8d8;font-size:8px;margin-left:2px;text-shadow:0 0 7px rgba(159,207,225,.25)}

      @media(max-width:390px){
        .lunea-v22-sky{height:139px}.lunea-v22-moon{width:72px;height:72px;top:17px}.lunea-v22-moon::before{width:69px;height:69px;left:24px}
        .lunea-v22-crystal{transform:scale(.88);transform-origin:bottom left}.lunea-v22-crystal.right{transform:scaleX(-1) scale(.88);transform-origin:bottom right}
        html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6 .lunea-v22-title-panel>h3{font-size:27px!important}
        html.lunea-daily-celestial-v22 .lunea-daily-six-grid{gap:6px!important}
        html.lunea-daily-celestial-v22 .lunea-daily-axis{min-height:116px!important;padding-left:3px!important;padding-right:3px!important}
        html.lunea-daily-celestial-v22 .lunea-daily-axis .axis-icon{width:41px!important;height:41px!important}.lunea-daily-axis .axis-icon svg{width:31px!important;height:31px!important}
        html.lunea-daily-celestial-v22 .lunea-daily-axis b{font-size:8.2px!important}.lunea-daily-axis span{font-size:7.8px!important}.lunea-daily-axis:nth-child(5) b{font-size:6.6px!important}
      }
      @media(prefers-reduced-motion:reduce){
        .lunea-v22-moon,.lunea-v22-water,.lunea-v22-starburst,html.lunea-daily-celestial-v22 .lunea-daily-axis,html.lunea-daily-celestial-v22 .daily.lunea-daily-orbit6>#dailyBtn::before{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function stageNode() {
    const stage = document.createElement('div');
    stage.className = 'lunea-v22-sky';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `
      <svg class="lunea-v22-constellation" viewBox="0 0 82 56"><path d="M4 39 19 20 36 31 50 12 72 19"/><circle cx="4" cy="39" r="1.3"/><circle cx="19" cy="20" r="1.7"/><circle cx="36" cy="31" r="1.3"/><circle cx="50" cy="12" r="1.5"/><circle cx="72" cy="19" r="1.2"/></svg>
      <div class="lunea-v22-orbit"></div>
      <div class="lunea-v22-moon"></div>
      <div class="lunea-v22-crystal left"><i></i><i></i><i></i></div>
      <div class="lunea-v22-crystal right"><i></i><i></i><i></i></div>
      <div class="lunea-v22-horizon"></div>
      <div class="lunea-v22-water"></div>
      <div class="lunea-v22-starburst"></div>`;
    return stage;
  }

  function decorate() {
    const daily = $('.daily.lunea-daily-orbit6') || $('.daily');
    const grid = $('.lunea-daily-six-grid', daily || document);
    const btn = $('#dailyBtn', daily || document);
    if (!daily || !grid || !btn) return false;

    daily.classList.add('lunea-daily-orbit6', 'lunea-daily-celestial-card');

    if (!$('.lunea-v22-sky', daily)) daily.insertBefore(stageNode(), daily.firstChild);

    let panel = $('.lunea-v22-title-panel', daily);
    if (!panel) {
      const h3 = $('h3', daily);
      const p = $('p', daily);
      panel = document.createElement('div');
      panel.className = 'lunea-v22-title-panel';
      if (h3) panel.appendChild(h3);
      if (p) panel.appendChild(p);
      daily.insertBefore(panel, grid);
    }

    let foot = $('.lunea-v22-daily-foot', daily);
    if (!foot) {
      foot = document.createElement('div');
      foot.className = 'lunea-v22-daily-foot';
      daily.insertBefore(foot, btn.nextSibling);
    }
    foot.textContent = weekend()
      ? '하루 1회 고정 · 주말 MONEY는 금전·재정 중심 · 자정에 새로 열림'
      : '하루 1회 고정 · 평일 MONEY는 금전·주식 흐름 포함 · 자정에 새로 열림';

    grid.querySelectorAll('.lunea-daily-axis').forEach(tile => tile.setAttribute('aria-hidden', 'true'));
    return true;
  }

  function boot() {
    addStyles();
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      if (decorate() || tries > 120) clearInterval(t);
    }, 80);
    decorate();
    window.addEventListener('pageshow', () => setTimeout(decorate, 0));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(decorate, 0); });
    console.info('🌙 LUNEA Daily Celestial V22 loaded · mockup-close visual layer');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
