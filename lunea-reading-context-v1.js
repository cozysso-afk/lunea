'use strict';

/*
  LUNEA READING CONTEXT V1
  ========================
  - DAILY ORBIT CONNECTION: optional multi-select love-status context.
  - Message Oracle: keep AUTO as default, make the optional direct sector choice explicit.
  - Timing Oracle: keep AUTO as default, add an optional direct sector choice and feed it to AI/prompt context.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_CONTEXT_V1__) return;
  W.__LUNEA_READING_CONTEXT_V1__ = true;

  const DAILY_CONTEXT_KEY = 'LUNEA_DAILY_LOVE_CONTEXT_V1';
  const DAILY_ORBIT_KEY = 'LUNEA_DAILY_ORBIT_V1';
  const STYLE_ID = 'luneaReadingContextV1Style';
  const DAILY_BOX_ID = 'luneaDailyLoveContextV1';
  const TIMING_BOX_ID = 'luneaTimingSectorContextV1';

  const LOVE_STATUSES = Object.freeze([
    ['SOLO', '솔로', '소개팅 · 새 인연 · 새로운 만남 포함'],
    ['SOME', '썸', '호감 교류 · 연락 · 관계 진전'],
    ['CRUSH', '짝사랑', '내 관심 · 접근 · 관계 가능성'],
    ['REUNION', '재회', '과거 인연 · 재접촉 · 관계 회복'],
    ['DATING', '연애중', '현재 연인 · 소통 · 친밀감 · 갈등'],
    ['MARRIED', '기혼', '배우자 · 부부 소통 · 생활 파트너십']
  ]);

  const TIMING_SECTORS = Object.freeze([
    ['LOVE', '연애'],
    ['REUNION', '재회'],
    ['CAREER', '직업 · 업무'],
    ['MONEY', '금전 · 투자'],
    ['STUDY', '학업 · 시험'],
    ['RELATION', '대인관계'],
    ['HEALTH', '건강 · 회복'],
    ['GENERAL', '일반']
  ]);

  const loveLabel = code => LOVE_STATUSES.find(x => x[0] === code)?.[1] || code;
  const timingLabel = code => TIMING_SECTORS.find(x => x[0] === code)?.[1] || '일반';

  function localDay(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getState() {
    try { return typeof state !== 'undefined' ? state : null; }
    catch { return null; }
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${DAILY_BOX_ID}{position:relative;z-index:5;margin:0 1px 12px;padding:11px 10px;border:1px solid rgba(216,205,239,.14);border-radius:15px;background:linear-gradient(145deg,rgba(196,171,228,.075),rgba(104,168,193,.04))}
      #${DAILY_BOX_ID} .lrc-title{display:flex;align-items:baseline;justify-content:space-between;gap:8px;color:#eee8f6;font:650 10.5px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif}
      #${DAILY_BOX_ID} .lrc-title small{color:rgba(211,207,226,.66);font-size:8.5px;font-weight:500}
      #${DAILY_BOX_ID} .lrc-hint{margin:4px 0 8px;color:rgba(207,207,225,.72);font:500 8.8px/1.45 system-ui,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif}
      #${DAILY_BOX_ID} .lrc-chips,#${TIMING_BOX_ID} .lrc-chips{display:flex;flex-wrap:wrap;gap:6px}
      #${DAILY_BOX_ID} button,#${TIMING_BOX_ID} button{border-radius:999px;min-height:32px;padding:6px 9px;border:1px solid rgba(197,181,226,.22);background:rgba(255,255,255,.055);color:#e8e2ef;font:600 9.5px/1.2 system-ui,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;cursor:pointer}
      #${DAILY_BOX_ID} button[aria-pressed='true']{background:linear-gradient(125deg,rgba(176,139,216,.34),rgba(103,166,194,.22));border-color:rgba(216,197,241,.48);color:#fff}
      #${DAILY_BOX_ID} .lrc-selected{margin-top:7px;color:rgba(226,220,238,.78);font-size:8.8px;line-height:1.4}
      #${TIMING_BOX_ID}{margin:8px 0 11px;padding:10px;border-radius:13px;border:1px solid rgba(170,139,191,.22);background:rgba(255,255,255,.36)}
      #${TIMING_BOX_ID} .lrc-title{color:#4a3b50;font-size:11px;font-weight:700;margin-bottom:3px}
      #${TIMING_BOX_ID} .lrc-hint{color:#786b7d;font-size:9.5px;line-height:1.45;margin-bottom:7px}
      #${TIMING_BOX_ID} button{color:#604e68;background:rgba(255,255,255,.64);border-color:rgba(151,119,169,.24)}
      #${TIMING_BOX_ID} button[aria-pressed='true']{color:#fff;background:#735c7c;border-color:#735c7c}
      #${TIMING_BOX_ID} .lrc-selected{margin-top:7px;color:#725d79;font-size:9.5px;line-height:1.4}
      #luneaMessageOracleOverlay .lrc-message-sector-title{margin:2px 0 0;color:#493d51;font-size:13px;font-weight:650}
      #luneaMessageOracleOverlay .lrc-message-sector-hint{margin:3px 0 2px;color:#756878;font-size:10px;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

  function readDailyStatuses() {
    try {
      const value = JSON.parse(localStorage.getItem(DAILY_CONTEXT_KEY) || 'null');
      if (!value || value.day !== localDay() || !Array.isArray(value.statuses)) return [];
      const allowed = new Set(LOVE_STATUSES.map(x => x[0]));
      return value.statuses.filter(x => allowed.has(x));
    } catch { return []; }
  }

  function writeDailyStatuses(statuses) {
    const allowed = new Set(LOVE_STATUSES.map(x => x[0]));
    const clean = [...new Set(statuses)].filter(x => allowed.has(x));
    try { localStorage.setItem(DAILY_CONTEXT_KEY, JSON.stringify({day: localDay(), statuses: clean, updatedAt: Date.now()})); } catch {}

    try {
      const daily = JSON.parse(localStorage.getItem(DAILY_ORBIT_KEY) || 'null');
      if (daily && daily.day === localDay()) {
        daily.loveStatuses = [...clean];
        localStorage.setItem(DAILY_ORBIT_KEY, JSON.stringify(daily));
      }
    } catch {}

    const s = getState();
    if (s?.category === 'DAILY') s.__luneaDailyLoveStatuses = [...clean];
    return clean;
  }

  function dailyStatusText(statuses) {
    return statuses.length ? `선택: ${statuses.map(loveLabel).join(' · ')}` : '선택 없음 · 애정 전반으로 해석';
  }

  function ensureDailySelector() {
    const daily = document.querySelector('.daily.lunea-daily-orbit6') || document.querySelector('.daily');
    const btn = document.getElementById('dailyBtn');
    if (!daily || !btn) return false;

    let box = document.getElementById(DAILY_BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = DAILY_BOX_ID;
      box.innerHTML = `<div class="lrc-title"><span>애정 상태</span><small>복수 선택 가능</small></div><div class="lrc-hint">선택한 상태마다 각각 따로 해설해요. 솔로에는 소개팅·새 인연·새로운 만남이 포함돼요.</div><div class="lrc-chips" role="group" aria-label="데일리 애정 상태 복수 선택"></div><div class="lrc-selected" aria-live="polite"></div>`;
      const chips = box.querySelector('.lrc-chips');
      LOVE_STATUSES.forEach(([code, label, detail]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.loveStatus = code;
        button.textContent = label;
        button.title = detail;
        button.addEventListener('click', () => {
          const selected = new Set(readDailyStatuses());
          if (selected.has(code)) selected.delete(code); else selected.add(code);
          writeDailyStatuses([...selected]);
          syncDailySelector();
        });
        chips.appendChild(button);
      });
    }

    if (box.parentNode !== daily || box.nextElementSibling !== btn) daily.insertBefore(box, btn);
    syncDailySelector();
    return true;
  }

  function syncDailySelector() {
    const box = document.getElementById(DAILY_BOX_ID);
    if (!box) return;
    const statuses = readDailyStatuses();
    const selected = new Set(statuses);
    box.querySelectorAll('[data-love-status]').forEach(button => button.setAttribute('aria-pressed', String(selected.has(button.dataset.loveStatus))));
    const status = box.querySelector('.lrc-selected');
    if (status) status.textContent = dailyStatusText(statuses);
  }

  function inferTimingSector(question) {
    const q = String(question || '').toLowerCase();
    if (/(재회|전남친|전여친|전애인|헤어진|다시\s*만나|다시\s*이어)/i.test(q)) return 'REUNION';
    if (/(연애|썸|짝사랑|소개팅|데이트|남친|여친|애인|사랑|호감)/i.test(q)) return 'LOVE';
    if (/(주식|투자|매수|매도|수익|금전|재정|돈|매매|코인)/i.test(q)) return 'MONEY';
    if (/(시험|합격|공부|학업|학교|성적|입시|자격증)/i.test(q)) return 'STUDY';
    if (/(직장|취업|이직|퇴사|회사|업무|사업|계약|면접|승진)/i.test(q)) return 'CAREER';
    if (/(건강|회복|치료|병원|컨디션|수술|검사)/i.test(q)) return 'HEALTH';
    if (/(친구|가족|지인|대인|인간관계|동료)/i.test(q)) return 'RELATION';
    return 'GENERAL';
  }

  let timingOverride = 'AUTO';
  let lastTimingContext = null;

  function currentTimingQuestion() {
    const field = document.getElementById('timingQuestionField');
    if (field && field.style.display === 'none') return String(getState()?.question || '').trim();
    return String(document.getElementById('timingQuestion')?.value || '').trim();
  }

  function resolvedTimingContext(question = currentTimingQuestion()) {
    const resolved = timingOverride === 'AUTO' ? inferTimingSector(question) : timingOverride;
    return {
      question: String(question || '').trim(),
      override: timingOverride,
      code: resolved,
      label: timingLabel(resolved),
      mode: timingOverride === 'AUTO' ? '자동 분류' : '직접 선택'
    };
  }

  function syncTimingSelector() {
    const box = document.getElementById(TIMING_BOX_ID);
    if (!box) return;
    box.querySelectorAll('[data-timing-sector]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.timingSector === timingOverride)));
    const value = resolvedTimingContext();
    const status = box.querySelector('.lrc-selected');
    if (status) status.textContent = `${value.mode} · ${value.label}`;
  }

  function ensureTimingSelector() {
    const body = document.getElementById('timingScrollBody');
    const help = document.getElementById('timingHelp');
    if (!body || !help) return false;
    let box = document.getElementById(TIMING_BOX_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = TIMING_BOX_ID;
      box.innerHTML = `<div class="lrc-title">어떤 섹터를 생각하고 뽑아?</div><div class="lrc-hint">기본은 질문을 보고 자동 분류해요. 원하면 직접 선택해서 자동 분류를 덮어쓸 수 있어요.</div><div class="lrc-chips" role="group" aria-label="시기 오라클 섹터 선택"></div><div class="lrc-selected" aria-live="polite"></div>`;
      const chips = box.querySelector('.lrc-chips');
      [['AUTO', '자동 분류'], ...TIMING_SECTORS].forEach(([code, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.timingSector = code;
        button.textContent = label;
        button.addEventListener('click', () => { timingOverride = code; syncTimingSelector(); });
        chips.appendChild(button);
      });
      const question = document.getElementById('timingQuestion');
      question?.addEventListener('input', () => { if (timingOverride === 'AUTO') syncTimingSelector(); });
    }
    if (box.parentNode !== body || box.nextElementSibling !== help) body.insertBefore(box, help);
    syncTimingSelector();

    const draw = document.getElementById('timingDraw');
    if (draw && !draw.__luneaTimingSectorCaptureV1) {
      draw.__luneaTimingSectorCaptureV1 = true;
      draw.addEventListener('click', () => {
        const value = resolvedTimingContext();
        if (!value.question) return;
        lastTimingContext = value;
        W.LUNEA_TIMING_SECTOR_CONTEXT_V1 = {...value};
      }, true);
    }
    return true;
  }

  function enhanceMessageOracle() {
    const overlay = document.getElementById('luneaMessageOracleOverlay');
    const chips = overlay?.querySelector('.mo-chips');
    if (!overlay || !chips) return false;
    chips.setAttribute('aria-label', '생각한 메시지 오라클 섹터');
    const auto = chips.querySelector('[data-context="AUTO"]');
    if (auto) auto.textContent = '자동 분류';
    if (!overlay.querySelector('.lrc-message-sector-title')) {
      const title = document.createElement('div');
      title.className = 'lrc-message-sector-title';
      title.textContent = '어떤 섹터를 생각하고 뽑아?';
      const hint = document.createElement('div');
      hint.className = 'lrc-message-sector-hint';
      hint.textContent = '기본은 자동 분류예요. 원하면 아래에서 직접 선택해서 덮어쓸 수 있어요.';
      chips.before(title, hint);
    }
    return true;
  }

  function dailyPromptBlock() {
    const statuses = readDailyStatuses();
    const headings = statuses.map(code => `애정 · ${loveLabel(code)}`);
    const selected = statuses.length ? statuses.map(loveLabel).join(', ') : '미선택(애정 전반)';
    const required = headings.length ? `반드시 ${headings.map(x => `「${x}」`).join(', ')} 소제목을 각각 따로 작성한다.` : '애정 상태를 선택하지 않았으므로 「애정 · 전반」 하나로 해석한다.';
    return `[DAILY ORBIT · CONNECTION 세부 해설]\n- 4번 CONNECTION 카드는 대인관계와 애정을 한 문단으로 섞지 않는다. 먼저 「대인관계」를 별도 소제목으로 해석한다.\n- 사용자가 선택한 애정 상태: ${selected}\n- ${required}\n- 복수 선택이면 각 상태를 서로 독립된 가정으로 읽는다. 같은 카드 한 장을 근거로 하더라도 상태별 의미를 다시 적용하고, 여러 상태를 하나의 '연애운' 문단으로 합치거나 한 상태의 결론을 다른 상태에 복사하지 않는다.\n- 솔로는 현재 특정 연인이 없는 상태이며 소개팅, 새 인연, 새로운 만남, 새로운 연락 가능성을 포함한다.\n- 썸은 호감 교류, 연락 템포, 관계 진전과 거리 조절을 중심으로 읽는다.\n- 짝사랑은 사용자의 관심과 접근 흐름을 중심으로 읽고 상대의 속마음을 확인된 사실처럼 단정하지 않는다.\n- 재회는 과거 인연의 재접촉과 실제 관계 회복을 구분한다. 추억, 연락, 재결합을 같은 사건으로 취급하지 않는다.\n- 연애중은 현재 연인의 소통, 친밀감, 갈등, 일상 리듬을 중심으로 읽는다.\n- 기혼은 배우자와의 부부 소통, 생활 리듬, 정서적 협력과 파트너십을 중심으로 읽고 카드만으로 외도나 파탄을 만들어내지 않는다.`;
  }

  function timingPromptBlock(context) {
    if (!context) return '';
    return `[TIMING ORACLE · 질문 섹터]\n- 섹터 선택 방식: ${context.mode}\n- 해석 섹터: ${context.label}\n- 이 섹터는 질문의 맥락을 좁히는 정보이며 시기 카드 자체의 범위나 사건 성립 여부를 임의로 바꾸는 추가 예언 근거가 아니다. 같은 시기 카드라도 ${context.label} 상황에서 무엇이 움직이는 시기인지 구체적으로 설명한다.`;
  }

  function installPromptWrapper() {
    let lexical = null;
    try { lexical = typeof promptString === 'function' ? promptString : null; } catch {}
    const prior = lexical || W.promptString;
    if (typeof prior !== 'function') return false;
    if (prior.__luneaReadingContextV1) {
      if (W.promptString !== prior) W.promptString = prior;
      return true;
    }

    const wrapped = function() {
      let p = prior.apply(this, arguments);
      const s = getState();
      if (s?.category === 'DAILY') p += `\n\n${dailyPromptBlock()}`;
      if (lastTimingContext && String(p).includes('[LUNEA TIMING ORACLE')) {
        const q = String(s?.question || '').trim();
        if (!lastTimingContext.question || !q || lastTimingContext.question === q) p += `\n\n${timingPromptBlock(lastTimingContext)}`;
      }
      return p;
    };
    wrapped.__luneaReadingContextV1 = true;
    wrapped.__luneaReadingContextBase = prior;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    return true;
  }

  function installTimingFetchAdapter() {
    const prior = W.fetch;
    if (typeof prior !== 'function' || prior.__luneaReadingContextV1) return false;
    const wrapped = function(input, init) {
      try {
        const url = String(input?.url || input || '');
        if (lastTimingContext && /generativelanguage\.googleapis\.com/i.test(url) && typeof init?.body === 'string') {
          const body = JSON.parse(init.body);
          const part = body?.contents?.[0]?.parts?.[0];
          if (typeof part?.text === 'string' && part.text.includes('당신은 타로의 시기 질문을 과장 없이 읽는 숙련된 리더다.')) {
            body.contents[0].parts[0].text = `${part.text}\n\n${timingPromptBlock(lastTimingContext)}`;
            init = {...init, body: JSON.stringify(body)};
          }
        }
      } catch {}
      return prior.call(this, input, init);
    };
    wrapped.__luneaReadingContextV1 = true;
    wrapped.__luneaReadingContextBase = prior;
    W.fetch = wrapped;
    return true;
  }

  function syncAll() {
    addStyles();
    ensureDailySelector();
    ensureTimingSelector();
    enhanceMessageOracle();
    installPromptWrapper();
    installTimingFetchAdapter();
  }

  const observer = new MutationObserver(() => {
    if (W.__LUNEA_READING_CONTEXT_SYNC_QUEUED__) return;
    W.__LUNEA_READING_CONTEXT_SYNC_QUEUED__ = true;
    requestAnimationFrame(() => {
      W.__LUNEA_READING_CONTEXT_SYNC_QUEUED__ = false;
      syncAll();
    });
  });

  function boot() {
    syncAll();
    observer.observe(document.documentElement, {subtree:true, childList:true});
    W.addEventListener('focus', syncAll);
    W.addEventListener('pageshow', syncAll);
    W.addEventListener('lunea:feature-group-ready', syncAll);
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      syncAll();
      if (tries > 80) clearInterval(timer);
    }, 250);
    console.info('💞 LUNEA Reading Context V1 loaded · daily love multi-select + oracle sectors');
  }

  W.LUNEA_READING_CONTEXT_V1 = {
    version:1,
    loveStatuses: LOVE_STATUSES.map(x => ({code:x[0], label:x[1], detail:x[2]})),
    timingSectors: TIMING_SECTORS.map(x => ({code:x[0], label:x[1]})),
    readDailyStatuses,
    writeDailyStatuses,
    inferTimingSector,
    getTimingContext: () => lastTimingContext ? {...lastTimingContext} : null,
    sync:syncAll
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
