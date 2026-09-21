'use strict';

/*
  LUNEA DAILY / ORACLE SECTOR CONTEXT V1
  - DAILY CONNECTION: split people + six love-status interpretations.
  - MESSAGE ORACLE: require an explicit user-selected context instead of AUTO.
  - TIMING ORACLE: ask for a sector before drawing and pass it into AI/prompt context.
*/
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_ORACLE_SECTOR_CONTEXT_V1__) return;
  W.__LUNEA_DAILY_ORACLE_SECTOR_CONTEXT_V1__ = true;

  const DAILY_MARKER = '[DAILY CONNECTION · 관계 상태별 해설 규칙]';
  const TIMING_MARKER = '[TIMING ORACLE · 사용자 선택 섹터]';
  const TIMING_SECTORS = Object.freeze([
    ['GENERAL', '일반 · 전체'],
    ['LOVE', '연애 · 관계'],
    ['REUNION', '재회'],
    ['CONTACT', '연락 · 소식'],
    ['CAREER', '직장 · 업무'],
    ['STUDY', '학업 · 시험'],
    ['MONEY', '금전 · 투자'],
    ['FAMILY', '가족 · 생활']
  ]);

  let lastTimingSector = null;

  function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }

  function isDailyPrompt(prompt) {
    const p = String(prompt || '');
    if (/DAILY ORBIT 6/i.test(p) || /4\.\s*CONNECTION\s*·\s*대인[·\s]*연애/i.test(p)) return true;
    try { return String(state?.category || '').toUpperCase() === 'DAILY'; } catch { return false; }
  }

  function dailyBlock() {
    return `${DAILY_MARKER}
4번 CONNECTION 카드는 한 장이지만 대인관계와 애정 상태별 의미를 섞지 말고 아래 7개 항목으로 각각 따로 해설한다.
- 대인관계: 친구·가족·동료·주변 사람과의 소통, 협력, 거리감, 갈등 또는 도움 흐름.
- 애정 · 솔로: 현재 특정 상대가 없는 사람 기준의 새로운 인연 가능성, 만남 태도, 관계를 여는 흐름.
- 애정 · 썸: 서로 알아가는 단계의 호응, 속도, 연락·만남의 진전 또는 조절 포인트.
- 애정 · 재회: 이미 끝났거나 멀어진 인연과의 재접촉·관계 회복 가능성을 구분해서 해설. 그리움만으로 연락·재회를 확정하지 않는다.
- 애정 · 짝사랑: 일방 호감 상태에서 관찰되는 교류·거리·접근 흐름. 카드 한 장으로 상대의 숨은 감정을 사실처럼 단정하지 않는다.
- 애정 · 연애중: 현재 교제 중인 커플의 소통, 정서적 연결, 갈등 조율, 관계의 안정·진전 흐름.
- 애정 · 기혼: 배우자와의 정서적 친밀감, 대화, 생활 협력, 갈등 조율, 부부 관계 흐름. 카드 한 장만으로 외도·제3자·이혼 같은 중대 사실을 만들어내지 않는다.
같은 카드라도 관계 상태에 따라 현실적으로 달라지는 포인트를 써라. 각 항목은 짧고 구체적으로 1~2문장으로 쓰고, 같은 문장을 이름만 바꿔 반복하지 않는다. 카드의 정역방향과 4번 CONNECTION 포지션 근거를 유지한다.`;
  }

  function timingPromptBlock() {
    if (!lastTimingSector?.label) return '';
    return `${TIMING_MARKER}
- 사용자가 시기 카드를 뽑을 때 생각한 섹터: ${lastTimingSector.label}
- 같은 시기 카드라도 이 섹터의 현실적인 진행 방식과 사건 단위를 기준으로 설명한다.
- 섹터 선택은 해석 맥락일 뿐 사건 성립·연락·재회·합격·수익을 확정하는 추가 증거가 아니다.`;
  }

  function installPromptWrapper() {
    let lexical = null;
    try { lexical = typeof promptString === 'function' ? promptString : null; } catch {}
    const prior = lexical || W.promptString;
    if (typeof prior !== 'function' || prior.__luneaDailyOracleSectorContextV1) return false;

    const wrapped = function() {
      let p = String(prior.apply(this, arguments) || '');
      if (isDailyPrompt(p) && !p.includes(DAILY_MARKER)) p += `\n\n${dailyBlock()}`;
      if (lastTimingSector && p.includes('[LUNEA TIMING ORACLE') && !p.includes(TIMING_MARKER)) {
        p += `\n\n${timingPromptBlock()}`;
      }
      return p;
    };
    wrapped.__luneaDailyOracleSectorContextV1 = true;
    wrapped.__luneaDailyOracleSectorContextBase = prior;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    return true;
  }

  function addStyles() {
    if (document.getElementById('luneaOracleSectorContextStyleV1')) return;
    const style = document.createElement('style');
    style.id = 'luneaOracleSectorContextStyleV1';
    style.textContent = `
      .lunea-sector-prompt{margin:10px 0 5px;font-size:12px;line-height:1.55;color:inherit}
      .lunea-sector-prompt strong{display:block;font-size:13px;margin-bottom:2px}
      .lunea-sector-prompt span{display:block;opacity:.72;font-size:11px}
      .lunea-oracle-sector-chips{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 5px}
      .lunea-oracle-sector-chips button{min-height:35px!important;padding:7px 10px!important;border-radius:999px!important;font-size:11px!important}
      .lunea-oracle-sector-chips button[aria-pressed="true"]{background:#705779!important;color:#fff!important;border-color:#705779!important}
      #timingOverlay .lunea-oracle-sector-field{margin:12px 0 8px}
      #timingOverlay .lunea-oracle-sector-field label{display:block;margin-bottom:4px;font-weight:700;color:#4b3d52}
      #timingOverlay .lunea-oracle-sector-status{min-height:17px;margin:4px 0 0;color:#805368;font-size:11px;line-height:1.5}
      #timingOverlay .lunea-timing-sector-badge{display:inline-flex;align-items:center;gap:5px;margin:9px 0 0;padding:5px 9px;border:1px solid rgba(112,87,121,.30);border-radius:999px;background:rgba(112,87,121,.08);font-size:10.5px;color:#5f4b66}
    `;
    document.head.appendChild(style);
  }

  function enhanceMessageOracle() {
    const overlay = document.getElementById('luneaMessageOracleOverlay');
    if (!overlay || overlay.dataset.luneaSectorContextV1 === '1') return;
    const chips = overlay.querySelector('.mo-chips');
    const context = overlay.querySelector('.mo-context');
    const form = overlay.querySelector('.mo-form');
    if (!chips || !context || !form) return;

    overlay.dataset.luneaSectorContextV1 = '1';
    const auto = chips.querySelector('button[data-context="AUTO"]');
    if (auto) {
      auto.hidden = true;
      auto.tabIndex = -1;
      auto.setAttribute('aria-hidden', 'true');
    }

    const prompt = document.createElement('div');
    prompt.className = 'lunea-sector-prompt';
    prompt.innerHTML = '<strong>어떤 섹터를 생각하고 뽑나요?</strong><span>한 가지를 직접 선택하면 그 맥락에 맞춰 메시지 카드를 읽습니다.</span>';
    context.insertAdjacentElement('beforebegin', prompt);
    chips.setAttribute('aria-label', '생각한 섹터 선택');

    form.addEventListener('submit', event => {
      const selected = chips.querySelector('button[data-context]:not([data-context="AUTO"])[aria-pressed="true"]');
      if (selected) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const status = overlay.querySelector('.mo-status');
      if (status) status.textContent = '카드를 뽑기 전에 생각한 섹터를 하나 선택해 주세요.';
      chips.querySelector('button[data-context]:not([data-context="AUTO"])')?.focus?.();
    }, true);
  }

  function selectedTimingButton(overlay) {
    return overlay?.querySelector('[data-lunea-timing-sector][aria-pressed="true"]') || null;
  }

  function resetTimingSector(overlay) {
    if (!overlay) return;
    delete overlay.dataset.luneaTimingSector;
    overlay.querySelectorAll('[data-lunea-timing-sector]').forEach(btn => btn.setAttribute('aria-pressed', 'false'));
    const status = overlay.querySelector('.lunea-oracle-sector-status');
    if (status) status.textContent = '';
    overlay.querySelector('.lunea-timing-sector-badge')?.remove();
  }

  function rememberTimingSector(overlay) {
    const selected = selectedTimingButton(overlay);
    if (!selected) return null;
    const question = clean(overlay.querySelector('#timingQuestion')?.value || '');
    lastTimingSector = {
      key: selected.dataset.luneaTimingSector,
      label: selected.dataset.luneaTimingLabel || clean(selected.textContent),
      question,
      at: Date.now()
    };
    return lastTimingSector;
  }

  function showTimingSectorBadge(overlay) {
    const sector = lastTimingSector;
    if (!sector?.label) return;
    const result = overlay.querySelector('#timingResult');
    if (!result) return;
    let badge = result.querySelector('.lunea-timing-sector-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'lunea-timing-sector-badge';
      result.prepend(badge);
    }
    badge.textContent = `생각한 섹터 · ${sector.label}`;
  }

  function enhanceTimingOracle() {
    const overlay = document.getElementById('timingOverlay');
    if (!overlay) return;

    if (overlay.dataset.luneaSectorContextV1 !== '1') {
      const questionField = overlay.querySelector('#timingQuestionField');
      const help = overlay.querySelector('#timingHelp');
      const draw = overlay.querySelector('#timingDraw');
      if (!questionField || !help || !draw) return;

      overlay.dataset.luneaSectorContextV1 = '1';
      const field = document.createElement('div');
      field.id = 'luneaTimingSectorField';
      field.className = 'field lunea-oracle-sector-field';
      field.innerHTML = '<label>어떤 섹터를 생각하고 뽑나요?</label><div class="lunea-oracle-sector-chips" role="group" aria-label="시기 오라클 섹터 선택"></div><div class="lunea-oracle-sector-status" role="status"></div>';
      help.insertAdjacentElement('beforebegin', field);
      const chips = field.querySelector('.lunea-oracle-sector-chips');
      TIMING_SECTORS.forEach(([key, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mini';
        button.dataset.luneaTimingSector = key;
        button.dataset.luneaTimingLabel = label;
        button.setAttribute('aria-pressed', 'false');
        button.textContent = label;
        button.addEventListener('click', () => {
          chips.querySelectorAll('[data-lunea-timing-sector]').forEach(x => x.setAttribute('aria-pressed', String(x === button)));
          overlay.dataset.luneaTimingSector = key;
          field.querySelector('.lunea-oracle-sector-status').textContent = `선택 · ${label}`;
        });
        chips.appendChild(button);
      });

      draw.addEventListener('click', event => {
        if (!selectedTimingButton(overlay)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          field.querySelector('.lunea-oracle-sector-status').textContent = '시기 카드를 뽑기 전에 생각한 섹터를 하나 선택해 주세요.';
          chips.querySelector('button')?.focus?.();
          return;
        }
        rememberTimingSector(overlay);
        setTimeout(() => showTimingSectorBadge(overlay), 0);
      }, true);
    }

    const isOpen = overlay.classList.contains('show');
    const wasOpen = overlay.dataset.luneaSectorWasOpen === '1';
    if (isOpen && !wasOpen) resetTimingSector(overlay);
    overlay.dataset.luneaSectorWasOpen = isOpen ? '1' : '0';
  }

  function installTimingFetchContext() {
    if (W.fetch?.__luneaTimingSectorContextV1) return;
    const prior = W.fetch?.bind(W);
    if (typeof prior !== 'function') return;
    const wrapped = function(input, init) {
      try {
        if (lastTimingSector?.label && typeof init?.body === 'string') {
          const payload = JSON.parse(init.body);
          const part = payload?.contents?.[0]?.parts?.[0];
          const text = String(part?.text || '');
          if (part && text.includes('[LUNEA TIMING ORACLE]') && !text.includes(TIMING_MARKER)) {
            const block = `${TIMING_MARKER}\n${lastTimingSector.label}\n- 이 섹터를 기준으로 같은 시기 카드의 현실적인 의미를 조정한다.\n- 섹터 자체를 사건 성립의 추가 증거로 쓰지 않는다.`;
            part.text = text.replace('[LUNEA TIMING ORACLE]', `${block}\n\n[LUNEA TIMING ORACLE]`);
            init = {...init, body: JSON.stringify(payload)};
          }
        }
      } catch {}
      return prior(input, init);
    };
    wrapped.__luneaTimingSectorContextV1 = true;
    wrapped.__luneaTimingSectorContextBase = prior;
    W.fetch = wrapped;
  }

  function resetOnReadingBoundary(event) {
    const button = event.target?.closest?.('button');
    if (!button) return;
    if (['drawBtn', 'dailyBtn', 'retry', 'luneaDraftRestore'].includes(button.id) || /새\s*리딩|새\s*질문/.test(clean(button.textContent))) {
      lastTimingSector = null;
    }
  }

  function boot() {
    addStyles();
    installTimingFetchContext();
    enhanceMessageOracle();
    enhanceTimingOracle();
    installPromptWrapper();

    const observer = new MutationObserver(() => {
      enhanceMessageOracle();
      enhanceTimingOracle();
    });
    observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','data-open']});
    document.addEventListener('click', resetOnReadingBoundary, true);

    W.addEventListener('load', () => setTimeout(installPromptWrapper, 0), {once:true});
    W.addEventListener('pageshow', installPromptWrapper);
    setTimeout(installPromptWrapper, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
