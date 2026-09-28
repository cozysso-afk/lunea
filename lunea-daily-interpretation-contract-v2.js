'use strict';

/*
  LUNEA DAILY INTERPRETATION CONTRACT V2
  ======================================
  Final-mile prompt contract for DAILY ORBIT 6.

  Goals:
  - Reunion: distinguish contact/recontact, continued conversation, and actual reunion.
  - Money & Trading: answer the profit-taking vs hold judgment before giving cautions.
  - Never assume an ex is already in contact when the prompt does not say so.
  - Keep Message Oracle and Timing Oracle inside their actual declared sectors.
  - Collapse duplicated DAILY/TIMING context blocks caused by late prompt wrappers.
*/
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_INTERPRETATION_CONTRACT_V2__) return;
  W.__LUNEA_DAILY_INTERPRETATION_CONTRACT_V2__ = true;

  const DAILY_MARKER = '[DAILY ORBIT · CONNECTION 세부 해설]';
  const TIMING_MARKER = '[TIMING ORACLE · 질문 섹터]';
  const DAILY_CONTEXT_KEY = 'LUNEA_DAILY_LOVE_CONTEXT_V1';
  const LOVE_LABELS = Object.freeze({
    SOLO:'솔로', SOME:'썸', CRUSH:'짝사랑', REUNION:'재회', DATING:'연애중', MARRIED:'기혼'
  });
  const LABEL_CODES = Object.freeze(Object.fromEntries(Object.entries(LOVE_LABELS).map(([code,label]) => [label, code])));

  function localDay(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function readStoredStatuses() {
    try {
      const value = JSON.parse(localStorage.getItem(DAILY_CONTEXT_KEY) || 'null');
      if (!value || value.day !== localDay() || !Array.isArray(value.statuses)) return [];
      return [...new Set(value.statuses)].filter(code => Object.hasOwn(LOVE_LABELS, code));
    } catch { return []; }
  }

  function statusesFromPrompt(prompt) {
    const matches = [...String(prompt || '').matchAll(/- 사용자가 선택한 애정 상태:\s*([^\n]+)/g)];
    if (!matches.length) return null;
    const raw = String(matches.at(-1)?.[1] || '').trim();
    if (!raw || /미선택/.test(raw)) return [];
    return [...new Set(raw.split(/[,·]/).map(x => x.trim()).map(label => LABEL_CODES[label]).filter(Boolean))];
  }

  function isHeader(line) {
    const text = String(line || '').trim();
    return /^\[[^\]\n]+\]$/.test(text);
  }

  function stripGeneratedBlocks(prompt) {
    const lines = String(prompt || '').split('\n');
    const kept = [];
    const found = {daily:[], timing:[]};
    const markers = new Map([[DAILY_MARKER, 'daily'], [TIMING_MARKER, 'timing']]);

    for (let i = 0; i < lines.length; i += 1) {
      const marker = String(lines[i] || '').trim();
      const kind = markers.get(marker);
      if (!kind) {
        kept.push(lines[i]);
        continue;
      }

      const block = [marker];
      for (i += 1; i < lines.length; i += 1) {
        if (isHeader(lines[i])) {
          i -= 1;
          break;
        }
        block.push(lines[i]);
      }
      found[kind].push(block.join('\n').trim());
    }

    return {
      text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
      dailyBlocks: found.daily,
      timingBlocks: found.timing
    };
  }

  function isDailyOrbitPrompt(prompt) {
    const text = String(prompt || '');
    return /\[스프레드\]\s*\nDAILY ORBIT 6\b/.test(text) ||
      (/DAILY ORBIT 6/.test(text) && /\[뽑힌 카드\]/.test(text));
  }

  function loveRequirement(statuses) {
    const labels = statuses.map(code => LOVE_LABELS[code]).filter(Boolean);
    if (!labels.length) return '애정 상태를 선택하지 않았으므로 「애정 · 전반」 하나로 해석한다.';
    return `반드시 ${labels.map(label => `「애정 · ${label}」`).join(', ')} 소제목을 각각 따로 작성한다.`;
  }

  function dailyContractBlock(statuses) {
    const selected = statuses.length ? statuses.map(code => LOVE_LABELS[code]).join(', ') : '미선택(애정 전반)';
    const reunionSelected = statuses.includes('REUNION');
    const reunionRule = reunionSelected
      ? `- 「애정 · 재회」는 반드시 ① 연락·재접촉 신호 ② 실제 대화가 이어질 신호 ③ 관계 회복·재결합 신호 ④ 지연·거리·불발·반증 신호를 서로 구분해 판단한다.\n- 재회가 선택되어도 현재 연락 중이라고 가정하지 않는다. 질문·입력에 현재 연락 중이라는 사실이 명시되지 않았다면 "연락이 이어진다", "현재 소통에서", "대화를 조율하고 있다"처럼 이미 연락하는 상태를 전제로 쓰지 않는다.\n- 연락·재접촉 근거가 약하면 그 점을 직접 말한다. 관계의 안정감·호감·추억 카드만으로 연락 발생을 만들지 않는다. 연락 신호가 있어도 그것을 재결합 확정으로 승격하지 않는다.`
      : '- 재회가 선택되지 않았다면 재회 전용 연락·재결합 결론을 새로 만들지 않는다.';

    return `${DAILY_MARKER}\n- 계약 버전: V2 · 이 블록은 DAILY ORBIT의 최종 출력 계약이며 질문 유형이 advice여도 각 포지션의 판단에 먼저 답한 뒤 필요한 조언을 붙인다. 조언·주의사항만으로 포지션 질문을 대체하지 않는다.\n- 4번 CONNECTION 카드는 대인관계와 애정을 한 문단으로 섞지 않는다. 먼저 「대인관계」를 별도 소제목으로 해석한다.\n- 사용자가 선택한 애정 상태: ${selected}\n- ${loveRequirement(statuses)}\n- 복수 선택이면 각 상태를 독립된 가정으로 읽고 한 상태의 결론을 다른 상태에 복사하지 않는다.\n- 솔로는 새로운 만남/접점과 새로운 연락/메시지를 구분한다. 새 인연의 분위기가 있다고 해서 실제 연락이 온다고 자동 판정하지 않는다.\n- 썸은 호감 교류, 연락 템포, 관계 진전과 거리 조절을 구분한다.\n- 짝사랑은 사용자의 관심·접근 흐름을 중심으로 읽고 상대의 속마음을 확인된 사실처럼 단정하지 않는다.\n${reunionRule}\n- 연애중은 현재 연인의 소통, 친밀감, 갈등, 일상 리듬을 중심으로 읽는다.\n- 기혼은 배우자와의 부부 소통, 생활 리듬, 정서적 협력과 파트너십을 중심으로 읽고 카드만으로 외도나 파탄을 만들지 않는다.\n- Message Oracle(메시지 오라클)은 그 블록에 실제로 적힌 맥락·질문 의도만 보조한다. 맥락이 공적·결과/업무/일반 소식이라면 그것을 재회 상대의 연락 근거로 전용하지 않는다. 실제 맥락이 연애·재회 또는 재접촉/연락 질문을 지지할 때만 해당 애정 연락 축에 교차참고한다.\n- Timing Oracle(시기 오라클)은 실제 선택된 질문 섹터에만 적용한다. 예를 들어 섹터가 「금전 · 투자」라면 그 시기를 재회 연락 시기로 바꾸지 않는다.\n- 평일 5번 포지션이 「MONEY & TRADING · 금전·투자 · 수익실현·보유 판단 흐름」이면 단순 주의사항으로 끝내지 않는다. 「금전 · 투자」의 첫 판단 문장에서 카드상 흐름을 「수익실현 쪽 우세 / 일부 수익실현 쪽 우세 / 보유 쪽 우세 / 추가 확인 후 판단 / 판단 보류」 중 실제 카드가 지지하는 방향으로 먼저 명시한다.\n- 이어서 ① 수익실현을 지지·제한하는 근거 ② 보유를 지지·제한하는 근거 ③ 과욕·추격·불확실성·리스크 ④ 판단을 다시 볼 확인 조건을 구분한다. 보조 카드는 연결된 5번 본 카드의 모호함을 좁히는 데 사용한다.\n- 위 투자 방향은 타로 카드상 판단 흐름이지 실제 시장 수익률·가격 예측이나 매매 보장이 아니다. 정확한 목표가·수익률·가격 방향을 만들지 않되, 이 제한을 이유로 수익실현/보유 질문 자체에 답하지 않는 것도 금지한다.`;
  }

  function canonicalizePrompt(prompt) {
    const source = String(prompt || '');
    if (!isDailyOrbitPrompt(source)) return source;

    const promptStatuses = statusesFromPrompt(source);
    const statuses = promptStatuses === null ? readStoredStatuses() : promptStatuses;
    const parsed = stripGeneratedBlocks(source);
    const timing = parsed.timingBlocks.at(-1) || '';
    let out = `${parsed.text}\n\n${dailyContractBlock(statuses)}`.trim();
    if (timing) out += `\n\n${timing}`;
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }

  function installPromptWrapper() {
    let lexical = null;
    try { lexical = typeof promptString === 'function' ? promptString : null; } catch {}
    const prior = lexical || W.promptString;
    if (typeof prior !== 'function') return false;
    if (prior.__luneaDailyInterpretationContractV2) {
      if (W.promptString !== prior) W.promptString = prior;
      return true;
    }

    const wrapped = function() {
      return canonicalizePrompt(prior.apply(this, arguments));
    };
    wrapped.__luneaDailyInterpretationContractV2 = true;
    // Reading Context V1 repeatedly re-checks ownership for ~20s. The final
    // canonicalizer already contains that wrapper in `prior`, so inherit its
    // ownership marker to prevent an unnecessary wrapper chain from growing.
    wrapped.__luneaReadingContextV1 = true;
    wrapped.__luneaDailyInterpretationContractBase = prior;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    return true;
  }

  function installFetchWrapper() {
    const prior = W.fetch;
    if (typeof prior !== 'function' || prior.__luneaDailyInterpretationContractV2) return false;

    const wrapped = function(input, init) {
      try {
        const url = String(input?.url || input || '');
        if (/generativelanguage\.googleapis\.com/i.test(url) && typeof init?.body === 'string') {
          const body = JSON.parse(init.body);
          let changed = false;
          for (const content of body?.contents || []) {
            for (const part of content?.parts || []) {
              if (typeof part?.text !== 'string' || !isDailyOrbitPrompt(part.text)) continue;
              const next = canonicalizePrompt(part.text);
              if (next !== part.text) {
                part.text = next;
                changed = true;
              }
            }
          }
          if (changed) init = {...init, body: JSON.stringify(body)};
        }
      } catch (error) {
        console.warn('[LUNEA Daily Contract V2] prompt normalization skipped', error);
      }
      return prior.call(this, input, init);
    };
    wrapped.__luneaDailyInterpretationContractV2 = true;
    wrapped.__luneaReadingContextV1 = true;
    wrapped.__luneaDailyInterpretationContractBase = prior;
    W.fetch = wrapped;
    return true;
  }

  function sync() {
    installPromptWrapper();
    installFetchWrapper();
  }

  W.LUNEA_DAILY_INTERPRETATION_CONTRACT_V2 = Object.freeze({
    version:2,
    marker:DAILY_MARKER,
    canonicalizePrompt,
    stripGeneratedBlocks,
    dailyContractBlock,
    sync
  });

  sync();
  W.addEventListener?.('focus', sync);
  W.addEventListener?.('pageshow', sync);
  W.addEventListener?.('lunea:feature-group-ready', sync);
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    sync();
    if (tries > 80) clearInterval(timer);
  }, 250);
  console.info('💞 LUNEA Daily Interpretation Contract V2 loaded · reunion/contact + money/realization judgment');
})();
