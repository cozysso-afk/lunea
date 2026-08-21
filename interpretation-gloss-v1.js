'use strict';

/*
  LUNEA INTERPRETATION GLOSS V1
  Load LAST among prompt-related patches.

  Purpose:
  - Keep interpretations primarily in natural Korean.
  - On first appearance, add Korean reading/meaning in parentheses
    for English, Chinese-character, transliterated, and specialist terms.
  - Does not alter RNG, cards, spread routing, archives, profile data,
    Timing Oracle, or astrology calculations.
*/
(() => {
  if (window.__LUNEA_INTERPRETATION_GLOSS_V1__) return;
  window.__LUNEA_INTERPRETATION_GLOSS_V1__ = true;

  const LANGUAGE_RULES = `
[해석 문체 · 용어 표기 규칙 — 최종 출력에 반드시 적용]
1. 전체 해석의 기본 언어는 자연스러운 한국어로 한다. 영어·한자·전문용어를 설명 없이 단독으로 던지지 않는다.
2. 영어 원어를 사용할 때는 첫 등장에 반드시 바로 뒤 괄호로 자연스러운 한글 뜻 또는 통용 한글 명칭을 병기한다.
   예: Applying aspect(적용각), Separating aspect(분리각), Whole Sign(홀사인), Placidus(플라시두스), Reception(리셉션·상호 수용).
3. 한자 또는 한문 명리 용어를 사용할 때는 첫 등장에 한글 독음·뜻을 병기한다.
   예: 庚金(경금), 正官(정관), 用神(용신), 喜神(희신), 忌神(기신).
4. 한국어로 널리 쓰이는 전문용어라도 일반 독자가 의미를 놓칠 수 있으면 첫 등장에 짧은 뜻을 괄호로 붙인다.
   예: 세크트(주·야간 차트 구분), 리셉션(행성 간 수용 관계), 퍼펙션(호라리에서 사건 성립을 나타내는 완성), 오브(각의 정확도에서 벗어난 허용 거리).
5. 고유 명칭은 정확성을 유지한다. 억지 번역으로 의미를 바꾸지 말고 '원어(한글 통용명·짧은 뜻)' 형식을 우선한다.
6. 같은 용어가 한 답변에서 반복되면 첫 등장 이후에는 한글 명칭만 사용해도 된다. 매 문장마다 원어를 반복하지 않는다.
7. 카드 이름도 영문명을 병기할 필요가 있을 때는 'The High Priestess(여사제)'처럼 표기한다. 이미 화면에 한글 카드명이 충분히 제시된 경우 본문에서는 한글명을 우선한다.
8. 점성술 표기는 예를 들어 ASC(상승점), MC(중천점), Vertex(버텍스·운명적 접점), Part of Fortune(포르투나·행운점), Solar Return(솔라리턴·태양회귀), Lunar Return(루나리턴·달회귀), Mercury Return(수성회귀), Venus Return(금성회귀), Mars Return(화성회귀)처럼 첫 등장에 한글을 병기한다.
9. 호라리에서는 Querent(질문자), Quesited(질문 대상), Significator(시그니피케이터·대표 행성), Regiomontanus(레지오몬타누스 하우스), Translation of Light(빛의 전달), Collection of Light(빛의 수집), Prohibition(금지·성립 방해)처럼 표기한다.
10. 전문용어를 많이 쓴다고 더 전문적인 해석으로 보이는 것이 아니다. 사용자의 질문에 필요한 용어만 쓰고, 바로 이해할 수 있는 한국어 문장을 우선한다.
11. 영어 문장이나 한자어 나열로 문단을 채우지 않는다. 전문용어 뒤에는 반드시 이번 질문에서 그것이 무엇을 뜻하는지 평이한 한국어로 풀어쓴다.
12. 숫자·기간·각도·하우스 등 계산값은 원래 값을 그대로 보존한다. 한글 병기를 위해 계산값이나 카드 결론을 바꾸지 않는다.
`;

  function installPromptWrapper() {
    if (typeof promptString !== 'function' || window.__LUNEA_GLOSS_PROMPT_WRAPPED__) {
      return;
    }

    window.__LUNEA_GLOSS_PROMPT_WRAPPED__ = true;
    const original = promptString;

    promptString = function() {
      const prompt = original.apply(this, arguments);
      if (String(prompt).includes('[해석 문체 · 용어 표기 규칙 — 최종 출력에 반드시 적용]')) {
        return prompt;
      }
      return `${prompt}\n\n${LANGUAGE_RULES}`;
    };
  }

  function boot() {
    installPromptWrapper();
    console.info('✦ LUNEA INTERPRETATION GLOSS V1 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
