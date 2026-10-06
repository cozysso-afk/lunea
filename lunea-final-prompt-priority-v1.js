'use strict';

/*
  LUNEA FINAL PROMPT PRIORITY V3
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
  - Keep positive/negative conclusions evidence-proportional without systematic
    pessimistic or optimistic drift.
*/
(() => {
  const W = window;
  if (W.__LUNEA_FINAL_PROMPT_PRIORITY_V1__) return;
  W.__LUNEA_FINAL_PROMPT_PRIORITY_V1__ = true;

  const MARKER = '[FINAL READING PRIORITY · 최종 근거 우선순위]';
  const INTERPRETATION_RULE_VERSION = 'v1';
  const FINAL_LINE = '12. 최종 답변에서는 질문의 결론과 카드 근거가 먼저다. 그다음 유효한 점성/프로필 보조를 짧고 구체적으로 붙인다. 계산값이 있는 보조 체계를 단순히 생략하지 않는다.';
  const CAUSE_END = '[END CAUSE RWS POLICY v1]';

  function isCausePrompt(prompt){
    const declared=String(prompt||'').match(/\[질문 유형\]\s*\n([^\n]+)/)?.[1]?.trim();
    // Explicit spread intent wins; never reuse a previous reading's semantic state.
    if(declared)return /^(?:cause|원인 분석)(?:\s|$|\/)/i.test(declared);
    return W.LUNEA_CAUSE_QUESTION_V1?.analyze(questionFromPrompt(prompt))?.kind==='cause';
  }

  function causeFinalBlock(){
    return `${MARKER}
[CAUSE RWS POLICY v1 · 원인 분석 전용]
interpretation_rule_version=cause-rws-v1
이 cause 규칙은 앞선 일반 해석·프로필의 필수 반영·보조 종합 지시와 충돌하면 우선한다. 카드 체계·정역·기존 포지션은 유지한다.

1. 질문 대상 고정
먼저 질문 유형, 설명할 핵심 사건, 핵심 동사, 질문 대상, 사용자가 제시한 원인 후보, 각 포지션 역할을 구분한다. 질문 원문과 명시된 스프레드 설계 의도는 자동 섹터보다 우선한다. 컨디션·피로 등의 단어가 질문 대상인지 원인 후보인지 구분한다. 보조 덱 섹터로 본 질문을 변경하지 않는다. 건강 자체가 대상이면 의학적 원인·질병·예후를 카드로 진단하지 않는다.

2. 경쟁 원인군
A 내부 신체 상태(피로·회복), B 내부 감정·심리(걱정·부담), C 업무·실무·책임, D 일정·시간 충돌, E 제3자·집단·모임, F 관계 자체의 회피·거절, G 예상 밖 돌발 상황을 검토한다. 내부·외부 어느 쪽도 기본값으로 삼지 않는다. 보통 상위 2~3개 후보만 비교하고, 약한 후보에 근거를 만들어 균형을 맞추지 않는다. 복합 원인은 각 구성 요소에 근거가 있을 때만 허용한다.

3. 메인 배열과 근거 역할
질문 원문 → 해당 포지션 → 주변 카드 순으로 해석한다. 유명 키워드가 포지션보다 앞서지 않는다. 각 근거를 배경 상태 / 직접 촉발 원인 / 행동 결정 요인 / 감정·향후 태도로 구분한다. 역할을 구분할 근거가 없으면 미확인으로 남긴다. 스트레스가 있다는 해석만으로 스트레스 때문에 행동을 바꿨다고 결론 내리지 않는다.
이미 컨디션을 묻는 자리가 있으면 컨디션 외 이유를 묻는 자리에 피로를 자동 복제하지 않는다. 보류·정지·거리 확보·반응 유예 등을 검토하되 중복을 피하려고 외부 제약을 지어내지 않는다. 독립 근거가 같은 원인을 지지하면 그 원인으로 수렴할 수 있다.
감정·향후 태도와 사건 원인을 분리한다. 향후 만남에 긍정적이라는 카드가 오늘의 연기 원인을 증명하지 않으며, 외부 사정이라는 해석도 호감을 증명하지 않는다.

4. 비교와 잠정 순위
RWS 메인 배열만으로 최소 두 경쟁 가설의 지지 카드·포지션, 반대 또는 양립하기 어려운 근거, 미확인 연결, 행동 변화 설명력을 비교하고 잠정 순위를 정한다.
판단 우선순위는 포지션 적합성 > 행동 변화 설명력 > 근거의 독립성 > 반복성 > 추가 추정이 적은 정도다. 카드 개수·긍정부정 개수·메이저 여부만으로 결정하지 않는다. 서로 다른 카드도 동일한 모호한 뜻이면 독립 증거로 중복 계산하지 않는다. 지지 부재는 반박이 아니다. 반박이 없으면 만들지 않는다.
모임·시간 조정·책임·계획 변경 신호가 반복되면 외부 사건 가설을 반드시 비교한다. 그러나 카드 조합을 회식·외도·질병 등의 공식으로 쓰지 않는다. 근거가 일정 조정 수준이면 회사·특정 인물·이성·요일·장소를 생성하지 않는다. 뚜렷한 근거가 기울면 우세한 원인을 선택하고 팽팽할 때만 두 후보를 남긴다. 임의의 확률·퍼센트는 금지한다.

5. RWS 추가 카드
포지션별 보조 카드는 해당 본 카드에 종속한다. 전체 추가 카드는 메인 배열의 모호성 축소, 기존 경쟁 가설 비교, 직접 원인과 배경 구분에 사용한다. 잠정 순위는 조정할 수 있으나 한 장으로 명확한 메인 근거를 뒤집거나 구체 사건을 생성하지 않는다. 새로운 후보는 메인 배열과 연결될 때만 비교에 포함한다. 가설을 구분하지 못하면 판별력이 낮다고 처리한다. 원하는 답까지 추가 추출하지 않는다.

6. RWS 결론 확정
질문 → 메인 포지션 해석 → 경쟁 가설 잠정 순위 → RWS 추가 카드 비교 → RWS 최종 원인 순위·핵심 결론·단정 수준 확정 → 보조 체계 순으로 처리한다.
위계는 질문 원문 > 포지션 > RWS 메인 카드 > 카드 간 관계·반복 > RWS 추가 카드 > 보조 체계다. 실제 RWS 카드의 근거만으로 원인 순위를 정한다. 근거가 팽팽하면 보조 체계로 동률을 해소하지 않고 두 후보와 현실 확인 포인트를 남긴다.

7. 보조 체계 제한
모든 보조 체계는 현재 리딩에 실제 제공되고 질문과 관련된 범위에서만 사용한다. 이미 RWS에 나타난 주제의 상징적 조응·약한 보강·사용자 본인의 성향·반응·배경만 짧게 설명한다. 새로운 사건, 직접 원인 순위 변경, 결론 뒤집기, 상대의 마음·행동·사건 발생의 독립 확정, RWS보다 강한 단정은 금지한다. 여러 보조 체계의 일치를 사실 증거로 합산하지 않는다.
- Timing Oracle(시기 오라클): 현재 프롬프트에 실제 제공된 결과가 있을 때 시간 창만 보조한다. 원인·감정·관계 성립·사건 발생 판단에 사용하지 않는다. 카드 명칭에 불발·발생 신호가 있어도 RWS 사건 판단을 덮어쓰지 않는다.
- Western Natal(서양 출생차트): 사용자 본인의 반응·관계 성향·감정 처리·판단 기준만 보조한다. 사용자 차트로 상대 행동을 설명하지 않는다. 상대 출생 정보가 있어도 원인 순위를 바꾸지 않는다.
- Saju(사주): 제공된 원국 범위의 사용자 성향·부담·선택 기준만 보조한다. 입력되지 않은 대운·세운·합충형파·용희신, 상대 원인, 구체 사건을 생성하지 않는다.
- Thai Taksa(태국 탁사): 상징적 환경·지원·취약점만 보조한다. 직접 원인·상대 마음·구체 사건·정밀 시기를 확정하지 않는다.
- 그 밖에 함께 제공된 트랜짓·행성 회귀·메시지 오라클도 위의 순위·방향·단정 수준 변경 금지에 종속한다.
보조 전체 분량은 해석 본문의 최대 약 20% 이하, 체계당 기본 1~2문장 이내다. 20%를 채우거나 RWS를 억지로 늘리지 않는다. 관련 없으면 0문장으로 생략한다.

8. 최종 출력
① 가장 우세한 직접 원인 ② 부수적으로 작용했을 수 있는 배경 상태 ③ 실제 행동을 바꾼 요인 ④ 차순위 가설과 약한 이유 ⑤ 두 가설을 구분하는 현실 검증 포인트 순으로 간결하게 답한다. ①과 ③이 같으면 같은 요인이라고 짧게 연결하고 새로운 요인을 만들지 않는다. 검증 질문은 특정 정답을 유도하지 않는 중립적인 질문으로 쓴다. 카드 해석을 확인된 사실로 표현하지 않는다.

9. SELF-CHECK(출력 전 점검)
상태의 원인 승격, 포지션 침범, 근거 중복, 추가 카드 한 장의 사건 생성, 감정 카드의 원인 침범, 단어 하나의 섹터 오분류, 근거보다 구체적인 사건 생성 여부를 확인한다.
보조 전후 직접 원인 순위가 같은가? 보조를 모두 삭제해도 핵심 결론·방향·단정 수준이 같은가? 하나라도 아니면 보조 문장을 삭제·약화하고 보조 투입 전 RWS 결론을 복원한다. RWS 근거 자체의 오류라면 해당 문장과 순위만 바로잡는다. 전체 해석을 새 이야기로 바꾸지 않는다. 긴 내부 사고 과정 대신 짧은 근거 요약만 출력한다.

10. 사후검증
당시 출력의 일치 부분 / 틀린 부분 / 당시 중요하게 읽지 못한 가능성 / 새 사실로 추가 이해한 부분을 분리한다. 당시 1순위와 구체성으로 평가한다. 나중에 알게 된 사실을 과거 근거에 역투입하거나 적중으로 소급하지 않는다. 회귀검사의 실제 결과는 운영 카드 공식이 아니다.
${CAUSE_END}`;
  }

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

  const MESSAGE_MARKER = '[MESSAGE ORACLE · 현재 리딩의 연락·소식 보조]';
  function hasMessageOracle(prompt){
    return String(prompt || '').includes(MESSAGE_MARKER);
  }

  function messagePolicy(prompt){
    if (!hasMessageOracle(prompt)) {
      return '- Message Oracle(연락·소식 메시지 오라클): 현재 리딩에 연결된 결과가 없으면 참고했다고 말하거나 카드·점수·메시지를 만들어내지 않는다. 독립 화면의 마지막 결과를 가져오지 않는다.';
    }
    return '- Message Oracle(연락·소식 메시지 오라클): 현재 리딩에 연결된 실제 결과가 있으므로 최종 답변에 짧은 "메시지 오라클 보조"를 최소 1회 반영한다. 실제 카드명과 질문 의도, 연락 방식·전달 경로·제한 중 관련 근거를 짚고 RWS 카드의 지지·반증과 연결한다. 점수는 카드 상징의 신호 강도이며 실제 연락 확률·합격률·긍정 결과 확률이 아니다. 시기 오라클과 구분하고 날짜나 상대의 실제 행동을 이 점수에서 만들어내지 않는다. RWS와 방향이 다르면 차이를 숨기거나 한쪽 결론으로 덮어쓰지 않는다.';
  }

  function assembleEvidence(prompt){
    const reference=W.LUNEA_TAROT_REFERENCE_V1;
    let text = reference ? reference.strip(prompt) : String(prompt || '');
    const cardEvidence=reference?.build?.() || '';
    if(cardEvidence)text+=`\n\n${cardEvidence}`;
    // Read the live, exact-reading adapter at call time. This also restores
    // evidence if a later feature replaced the earlier Message prompt wrapper.
    const message = W.LUNEA_MESSAGE_ORACLE_SUPPORT_V1?.promptBlock?.() || '';
    if (message && !hasMessageOracle(text)) text += `\n\n${message}`;
    return W.LUNEA_INTERPRETATION_GLOSS_V2?.refreshEngineLedger?.(text) || text;
  }

  function sajuBlock(prompt){
    const s = String(prompt || '');
    const m = s.match(/\[SAJU \/ FOUR PILLARS · 사주명리\]([\s\S]*?)(?=\n\[THAI ASTROLOGY|\n\[프로필 체계 사용 규칙|\n\n\[뽑힌 카드\]|$)/);
    return String(m?.[1] || '');
  }

  function hasSaju(prompt){
    const b = sajuBlock(prompt);
    const rows = [...b.matchAll(/-\s*(?:일간|원국(?: 年\/月\/日\/時)?|오행 분포|신강·신약|주요 십성·특징|용신|희신|기신|기타 확인사항):([^\n]*)/g)];
    return rows.some(([,value]) => value.replace(/미입력|미확인|없음|unknown|not provided|n\/a|[\s/—-]/gi,'').length > 0);
  }

  function classify(question){
    const q = clean(question).toLowerCase();
    if (!q) return 'neutral';

    const selfDecision = /(?:내가|나는|나한테|나에게|내\s*(?:마음|경계|선택|결정|행동|반응|답장|연락|소모|후회|부담|페이스|리듬|기준)|자연스러운|덜\s*후회|어떻게\s*(?:할|해야)|할까\s*말까|선택|결정|이직|퇴사|취업|직장|커리어|시험|공부|학업|돈|재정|투자|주식|매수|매도|소비|구매|이사|건강|회복|생활\s*리듬|자기\s*패턴|준비도|경계)/i.test(q);

    const otherMind = /(?:걔|그\s*사람|상대|전남친|전여친|전애인|a\b|b\b)[^?]{0,80}(?:생각|마음|감정|호감|그리움|후회|연락\s*의도|행동\s*의도|나를\s*어떻게)/i.test(q);
    const selfAxis = /(?:내\s*(?:선택|경계|대응|반응|행동|소모|후회)|내가\s*(?:할|해야|어떻게))/.test(q);
    if (otherMind && !selfAxis) return 'other_focused';
    if (selfDecision) return 'self_relevant';

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
    if(isCausePrompt(prompt))return causeFinalBlock();
    const western = westernPolicy(prompt);
    const transit = transitPolicy(prompt);
    const returns = returnPolicy(prompt);
    const thai = thaiPolicy(prompt);
    const saju = sajuPolicy(prompt);
    const message = messagePolicy(prompt);

    return `${MARKER}\n1. 질문 원문과 각 카드 포지션이 최우선이다. 포지션을 바꾸거나 질문에 없는 축을 추가하지 않는다.\n2. 실제 뽑힌 RWS 카드가 본체다. 긍정·제한·반증 신호를 함께 읽는다. 카드명·정역방향·포지션을 근거 문장에 연결한다. 역방향을 무조건 정방향의 반대나 나쁜 결과로 바꾸지 않고, 막힘·내면화·과잉·회복 중 질문과 인접 카드가 지지하는 해석만 선택해 이유를 설명한다. 보조 카드는 연결된 본 카드의 모호함을 좁히며 독립 결론으로 본 카드를 대체하지 않는다.\n3. 긍정과 부정 어느 방향도 기본값으로 삼지 않는다. 카드의 포지션 중요도, 신호 강도, 반복성, 서로 독립된 근거의 합치 정도에 비례해 결론의 방향과 강도를 정한다. 애매한 카드를 자동으로 부정 쪽에 배치하지 않는다.\n4. [과대해석 방지] 약한 카드 한 장이나 단일 보조 신호만으로 구체적 사건·상대 행동·시기·관계 성립을 단정하지 않는다. 질문 범위를 넘어 새로운 사건을 확장하지 않고, 보조 신호를 핵심 결론으로 승격하려면 본 카드 또는 다른 독립 근거의 지지가 있어야 한다.\n5. [과소해석 방지] 동일 주제가 여러 포지션에서 반복되거나 강한 메이저 조합·명확한 카드 흐름·서로 독립된 근거가 같은 방향으로 수렴하면 그 강도를 실제 결론에 반영한다. 명확한 긍정 신호를 습관적으로 경고 문구로 희석하거나, 명확한 부정 신호를 막연한 가능성으로 흐리지 않는다.\n6. 혼합 신호는 혼합으로 말한다. 긍정 근거가 더 강하면 긍정 결론을, 부정 근거가 더 강하면 부정 결론을 내되 반대 근거의 제한을 함께 짚는다. 근거가 비슷할 때만 애매함을 유지한다.\n7. interpretation_rule_version=${INTERPRETATION_RULE_VERSION}. 이 버전은 사후검증을 위한 시스템 해석 정책 식별자이며 사용자 취향이나 메모리로 변경하지 않는다.\n8. 보조 체계가 실제 계산/입력되어 있더라도 카드와 동급의 사건 증거로 취급하지 않는다. 대신 유효한 보조값은 무시하지 말고 아래 규칙대로 교차참고한다.\n${western}\n${transit}\n${returns}\n${thai}\n${saju}\n${message}\n9. 사주에서 대운·세운·합충형파 등 현재 입력되지 않은 계산을 새로 만들지 않는다. 원국 프로필만으로 특정 날짜·연락·재회·합격·주가 움직임을 예측하지 않는다.\n10. 카드와 보조 체계가 같은 방향이면 '교차 보조 신호'라고 짧게 표현할 수 있다. 방향이 다르면 억지로 합치지 말고 차이를 명시한다. 감정·연락 의도·실제 행동·관계 성립은 서로 다른 축이다. 호감 카드만으로 연락이나 재회를 확정하지 않는다. 근거가 팽팽하면 판단이 갈리는 이유와 확인되지 않은 부분을 말하고, 새로운 사실이나 기한을 덧붙여 결론을 강제로 만들지 않는다.\n11. Western Astrology(서양점성술), Saju(사주명리), Thai Astrology(태국점성술)는 서로 독립된 전통이다. 한 체계의 개념을 다른 체계의 개념으로 1:1 치환하지 않는다.\n${FINAL_LINE}`;
  }

  function withoutFinalBlocks(prompt){
    let out = String(prompt || '');
    let start = out.indexOf(MARKER);
    while (start !== -1) {
      const endings=[FINAL_LINE,CAUSE_END].map(line=>({line,index:out.indexOf(line,start+MARKER.length)})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index);
      if (!endings.length) break;
      const after = endings[0].index + endings[0].line.length;
      out = `${out.slice(0, start).trimEnd()}\n\n${out.slice(after).trimStart()}`.trim();
      start = out.indexOf(MARKER);
    }
    return out;
  }

  function install(){
    // The real AI/copy handlers in index.html call the bare `promptString`
    // binding. Several late profile/gloss modules also wrap that binding after
    // this file first loads, while `window.promptString` can still point at an
    // older wrapper. Always follow the binding the handlers actually call.
    let lexical = null;
    try { lexical = typeof promptString === 'function' ? promptString : null; } catch {}
    const prior = lexical || W.promptString;
    if (typeof prior !== 'function') return false;
    if (prior.__luneaFinalPromptPriorityV2) {
      if (W.promptString !== prior) W.promptString = prior;
      return true;
    }

    const wrapped = function(){
      const p = assembleEvidence(withoutFinalBlocks(prior.apply(this, arguments)));
      return `${p}\n\n${finalBlock(p)}`;
    };
    wrapped.__luneaFinalPromptPriorityV2 = true;
    wrapped.__luneaFinalPromptPriorityBase = prior;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    W.__LUNEA_FINAL_PROMPT_PRIORITY_INSTALLED__ = true;
    console.info(`🧭 LUNEA Final Prompt Priority V3 installed · interpretation ${INTERPRETATION_RULE_VERSION}`);
    return true;
  }

  W.LUNEA_FINAL_PROMPT_PRIORITY_V1 = {
    version:3,
    interpretationRuleVersion:INTERPRETATION_RULE_VERSION,
    ensure:install,
    classify,
    build:finalBlock,
    isCausePrompt,
    causePolicyVersion:'cause-rws-v1',
    hasWesternNatal,
    hasTransit,
    hasReturns,
    hasThaiComputed,
    hasMessageOracle,
    hasSaju:(prompt) => {
      if (typeof prompt === 'string') return hasSaju(prompt);
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

  W.addEventListener('lunea:feature-group-ready', install);
  // Re-attach after all synchronous + DOMContentLoaded profile/gloss wrappers
  // have finished. This is essential for DAILY ORBIT too: its AI/copy actions
  // otherwise bypass exact-reading Message Oracle evidence.
  W.addEventListener('load', () => setTimeout(install, 0));
  W.addEventListener('pageshow', install);
  boot();
})();
