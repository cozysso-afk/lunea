'use strict';

/*
  LUNEA DAILY ORBIT 6 V21
  =======================
  Functional + visual upgrade for the fixed daily tarot reading.

  Actual base spread (6 cards):
  1. OVERALL      · today's core flow
  2. VITAL        · condition / energy
  3. FOCUS        · study / work
  4. CONNECTION   · people / love
  5. MONEY        · weekday money & trading / weekend finance & spending
  6. SIGNAL       · variable / opportunity / caution / advice

  Reuses LUNEA Daily Lock V1 for same-day persistence, clarifiers, archive/draft
  compatibility and retry blocking. Existing legacy 4-card DAILY data is migrated
  once to the new 6-card format instead of being silently relabelled.
*/
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_ORBIT6_V21__) return;
  W.__LUNEA_DAILY_ORBIT6_V21__ = true;
  document.documentElement.classList.add('lunea-daily-orbit6-v21');

  const DAILY_KEY = 'LUNEA_DAILY_ORBIT_V1';
  const DRAFT_KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  const MIGRATION_KEY = 'LUNEA_DAILY_ORBIT6_MIGRATED_V21';
  const $ = id => document.getElementById(id);
  const getState = () => { try { return state; } catch { return null; } };

  function localDay(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function weekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }

  function positionsForToday() {
    const money = weekend()
      ? '5. MONEY · 금전·재정 · 소비·현금흐름'
      : '5. MONEY & TRADING · 금전·투자 · 수익실현·보유 판단 흐름';
    return [
      '1. OVERALL · 오늘의 핵심 흐름',
      '2. VITAL · 컨디션·에너지',
      '3. FOCUS · 학업·업무 · 집중·성취 흐름',
      '4. CONNECTION · 대인·연애 · 연락·교류 흐름',
      money,
      '6. SIGNAL · 변수·기회·주의점·조언'
    ];
  }

  function dailyQuestion() {
    return weekend()
      ? '오늘 하루 나의 전체 흐름, 컨디션, 학업·업무, 대인·연애, 금전·재정, 변수와 조언은 어떨까?'
      : '오늘 하루 나의 전체 흐름, 컨디션, 학업·업무, 대인·연애, 금전·투자와 수익실현 판단 흐름, 변수와 조언은 어떨까?';
  }

  function rationale() {
    const moneyRule = weekend()
      ? '주말 MONEY는 소비·재정·현금흐름 중심'
      : '평일 MONEY & TRADING은 수익실현·보유 판단 분위기·과욕·리스크 중심이며 정확한 가격/수익률 예언은 하지 않음';
    return `DAILY ORBIT 6 · 전체/컨디션/학업·업무/대인·연애/금전/변수의 6축 고정 배열 · ${moneyRule}`;
  }

  function validOrbit6(d) {
    return !!(d && d.day === localDay() && Array.isArray(d.drawn) && d.drawn.length >= 6 && Array.isArray(d.positions) && d.positions.length >= 6);
  }

  function rawStoredDaily() {
    try { return JSON.parse(localStorage.getItem(DAILY_KEY) || 'null'); }
    catch { return null; }
  }

  function clearLegacyFourCardOnce() {
    const d = rawStoredDaily();
    if (d && d.day === localDay() && Array.isArray(d.drawn) && d.drawn.length >= 6) return false;
    if (!d || d.day !== localDay() || !Array.isArray(d.drawn) || d.drawn.length < 4) return false;

    try {
      localStorage.removeItem(DAILY_KEY);
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft && draft.category === 'DAILY' && Array.isArray(draft.drawn) && draft.drawn.length < 6) {
        const draftDay = localDay(Number(draft.savedAt || 0));
        if (draftDay === localDay()) localStorage.removeItem(DRAFT_KEY);
      }
      localStorage.setItem(MIGRATION_KEY, JSON.stringify({day: localDay(), migratedAt: Date.now(), from: d.drawn.length, to: 6}));
      console.info(`🌙 LUNEA Daily Orbit 6 migrated legacy ${d.drawn.length}-card daily`);
      return true;
    } catch (err) {
      console.warn('[LUNEA Daily Orbit 6] legacy migration failed', err);
      return false;
    }
  }

  const ICONS = {
    overall: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8.1"/><ellipse cx="16" cy="16" rx="13" ry="5.1"/><path d="M16 3.6v2.2M16 26.2v2.2M3.8 16H6m20 0h2.2"/></svg>',
    vital: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M21.8 6.2a10.7 10.7 0 1 0 4 16.7A9.2 9.2 0 0 1 21.8 6.2Z"/><path d="M8.5 23.8c2.2-2.5 4.8-3.7 7.7-3.7"/></svg>',
    focus: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5.5 8.2c4.3-.6 7.6.3 10.5 2.7v14c-2.9-2.3-6.3-3.2-10.5-2.6Z"/><path d="M26.5 8.2c-4.3-.6-7.6.3-10.5 2.7v14c2.9-2.3 6.3-3.2 10.5-2.6Z"/><path d="m23.8 4.4.8 1.9 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/></svg>',
    connection: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12.3 8.2a7.6 7.6 0 1 0 0 15.6 8.7 8.7 0 0 1 0-15.6Z"/><path d="M19.7 8.2a7.6 7.6 0 1 1 0 15.6 8.7 8.7 0 0 0 0-15.6Z"/><path d="M16 20.9s-4.2-2.3-4.2-5.2c0-2.3 2.9-3.2 4.2-1.2 1.3-2 4.2-1.1 4.2 1.2 0 2.9-4.2 5.2-4.2 5.2Z"/></svg>',
    money: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v21M8 10h16M5.5 24.5h21"/><path d="m8 10-4 8h8l-4-8Zm16 0-4 8h8l-4-8Z"/><path d="m19 22 3-3 2 1.3 3.5-4.3"/></svg>',
    signal: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="17" r="8.8"/><path d="M11 26h10M13 28.2h6"/><path d="m16 4 .8 2.2L19 7l-2.2.8L16 10l-.8-2.2L13 7l2.2-.8Z"/><path d="M11.7 17.4c1.2-3.6 4.1-5.3 8.2-4.5"/></svg>'
  };

  const AXES = [
    ['01', 'overall', 'OVERALL', '전체 흐름'],
    ['02', 'vital', 'VITAL', '컨디션 · 에너지'],
    ['03', 'focus', 'FOCUS', '학업 · 업무'],
    ['04', 'connection', 'CONNECTION', '대인 · 연애'],
    ['05', 'money', weekend() ? 'MONEY' : 'MONEY & TRADING', weekend() ? '금전 · 재정' : '금전 · 투자'],
    ['06', 'signal', 'SIGNAL', '변수 · 조언']
  ];

  function addStyles() {
    if ($('luneaDailyOrbit6V21Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaDailyOrbit6V21Style';
    style.textContent = `
      @keyframes luneaDaily21Halo{
        0%,100%{filter:drop-shadow(0 0 8px rgba(197,179,246,.12));opacity:.82}
        50%{filter:drop-shadow(0 0 18px rgba(200,181,250,.29)) drop-shadow(0 0 10px rgba(125,196,219,.13));opacity:1}
      }
      @keyframes luneaDaily21Sweep{
        0%,20%{transform:translateX(-155%) skewX(-17deg);opacity:0}
        34%{opacity:.18}55%{opacity:.48}72%{opacity:.06}
        80%,100%{transform:translateX(175%) skewX(-17deg);opacity:0}
      }
      @keyframes luneaDaily21Moon{
        0%,100%{box-shadow:inset -9px -9px 16px rgba(81,70,119,.30),inset 6px 6px 14px rgba(255,255,255,.42),0 0 20px rgba(219,204,255,.21)}
        50%{box-shadow:inset -9px -9px 16px rgba(81,70,119,.28),inset 6px 6px 14px rgba(255,255,255,.48),0 0 34px rgba(221,205,255,.36),0 0 22px rgba(132,204,225,.14)}
      }

      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6{
        position:relative!important;display:block!important;overflow:hidden!important;
        min-height:0!important;margin-bottom:27px!important;padding:23px 17px 17px!important;border-radius:31px!important;
        border:1px solid rgba(231,233,246,.22)!important;
        background:
          radial-gradient(circle at 83% 7%,rgba(222,205,255,.20),transparent 23%),
          radial-gradient(circle at 9% 70%,rgba(106,181,208,.10),transparent 29%),
          radial-gradient(circle at 84% 95%,rgba(244,205,229,.065),transparent 29%),
          linear-gradient(151deg,rgba(27,30,60,.97),rgba(10,13,31,.992) 58%,rgba(6,8,20,.997))!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.12),
          inset 0 0 42px rgba(176,151,229,.035),
          0 22px 54px rgba(0,0,0,.31),
          0 0 39px rgba(147,119,214,.10),
          0 0 28px rgba(93,169,200,.045)!important;
      }
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6::before{
        content:''!important;display:block!important;position:absolute!important;inset:0!important;pointer-events:none!important;opacity:.52!important;
        background-image:
          radial-gradient(circle at 8% 10%,rgba(255,255,255,.72) 0 1px,transparent 1.6px),
          radial-gradient(circle at 23% 28%,rgba(207,219,247,.56) 0 1px,transparent 1.5px),
          radial-gradient(circle at 66% 15%,rgba(239,229,255,.55) 0 1px,transparent 1.5px),
          radial-gradient(circle at 92% 35%,rgba(255,255,255,.52) 0 1px,transparent 1.5px),
          radial-gradient(circle at 78% 72%,rgba(199,183,242,.47) 0 1px,transparent 1.5px),
          radial-gradient(circle at 17% 91%,rgba(180,222,235,.36) 0 1px,transparent 1.5px)!important;
      }
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6::after{
        content:''!important;display:block!important;position:absolute!important;top:-44%;bottom:-44%;left:-26%;width:30%;pointer-events:none!important;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.19),rgba(201,225,242,.12),rgba(224,202,250,.11),transparent)!important;
        filter:blur(4px);animation:luneaDaily21Sweep 8.8s ease-in-out infinite!important;
      }
      html.lunea-daily-orbit6-v21 .daily .lunea-daily-relic-v8{display:none!important}
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>h3,
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>p,
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>#dailyBtn,
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>.lunea-daily-six-grid{position:relative!important;z-index:4!important}
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>h3{
        margin:2px 82px 6px 0!important;color:#f8f5ff!important;
        font:500 26px/1.16 'Cinzel','Noto Serif KR',serif!important;letter-spacing:1.4px!important;
        text-shadow:0 0 18px rgba(211,194,255,.14)!important;
      }
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>h3::before{
        content:'LUNEA · CELESTIAL DAILY'!important;display:block!important;margin-bottom:7px!important;
        color:#c4b7df!important;font:700 8.5px/1 'Cinzel',serif!important;letter-spacing:2.1px!important;
      }
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>p{
        max-width:none!important;margin:0 76px 15px 0!important;color:#aaaabd!important;font-size:10.8px!important;line-height:1.58!important;
      }
      .lunea-daily-orbit6-moon{
        position:absolute;z-index:3;right:22px;top:24px;width:51px;height:51px;border-radius:50%;pointer-events:none;
        background:linear-gradient(145deg,#fbfbff 0%,#ddd9ed 38%,#9e96bd 72%,#645b89 100%);
        animation:luneaDaily21Moon 6.8s ease-in-out infinite
      }
      .lunea-daily-orbit6-moon::before{
        content:'';position:absolute;width:47px;height:47px;border-radius:50%;left:17px;top:-2px;
        background:#141831;box-shadow:-3px 2px 7px rgba(14,17,38,.75)
      }
      .lunea-daily-orbit6-moon::after{
        content:'';position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(224,226,242,.16);
        box-shadow:0 0 0 9px rgba(203,191,239,.026),0 0 0 18px rgba(133,176,209,.016)
      }

      .lunea-daily-six-grid{
        display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;margin:0 0 11px!important;
      }
      .lunea-daily-axis{
        position:relative;overflow:hidden;min-width:0;min-height:105px;padding:9px 5px 8px;border-radius:17px;text-align:center;
        border:1px solid rgba(227,230,243,.15);
        background:
          radial-gradient(circle at 50% 15%,rgba(225,211,255,.115),transparent 28%),
          linear-gradient(157deg,rgba(27,31,59,.80),rgba(8,11,27,.88));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 7px 17px rgba(0,0,0,.18)
      }
      .lunea-daily-axis::after{
        content:'';position:absolute;left:8px;right:8px;top:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(239,238,250,.27),rgba(177,216,232,.11),transparent)
      }
      .lunea-daily-axis .axis-num{color:#8f90a4;font:700 7px 'Cinzel',serif;letter-spacing:1.1px}
      .lunea-daily-axis .axis-icon{
        width:33px;height:33px;margin:6px auto 5px;color:#e7ddff;animation:luneaDaily21Halo 6.4s ease-in-out infinite
      }
      .lunea-daily-axis:nth-child(2n) .axis-icon{animation-delay:-2.1s}.lunea-daily-axis:nth-child(3n) .axis-icon{animation-delay:-4.2s}
      .lunea-daily-axis .axis-icon svg{display:block;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}
      .lunea-daily-axis b{display:block;min-height:20px;color:#f2eff9;font:650 8.5px/1.15 'Cinzel',serif;letter-spacing:.45px;word-break:normal}
      .lunea-daily-axis span{display:block;margin-top:3px;color:#9d9caf;font-size:8.3px;line-height:1.25}
      .lunea-daily-axis:nth-child(5) b{font-size:7.3px;letter-spacing:.18px}

      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>#dailyBtn{
        position:relative!important;inset:auto!important;right:auto!important;bottom:auto!important;display:flex!important;
        width:100%!important;min-height:52px!important;margin:0!important;padding:12px 15px!important;align-items:center!important;justify-content:center!important;
        border-radius:17px!important;color:#28203f!important;font-size:13px!important;font-weight:800!important;
        background-size:250% 250%!important;
        background-image:linear-gradient(112deg,#eee3ff 0%,#bca8ed 23%,#e4e8f2 46%,#9acfe5 67%,#efd6ea 84%,#c9b6f2 100%)!important;
        border:1px solid rgba(255,255,255,.47)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.68),0 10px 28px rgba(91,76,156,.28),0 0 27px rgba(199,177,245,.16),0 0 16px rgba(137,201,221,.08)!important;
      }
      html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>#dailyBtn::after{content:'→';margin-left:9px;font-size:17px;font-weight:500}
      html.lunea-daily-orbit6-v21 .daily .lunea-daily-lock-note{
        display:block!important;margin-top:5px!important;color:rgba(198,201,220,.73)!important;font-size:9.2px!important;letter-spacing:.1px!important
      }

      #spreadOverlay[data-daily-orbit="6"] .spread-rationale{
        border-color:rgba(193,179,231,.14)!important;
        background:linear-gradient(145deg,rgba(160,135,215,.075),rgba(98,156,190,.035))!important;
      }
      #spreadOverlay[data-daily-orbit="6"] #cards{
        padding:10px 5px 14px!important;border-radius:22px!important;
        background:radial-gradient(circle at 50% 0%,rgba(170,143,226,.055),transparent 35%)!important
      }
      #spreadOverlay[data-daily-orbit="6"] .tarot-card-wrapper{
        filter:drop-shadow(0 9px 17px rgba(0,0,0,.30)) drop-shadow(0 0 10px rgba(169,143,226,.045))
      }

      @media(max-width:390px){
        html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6{padding:21px 14px 15px!important}
        html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>h3{font-size:23px!important;margin-right:70px!important}
        html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6>p{margin-right:62px!important;font-size:10.2px!important}
        .lunea-daily-orbit6-moon{right:18px;top:23px;width:45px;height:45px}.lunea-daily-orbit6-moon::before{width:42px;height:42px;left:15px}
        .lunea-daily-six-grid{gap:6px!important}.lunea-daily-axis{min-height:99px;padding-left:4px;padding-right:4px}.lunea-daily-axis .axis-icon{width:30px;height:30px}.lunea-daily-axis b{font-size:8px}.lunea-daily-axis span{font-size:7.8px}.lunea-daily-axis:nth-child(5) b{font-size:6.9px}
      }
      @media(prefers-reduced-motion:reduce){
        html.lunea-daily-orbit6-v21 .daily.lunea-daily-orbit6::after,.lunea-daily-orbit6-moon,.lunea-daily-axis .axis-icon{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function renderHome() {
    const daily = document.querySelector('.daily');
    const btn = $('dailyBtn');
    if (!daily || !btn) return false;
    daily.classList.add('lunea-daily-orbit6');

    const h3 = daily.querySelector('h3');
    const p = daily.querySelector('p');
    if (h3) h3.textContent = 'DAILY ORBIT 6';
    if (p) {
      p.replaceChildren(document.createTextNode('오늘을 여섯 개의 실제 생활 축으로 읽는 고정 데일리 리딩.'));
      const note = document.createElement('span');
      note.className = 'lunea-daily-lock-note';
      note.textContent = weekend()
        ? '하루 1회 고정 · 주말 MONEY는 금전·재정 중심 · 자정에 새로 열림'
        : '하루 1회 고정 · 평일 MONEY는 금전·주식 흐름 포함 · 자정에 새로 열림';
      p.appendChild(note);
      p.dataset.dailyLockCopy = '1';
    }

    if (!daily.querySelector('.lunea-daily-orbit6-moon')) {
      const moon = document.createElement('div');
      moon.className = 'lunea-daily-orbit6-moon';
      moon.setAttribute('aria-hidden', 'true');
      daily.prepend(moon);
    }

    let grid = daily.querySelector('.lunea-daily-six-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'lunea-daily-six-grid';
      grid.setAttribute('aria-label', 'DAILY ORBIT 6 카드 포지션');
      AXES.forEach(([num, icon, en, ko]) => {
        const tile = document.createElement('div');
        tile.className = 'lunea-daily-axis';
        tile.innerHTML = `<div class="axis-num">${num}</div><div class="axis-icon">${ICONS[icon]}</div><b>${en}</b><span>${ko}</span>`;
        grid.appendChild(tile);
      });
      daily.insertBefore(grid, btn);
    }

    const stored = rawStoredDaily();
    btn.textContent = validOrbit6(stored) ? '오늘의 카드 다시 보기' : '오늘의 카드 열기';
    btn.dataset.dailyLocked = validOrbit6(stored) ? '1' : '0';
    return true;
  }

  function decorateReading() {
    const s = getState();
    const overlay = $('spreadOverlay');
    if (!overlay) return;
    if (s?.category === 'DAILY' && Array.isArray(s.positions) && s.positions.length >= 6) {
      overlay.dataset.dailyOrbit = '6';
      if ($('spreadType')) $('spreadType').textContent = 'DAILY ORBIT 6';
      const retry = $('retry');
      if (retry) retry.setAttribute('aria-label', '데일리 기본 6장은 오늘 하루 고정');
    } else {
      delete overlay.dataset.dailyOrbit;
    }
  }

  function drawOrbit6() {
    const s = getState();
    const start = W.startSpread || (typeof startSpread === 'function' ? startSpread : null);
    if (!s || typeof start !== 'function') {
      alert('DAILY ORBIT 6 카드 펼치기 함수를 찾지 못했어. 페이지를 새로 열고 다시 시도해줘.');
      return false;
    }

    s.category = 'DAILY';
    s.title = 'DAILY ORBIT 6';
    s.desc = '오늘의 전체 흐름부터 금전·투자와 변수까지 여섯 축으로 읽는 데일리 리딩';
    s.count = 6;
    s.isAi = false;
    s.allowReversed = false;
    s.__luneaDailyOrbit6 = true;

    start(dailyQuestion(), positionsForToday(), 'DAILY ORBIT 6', rationale());
    requestAnimationFrame(() => {
      decorateReading();
      try { W.LUNEA_DAILY_ORBIT_V1?.saveNow?.(); } catch {}
      setTimeout(() => {
        renderHome();
        decorateReading();
      }, 120);
    });
    return true;
  }

  function openDaily() {
    clearLegacyFourCardOnce();
    const lock = W.LUNEA_DAILY_ORBIT_V1;
    let stored = null;
    try { stored = lock?.read?.() || rawStoredDaily(); } catch { stored = rawStoredDaily(); }

    if (validOrbit6(stored) && typeof lock?.restoreToday === 'function') {
      lock.restoreToday();
      requestAnimationFrame(() => {
        decorateReading();
        renderHome();
      });
      return;
    }
    drawOrbit6();
  }

  function install() {
    addStyles();
    clearLegacyFourCardOnce();
    const btn = $('dailyBtn');
    if (!btn || !W.LUNEA_DAILY_ORBIT_V1) return false;
    if (!btn.__luneaDailyOrbit6Wrapped) {
      btn.__luneaDailyOrbit6Prior = btn.onclick;
      btn.onclick = openDaily;
      btn.__luneaDailyOrbit6Wrapped = true;
    }
    renderHome();

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        clearLegacyFourCardOnce();
        renderHome();
        decorateReading();
      }
    });
    W.addEventListener('focus', renderHome);

    const msToMidnight = () => {
      const n = new Date(), next = new Date(n);
      next.setHours(24, 0, 2, 0);
      return Math.max(1000, next - n);
    };
    const armMidnight = () => setTimeout(() => {
      renderHome();
      armMidnight();
    }, msToMidnight());
    armMidnight();

    W.LUNEA_DAILY_ORBIT6_V21 = {
      version: 21,
      positions: positionsForToday,
      question: dailyQuestion,
      draw: drawOrbit6,
      open: openDaily,
      isWeekend: weekend
    };
    console.info('🌙 LUNEA DAILY ORBIT 6 V21 loaded · 6 life axes + weekday trading / weekend finance');
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 160) clearInterval(timer);
    }, 80);
    install();
  }

  if (document.readyState === 'complete') setTimeout(boot, 0);
  else W.addEventListener('load', boot, {once: true});
})();
