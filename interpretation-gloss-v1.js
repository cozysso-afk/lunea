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
1. 전체 해석의 기본 언어는 자연스러운 한국어로 한다. 영어·한자·전문용어를 설명 없이 단독으로 던지지 않는다.
2. 영어 원어를 사용할 때는 첫 등장에 반드시 바로 뒤 괄호로 자연스러운 한글 뜻 또는 통용 한글 명칭을 병기한다.
   예: Applying aspect(적용각), Separating aspect(분리각), Whole Sign(홀사인), Placidus(플라시두스), Reception(리셉션·상호 수용).
3. 한자 또는 한문 명리 용어를 사용할 때는 첫 등장에 한글 독음·뜻을 병기한다.
   예: 庚金(경금), 正官(정관), 用神(용신), 喜神(희신), 忌神(기신).
4. 한국어로 널리 쓰이는 전문용어라도 일반 독자가 의미를 놓칠 수 있으면 첫 등장에 짧은 뜻을 괄호로 붙인다.
   예: 세크트(주·야간 차트 구분), 리셉션(행성 간 수용 관계), 퍼펙션(호라리에서 사건 성립을 나타내는 완성), 오브(각의 정확도에서 벗어난 허용 거리).
5. 고유 명칭은 정확성을 유지한다. 억지 번역으로 의미를 바꾸지 말고 '원어(한글 통용명·짧은 뜻)' 형식을 우선한다.
6. 같은 용어가 한 답변에서 반복되면 첫 등장 이후에는 한글 명칭만 사용해도 된다.
7. 카드 이름은 본문에서는 한글명을 우선한다. 영문명을 쓸 필요가 있을 때만 The High Priestess(여사제)처럼 병기한다.
8. 점성술 표기는 ASC(상승점), MC(중천점), Vertex(버텍스·운명적 접점), Part of Fortune(포르투나·행운점), Solar Return(솔라리턴·태양회귀), Lunar Return(루나리턴·달회귀), Mercury Return(수성회귀), Venus Return(금성회귀), Mars Return(화성회귀)처럼 첫 등장에 한글을 병기한다.
9. 호라리에서는 Querent(질문자), Quesited(질문 대상), Significator(시그니피케이터·대표 행성), Regiomontanus(레지오몬타누스 하우스), Translation of Light(빛의 전달), Collection of Light(빛의 수집), Prohibition(금지·성립 방해)처럼 표기한다.
10. 전문용어를 많이 쓰지 않는다. 질문에 필요한 용어만 사용하고 바로 이해할 수 있는 한국어 문장을 우선한다.
11. 영어 문장이나 한자어 나열로 문단을 채우지 않는다.
12. 숫자·기간·각도·하우스 등 계산값은 원래 값을 그대로 보존한다.
`;

  const QUALITY_RULES = `
[최종 해석 품질 규칙 — 다른 모든 문체 규칙보다 우선]
1. 계산되지 않은 날짜·주차·월초·중순·하순·중후반·특정 시각을 새로 만들어내지 않는다.
2. 카드 포지션이 '1개월 안 변화'라고 되어 있다고 해서 '2주차', '중순', '후반부'처럼 더 세분화하지 않는다.
3. 구체적 시기 표현은 현재 프롬프트에 실제로 존재하는 다음 자료에서만 가져온다:
   - LUNEA Timing Oracle(시기 오라클)
   - Western Transit Scanner(서양 트랜짓 스캐너)
   - 계산된 Return(회귀) 시각
   - 질문 원문에 사용자가 직접 지정한 기간
4. 위 시기 자료가 없으면 '한 달 안', '가까운 시기', '해당 기간 안'처럼 카드와 질문이 실제로 지지하는 범위까지만 말한다.
5. 현재 프롬프트에 없는 엔진이나 계산을 사용했다고 말하지 않는다. 예: Transit 블록이 없는데 '트랜짓상'이라고 말하지 않는다.
6. Timing Oracle과 Transit이 모두 있으면:
   - Timing Oracle = 넓은 시기 범위
   - Transit = 그 범위 안의 활성 피크
   로 역할을 나눈다.
7. Timing Oracle과 Transit이 충돌하면 억지로 하나로 합치지 않는다. '신호가 갈린다'고 명시하고 각각의 역할을 설명한다.
8. Return(회귀)은 배경 주기다. Return 날짜 하나를 연락·재회·합격 등 사건의 확정일로 바꾸지 않는다.
9. Thai Taksa(태국 탁사)는 구조·상징 보조층이다. 정밀 날짜 근거로 사용하지 않는다.
10. 사주명리 프로필은 보조층이다. 입력되지 않은 대운·세운·합충형파·용희신을 새로 생성하지 않는다.
11. 카드 해석은 반드시 각 포지션을 먼저 지킨다. 카드의 일반 의미가 포지션 질문을 덮어쓰면 안 된다.
12. '가능성이 높다', '긍정 신호가 우세하다' 같은 표현은 가능하지만 근거 없는 확률 퍼센트는 만들지 않는다.
13. 사건 성립 가능성과 시기를 분리한다. 시기 카드가 나왔다는 이유만으로 사건 성립을 확정하지 않는다.
14. 첫 문단의 결론은 현재 프롬프트에 실제로 들어온 근거만 사용한다.
15. 최종 답변을 쓰기 직전에 아래 SELF-CHECK를 내부적으로 수행하고, 위반 문장을 수정한 뒤 최종 출력한다.

[SELF-CHECK · 최종 출력 전 내부 검수]
A. 내가 말한 모든 날짜/주차/중순·하순 표현에 실제 계산 또는 사용자 지정 근거가 있는가?
B. 현재 프롬프트에 없는 Timing/Transit/Return/Thai/사주 계산을 사용했다고 말하지 않았는가?
C. 영어·한자·전문용어 첫 등장에 한글 병기가 빠진 곳이 없는가?
D. 포지션별 카드 역할을 바꾸거나 섞지 않았는가?
E. 긍정 신호와 지연·반증 신호를 둘 다 반영했는가?
F. 숫자·날짜·각도·하우스 계산값을 임의로 바꾸지 않았는가?
하나라도 아니면 최종 출력 전에 해당 문장을 고쳐라.
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
