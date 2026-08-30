'use strict';

/*
  LUNEA THAI ASTROLOGY STANDALONE V24
  ====================================
  Separates Thai Maha Taksa from tarot readings.

  - Hides the legacy Thai button / inline block inside tarot readings.
  - Adds a standalone Thai Astrology launcher to the Home portal.
  - Uses the existing /v1/thai/taksa API and saved Natal profile.
  - Lets the user choose a practical topic without needing a tarot question.
  - Keeps Thai Taksa independent from Western Transit / Return / Horary.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_STANDALONE_V24__) return;
  W.__LUNEA_THAI_STANDALONE_V24__ = true;
  document.documentElement.classList.add('lunea-thai-standalone-v24');

  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const LAST_KEY = 'LUNEA_THAI_STANDALONE_V24_LAST';
  const $ = id => document.getElementById(id);
  let selectedTopic = 'general';
  let result = null;

  const TOPICS = [
    ['general','오늘 전체'],
    ['학업','학업'],
    ['연애','대인·연애'],
    ['투자심리','금전·투자'],
    ['직장','직장·커리어'],
    ['연락','연락·소식']
  ];

  function safeJSON(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; }
    catch { return fallback; }
  }

  function apiUrl() {
    return String(localStorage.getItem(API_KEY) || '').trim().replace(/\/+$/,'');
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function localDay(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function addStyles() {
    if ($('luneaThaiStandaloneV24Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaThaiStandaloneV24Style';
    s.textContent = `
      #thaiTaksaBtn,#luneaThaiInline{display:none!important}

      .lunea-thai-home-tile{
        grid-column:1/-1!important;min-height:118px!important;padding:15px 16px!important;
        display:grid!important;grid-template-columns:58px minmax(0,1fr) auto!important;align-items:center!important;gap:13px!important;
        border-color:rgba(228,219,183,.18)!important;
        background:
          radial-gradient(circle at 10% 10%,rgba(244,225,169,.13),transparent 26%),
          radial-gradient(circle at 92% 90%,rgba(118,190,173,.08),transparent 30%),
          linear-gradient(148deg,rgba(30,31,46,.94),rgba(9,13,25,.985))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 12px 28px rgba(0,0,0,.17),0 0 24px rgba(198,171,107,.055)!important
      }
      .lunea-thai-home-tile .thai-v24-orb{
        width:56px;height:56px;border-radius:19px;display:grid;place-items:center;position:relative;color:#efe0ad;
        border:1px solid rgba(237,221,177,.22);
        background:radial-gradient(circle at 32% 24%,rgba(255,255,255,.24),transparent 18%),linear-gradient(145deg,rgba(209,182,115,.18),rgba(84,132,120,.10));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 22px rgba(215,186,119,.08)
      }
      .lunea-thai-home-tile .thai-v24-orb svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
      .lunea-thai-home-tile .thai-v24-copy{text-align:left;min-width:0}
      .lunea-thai-home-tile .thai-v24-copy small{display:block;color:#b9aa82;font:700 7.7px 'Cinzel',serif;letter-spacing:1.6px;margin-bottom:5px}
      .lunea-thai-home-tile .thai-v24-copy b{display:block;color:#f1eef4;font:650 13px/1.25 'Cinzel','Noto Serif KR',serif;letter-spacing:.5px}
      .lunea-thai-home-tile .thai-v24-copy span{display:block;color:#9293a4;font-size:9.7px;line-height:1.45;margin-top:4px}
      .lunea-thai-home-tile .thai-v24-arrow{color:#c9bb91;font-size:20px;opacity:.78}

      #luneaThaiStandaloneOverlay{
        background:
          radial-gradient(circle at 50% 0%,rgba(181,151,91,.11),transparent 34%),
          rgba(4,5,12,.95)!important;
        backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)
      }
      #luneaThaiStandaloneModal{
        background:
          radial-gradient(circle at 92% 0%,rgba(208,180,111,.12),transparent 25%),
          radial-gradient(circle at 8% 38%,rgba(91,159,143,.07),transparent 28%),
          linear-gradient(161deg,#151521,#0b0e1a 70%,#080a13)!important;
        border-color:rgba(225,216,190,.16)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 28px 70px rgba(0,0,0,.72),0 0 34px rgba(190,159,93,.06)!important
      }
      .thai-v24-kicker{color:#c5b27d;font:700 8.5px 'Cinzel',serif;letter-spacing:1.9px;margin:2px 38px 5px 0}
      .thai-v24-title{margin:0 38px 5px 0;color:#f4f1f6;font:500 22px/1.25 'Noto Serif KR',serif}
      .thai-v24-sub{margin:0 0 13px;color:#9b9aaa;font-size:10.4px;line-height:1.55}
      .thai-v24-topic-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:10px 0 12px}
      .thai-v24-topic{
        min-height:39px;border-radius:11px;border:1px solid rgba(224,216,190,.10);background:rgba(255,255,255,.035);
        color:#aaa7b2;font-size:9.6px;font-weight:650
      }
      .thai-v24-topic.active{color:#f0e7cb;border-color:rgba(213,188,121,.34);background:linear-gradient(145deg,rgba(205,173,102,.12),rgba(85,143,129,.07));box-shadow:0 0 16px rgba(199,168,98,.055)}
      #luneaThaiStandaloneRun{
        background:linear-gradient(112deg,#e9dfc4,#c9b27a 38%,#d8e1d8 68%,#9fc7bc)!important;color:#25251f!important;
        border-color:rgba(255,255,255,.42)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.58),0 10px 25px rgba(89,75,46,.22),0 0 20px rgba(191,160,89,.09)!important
      }
      .thai-v24-status{margin:8px 1px;color:#9796a5;font-size:9.8px;line-height:1.5}
      .thai-v24-summary{padding:12px 13px;border-radius:15px;border:1px solid rgba(214,192,130,.14);background:linear-gradient(145deg,rgba(198,169,96,.07),rgba(82,139,126,.055));margin-top:10px}
      .thai-v24-summary small{display:block;color:#c7b37c;font:700 8px 'Cinzel',serif;letter-spacing:1.2px}
      .thai-v24-summary b{display:block;color:#f0edf3;font-size:13px;margin:4px 0}
      .thai-v24-summary span{display:block;color:#a2a0ad;font-size:10.2px;line-height:1.5}
      .thai-v24-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      .thai-v24-cell{padding:10px;border-radius:13px;border:1px solid rgba(222,218,203,.09);background:rgba(255,255,255,.032)}
      .thai-v24-cell.focus{border-color:rgba(120,190,169,.25);background:rgba(99,164,146,.055)}
      .thai-v24-cell.kala{border-color:rgba(211,129,131,.24);background:rgba(167,78,87,.045)}
      .thai-v24-cell small{display:block;color:#9b98a6;font-size:8.5px;margin-bottom:3px}
      .thai-v24-cell b{display:block;color:#eeeaf1;font-size:10.5px;line-height:1.35}
      .thai-v24-cell span{display:block;color:#8e8c9a;font-size:8.9px;line-height:1.4;margin-top:4px}
      .thai-v24-now{margin-top:9px;padding:11px 12px;border-radius:13px;border:1px solid rgba(215,193,131,.12);background:rgba(200,169,94,.045);color:#b4b0ba;font-size:9.8px;line-height:1.55}
      @media(max-width:380px){.thai-v24-topic-grid{grid-template-columns:1fr 1fr}.thai-v24-grid{grid-template-columns:1fr}.lunea-thai-home-tile{grid-template-columns:52px minmax(0,1fr) auto!important}.lunea-thai-home-tile .thai-v24-orb{width:50px;height:50px}}
    `;
    document.head.appendChild(s);
  }

  function removeLegacyReadingUI() {
    $('thaiTaksaBtn')?.remove();
    $('luneaThaiInline')?.remove();
  }

  function thaiIcon() {
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="12.5"/><circle cx="20" cy="20" r="4"/>
      <path d="M20 3.5v7M20 29.5v7M3.5 20h7M29.5 20h7M8.3 8.3l5 5M26.7 26.7l5 5M31.7 8.3l-5 5M13.3 26.7l-5 5"/>
      <path d="M20 12.7 22.1 18l5.2 2-5.2 2L20 27.3 17.9 22l-5.2-2 5.2-2Z"/>
    </svg>`;
  }

  function injectHomeTile() {
    if ($('luneaThaiHomeTileV24')) return true;
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid) return false;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'luneaThaiHomeTileV24';
    button.className = 'lunea-v8-tile lunea-thai-home-tile';
    button.innerHTML = `<span class="thai-v24-orb">${thaiIcon()}</span><span class="thai-v24-copy"><small>THAI ASTROLOGY · MAHA TAKSA</small><b>태국점성술</b><span>출생요일 · 8영역 · 오늘의 주제별 보조 흐름</span></span><span class="thai-v24-arrow">›</span>`;
    button.onclick = open;
    grid.appendChild(button);
    return true;
  }

  function injectOverlay() {
    if ($('luneaThaiStandaloneOverlay')) return;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'luneaThaiStandaloneOverlay';
    ov.setAttribute('aria-hidden','true');
    ov.innerHTML = `<div class="modal" id="luneaThaiStandaloneModal">
      <button class="close" id="luneaThaiStandaloneClose" aria-label="닫기">×</button>
      <div class="thai-v24-kicker">LUNEA · THAI ASTROLOGY</div>
      <h3 class="thai-v24-title">Maha Taksa(마하 탁사)</h3>
      <p class="thai-v24-sub">출생요일을 기준으로 8개 영역의 행성 배치를 읽는 태국 전통 체계야. Western Transit(서양 트랜짓)이나 Horary(호라리)와 섞지 않고 독립적으로 보여줘.</p>
      <div class="thai-v24-topic-grid" id="luneaThaiTopicGrid"></div>
      <button type="button" class="primary full-btn" id="luneaThaiStandaloneRun">오늘의 Taksa 계산</button>
      <div class="thai-v24-status" id="luneaThaiStandaloneStatus"></div>
      <div id="luneaThaiStandaloneResult"></div>
    </div>`;
    document.body.appendChild(ov);

    const topicGrid = $('luneaThaiTopicGrid');
    TOPICS.forEach(([value,label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'thai-v24-topic';
      b.dataset.topic = value;
      b.textContent = label;
      b.onclick = () => {
        selectedTopic = value;
        [...topicGrid.querySelectorAll('.thai-v24-topic')].forEach(x => x.classList.toggle('active', x === b));
        restoreLast();
      };
      topicGrid.appendChild(b);
    });
    topicGrid.querySelector('[data-topic="general"]')?.classList.add('active');

    $('luneaThaiStandaloneClose').onclick = close;
    ov.addEventListener('pointerup', e => { if (e.target === ov) close(); });
    $('luneaThaiStandaloneRun').onclick = run;
  }

  function open() {
    const natal = safeJSON(NATAL_KEY);
    if (!natal) return alert('먼저 서양점성술 프로필에서 Natal(네이탈·출생차트) 자동 계산을 완료해줘.');
    if (!apiUrl()) return alert('Astro Core API 주소를 확인해줘.');
    injectOverlay();
    restoreLast();
    const ov = $('luneaThaiStandaloneOverlay');
    ov.classList.add('show');
    ov.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  }

  function close() {
    const ov = $('luneaThaiStandaloneOverlay');
    ov?.classList.remove('show');
    ov?.setAttribute('aria-hidden','true');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  function saveLast(data) {
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({day:localDay(),topic:selectedTopic,result:data,savedAt:Date.now()}));
    } catch {}
  }

  function restoreLast() {
    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
      if (last && last.day === localDay() && last.topic === selectedTopic && last.result) {
        result = last.result;
        render();
        $('luneaThaiStandaloneStatus').textContent = '오늘 계산한 결과를 다시 불러왔어.';
        return true;
      }
    } catch {}
    result = null;
    if ($('luneaThaiStandaloneResult')) $('luneaThaiStandaloneResult').innerHTML = '';
    if ($('luneaThaiStandaloneStatus')) $('luneaThaiStandaloneStatus').textContent = `선택 주제: ${TOPICS.find(x => x[0] === selectedTopic)?.[1] || selectedTopic}`;
    return false;
  }

  async function run() {
    const natal = safeJSON(NATAL_KEY);
    const api = apiUrl();
    if (!natal || !api) return;
    const btn = $('luneaThaiStandaloneRun');
    btn.disabled = true;
    btn.textContent = 'Taksa 계산 중…';
    $('luneaThaiStandaloneStatus').textContent = '출생요일과 오늘의 요일 행성을 8영역에 대입하는 중…';
    try {
      const res = await fetch(`${api}/v1/thai/taksa`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({natal,topic:selectedTopic,current_iso:new Date().toISOString(),timezone:'Asia/Seoul'})
      });
      let data = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.detail || data?.message || `${res.status} ${res.statusText}`);
      result = data;
      saveLast(data);
      render();
      $('luneaThaiStandaloneStatus').textContent = '계산 완료 · Thai Taksa는 독립 보조체계로만 표시해.';
    } catch (err) {
      $('luneaThaiStandaloneStatus').textContent = '계산 실패: ' + (err?.message || err);
    } finally {
      btn.disabled = false;
      btn.textContent = '오늘의 Taksa 계산';
    }
  }

  function render() {
    const d = result;
    if (!d || !$('luneaThaiStandaloneResult')) return;
    const focus = new Set(d.question?.focus_positions || []);
    const focusRows = d.question?.focus_rows || [];
    const now = d.current_day?.falls_in_natal_taksa;

    let html = `<div class="thai-v24-summary"><small>BIRTH DAY RULER</small><b>${esc(d.birth?.weekday_label || '')} · ${esc(d.birth?.ruler?.ko || '')}(${esc(d.birth?.ruler?.key || '')}) · 행성번호 ${esc(d.birth?.planet_number || '')}</b><span>Taksa day boundary(탁사 날짜 경계) 06:00 현지시각 · 이번 주제 초점: ${focusRows.length ? focusRows.map(x => esc(x.position_ko)).join(' · ') : '전체 8영역'}</span></div>`;
    html += '<div class="thai-v24-grid">';
    (d.grid || []).forEach(row => {
      html += `<div class="thai-v24-cell ${focus.has(row.position) ? 'focus' : ''} ${row.position === 'Kalakini' ? 'kala' : ''}"><small>${esc(row.position)} · ${esc(row.position_thai || '')}</small><b>${esc(row.position_ko)} · ${esc(row.planet_ko)}(${esc(row.planet || row.planet_key || '')})</b><span>${esc(row.meaning_ko || '')}</span></div>`;
    });
    html += '</div>';
    if (now) {
      html += `<div class="thai-v24-now">오늘의 요일 행성 <b>${esc(d.current_day?.ruler?.ko || '')}(${esc(d.current_day?.ruler?.key || '')})</b>은 네 Natal Taksa(출생 탁사)에서 <b>${esc(now.position_ko)}(${esc(now.position)})</b> 영역에 들어와 있어.<br>${esc(now.meaning_ko || '')}<br><br>이 신호는 오늘의 상징적 보조 흐름이고, 사건 날짜나 결과를 확정하는 판정으로 사용하지 않아.</div>`;
    }
    $('luneaThaiStandaloneResult').innerHTML = html;
  }

  function boot() {
    addStyles();
    injectOverlay();
    removeLegacyReadingUI();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      removeLegacyReadingUI();
      if (injectHomeTile() || tries > 180) clearInterval(timer);
    }, 80);

    // Legacy Thai module can inject after this module on unusual load paths.
    const bodyObserver = new MutationObserver(() => removeLegacyReadingUI());
    if (document.body) bodyObserver.observe(document.body, {childList:true,subtree:true});
    setTimeout(() => bodyObserver.disconnect(), 12000);
  }

  W.LUNEA_THAI_STANDALONE_V24 = {open,run,getResult:() => result};

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
