'use strict';

/* LUNEA HORARY INTERPRETATION BRIDGE V47
   Rewrites only Gemini requests that are already Horary interpretation calls.
   Tarot / Daily / other AI requests are untouched. */
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_INTERPRETATION_BRIDGE_V47__ || typeof W.fetch !== 'function') return;
  W.__LUNEA_HORARY_INTERPRETATION_BRIDGE_V47__ = true;

  const priorFetch = W.fetch.bind(W);
  const HORARY_MARKERS = [
    '[HORARY V1 · 질문시각 점성술 계산 결과]',
    '[HORARY V1 · 계산 결과]',
    '[HORARY ENGINE RESULT · AUTHORITATIVE]',
    'LUNEA의 전통 Horary',
    'LUNEA HORARY INTERPRETATION ENGINE V2'
  ];

  const QUALITY_LOCK = `

[FINAL VERDICT LOCK · V2 QA]
- 엔진에 authoritative/staged verdict가 있으면 최종 결론의 방향을 고정한다. NO/부정/근거부족 판정을 reception·dignity·Moon 분위기만으로 YES/긍정으로 올리지 마라.
- direct perfection이 없고 derived-event perfection만 유효하면 그 파생 사건만 긍정할 수 있다. 예: 연락 사건 근거를 재회·관계 성사 근거로 확대하지 마라.
- 엔진에 confirmed obstruction: none 또는 동등한 무방해 판정이 있으면 방해 행성·prohibition·frustration을 새로 만들지 마라.
- out-of-orb / geometric-only / nearest aspect는 applying perfection이나 사건 성사 근거로 호칭하지 마라. currentWithinOrb/currentlyWithinOrb가 false이면 “적용각”이라는 표현도 쓰지 말고 “기하학적으로 접근 중”으로만 설명한다.
- 엔진이 timing unit, candidate date/time, 범위를 제공하지 않았다면 달력 날짜나 N일/N주/N개월 수치를 새로 쓰지 마라.
- Prashna가 Horary와 다르면 평균·절충 결론을 만들지 말고 체계 간 충돌로 분리해서 쓴다.
- Cross V2 근거의 aspect·house·reception을 인용할 때는 authoritative 블록에 존재하는 사실만 쓰고, 아래 VALIDATOR ALLOWED ALIASES에 없는 별도 점성 요소를 추가하지 마라.

[PRIVATE SELF-CHECK · 출력 금지]
최종 답변을 보내기 전에 내부적으로만 다음을 확인하고, 하나라도 실패하면 답변을 고쳐라.
1. staged/authoritative verdict와 최종 한줄 결론의 방향이 같은가?
2. 마음·수용성과 실제 행동·사건 성사를 분리했는가?
3. direct / derived-event / indirect perfection을 서로 바꿔 부르지 않았는가?
4. 화면에 없는 하우스·aspect·방해·날짜·확률·점수를 만들지 않았는가?
5. 핵심 판단마다 실제 엔진 문구를 근거: 뒤에 붙였는가?
6. Prashna는 Horary 뒤에 독립 교차검증으로만 사용했는가?
이 체크리스트 자체는 사용자에게 출력하지 마라.`;

  const EXPLANATION_LOCK = `

[AI EXPLANATION V2 · EVIDENCE-LINKED]
기존 [출력 형식]의 제목과 질문 유형별 구조를 유지하되, 설명층은 다음 규칙을 추가로 지킨다.
- 최종 결론과 중요한 사건 판단은 먼저 “판정:”으로 짧게 말하고, 바로 다음 줄에 “근거:”를 붙인다.
- “근거:”에는 [HORARY ENGINE RESULT · AUTHORITATIVE] 또는 Cross V2에 실제로 존재하는 근거만 요약한다. 화면에 없는 하우스·행성·각·리셉션·점수·시기 근거를 새로 만들지 않는다.
- 결론을 약화하거나 반대하는 실제 엔진 근거가 있으면 “반증:”으로 별도 표시한다. 잠재 후보를 확정 반증처럼 쓰지 않는다.
- 해석의 한계, 근거 부족, 서로 충돌하는 신호는 “불확실성:”으로 명시한다. 불확실성을 임의 확률이나 숫자 점수로 바꾸지 않는다.
- reception/dignity가 말하는 의향·수용성·상태와 perfection/derived-event axis가 말하는 실제 행동·사건을 한 문장 안에서 섞어 확정하지 않는다.
- Moon은 전개·순서·보조 시기층으로만 설명하고 다른 핵심 성사축을 덮어쓰지 않는다.
- Prashna가 있으면 Horary 판정을 먼저 완료한 뒤 독립 교차층으로 설명한다. 같은 방향, 충돌, 이유, 불확실성을 구분하고 평균·합산·절충하지 않는다.
- 엔진에 없는 확률(%), 점수, 달력 날짜, N일/N주/N개월을 생성하지 않는다.
- out-of-orb인데 기하학적으로 가까워지는 각은 “기하학적으로 접근 중”이라고 쓰고, currentWithinOrb/currentlyWithinOrb가 true가 아닌 한 “적용각”이라고 부르지 않는다.
- 전문용어는 그대로 쓰되 바로 뒤에 쉬운 한국어 뜻을 짧게 붙인다.
- 설명을 길게 늘이기보다 “질문에 대한 답 → 근거 → 반증/제한 → 불확실성”의 읽기 순서를 우선한다.`;

  function isGeminiGenerate(url) {
    return /generativelanguage\.googleapis\.com\/.+:generateContent(?:\?|$)/i.test(String(url || ''));
  }

  function isHoraryPrompt(text) {
    const value = String(text || '');
    return HORARY_MARKERS.some(marker => value.includes(marker));
  }

  function validatorAliasBlock(prompt) {
    const source = String(prompt || '');
    const aliases = [];
    const aspectAliases = [
      ['conjunction', /\bconjunction\b|(?:합|컨정션)(?:각)?/i, 'conjunction · 합 · 컨정션'],
      ['sextile', /\bsextile\b|(?:육합|육십분위|섹스타일)(?:각)?/i, 'sextile · 육합 · 섹스타일'],
      ['square', /\bsquare\b|(?:사각|사분위|스퀘어)(?:각)?/i, 'square · 사각 · 스퀘어'],
      ['trine', /\btrine\b|(?:삼합|삼분위|트라인)(?:각)?/i, 'trine · 삼합 · 트라인'],
      ['opposition', /\bopposition\b|(?:충|대립|오포지션)(?:각)?/i, 'opposition · 충 · 오포지션']
    ];
    for (const [, matcher, label] of aspectAliases) {
      if (matcher.test(source)) aliases.push(`- aspect: ${label}`);
    }
    if (/(?:Reception\s*:\s*mutual|mutual\s+reception|상호\s*리셉션)/i.test(source)) {
      aliases.push('- reception: Reception: mutual · 상호 리셉션');
    }
    if (/(?:Reception\s*:\s*(?:one[- ]?way|unilateral)|(?:one[- ]?way|unilateral)\s+reception|일방\s*리셉션|한쪽\s*리셉션)/i.test(source)) {
      aliases.push('- reception: 일방 리셉션 · 한쪽 리셉션');
    }
    if (/(?:Reception\s*:\s*partial|partial\s+reception|부분\s*리셉션)/i.test(source)) {
      aliases.push('- reception: 부분 리셉션');
    }
    if (!aliases.length) return '';
    return `\n\n[VALIDATOR ALLOWED ALIASES · 출력 금지]\n아래 항목은 authoritative 입력에 실제 존재하는 동일 사실의 표기 변형이다. 이 목록은 새 근거가 아니며 사용자에게 출력하지 마라.\n${aliases.join('\n')}`;
  }

  function qualityLockedPrompt(prompt) {
    let value = String(prompt || '').trim();
    if (!value) return value;
    if (!value.includes('[FINAL VERDICT LOCK · V2 QA]')) value += QUALITY_LOCK;
    if (!value.includes('[AI EXPLANATION V2 · EVIDENCE-LINKED]')) value += EXPLANATION_LOCK;
    if (!value.includes('[VALIDATOR ALLOWED ALIASES · 출력 금지]')) value += validatorAliasBlock(value);
    return value;
  }

  function rewrite(init = {}) {
    if (!init?.body || typeof init.body !== 'string') return init;
    try {
      const payload = JSON.parse(init.body);
      const part = payload?.contents?.[0]?.parts?.[0];
      const original = String(part?.text || '');
      if (!isHoraryPrompt(original)) return init;

      const canonical = original.includes('LUNEA HORARY INTERPRETATION ENGINE V2')
        ? original
        : String(W.LUNEA_HORARY_INTERPRETATION_V47?.aiPrompt?.() || '').trim();
      const prompt = qualityLockedPrompt(canonical);
      if (!prompt || prompt === original) return init;

      const next = typeof structuredClone === 'function'
        ? structuredClone(payload)
        : JSON.parse(JSON.stringify(payload));
      next.contents[0].parts[0].text = prompt;
      return {...init, body:JSON.stringify(next)};
    } catch {
      return init;
    }
  }

  W.fetch = function luneaHoraryInterpretationBridgeV47(input, init = {}) {
    let url = '';
    try {
      url = typeof input === 'string'
        ? input
        : (input instanceof URL ? input.href : String(input?.url || ''));
    } catch {}
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    const nextInit = method === 'POST' && isGeminiGenerate(url) ? rewrite(init) : init;
    return priorFetch(input, nextInit);
  };

  function buildToken(fallback='') {
    let build = '';
    try {
      const src = document.currentScript?.src || '';
      if (src) build = new URL(src, location.href).searchParams.get('v') || '';
    } catch {}
    return build || fallback;
  }

  function loadAiExplanationV2() {
    if (typeof document === 'undefined') return false;
    if (document.getElementById('luneaHoraryAiExplanationV2Loader')) return true;
    const script = document.createElement('script');
    script.id = 'luneaHoraryAiExplanationV2Loader';
    script.src = `./lunea-horary-ai-explanation-v2.js?v=${encodeURIComponent(buildToken('200'))}`;
    script.async = false;
    script.onerror = () => console.error('[LUNEA] Horary AI Explanation V2 failed to load');
    (document.head || document.documentElement).appendChild(script);
    return true;
  }

  function loadAnswerValidatorV48() {
    if (typeof document === 'undefined') return false;
    if (document.getElementById('luneaHoraryAnswerValidatorV48Loader')) return true;
    const script = document.createElement('script');
    script.id = 'luneaHoraryAnswerValidatorV48Loader';
    script.src = `./lunea-horary-answer-validator-v48.js?v=${encodeURIComponent(buildToken('480'))}`;
    script.async = false;
    script.onerror = () => console.error('[LUNEA] Horary Answer Validator V48 failed to load');
    (document.head || document.documentElement).appendChild(script);
    return true;
  }

  function loadExplanationLayers() {
    loadAiExplanationV2();
    loadAnswerValidatorV48();
  }

  W.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47 = Object.freeze({
    version:'47.4',
    rewrite,
    isHoraryPrompt,
    qualityLockedPrompt,
    validatorAliasBlock,
    qualityLock:QUALITY_LOCK,
    explanationLock:EXPLANATION_LOCK,
    loadAiExplanationV2,
    loadAnswerValidatorV48,
    markers:HORARY_MARKERS.slice()
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(loadExplanationLayers, 0), {once:true});
    } else {
      setTimeout(loadExplanationLayers, 0);
    }
  }
  console.info('✦ LUNEA Horary Interpretation Bridge V47.4 active · AI Explanation V2 contract ON');
})();