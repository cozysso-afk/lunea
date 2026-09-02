'use strict';

/*
  LUNEA FINAL PROMPT PRIORITY V2
  ==============================
  Last-mile evidence priority + balanced auxiliary-system usage policy.

  Goals:
  - Keep question/positions/RWS cards as the primary evidence.
  - Prevent a valid computed Western natal chart from being silently ignored.
  - Use Transit / Returns / Thai Taksa only when their real computed blocks are
    present for the current question.
  - Preserve the conditional Saju policy.
  - Never use the user's natal/profile data as proof of another person's private
    feelings or as a substitute for event/timing calculations.
*/
(() => {
  const W = window;
  if (W.__LUNEA_FINAL_PROMPT_PRIORITY_V1__) return;
  W.__LUNEA_FINAL_PROMPT_PRIORITY_V1__ = true;

  const MARKER = '[FINAL READING PRIORITY · 최종 근거 우선순위]';

  function clean(v){ return String(v || '').replace(/\s+/g,' ').trim(); }

  function questionFromPrompt(prompt){
    const s = String(prompt || '');
    const m = s.match(/\[질문 원문\]\s*\n["“]?([\s\S]*?)["”]?\s*\n\n\[질문 유형\]/);
    return clean(m?.[1] || '');
  }

  function westernBlock(prompt){
    const s = String(prompt || '');
    const m = s.match(/\[WESTERN ASTROLOGY · 서양점성술\]([\s\S]*?)(?=\n\[SAJU \/ FOUR PILLARS|\n\[THAI ASTROLOGY|\n\[프로필 체계 사용 규칙|\n\n\[뽑힌 카드\]|$)/);
    return String(m?.[1] || '');
  }

  function hasWesternNatal(prompt){
    const b = westernBlock(prompt);
    if (!b || /아직\s*Astro\s*Core\s*미연결/i.test(b)) return false;
    const hits = b.match(/-\s*(?:Sun\(태양\)|Moon\(달\)|ASC\(상승점\)|MC\(중천점\)|Mercury\(수성\)|Venus\(금성\)|Mars\(화성\)|Jupiter\(목성\)|Saturn\(토성\)|Vertex\(버텍스\)):\s*\S[^\n]*/g) || [];
    return hits.length >= 2;
  }

  function hasTransit(prompt){
    return String(prompt || '').includes('[WESTERN ASTROLOGY — TRANSIT SCANNER');
  }

  function hasReturns(prompt){
    return String(prompt || '').includes('[PLANETARY RETURNS · 회귀 계산 결과]');
  }

  function hasThaiComputed(prompt){
    return String(prompt || '').includes('[THAI ASTROLOGY · MAHA TAKSA 계산 결과]');
  }

  function sajuBlock(prompt){
    const s = String(prompt || '');
    const m = s.match(/\[SAJU \/ FOUR PILLARS · 사주명리\]([\s\S]*?)(?=\n\[THAI ASTROLOGY|\n\[프로필 체계 사용 규칙|\n\n\[뽑힌 카드\]|$)/);
    return String(m?.[1] || '');
  }

  function hasSaju(prompt){
    const b = sajuBlock(prompt);
    return /-\s*(?:일간|원국|오행 분포|신강·신약|주요 십성·특징|용신|희신|기신|기타 확인사항):\s*\S/.test(b);
  }

  function classify(question){
    const q = clean(question).toLowerCase();
    if (!q) return 'neutral';

    const selfDecision = /(?:내가|나는|나한테|나에게|내\s*(?:마음|경계|선택|결정|행동|반응|답장|연락|소모|후회|부담|페이스|리듬|기준)|자연스러운|덜\s*후회|어떻게\s*(?:할|해야)|할까\s*말까|선택|결정|이직|퇴사|취업|직장|커리어|시험|공부|학업|돈|재정|투자|주식|매수|매도|소비|구매|이사|건강|회복|생활\s*리듬|자기\s*패턴|준비도|경계)/i.test(q);
    if (selfDecision) return 'self_relevant';

    const otherMind = /(?:걔|그\s*사람|상대|전남친|전여친|전애인|a\b|b\b)[^?]{0,80}(?:생각|마음|감정|호감|그리움|후회|연락\s*의도|행동\s*의도|나를\s*어떻게)/i.test(q);
    const selfAxis = /(?:내\s*(?:선택|경계|대응|반응|행동|소모|후회)|내가\s*(?:할|해야|어떻게))/.test(q);
    if (otherMind && !selfAxis) return 'other_focused';

    return 'neutral';
  }

  function westernPolicy(prompt){
    if (!hasWesternNatal(prompt)) {
      return `- Western Natal(서양 출생차트): 실제 계산된 Natal 핵심값이 없으면 태양궁 호환값이나 출생정보만으로 상세 출생차트를 지어내지 않는다.`;
    }

    const mode = classify(questionFromPrompt(prompt));
    if (mode === 'other_focused') {
      return `- Western Natal(서양 출생차트): 실제 계산된 Natal 값이 있으므로 최종 답변에 짧은 '서양점성 보조' 문장 또는 단락을 최소 1회 실질적으로 반영한다. 단, 이번 질문이 타인의 생각·감정·행동 중심이면 사용자의 Natal을 상대의 속마음·연락 발생·행동 증거로 쓰지 않는다. Sun/Moon/ASC/MC/Mercury/Venus/Mars/Jupiter/Saturn/Vertex 중 현재 질문과 연결되는 실제 계산값 1~2개를 정확히 짚어 사용자의 관계 체감·반응 패턴·경계 또는 선택 기준만 보조한다. 막연히 '점성술상'이라고만 쓰지 않는다.`;
    }

    return `- Western Natal(서양 출생차트): 실제 계산된 Natal 값이 있으므로 최종 답변에 짧은 '서양점성 보조' 문장 또는 단락을 최소 1회 실질적으로 반영한다. Sun/Moon/ASC/MC/Mercury/Venus/Mars/Jupiter/Saturn/Vertex 중 질문과 직접 관련된 실제 계산값 1~2개를 정확히 짚고 현재 카드/포지션과 어떻게 교차 보조되는지 설명한다. Natal은 사용자의 성향·반응·관계 방식·현실 판단을 보조하며 카드 결론이나 사건 성립 여부를 대신하지 않는다. 막연히 '점성술상'이라고만 쓰지 않는다.`;
  }

  function transitPolicy(prompt){
    if (!hasTransit(prompt)) {
      return `- Transit Scanner(트랜짓): 현재 질문의 실제 계산 결과 블록이 없으면 트랜짓을 참고했다고 말하거나 현재 천체 위치·시기를 새로 만들지 않는다.`;
    }
    return `- Transit Scanner(트랜짓): 현재 질문의 실제 계산 결과가 있으므로 시기·현재 흐름을 다루는 부분에서는 계산된 peak/caution/exact-hit 중 관련 근거를 최소 1개 구체적으로 반영한다. 트랜짓은 활성 구간 보조이며 사건 성립 자체를 확정하거나 RWS 카드 결론을 뒤집지 않는다.`;
  }

  function returnPolicy(prompt){
    if (!hasReturns(prompt)) {
      return `- Planetary Returns(행성 회귀): 실제 계산 결과가 없으면 회귀 시각·하우스·주기를 만들어내지 않는다.`;
    }
    return `- Planetary Returns(행성 회귀): 실제 계산 결과가 있으면 질문과 직접 관련된 회귀 1개를 배경 주기로 짧게 교차참고한다. 회귀 날짜 하나를 연락·재회·합격·주가 움직임의 확정일로 바꾸지 않는다.`;
  }

  function thaiPolicy(prompt){
    if (!hasThaiComputed(prompt)) {
      return `- Thai Taksa(태국 탁사): 현재 질문의 실제 Maha Taksa 계산 결과가 없으면 출생 요일 프로필만으로 정밀 사건·시기 근거를 만들어내지 않는다.`;
    }
    return `- Thai Taksa(태국 탁사): 현재 질문의 실제 Maha Taksa 계산 결과가 있으므로 질문과 연결되는 Taksa 영역/행성 1개를 짧은 '태국점성 보조'로 반영한다. 구조·상징 보조층으로만 쓰고 정밀 날짜나 타인의 속마음 증거로 확대하지 않는다.`;
  }

  function sajuPolicy(prompt){
    if (!hasSaju(prompt)) return `- Saju(사주명리): 유효한 입력값이 없으면 사용하지 않는다.`;
    const mode = classify(questionFromPrompt(prompt));

    if (mode === 'self_relevant') {
      return `- Saju(사주명리): 이번 질문은 사용자 본인의 선택·경계·소모·행동 방식 또는 현실 판단이 직접 포함된다. 입력된 사주값이 질문과 연결된다면 최종 답변에 짧은 '사주 보조' 문장 또는 단락을 최소 1회 실질적으로 반영한다. 단순 장식 문구가 아니라 실제 입력된 일간/신강·신약/십성/오행/용신·희신·기신 중 관련 있는 1~2개를 정확히 짚고, 그것이 사용자의 반응·부담·결정 기준에 어떤 보조 의미를 주는지 설명한다.`;
    }
    if (mode === 'other_focused') {
      return `- Saju(사주명리): 이번 질문은 타인의 생각·감정·행동이 중심이다. 사용자의 사주를 상대의 속마음이나 행동 발생을 추정하는 증거로 쓰지 않는다. 질문 안에 사용자의 경계·대응·선택 축이 실제로 있을 때만 그 사용자 축에 한정해 보조한다.`;
    }
    return `- Saju(사주명리): 질문과 직접 연결되는 사용자 본인의 성향·부담·선택 기준이 있을 때만 사용한다. 사용할 경우 실제 입력 항목 1~2개를 명시하고, 일반론 나열 대신 현재 카드/포지션과 어떻게 맞물리는지만 짧게 설명한다.`;
  }

  function finalBlock(prompt){
    const western = westernPolicy(prompt);
    const transit = transitPolicy(prompt);
    const returns = returnPolicy(prompt);
    const thai = thaiPolicy(prompt);
    const saju = sajuPolicy(prompt);

    return `${MARKER}\n1. 질문 원문과 각 카드 포지션이 최우선이다. 포지션을 바꾸거나 질문에 없는 축을 추가하지 않는다.\n2. 실제 뽑힌 RWS 카드가 본체다. 긍정·제한·반증 신호를 함께 읽는다.\n3. 보조 체계가 실제 계산/입력되어 있더라도 카드와 동급의 사건 증거로 취급하지 않는다. 대신 유효한 보조값은 무시하지 말고 아래 규칙대로 교차참고한다.\n${western}\n${transit}\n${returns}\n${thai}\n${saju}\n9. 사주에서 대운·세운·합충형파 등 현재 입력되지 않은 계산을 새로 만들지 않는다. 원국 프로필만으로 특정 날짜·연락·재회·합격·주가 움직임을 예측하지 않는다.\n10. 카드와 보조 체계가 같은 방향이면 '교차 보조 신호'라고 짧게 표현할 수 있다. 방향이 다르면 억지로 합치지 말고 차이를 명시한다.\n11. Western Astrology(서양점성술), Saju(사주명리), Thai Astrology(태국점성술)는 서로 독립된 전통이다. 한 체계의 개념을 다른 체계의 개념으로 1:1 치환하지 않는다.\n12. 최종 답변에서는 질문의 결론과 카드 근거가 먼저다. 그다음 유효한 점성/프로필 보조를 짧고 구체적으로 붙인다. 계산값이 있는 보조 체계를 단순히 생략하지 않는다.`;
  }

  function install(){
    if (W.__LUNEA_FINAL_PROMPT_PRIORITY_INSTALLED__) return true;
    const prior = W.promptString || (typeof promptString === 'function' ? promptString : null);
    if (typeof prior !== 'function') return false;

    const wrapped = function(){
      let p = String(prior.apply(this, arguments) || '');
      if (p.includes(MARKER)) return p;
      return `${p}\n\n${finalBlock(p)}`;
    };
    wrapped.__luneaFinalPromptPriorityV2 = true;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    W.__LUNEA_FINAL_PROMPT_PRIORITY_INSTALLED__ = true;
    console.info('🧭 LUNEA Final Prompt Priority V2 installed');
    return true;
  }

  W.LUNEA_FINAL_PROMPT_PRIORITY_V1 = {
    version:2,
    classify,
    build:finalBlock,
    hasWesternNatal,
    hasTransit,
    hasReturns,
    hasThaiComputed,
    hasSaju:() => {
      const prior = W.promptString || (typeof promptString === 'function' ? promptString : null);
      if (typeof prior !== 'function') return false;
      try { return hasSaju(prior()); } catch { return false; }
    }
  };

  function boot(){
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 80) clearInterval(timer);
    },100);
    install();
  }

  // Install slightly after the other load-time prompt repair wrappers so this
  // remains the final compact instruction the model sees.
  if (document.readyState === 'complete') setTimeout(boot,120);
  else W.addEventListener('load', () => setTimeout(boot,120), {once:true});
})();
