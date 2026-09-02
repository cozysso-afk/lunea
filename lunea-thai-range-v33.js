'use strict';

/*
  LUNEA THAI TAKSA RANGE V33
  ==========================
  Adds a 7 / 14 / 30 day / custom-date Taksa calendar without pretending that
  weekday-ruler Taksa is an astronomical transit scan.

  - Standalone Thai home: period controls under the existing Maha Taksa result.
  - Tarot reading: optional "Thai 기간" button + question-scoped inline summary.
  - No automatic API request. Every period calculation is user initiated.
  - Tarot period evidence is appended to promptString before Final Priority V2.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_RANGE_V33__) return;
  W.__LUNEA_THAI_RANGE_V33__ = true;

  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const STYLE_ID = 'luneaThaiRangeV33Style';
  const TAROT_BUTTON_ID = 'luneaThaiTarotRangeBtn';
  const TAROT_INLINE_ID = 'luneaThaiRangeInline';
  const TAROT_OVERLAY_ID = 'luneaThaiRangeOverlay';
  const STANDALONE_PANEL_ID = 'luneaThaiStandaloneRangeV33';
  const MAX_DAYS = 90;

  const tarotState = {
    question: '',
    topic: 'general',
    result: null,
    running: false,
    renderSignature: '',
  };

  const standaloneState = {
    topic: 'general',
    result: null,
    running: false,
  };

  const $ = id => document.getElementById(id);

  function safeJSON(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; }
    catch { return fallback; }
  }

  function apiUrl() {
    return String(localStorage.getItem(API_KEY) || '').trim().replace(/\/+$/,'');
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function currentQuestion() {
    let value = '';
    try { value = W.state?.question || ''; } catch {}
    if (!value) {
      try { value = state?.question || ''; } catch {}
    }
    return String(value || '').trim();
  }

  function inferTopic(question) {
    const fromBridge = W.LUNEA_THAI_TAROT_BRIDGE_V32?.inferTopic;
    if (typeof fromBridge === 'function') return fromBridge(question);
    const q = String(question || '');
    if (/재회|다시\s*만나|구남친|구여친|전남친|전여친|전애인/.test(q)) return '재회';
    if (/시험|합격|불합격|면접|점수|발표/.test(q)) return '시험';
    if (/공부|학업|복습|강의|암기|회독/.test(q)) return '학업';
    if (/이직|퇴사|커리어\s*전환|옮길/.test(q)) return '이직';
    if (/직장|회사|업무|승진|평판/.test(q)) return '직장';
    if (/주식|코인|투자|매수|매도|익절|손절/.test(q)) return '투자심리';
    if (/금전|돈|재물|수입|지출|재정/.test(q)) return '금전';
    if (/연애|소개팅|호감|썸|데이트|사귀|좋아하/.test(q)) return '연애';
    if (/소식|문서|메일|통보/.test(q)) return '소식';
    if (/연락|카톡|답장|메시지|전화|DM|디엠/.test(q)) return '연락';
    return 'general';
  }

  function standaloneTopic() {
    return document.querySelector('#luneaThaiTopicGrid .thai-v24-topic.active')?.dataset?.topic || 'general';
  }

  function koreaDateString(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'
      }).formatToParts(date);
      const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
      return `${map.year}-${map.month}-${map.day}`;
    } catch {
      const y = date.getFullYear();
      const m = String(date.getMonth()+1).padStart(2,'0');
      const d = String(date.getDate()).padStart(2,'0');
      return `${y}-${m}-${d}`;
    }
  }

  function addDays(dateText, offset) {
    const [y,m,d] = String(dateText).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m-1, d));
    dt.setUTCDate(dt.getUTCDate() + Number(offset || 0));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
  }

  function inclusiveDays(startText, endText) {
    const a = Date.parse(`${startText}T00:00:00Z`);
    const b = Date.parse(`${endText}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
    return Math.floor((b-a)/86400000) + 1;
  }

  function toneLabel(tone) {
    const key = tone?.key || 'neutral';
    if (key === 'supportive') return '지원';
    if (key === 'caution') return '주의';
    return '중립';
  }

  function addStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${TAROT_BUTTON_ID}{border-color:rgba(220,195,128,.24)!important;background:linear-gradient(145deg,rgba(184,145,72,.08),rgba(87,144,133,.06))!important;color:#dbc99c!important}
      #${TAROT_BUTTON_ID}[aria-busy="true"]{opacity:.62;pointer-events:none}
      #${TAROT_INLINE_ID}{margin:8px auto 12px;max-width:360px;padding:10px 11px;border-radius:14px;border:1px solid rgba(213,185,117,.17);background:linear-gradient(145deg,rgba(213,180,98,.06),rgba(77,142,126,.06));cursor:pointer;text-align:left}
      #${TAROT_INLINE_ID} small{display:block;color:#d4b86f;font:700 8.2px 'Cinzel',serif;letter-spacing:.8px}
      #${TAROT_INLINE_ID} b{display:block;color:#f0edf3;font-size:11px;line-height:1.42;margin:3px 0}
      #${TAROT_INLINE_ID} span{display:block;color:#9b98a6;font-size:9.2px;line-height:1.5}

      .thai-v33-range-panel{margin-top:13px;padding:12px;border-radius:15px;border:1px solid rgba(213,190,126,.14);background:rgba(255,255,255,.025)}
      .thai-v33-range-kicker{color:#c5ae72;font:700 8px 'Cinzel',serif;letter-spacing:1.2px;margin-bottom:8px}
      .thai-v33-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
      .thai-v33-chip{min-height:34px;border-radius:10px;border:1px solid rgba(222,210,178,.12);background:rgba(255,255,255,.035);color:#aaa6b1;font-size:9.4px;font-weight:700}
      .thai-v33-chip.active{color:#f1e7c7;border-color:rgba(214,184,108,.34);background:rgba(200,163,80,.10)}
      .thai-v33-dates{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}
      .thai-v33-field{display:block;color:#8f8d99;font-size:8.3px;line-height:1.35}
      .thai-v33-field input{margin-top:4px;width:100%;box-sizing:border-box;min-height:34px;padding:6px 7px;border-radius:9px;border:1px solid rgba(220,215,199,.12);background:rgba(7,9,17,.7);color:#ded9e4;font-size:10px}
      .thai-v33-run{width:100%;min-height:38px;border-radius:11px;border:1px solid rgba(215,191,127,.22);background:linear-gradient(112deg,rgba(225,203,145,.92),rgba(169,150,96,.92),rgba(141,190,177,.85));color:#22231f;font-size:10px;font-weight:800}
      .thai-v33-status{min-height:16px;margin:7px 1px;color:#94929f;font-size:9px;line-height:1.45}
      .thai-v33-summary{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}
      .thai-v33-summary span{padding:4px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.08);font-size:8.5px;color:#aaa7b1;background:rgba(255,255,255,.03)}
      .thai-v33-list{display:grid;gap:6px;max-height:48vh;overflow:auto;-webkit-overflow-scrolling:touch;padding-right:1px}
      .thai-v33-day{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px;border-radius:11px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025)}
      .thai-v33-day.supportive{border-color:rgba(128,194,165,.18);background:rgba(99,161,137,.045)}
      .thai-v33-day.caution{border-color:rgba(213,126,139,.18);background:rgba(168,75,92,.04)}
      .thai-v33-date b{display:block;color:#e6e1ea;font-size:9.6px}.thai-v33-date small{display:block;color:#777785;font-size:7.8px;margin-top:2px}
      .thai-v33-main b{display:block;color:#d9d4df;font-size:9.5px;line-height:1.35}.thai-v33-main span{display:block;color:#8e8c99;font-size:8.3px;line-height:1.35;margin-top:2px}
      .thai-v33-tone{font-style:normal;font-size:8px;padding:3px 5px;border-radius:999px;color:#aaa7b1;border:1px solid rgba(255,255,255,.07)}
      .thai-v33-night{grid-column:2/-1;margin-top:2px;padding-top:5px;border-top:1px dashed rgba(255,255,255,.07);color:#9d94ac;font-size:8.3px;line-height:1.35}
      #${TAROT_OVERLAY_ID}{z-index:100020!important;background:rgba(4,5,12,.94)!important;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      #${TAROT_OVERLAY_ID} .modal{max-height:86vh;overflow:auto;-webkit-overflow-scrolling:touch}
      @media(max-width:380px){.thai-v33-dates{grid-template-columns:1fr}.thai-v33-day{grid-template-columns:58px minmax(0,1fr) auto}}
    `;
    document.head.appendChild(style);
  }

  function setQuickRange(startInput, endInput, days, root) {
    const start = startInput.value || koreaDateString();
    startInput.value = start;
    endInput.value = addDays(start, Number(days)-1);
    root?.querySelectorAll('.thai-v33-chip').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.days) === Number(days));
    });
  }

  function validateRange(startInput, endInput) {
    const start = startInput.value;
    const end = endInput.value;
    const days = inclusiveDays(start, end);
    if (!start || !end || !days) throw new Error('시작일과 종료일을 확인해줘.');
    if (days > MAX_DAYS) throw new Error(`Thai 기간은 최대 ${MAX_DAYS}일까지 볼 수 있어.`);
    return {start, end, days};
  }

  async function requestRange({topic, start, days}) {
    const natal = safeJSON(NATAL_KEY);
    if (!natal) throw new Error('먼저 Natal(네이탈·출생차트) 자동 계산을 완료해줘.');
    const api = apiUrl();
    if (!api) throw new Error('Astro Core API 주소를 확인해줘.');

    const response = await fetch(`${api}/v1/thai/taksa/range`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        natal,
        topic,
        start_iso:start,
        days,
        timezone:'Asia/Seoul',
      })
    });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data?.detail || data?.message || `${response.status} ${response.statusText}`);
    return data;
  }

  function renderCalendar(data, target) {
    if (!target || !data) return;
    const summary = data.summary || {};
    let html = `<div class="thai-v33-summary">
      <span>지원 ${Number(summary.supportive_segments || 0)}</span>
      <span>중립 ${Number(summary.neutral_segments || 0)}</span>
      <span>주의 ${Number(summary.caution_segments || 0)}</span>
      <span>질문 초점 ${Number(summary.focus_match_segments || 0)}</span>
    </div><div class="thai-v33-list">`;

    (data.calendar || []).forEach(entry => {
      const day = entry.daytime || {};
      const tone = day.tone?.key || 'neutral';
      const night = entry.night_variant;
      html += `<div class="thai-v33-day ${esc(tone)}">
        <div class="thai-v33-date"><b>${esc(entry.date || '')}</b><small>${esc(entry.weekday_label || '')} · 06:00 경계</small></div>
        <div class="thai-v33-main"><b>${esc(day.ruler?.ko || day.ruler?.key || '')} → ${esc(day.position_ko || day.position || '')}${day.focus_match ? ' · 질문초점' : ''}</b><span>${esc(day.meaning_ko || '')}</span></div>
        <em class="thai-v33-tone">${esc(toneLabel(day.tone))}</em>
        ${night ? `<div class="thai-v33-night">수요일 밤 분리 · ${esc(night.ruler?.ko || night.ruler?.key || '')} → ${esc(night.position_ko || night.position || '')} · ${esc(toneLabel(night.tone))}${night.focus_match ? ' · 질문초점' : ''}</div>` : ''}
      </div>`;
    });
    html += '</div>';
    target.innerHTML = html;
  }

  function injectStandaloneControls() {
    if ($(STANDALONE_PANEL_ID)) return true;
    const resultBox = $('luneaThaiStandaloneResult');
    if (!resultBox) return false;

    const panel = document.createElement('div');
    panel.id = STANDALONE_PANEL_ID;
    panel.className = 'thai-v33-range-panel';
    panel.innerHTML = `
      <div class="thai-v33-range-kicker">THAI TAKSA · PERIOD CALENDAR</div>
      <div class="thai-v33-quick">
        <button type="button" class="thai-v33-chip" data-days="7">7일</button>
        <button type="button" class="thai-v33-chip active" data-days="14">14일</button>
        <button type="button" class="thai-v33-chip" data-days="30">30일</button>
      </div>
      <div class="thai-v33-dates">
        <label class="thai-v33-field">시작일<input type="date" id="luneaThaiStandaloneRangeStart"></label>
        <label class="thai-v33-field">종료일<input type="date" id="luneaThaiStandaloneRangeEnd"></label>
      </div>
      <button type="button" class="thai-v33-run" id="luneaThaiStandaloneRangeRun">기간 흐름 보기</button>
      <div class="thai-v33-status" id="luneaThaiStandaloneRangeStatus">요일 지배행성의 Taksa 위치를 기간별로 정리해. 트랜짓과는 다른 달력이야.</div>
      <div id="luneaThaiStandaloneRangeResult"></div>`;
    resultBox.insertAdjacentElement('afterend', panel);

    const start = $('luneaThaiStandaloneRangeStart');
    const end = $('luneaThaiStandaloneRangeEnd');
    start.value = koreaDateString();
    setQuickRange(start, end, 14, panel);

    panel.querySelectorAll('.thai-v33-chip').forEach(btn => {
      btn.onclick = () => setQuickRange(start, end, Number(btn.dataset.days), panel);
    });
    start.onchange = () => {
      const active = panel.querySelector('.thai-v33-chip.active');
      const days = Number(active?.dataset?.days || 14);
      setQuickRange(start, end, days, panel);
    };
    end.onchange = () => panel.querySelectorAll('.thai-v33-chip').forEach(btn => btn.classList.remove('active'));
    $('luneaThaiStandaloneRangeRun').onclick = runStandaloneRange;

    const topicGrid = $('luneaThaiTopicGrid');
    topicGrid?.addEventListener('click', event => {
      if (!event.target?.closest?.('.thai-v24-topic')) return;
      standaloneState.result = null;
      $('luneaThaiStandaloneRangeResult').innerHTML = '';
      $('luneaThaiStandaloneRangeStatus').textContent = '주제가 바뀌었어. 새 기간 흐름을 계산해줘.';
    });
    return true;
  }

  async function runStandaloneRange() {
    if (standaloneState.running) return;
    const startInput = $('luneaThaiStandaloneRangeStart');
    const endInput = $('luneaThaiStandaloneRangeEnd');
    const status = $('luneaThaiStandaloneRangeStatus');
    const button = $('luneaThaiStandaloneRangeRun');
    try {
      const range = validateRange(startInput, endInput);
      const topic = standaloneTopic();
      standaloneState.running = true;
      standaloneState.topic = topic;
      button.disabled = true;
      button.textContent = '기간 계산 중…';
      status.textContent = `${range.days}일 Taksa 달력을 계산하는 중…`;
      const data = await requestRange({topic, start:range.start, days:range.days});
      standaloneState.result = data;
      renderCalendar(data, $('luneaThaiStandaloneRangeResult'));
      status.textContent = `${data.start_date}부터 ${data.days}일 · 지원/중립/주의는 Taksa 구조 신호이며 사건 확정일이 아니야.`;
    } catch (error) {
      status.textContent = '기간 계산 실패: ' + (error?.message || error);
    } finally {
      standaloneState.running = false;
      button.disabled = false;
      button.textContent = '기간 흐름 보기';
    }
  }

  function injectTarotButton() {
    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (!bar) return false;
    if ($(TAROT_BUTTON_ID)) return true;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = TAROT_BUTTON_ID;
    button.className = 'mini';
    button.textContent = '🇹🇭 Thai 기간';
    button.title = '현재 질문의 Thai Taksa 기간 달력 보기';
    button.onclick = openTarotRange;
    const currentThai = $('luneaThaiTarotBridgeBtn');
    if (currentThai?.parentNode === bar) bar.insertBefore(button, currentThai.nextSibling || null);
    else bar.appendChild(button);
    return true;
  }

  function injectTarotOverlay() {
    if ($(TAROT_OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.id = TAROT_OVERLAY_ID;
    overlay.className = 'overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `<div class="modal">
      <button class="close" id="luneaThaiRangeClose" aria-label="닫기">×</button>
      <div class="thai-v33-range-kicker">THAI ASTROLOGY · PERIOD SUPPORT</div>
      <h3 class="modal-h">🇹🇭 Thai Taksa 기간</h3>
      <p class="astro-transit-help">트랜짓처럼 천체 각을 스캔하는 기능은 아니고, 06:00 경계의 요일 지배행성이 네 출생 Taksa에서 어느 영역을 활성화하는지 기간별로 정리해.</p>
      <div class="thai-v33-range-panel">
        <div class="thai-v33-quick">
          <button type="button" class="thai-v33-chip" data-days="7">7일</button>
          <button type="button" class="thai-v33-chip active" data-days="14">14일</button>
          <button type="button" class="thai-v33-chip" data-days="30">30일</button>
        </div>
        <div class="thai-v33-dates">
          <label class="thai-v33-field">시작일<input type="date" id="luneaThaiTarotRangeStart"></label>
          <label class="thai-v33-field">종료일<input type="date" id="luneaThaiTarotRangeEnd"></label>
        </div>
        <button type="button" class="thai-v33-run" id="luneaThaiTarotRangeRun">현재 질문으로 기간 계산</button>
        <div class="thai-v33-status" id="luneaThaiTarotRangeStatus"></div>
        <div id="luneaThaiTarotRangeResult"></div>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    const start = $('luneaThaiTarotRangeStart');
    const end = $('luneaThaiTarotRangeEnd');
    start.value = koreaDateString();
    setQuickRange(start, end, 14, overlay);
    overlay.querySelectorAll('.thai-v33-chip').forEach(btn => {
      btn.onclick = () => setQuickRange(start, end, Number(btn.dataset.days), overlay);
    });
    start.onchange = () => {
      const active = overlay.querySelector('.thai-v33-chip.active');
      setQuickRange(start, end, Number(active?.dataset?.days || 14), overlay);
    };
    end.onchange = () => overlay.querySelectorAll('.thai-v33-chip').forEach(btn => btn.classList.remove('active'));
    $('luneaThaiTarotRangeRun').onclick = runTarotRange;
    $('luneaThaiRangeClose').onclick = closeTarotRange;
    overlay.addEventListener('pointerup', event => { if (event.target === overlay) closeTarotRange(); });
  }

  function openTarotRange() {
    const question = currentQuestion();
    if (!question) return alert('먼저 타로 질문을 입력하고 카드를 뽑아줘.');
    if (!safeJSON(NATAL_KEY)) return alert('먼저 Natal(네이탈·출생차트) 자동 계산을 완료해줘.');
    if (!apiUrl()) return alert('Astro Core API 주소를 확인해줘.');
    ensureTarotQuestionScope();
    injectTarotOverlay();
    const overlay = $(TAROT_OVERLAY_ID);
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    if (tarotState.result) renderCalendar(tarotState.result, $('luneaThaiTarotRangeResult'));
    $('luneaThaiTarotRangeStatus').textContent = tarotState.result
      ? `${tarotState.result.start_date}부터 ${tarotState.result.days}일 · 현재 질문에 연결된 결과`
      : `질문 주제: ${inferTopic(question)} · 기간을 골라 계산해줘.`;
  }

  function closeTarotRange() {
    const overlay = $(TAROT_OVERLAY_ID);
    overlay?.classList.remove('show');
    overlay?.setAttribute('aria-hidden','true');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  async function runTarotRange() {
    if (tarotState.running) return;
    const question = currentQuestion();
    if (!question) return;
    const button = $('luneaThaiTarotRangeRun');
    const actionButton = $(TAROT_BUTTON_ID);
    const status = $('luneaThaiTarotRangeStatus');
    try {
      const range = validateRange($('luneaThaiTarotRangeStart'), $('luneaThaiTarotRangeEnd'));
      const topic = inferTopic(question);
      tarotState.running = true;
      button.disabled = true;
      button.textContent = '기간 계산 중…';
      actionButton?.setAttribute('aria-busy','true');
      status.textContent = `${range.days}일 · ${topic} 주제 Taksa 달력을 계산하는 중…`;
      const data = await requestRange({topic, start:range.start, days:range.days});
      if (question !== currentQuestion()) {
        clearTarotResult();
        status.textContent = '계산 중 질문이 바뀌어서 이전 결과를 폐기했어.';
        return;
      }
      tarotState.question = question;
      tarotState.topic = topic;
      tarotState.result = data;
      tarotState.renderSignature = '';
      renderCalendar(data, $('luneaThaiTarotRangeResult'));
      renderTarotInline(true);
      status.textContent = `${data.start_date}부터 ${data.days}일 · AI 해석에도 이 질문의 기간 Taksa를 보조 근거로 연결해.`;
    } catch (error) {
      status.textContent = '기간 계산 실패: ' + (error?.message || error);
    } finally {
      tarotState.running = false;
      button.disabled = false;
      button.textContent = '현재 질문으로 기간 계산';
      actionButton?.removeAttribute('aria-busy');
    }
  }

  function renderTarotInline(force = false) {
    const data = tarotState.result;
    if (!data || tarotState.question !== currentQuestion()) return false;
    const cards = $('cards');
    if (!cards) return false;
    const summary = data.summary || {};
    const signature = JSON.stringify([
      tarotState.question, data.start_date, data.days,
      summary.supportive_segments, summary.caution_segments, summary.focus_match_segments
    ]);
    let box = $(TAROT_INLINE_ID);
    if (box && !force && tarotState.renderSignature === signature) return false;
    if (!box) {
      box = document.createElement('div');
      box.id = TAROT_INLINE_ID;
      const currentThai = $('luneaThaiTarotBridgeInline');
      if (currentThai) currentThai.insertAdjacentElement('afterend', box);
      else cards.insertAdjacentElement('afterend', box);
    }
    box.innerHTML = `<small>THAI ASTROLOGY · PERIOD SUPPORT</small><b>${esc(data.start_date)}부터 ${Number(data.days || 0)}일 · ${esc(tarotState.topic)}</b><span>지원 ${Number(summary.supportive_segments || 0)} · 주의 ${Number(summary.caution_segments || 0)} · 질문초점 ${Number(summary.focus_match_segments || 0)} · 눌러서 기간표 보기</span>`;
    box.onclick = openTarotRange;
    tarotState.renderSignature = signature;
    const button = $(TAROT_BUTTON_ID);
    if (button) button.textContent = '🇹🇭 Thai 기간 ✓';
    return true;
  }

  function clearTarotResult() {
    tarotState.question = '';
    tarotState.topic = 'general';
    tarotState.result = null;
    tarotState.running = false;
    tarotState.renderSignature = '';
    $(TAROT_INLINE_ID)?.remove();
    const button = $(TAROT_BUTTON_ID);
    if (button) {
      button.removeAttribute('aria-busy');
      button.textContent = '🇹🇭 Thai 기간';
    }
    if ($('luneaThaiTarotRangeResult')) $('luneaThaiTarotRangeResult').innerHTML = '';
  }

  function ensureTarotQuestionScope() {
    if (tarotState.result && tarotState.question !== currentQuestion()) clearTarotResult();
  }

  function promptRows(data) {
    const rows = [];
    for (const entry of data?.calendar || []) {
      const day = entry.daytime || {};
      if (day.focus_match || day.tone?.key !== 'neutral') {
        rows.push(`${entry.date} 낮: ${day.ruler?.ko || day.ruler?.key || ''}→${day.position_ko || day.position || ''}(${toneLabel(day.tone)}${day.focus_match ? ', 질문초점' : ''})`);
      }
      const night = entry.night_variant;
      if (night && (night.focus_match || night.tone?.key !== 'neutral')) {
        rows.push(`${entry.date} 밤: ${night.ruler?.ko || night.ruler?.key || ''}→${night.position_ko || night.position || ''}(${toneLabel(night.tone)}${night.focus_match ? ', 질문초점' : ''})`);
      }
      if (rows.length >= 18) break;
    }
    if (!rows.length) {
      for (const entry of (data?.calendar || []).slice(0,10)) {
        const day = entry.daytime || {};
        rows.push(`${entry.date}: ${day.ruler?.ko || day.ruler?.key || ''}→${day.position_ko || day.position || ''}(${toneLabel(day.tone)})`);
      }
    }
    return rows;
  }

  function tarotPromptBlock() {
    const data = tarotState.result;
    if (!data || tarotState.question !== currentQuestion()) return '';
    const summary = data.summary || {};
    const rows = promptRows(data);
    return `[THAI ASTROLOGY · MAHA TAKSA 계산 결과]
- 연결 모드: 현재 타로 질문의 기간 Taksa 캘린더
- 연결 질문: ${tarotState.question}
- 질문 분류: ${tarotState.topic}
- 기간: ${data.start_date}부터 ${data.days}일
- 지원 세그먼트: ${summary.supportive_segments || 0}
- 주의 세그먼트: ${summary.caution_segments || 0}
- 질문 초점 일치 세그먼트: ${summary.focus_match_segments || 0}
- 지원 날짜(요약): ${(summary.supportive_dates || []).join(', ') || '없음'}
- 주의 날짜(요약): ${(summary.caution_dates || []).join(', ') || '없음'}
- 질문 초점 날짜(요약): ${(summary.focus_match_dates || []).join(', ') || '없음'}
- 핵심 기간 행:
${rows.map(row => `  · ${row}`).join('\n')}

[Thai Taksa 기간 해석 규칙]
1. 이것은 천체의 이동각을 계산하는 Western Transit이 아니라 요일 지배행성의 Taksa 위치를 기간별로 정리한 달력이다.
2. RWS 카드/포지션이 본체다. Taksa의 지원·주의 표시는 카드 결론을 뒤집거나 사건 발생일을 확정하지 않는다.
3. 질문 초점과 겹치는 날짜, Sri/Montri/Dech 지원 구간, Kalakini 주의 구간을 행동·준비·경계의 보조 리듬으로만 사용한다.
4. 수요일 밤 Rahu 분리가 있으면 낮과 밤을 구분한다.
5. 정확한 사건 시기는 실제 Transit/Return/Timing Oracle 근거가 있을 때 그 계산을 우선한다.`;
  }

  function installPromptBridge() {
    if (W.__LUNEA_THAI_RANGE_PROMPT_WRAPPED_V33__) return true;
    const prior = W.promptString || (typeof promptString === 'function' ? promptString : null);
    if (typeof prior !== 'function') return false;
    const wrapped = function() {
      const base = String(prior.apply(this, arguments) || '');
      const block = tarotPromptBlock();
      return block ? `${base}\n\n${block}` : base;
    };
    wrapped.__luneaThaiRangeV33 = true;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    W.__LUNEA_THAI_RANGE_PROMPT_WRAPPED_V33__ = true;
    return true;
  }

  function boot() {
    addStyles();
    injectTarotButton();
    injectTarotOverlay();
    injectStandaloneControls();
    installPromptBridge();

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const a = injectTarotButton();
      const b = injectStandaloneControls();
      const c = W.__LUNEA_THAI_RANGE_PROMPT_WRAPPED_V33__ || installPromptBridge();
      ensureTarotQuestionScope();
      if ((a && b && c) || tries > 100) clearInterval(timer);
    }, 250);

    let queued = false;
    const target = $('spreadOverlay') || document.body;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      const maintain = () => {
        queued = false;
        ensureTarotQuestionScope();
        injectTarotButton();
        if (tarotState.result && !$(TAROT_INLINE_ID)) renderTarotInline();
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(maintain);
      else setTimeout(maintain, 16);
    });
    if (target) observer.observe(target, {childList:true,subtree:true});
  }

  W.LUNEA_THAI_RANGE_V33 = {
    version:'33.0',
    openTarot:openTarotRange,
    runTarot:runTarotRange,
    runStandalone:runStandaloneRange,
    clearTarot:clearTarotResult,
    getTarotResult:() => tarotState.result,
    getStandaloneResult:() => standaloneState.result,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
