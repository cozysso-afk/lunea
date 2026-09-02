'use strict';

/*
  LUNEA THAI TAROT BRIDGE V32
  ===========================
  Hybrid bridge: keep the standalone Maha Taksa home experience while allowing
  an explicitly requested, question-scoped Thai Taksa calculation inside a
  tarot reading.

  Rules:
  - Never auto-call the Thai API on card draw.
  - A user tap on "Thai 보조" is required for each question.
  - Results are scoped to the exact current tarot question and are discarded
    when that question changes.
  - RWS cards remain primary evidence. Taksa is a structural/supporting layer,
    never an exact event-date engine and never a substitute for Transit/Return.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_TAROT_BRIDGE_V32__) return;
  W.__LUNEA_THAI_TAROT_BRIDGE_V32__ = true;

  const NATAL_KEY = 'LUNEA_ASTRO_NATAL_V3';
  const API_KEY = 'LUNEA_ASTRO_API_URL';
  const BUTTON_ID = 'luneaThaiTarotBridgeBtn';
  const INLINE_ID = 'luneaThaiTarotBridgeInline';
  const STYLE_ID = 'luneaThaiTarotBridgeStyle';

  const bridgeState = {
    question: '',
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

  function currentQuestion() {
    let q = '';
    try { q = W.state?.question || ''; } catch {}
    if (!q) {
      try { q = state?.question || ''; } catch {}
    }
    return String(q || '').trim();
  }

  function inferTopic(question) {
    const q = String(question || '');
    // Subject/situation first; generic contact/news last so
    // "시험 결과 연락" does not collapse into a generic contact topic.
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

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function addStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BUTTON_ID}{
        border-color:rgba(220,195,128,.24)!important;
        background:linear-gradient(145deg,rgba(207,176,103,.075),rgba(99,163,146,.055))!important;
        color:#ddcfaa!important
      }
      #${BUTTON_ID}[aria-busy="true"]{opacity:.66;pointer-events:none}
      #${INLINE_ID}{
        margin:8px auto 12px;max-width:360px;padding:10px 11px;border-radius:14px;
        background:linear-gradient(145deg,rgba(214,182,104,.065),rgba(91,154,138,.065));
        border:1px solid rgba(217,190,121,.17);text-align:left;cursor:pointer
      }
      #${INLINE_ID} small{display:block;color:#d3b875;font:700 8.2px 'Cinzel',serif;letter-spacing:.8px}
      #${INLINE_ID} b{display:block;margin:3px 0;color:#f0edf3;font-size:11px;line-height:1.45}
      #${INLINE_ID} span{display:block;color:#9e9aa7;font-size:9.2px;line-height:1.48}
    `;
    document.head.appendChild(style);
  }

  function clearResult() {
    bridgeState.question = '';
    bridgeState.topic = 'general';
    bridgeState.result = null;
    bridgeState.running = false;
    $(INLINE_ID)?.remove();
    const button = $(BUTTON_ID);
    if (button) {
      button.removeAttribute('aria-busy');
      button.textContent = '🇹🇭 Thai 보조';
    }
  }

  function ensureQuestionScope() {
    if (bridgeState.result && bridgeState.question !== currentQuestion()) clearResult();
  }

  function injectButton() {
    const bar = document.querySelector('#spreadOverlay .actionbar');
    if (!bar) return false;
    let button = $(BUTTON_ID);
    if (button) return true;

    button = document.createElement('button');
    button.type = 'button';
    button.id = BUTTON_ID;
    button.className = 'mini';
    button.textContent = '🇹🇭 Thai 보조';
    button.title = '현재 타로 질문에 Maha Taksa 보조 계산을 추가';
    button.onclick = runForCurrentQuestion;

    const timing = $('timingOracleBtn');
    const transit = $('astroTransitBtn');
    const save = $('saveReading');
    const anchor = transit || timing || save;
    if (anchor?.parentNode === bar) bar.insertBefore(button, anchor.nextSibling || null);
    else bar.appendChild(button);
    return true;
  }

  function renderInline() {
    const d = bridgeState.result;
    if (!d || bridgeState.question !== currentQuestion()) return;
    const cards = $('cards');
    if (!cards) return;

    let box = $(INLINE_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = INLINE_ID;
      const tail = $('luneaReturnInline') || $('luneaAstroTransitInline');
      if (tail) tail.insertAdjacentElement('afterend', box);
      else cards.insertAdjacentElement('afterend', box);
    }

    const focusRows = d.question?.focus_rows || [];
    const focus = focusRows.map(row => row.position_ko || row.position).filter(Boolean);
    const now = d.current_day?.falls_in_natal_taksa;
    const birth = d.birth || {};
    box.innerHTML = `
      <small>THAI ASTROLOGY · TAROT SUPPORT</small>
      <b>${esc(birth.weekday_label || '')} · ${esc(birth.ruler?.ko || birth.ruler?.key || '')} · ${focus.length ? `질문 초점 ${esc(focus.join(' / '))}` : 'Taksa 8영역 전체'}</b>
      <span>${now ? `오늘의 요일 행성은 출생 Taksa의 ${esc(now.position_ko || now.position)} 영역 · ` : ''}카드 결론을 대신하지 않는 질문별 구조 보조. 눌러서 다시 계산할 수 있어.</span>`;
    box.onclick = runForCurrentQuestion;

    const button = $(BUTTON_ID);
    if (button) {
      button.removeAttribute('aria-busy');
      button.textContent = '🇹🇭 Thai 포함됨';
    }
  }

  function promptBlock() {
    const d = bridgeState.result;
    if (!d || bridgeState.question !== currentQuestion()) return '';

    const grid = (d.grid || []).map(row =>
      `- ${row.position}(${row.position_ko}; ${row.position_thai || ''}): ${row.planet_number ?? ''} ${row.planet || row.planet_key || ''}(${row.planet_ko || ''}) — ${row.meaning_ko || ''}`
    ).join('\n');
    const focus = (d.question?.focus_rows || []).map(row => `${row.position}(${row.position_ko})`).join(', ');
    const now = d.current_day?.falls_in_natal_taksa;

    return `[THAI ASTROLOGY · MAHA TAKSA · 현재 타로 질문 보조 계산]
- 연결 질문: ${bridgeState.question}
- 질문 분류: ${bridgeState.topic}
- 출생요일: ${d.birth?.weekday_label || ''}
- 출생요일 행성: ${d.birth?.ruler?.key || ''}(${d.birth?.ruler?.ko || ''}) · 번호 ${d.birth?.planet_number ?? ''}
- Taksa 날짜 경계: 06:00 현지시각
${grid}
- 이번 질문의 LUNEA 보조 초점: ${focus || '전체 8영역'}
${now ? `- 현재 요일 행성 ${d.current_day?.ruler?.key || ''}(${d.current_day?.ruler?.ko || ''})은 출생 Taksa의 ${now.position}(${now.position_ko}) 영역` : ''}

[타로와 Thai Taksa 결합 규칙]
1. 실제 RWS 카드와 각 카드 포지션이 본체다. Taksa 때문에 카드 결론을 뒤집거나 없는 사건을 만들지 않는다.
2. Taksa는 현재 질문에서 강조되는 구조·행동·자원·장애·지원 축을 보조하는 독립 전통으로 사용한다.
3. 카드와 Taksa가 같은 방향이면 짧게 교차 보조 신호로 설명한다. 다르면 억지로 일치시키지 말고 차이를 적는다.
4. 현재 요일 행성은 오늘의 상징적 보조일 뿐 사건 발생일이나 결과 확정 근거로 쓰지 않는다.
5. 정확한 시기는 실제 Transit/Return/Timing Oracle 계산이 있을 때만 그 계산값을 사용한다.
6. Western Astrology, Saju, Thai Astrology의 개념을 서로 1:1 치환하지 않는다.`;
  }

  async function runForCurrentQuestion() {
    if (bridgeState.running) return;
    const question = currentQuestion();
    if (!question) return alert('먼저 타로 질문을 입력하고 카드를 뽑아줘.');
    const natal = safeJSON(NATAL_KEY);
    if (!natal) return alert('먼저 서양점성술 프로필에서 Natal(네이탈·출생차트) 자동 계산을 완료해줘.');
    const api = apiUrl();
    if (!api) return alert('Astro Core API 주소를 확인해줘.');

    if (bridgeState.question && bridgeState.question !== question) clearResult();
    bridgeState.running = true;
    const button = $(BUTTON_ID);
    if (button) {
      button.setAttribute('aria-busy','true');
      button.textContent = '🇹🇭 계산 중…';
    }

    try {
      const topic = inferTopic(question);
      const response = await fetch(`${api}/v1/thai/taksa`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          natal,
          topic,
          current_iso:new Date().toISOString(),
          timezone:'Asia/Seoul'
        })
      });
      let data = null;
      try { data = await response.json(); } catch {}
      if (!response.ok) throw new Error(data?.detail || data?.message || `${response.status} ${response.statusText}`);

      // The user may have started another reading while the API was running.
      if (question !== currentQuestion()) {
        clearResult();
        return;
      }
      bridgeState.question = question;
      bridgeState.topic = topic;
      bridgeState.result = data;
      renderInline();
    } catch (error) {
      bridgeState.result = null;
      const message = error?.message || String(error || 'unknown error');
      alert('Thai Taksa 계산 실패: ' + message);
      if (button) button.textContent = '🇹🇭 Thai 보조';
    } finally {
      bridgeState.running = false;
      if (button) button.removeAttribute('aria-busy');
    }
  }

  function installPromptBridge() {
    if (W.__LUNEA_THAI_TAROT_PROMPT_WRAPPED_V32__) return true;
    const prior = W.promptString || (typeof promptString === 'function' ? promptString : null);
    if (typeof prior !== 'function') return false;

    const wrapped = function() {
      const base = String(prior.apply(this, arguments) || '');
      const block = promptBlock();
      return block ? `${base}\n\n${block}` : base;
    };
    wrapped.__luneaThaiTarotBridgeV32 = true;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    W.__LUNEA_THAI_TAROT_PROMPT_WRAPPED_V32__ = true;
    return true;
  }

  function boot() {
    addStyles();
    injectButton();
    installPromptBridge();

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      ensureQuestionScope();
      injectButton();
      if (!W.__LUNEA_THAI_TAROT_PROMPT_WRAPPED_V32__) installPromptBridge();
      if (tries > 240) clearInterval(timer);
    }, 250);

    const bodyObserver = new MutationObserver(() => {
      ensureQuestionScope();
      injectButton();
      renderInline();
    });
    if (document.body) bodyObserver.observe(document.body, {childList:true,subtree:true});
  }

  W.LUNEA_THAI_TAROT_BRIDGE_V32 = {
    version:'32.0',
    run:runForCurrentQuestion,
    clear:clearResult,
    getResult:() => bridgeState.result,
    getQuestion:() => bridgeState.question,
    inferTopic,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
