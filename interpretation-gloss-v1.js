'use strict';

/*
  LUNEA INTERPRETATION GLOSS V2
  Load LAST among prompt-related patches.

  Purpose:
  - Natural Korean output.
  - Korean gloss for English/Chinese/specialist terms.
  - Hard guard against invented dates/periods.
  - Use only timing engines actually present in the current prompt.
  - Final self-audit before answer generation.
  - Does not alter RNG, cards, spread routing, archives, profile data,
    Timing Oracle, Transit, Return, Thai Taksa, or astrology calculations.
*/
(() => {
  if (window.__LUNEA_INTERPRETATION_GLOSS_V2__) return;
  window.__LUNEA_INTERPRETATION_GLOSS_V2__ = true;

  const LANGUAGE_RULES = `
[해석 문체 · 용어 표기 규칙 — 최종 출력에 반드시 적용]
- 자연스러운 한국어로 명확하고 간결하게 답한다. 카드 이름은 한글명을 우선한다.
- 실제 사용하는 영어·한자·전문용어만 첫 등장에 한글 뜻을 병기한다. 관련 없는 용어 예시나 전문용어 목록은 출력하지 않는다.
- 사용자 입력의 숫자·날짜·천체 계산값은 그대로 보존한다.
`;

  const QUALITY_RULES = `
[최종 해석 품질 규칙 — 다른 모든 문체 규칙보다 우선]
- 질문 원문과 각 포지션에 실제 나온 카드를 먼저 해석한다. 서로 다른 질문 축과 감정·의도·행동을 섞지 않는다.
- 근거가 강하면 강하게, 약하면 조심스럽게 말한다. 긍정·부정을 기계적으로 반씩 배분하거나 한 장만으로 극단적인 결론을 만들지 않는다.
- 사용자 지정 기간 또는 실제 제공된 Timing Oracle·Transit·Return 계산 범위를 벗어난 날짜·시각·주차를 만들지 않는다. 시기 신호가 사건 성립을 증명하지는 않는다.
- 실제 제공되지 않은 엔진, 점성술 수치, 사주 계산을 지어내지 않는다. Thai Taksa와 프로필은 직접 관련될 때만 참고한다.
- 상대의 속마음과 행동 원인은 카드상 가설로 표현하고 확인된 현실 사실과 구분한다. 임의 확률은 쓰지 않는다.
- 마지막으로 포지션 혼동, 근거 없는 단정·시기, 모순되는 결론이 없는지만 점검한다.
`;

  function engineLedger(prompt) {
    const s = String(prompt || '');
    const hasTiming = s.includes('[LUNEA TIMING ORACLE');
    const hasTransit = s.includes('[WESTERN ASTROLOGY — TRANSIT SCANNER');
    const hasReturns = s.includes('[PLANETARY RETURNS · 회귀 계산 결과]');
    const hasThai = s.includes('[THAI ASTROLOGY · MAHA TAKSA 계산 결과]');
    const hasSaju = s.includes('[SAJU / FOUR PILLARS · 사주명리]');
    const hasWesternProfile = s.includes('[WESTERN ASTROLOGY · 서양점성술]');

    const rows = [
      `- Timing Oracle(시기 오라클): ${hasTiming ? '현재 프롬프트에 있음 → 사용 가능' : '없음 → 사용했다고 말하면 안 됨'}`,
      `- Transit Scanner(트랜짓 스캐너): ${hasTransit ? '현재 프롬프트에 있음 → 계산값만 사용 가능' : '없음 → 트랜짓 시기 생성 금지'}`,
      `- Planetary Returns(행성 회귀): ${hasReturns ? '현재 프롬프트에 있음 → 배경 주기로 사용 가능' : '없음 → 사용 금지'}`,
      `- Thai Taksa(태국 탁사): ${hasThai ? '현재 프롬프트에 있음 → 구조 보조로 사용 가능' : '없음 → 사용 금지'}`,
      `- Saju(사주명리): ${hasSaju ? '현재 프롬프트에 있음 → 입력값 범위에서만 보조 가능' : '없음 → 사용 금지'}`,
      `- Western natal profile(서양 출생차트 프로필): ${hasWesternProfile ? '있음 → 질문 관련 항목만 보조 가능' : '없음 → 사용 금지'}`
    ].join('\n');

    return `[현재 리딩에서 실제 사용 가능한 보조 엔진 — 자동 감지]\n${rows}`;
  }

  function installPromptWrapper() {
    if (typeof promptString !== 'function' || window.__LUNEA_GLOSS_V2_PROMPT_WRAPPED__) return;

    window.__LUNEA_GLOSS_V2_PROMPT_WRAPPED__ = true;
    const original = promptString;

    promptString = function() {
      let prompt = String(original.apply(this, arguments) || '');

      // Remove old V1 language block if already injected earlier in a mixed cache/load state.
      const oldMarker = '[해석 문체 · 용어 표기 규칙 — 최종 출력에 반드시 적용]';
      const qualityMarker = '[최종 해석 품질 규칙 — 다른 모든 문체 규칙보다 우선]';

      const additions = [];
      if (!prompt.includes(oldMarker)) additions.push(LANGUAGE_RULES);
      if (!prompt.includes(qualityMarker)) additions.push(QUALITY_RULES);
      additions.push(engineLedger(prompt));

      return `${prompt}\n\n${additions.join('\n\n')}`;
    };
  }

  function boot() {
    installPromptWrapper();
    console.info('✦ LUNEA INTERPRETATION GLOSS V2 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
