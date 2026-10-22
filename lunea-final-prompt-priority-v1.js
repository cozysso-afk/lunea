'use strict';

/*
  LUNEA FINAL PROMPT PRIORITY V4
  ==============================
  Last-mile RWS evidence priority + optional auxiliary-system boundary policy.

  Goals:
  - Keep question/positions/RWS cards as the complete basis of the final conclusion.
  - Treat Western Natal / Saju / Thai Taksa / Timing / Transit / Returns / Message
    Oracle as optional auxiliary context, never mandatory evidence.
  - Allow every auxiliary system to be omitted when it is not directly relevant.
  - Prevent auxiliary systems from creating events, inferring another person's
    private state, changing cause/probability ranking, or strengthening certainty.
  - Keep positive/negative conclusions evidence-proportional without systematic
    pessimistic or optimistic drift.
*/
(() => {
  const W = window;
  if (W.__LUNEA_FINAL_PROMPT_PRIORITY_V1__) return;
  W.__LUNEA_FINAL_PROMPT_PRIORITY_V1__ = true;

  const MARKER = '[FINAL READING PRIORITY · 최종 근거 우선순위]';
  const INTERPRETATION_RULE_VERSION = 'v2';
  const FINAL_LINE = '13. [최종 출력] 최종 결론은 질문 원문·포지션·RWS 카드만으로 완결한다. 보조 체계를 전부 제거해도 결론 방향·원인/가능성 순위·사건 판단·단정 수준이 그대로여야 한다. 관련 없는 보조 체계는 0문장으로 생략한다.';
  const CAUSE_END = '[END CAUSE RWS POLICY v1]';

  function isCausePrompt(prompt){
    const declared=String(prompt||'').match(/\[질문 유형\]\s*\n([^\n]+)/)?.[1]?.trim();
    // Explicit spread intent wins; never reuse a previous reading's semantic state.
    if(declared)return /^(?:cause|원인 분석)(?:\s|$|\/)/i.test(declared);
    return W.LUNEA_CAUSE_QUESTION_V1?.analyze(questionFromPrompt(prompt))?.kind==='cause';
  }

  function causeFinalBlock(){
    return [MARKER,
      "[CAUSE RWS POLICY v1 · 원인 분석 전용]",
      "interpretation_rule_version=cause-rws-v1",
      "1. 질문 원문에서 설명해야 할 사건·행동, 사용자가 제시한 원인 후보, 각 포지션 역할을 분리한다. 질문·스프레드 설계 의도가 자동 섹터보다 우선이다. 건강 자체가 질문 대상이면 의료 진단을 하지 않는다.",
      "2. 질문에 나온 원인을 먼저 비교하고, 실제 카드가 지지하는 다른 원인만 추가한다. 내부 요인(감정·피로)과 외부 요인(업무·일정·주변 상황) 어느 쪽도 기본값으로 두지 않는다.",
      "3. 질문 → 해당 포지션 → RWS 메인 카드 → 추가 카드 순서로 읽는다. 배경 상태와 실제 행동을 바꾼 원인을 구분한다. 감정·긴장·피로 카드만으로 그 감정 때문에 연락이나 결정을 멈췄다고 단정하지 않는다.",
      "4. 원인별 지지·반대 근거, 포지션 적합성, 독립성을 비교한다. 근거가 명확하면 가장 우세한 1~2개 원인을 말하고, 비슷할 때만 판단을 유보한다. 카드 개수·메이저 여부로 순위를 매기거나 없는 반증을 만들지 않는다.",
      "5. 외도·질병·회식 등 구체적 사건은 카드에 없는 한 만들지 않는다. 추가 카드는 메인 배열의 모호함을 좁히되 카드 한 장으로 사건·제3자를 확정하지 않는다.",
      "6. 보조 체계는 질문과 직접 관련 있을 때만 짧게 참고한다. 사용자 차트·사주·Thai Taksa로 타인의 마음이나 직접 원인을 확정하거나 RWS 원인 순위를 바꾸지 않는다. Timing Oracle은 실제 시기 질문에만 사용한다.",
      "7. 가장 지지되는 원인, 그 근거, 주요 대안과 불확실성만 간결하게 답한다. 카드 해석과 확인된 현실 사실을 구분하고 가짜 확률을 쓰지 않는다.",
      "8. 사후 실제 결과가 확인되면 최초 해석을 소급 변경하지 않고 맞은 부분과 틀린 부분을 따로 평가한다.",
      CAUSE_END].join("\n");
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
    return '- Message Oracle(연락·소식 메시지 오라클): 현재 리딩에 연결된 실제 결과가 있어도 질문과 직접 관련 있을 때만 짧게 보조할 수 있다. 관련 없으면 완전히 생략한다. 사용할 경우 실제 카드명과 질문 의도, 연락 방식·전달 경로·제한 중 RWS에서 이미 확인된 주제만 연결한다. 점수는 실제 연락 확률·긍정 결과 확률이 아니며, RWS의 결론·가능성 순위·단정 수준을 강화하거나 뒤집지 않는다. RWS와 충돌하면 절충하지 말고 Message Oracle 보조를 생략한다.';
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
      return '- Western Natal(서양 출생차트): 실제 계산된 Natal 핵심값이 없으면 태양궁 호환값이나 출생정보만으로 상세 출생차트를 지어내지 않는다.';
    }

    const mode = classify(questionFromPrompt(prompt));
    if (mode === 'other_focused') {
      return '- Western Natal(서양 출생차트): 데이터가 있어도 자동 반영하지 않는다. 이번 질문이 타인의 생각·감정·행동·향후 행동·사건 발생 중심이면 사용자의 Natal을 그 판단 근거로 쓰지 않는다. 질문 안에 사용자의 반응·관계 판단 기준·선택 방식이 직접 포함된 경우에만 그 사용자 축을 1~2문장 보조할 수 있으며, 관련 없으면 0문장으로 생략한다.';
    }

    return '- Western Natal(서양 출생차트): 데이터가 있어도 자동 반영하지 않는다. 질문자의 성향·감정 반응 방식·관계 판단 기준·선택 방식이 현재 질문과 직접 관련될 때만 실제 계산값 1~2개를 짧게 보조할 수 있다. 상대방 속마음·행동 원인·향후 행동·사건 발생·관계 성립 판단에는 사용하지 않는다. RWS 결론의 방향·순위·단정 수준을 바꾸거나 더 강하게 확정하지 않으며, 관련 없으면 0문장으로 생략한다.';
  }

  function transitPolicy(prompt){
    if (!hasTransit(prompt)) {
      return '- Transit Scanner(트랜짓): 현재 질문의 실제 계산 결과 블록이 없으면 트랜짓을 참고했다고 말하거나 현재 천체 위치·시기를 새로 만들지 않는다.';
    }
    return '- Transit Scanner(트랜짓): 실제 계산 결과가 있어도 질문이 시기·현재 흐름을 직접 묻고 RWS에서 이미 확인된 주제와 관련될 때만 짧게 보조할 수 있다. 사건 성립 여부·상대 속마음·행동 원인·가능성 순위를 판단하지 않고, RWS보다 강한 확신을 만들지 않는다. 관련 없으면 0문장으로 생략한다.';
  }

  function returnPolicy(prompt){
    if (!hasReturns(prompt)) {
      return '- Planetary Returns(행성 회귀): 실제 계산 결과가 없으면 회귀 시각·하우스·주기를 만들어내지 않는다.';
    }
    return '- Planetary Returns(행성 회귀): 실제 계산 결과가 있어도 현재 질문과 직접 관련된 사용자 배경 주기 또는 시기 맥락일 때만 짧게 보조할 수 있다. 회귀 날짜를 연락·재회·합격·주가 움직임의 확정일로 바꾸거나 RWS의 사건 판단·가능성 순위·단정 수준을 강화하지 않는다. 관련 없으면 0문장으로 생략한다.';
  }

  function thaiPolicy(prompt){
    if (!hasThaiComputed(prompt)) {
      return '- Thai Taksa(태국 탁사): 현재 질문의 실제 Maha Taksa 계산 결과가 없으면 출생 요일 프로필만으로 정밀 사건·시기 근거를 만들어내지 않는다.';
    }
    return '- Thai Taksa(태국 탁사): 실제 계산 결과가 있어도 질문과 직접 관련 있을 때만 RWS에서 이미 확인된 환경·지원·취약점 또는 사용자 반응 주제를 짧게 보조할 수 있다. 새로운 사건·상대 속마음·행동 원인·사건 성립·원인/가능성 순위·정밀 시기를 만들지 않는다. 관련 없으면 0문장으로 생략한다.';
  }

  function sajuPolicy(prompt){
    if (!hasSaju(prompt)) return '- Saju(사주명리): 유효한 입력값이 없으면 사용하지 않는다.';
    const mode = classify(questionFromPrompt(prompt));

    if (mode === 'other_focused') {
      return '- Saju(사주명리): 데이터가 있어도 자동 반영하지 않는다. 타인의 생각·감정·행동·직접 원인·향후 사건을 사용자의 사주로 추론하지 않는다. 질문 안에 사용자의 부담·선택 기준·반응 방식이 직접 포함된 경우에만 그 사용자 축을 짧게 보조할 수 있으며, 관련 없으면 0문장으로 생략한다.';
    }
    return '- Saju(사주명리): 데이터가 있어도 자동 반영하지 않는다. 질문자의 기본 성향·부담·선택 기준·반응 방식이 현재 질문과 직접 관련될 때만 실제 입력된 원국 범위에서 짧게 보조할 수 있다. 입력되지 않은 대운·세운·합·충·형·파 등은 새로 생성하지 않는다. 상대 행동 원인·속마음·구체 사건·성립 여부·구체 시기·원인 순위를 판단하지 않으며, RWS보다 강한 단정을 만들지 않는다. 관련 없으면 0문장으로 생략한다.';
  }

  function finalBlock(prompt){
    if(isCausePrompt(prompt))return causeFinalBlock();
    return [
      MARKER,
      '1. 질문 원문과 각 포지션 > RWS 메인 카드 > 카드 간 관계 > RWS 추가 카드 > 보조 체계 순으로 읽는다. 카드명·정역·포지션을 근거로 설명하되 한 장만으로 사건을 확정하지 않는다.',
      '2. 긍정과 부정 어느 방향도 기본값으로 삼지 않는다. 혼합 신호는 혼합으로 말한다. 긍정 근거가 더 강하면 긍정 결론을, 부정 근거가 더 강하면 부정 결론을 내되 반대 카드의 제한도 짚는다.',
      '3. [과대해석 방지] 타인의 내면은 카드상 가설로만 표현하고, 확인된 관찰·표현·행동과 구분한다. 가장 강한 경쟁 해석은 실제 RWS 근거가 있을 때만 검토하며, 반증이나 50:50 균형을 위해 없는 대안을 생성하지 않는다.',
      '4. [과소해석 방지] 여러 포지션의 독립 근거가 같은 방향을 지지하면 그 강도를 반영한다. 긍정 신호를 무조건 희석하거나 약한 카드 하나를 극단적인 확정으로 키우지 않는다.',
      '5. 감정·의도·행동·결과와 원인·배경을 분리한다. 부담은 끌림 부재의 증거가 아니며, 끌림은 행동의 증거가 아니다. 근거가 부족하면 불확실하다고 답한다.',
      '6. interpretation_rule_version=${INTERPRETATION_RULE_VERSION}. 보조 체계는 RWS 결론을 변경하는 독립 근거가 아니다. 관련 없으면 0문장으로 생략한다. 보조 체계 전체 분량은 최종 해석 본문의 최대 20% 이하로 한다.',
      westernPolicy(prompt),transitPolicy(prompt),returnPolicy(prompt),thaiPolicy(prompt),sajuPolicy(prompt),messagePolicy(prompt),
      '10. Timing Oracle을 포함한 시기 보조는 사용자가 언제·어느 시기·시간 흐름을 실제로 묻는 경우에만 사용한다. 제공된 시간 창을 벗어난 정밀 날짜를 만들지 않고 사건 성립도 보장하지 않는다.',
      '11. 서양점성술·사주·태국점성술은 서로 다른 체계다. 보조 체계가 RWS와 충돌하면 절충하거나 새로운 복합 결론을 만들지 말고 보조 체계를 생략하고 RWS 결론을 유지한다.',
      FINAL_LINE
    ].join('\n');
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
    console.info(`🧭 LUNEA Final Prompt Priority V4 installed · interpretation ${INTERPRETATION_RULE_VERSION}`);
    return true;
  }

  W.LUNEA_FINAL_PROMPT_PRIORITY_V1 = {
    version:4,
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
