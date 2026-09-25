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
- out-of-orb / geometric-only / nearest aspect는 applying perfection이나 사건 성사 근거로 호칭하지 마라.
- 엔진이 timing unit, candidate date/time, 범위를 제공하지 않았다면 달력 날짜나 N일/N주/N개월 수치를 새로 쓰지 마라.
- Prashna가 Horary와 다르면 평균·절충 결론을 만들지 말고 체계 간 충돌로 분리해서 쓴다.

[PRIVATE SELF-CHECK · 출력 금지]
최종 답변을 보내기 전에 내부적으로만 다음을 확인하고, 하나라도 실패하면 답변을 고쳐라.
1. staged/authoritative verdict와 최종 한줄 결론의 방향이 같은가?
2. 마음·수용성과 실제 행동·사건 성사를 분리했는가?
3. direct / derived-event / indirect perfection을 서로 바꿔 부르지 않았는가?
4. 화면에 없는 하우스·aspect·방해·날짜·확률·점수를 만들지 않았는가?
5. 핵심 판단마다 실제 엔진 문구를 근거: 뒤에 붙였는가?
6. Prashna는 Horary 뒤에 독립 교차검증으로만 사용했는가?
이 체크리스트 자체는 사용자에게 출력하지 마라.`;

  function isGeminiGenerate(url) {
    return /generativelanguage\.googleapis\.com\/.+:generateContent(?:\?|$)/i.test(String(url || ''));
  }

  function isHoraryPrompt(text) {
    const value = String(text || '');
    return HORARY_MARKERS.some(marker => value.includes(marker));
  }

  function qualityLockedPrompt(prompt) {
    const value = String(prompt || '').trim();
    if (!value || value.includes('[FINAL VERDICT LOCK · V2 QA]')) return value;
    return value + QUALITY_LOCK;
  }

  function rewrite(init = {}) {
    if (!init?.body || typeof init.body !== 'string') return init;
    try {
      const payload = JSON.parse(init.body);
      const part = payload?.contents?.[0]?.parts?.[0];
      const original = String(part?.text || '');
      if (!isHoraryPrompt(original)) return init;
      if (original.includes('LUNEA HORARY INTERPRETATION ENGINE V2')) return init;

      const prompt = qualityLockedPrompt(W.LUNEA_HORARY_INTERPRETATION_V47?.aiPrompt?.());
      if (!prompt) return init;

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

  function loadAnswerValidatorV48() {
    if (typeof document === 'undefined') return false;
    if (document.getElementById('luneaHoraryAnswerValidatorV48Loader')) return true;
    const script = document.createElement('script');
    script.id = 'luneaHoraryAnswerValidatorV48Loader';
    let build = '';
    try {
      const src = document.currentScript?.src || '';
      if (src) build = new URL(src, location.href).searchParams.get('v') || '';
    } catch {}
    script.src = `./lunea-horary-answer-validator-v48.js?v=${encodeURIComponent(build || '480')}`;
    script.async = false;
    script.onerror = () => console.error('[LUNEA] Horary Answer Validator V48 failed to load');
    (document.head || document.documentElement).appendChild(script);
    return true;
  }

  W.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47 = Object.freeze({
    version:'47.2',
    rewrite,
    isHoraryPrompt,
    qualityLockedPrompt,
    qualityLock:QUALITY_LOCK,
    loadAnswerValidatorV48,
    markers:HORARY_MARKERS.slice()
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(loadAnswerValidatorV48, 0), {once:true});
    } else {
      setTimeout(loadAnswerValidatorV48, 0);
    }
  }
  console.info('✦ LUNEA Horary Interpretation Bridge V47.2 active');
})();
