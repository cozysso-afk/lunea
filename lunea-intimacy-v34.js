'use strict';

/*
  LUNEA INTIMACY V34
  ==================
  Adult-only intimacy interpretation layer for the existing 78-card RWS deck.

  Scope:
  - does NOT change tarot RNG, reversals, draw order, or base card meanings;
  - adds a normalized 78-card intimacy data layer;
  - adds five fixed INTIMACY 18+ spreads;
  - injects an independent INTIMACY 18+ cabinet beside LOVE;
  - appends position-aware intimacy evidence to the Gemini master prompt;
  - blocks minor-related intimacy questions and avoids physical/medical certainty.

  Dedicated oracle and dedicated art are intentionally out of scope for V34.
*/
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_V34__) return;
  W.__LUNEA_INTIMACY_V34__ = true;

  const RELEASE = '34.0';
  const ACK_KEY = 'LUNEA_INTIMACY_ADULT_ACK_V1';
  const AXES = Object.freeze([
    'attraction','desire','initiative','receptivity','emotionalSafety',
    'communication','mutuality','satisfaction','attachment'
  ]);
  const RISKS = Object.freeze(['obsession','boundary','avoidance','instability']);
  const PACES = new Set(['fast','slow','steady','variable','matched','blocked']);

  const zip = (keys, values, fallback = 0) => Object.fromEntries(
    keys.map((key, index) => [key, Number(values?.[index] ?? fallback)])
  );
  const card = (core, shadow, axes, pace, risks = [0,0,0,0], tags = []) => Object.freeze({
    core, shadow,
    axes: Object.freeze(zip(AXES, axes)),
    pace: PACES.has(pace) ? pace : 'steady',
    risks: Object.freeze(zip(RISKS, risks)),
    tags: Object.freeze([...tags])
  });

  // Axis order: attraction, desire, initiative, receptivity, emotionalSafety,
  // communication, mutuality, satisfaction, attachment
  // Risk order: obsession, boundary, avoidance, instability
  const MAJOR_ROWS = [
    ['Fool','새로운 호기심과 자유로운 탐색. 서로의 반응을 알아가는 초기 에너지.','충동이 앞서거나 상대의 속도와 경계를 충분히 읽지 못할 수 있다.',[1,1,2,1,0,0,0,0,0],'fast',[0,1,0,2],['curiosity','exploration','spontaneity']],
    ['Magician','매력을 의식적으로 표현하고 관계를 움직이는 힘. 먼저 분위기를 만들고 반응을 확인한다.','매력 표현이 진심보다 기술이나 통제 욕구로 기울 수 있다.',[1,1,2,0,0,1,0,1,0],'fast',[1,1,0,1],['confidence','initiative','seduction']],
    ['High Priestess','드러내지 않은 욕망과 내면의 긴장. 말보다 분위기와 직감으로 반응한다.','욕구를 숨기거나 추측만 키워 실제 상호 확인이 부족해질 수 있다.',[1,1,-2,1,1,0,0,1,1],'slow',[0,0,2,0],['hidden_desire','mystery','restraint']],
    ['Empress','감각적 편안함과 풍부한 수용성. 몸과 마음이 자연스럽게 이완되는 친밀감.','돌봄이나 수용이 일방적으로 과해지면 자기 욕구를 놓칠 수 있다.',[2,1,0,2,2,1,2,2,2],'steady',[0,0,0,0],['sensuality','comfort','receptivity']],
    ['Emperor','통제된 욕구와 명확한 리드. 안정된 틀 안에서 친밀감을 주도한다.','자기 방식과 속도를 고집하면 상대의 선택권과 반응을 놓칠 수 있다.',[1,1,2,-1,1,0,0,1,1],'steady',[0,2,0,0],['leadership','structure','control']],
    ['Hierophant','신뢰와 관계의 틀이 만들어져야 깊어지는 친밀감. 익숙하고 합의된 방식을 선호한다.','관습이나 역할 기대가 실제 욕구보다 앞서면 유연성이 떨어질 수 있다.',[0,0,-1,1,2,1,1,1,2],'slow',[0,0,0,0],['trust','commitment','convention']],
    ['Lovers','상호 끌림과 선택이 맞물리는 카드. 감정과 신체적 호응이 함께 살아난다.','끌림이 강해도 선택을 미루거나 제3의 변수 때문에 방향이 갈릴 수 있다.',[2,2,1,2,2,2,2,2,2],'matched',[0,0,0,0],['mutual_attraction','chemistry','choice']],
    ['Chariot','강한 추진력과 빠른 접근. 욕구가 행동으로 전환되기 쉬운 상태.','한쪽의 속도가 지나치게 빠르면 압박감이나 경쟁 구도가 생길 수 있다.',[1,2,2,0,0,0,0,1,0],'fast',[0,1,0,1],['drive','pursuit','momentum']],
    ['Strength','강한 욕망을 부드럽게 조절하는 능력. 자신감과 배려가 함께 작동한다.','참거나 통제하는 데만 집중하면 실제 욕구 표현이 늦어질 수 있다.',[2,2,1,2,2,1,2,2,1],'matched',[0,0,0,0],['confidence','gentle_lead','self_regulation']],
    ['Hermit','가까워지기 전 자기 욕구와 감정을 정리해야 하는 상태. 거리가 필요하다.','고립과 회피가 길어지면 친밀감 자체를 차단할 수 있다.',[0,-1,-2,-1,1,0,-1,0,1],'slow',[0,0,2,0],['distance','reflection','slow_bond']],
    ['Wheel of Fortune','케미와 반응이 상황에 따라 크게 달라지는 흐름. 타이밍 영향이 크다.','뜨거움과 식음이 반복되면 안정적인 만족으로 이어지기 어렵다.',[1,1,1,1,0,0,0,1,0],'variable',[0,0,0,2],['cycles','timing','change']],
    ['Justice','서로의 욕구와 경계를 공평하게 확인하고 조율하는 친밀감.','감정을 지나치게 판단하거나 계산하면 자연스러운 반응이 줄 수 있다.',[0,0,0,0,2,2,2,1,1],'matched',[0,0,0,0],['consent','fairness','boundary']],
    ['Hanged Man','욕구가 있어도 행동을 유보하거나 상대에게 맞춰보는 상태.','일방적 희생이나 장기적 보류가 되면 만족과 상호성이 떨어진다.',[0,0,-2,1,0,-1,-1,0,0],'blocked',[0,0,2,0],['pause','surrender','delay']],
    ['Death','기존 친밀감 패턴을 끝내고 완전히 다른 방식으로 재구성해야 하는 시기.','변화를 거부하면 과거 패턴의 반복이나 단절감이 커질 수 있다.',[0,0,0,0,0,0,0,0,0],'variable',[0,0,0,2],['transformation','reset','new_pattern']],
    ['Temperance','서로 다른 욕구와 템포를 세밀하게 맞추는 조화. 장기 속궁합에서 매우 강하다.','지나친 양보로 실제 욕구 차이를 덮으면 겉으로만 평온할 수 있다.',[1,1,0,1,2,2,2,2,2],'matched',[0,0,0,0],['rhythm','adjustment','harmony']],
    ['Devil','강렬한 육체적 끌림과 반복해서 당기는 욕망. 중독성 있는 케미가 생기기 쉽다.','집착·소유·권력 불균형이 섞이면 강한 끌림이 좋은 궁합을 뜻하지 않게 된다.',[2,2,2,1,-1,-1,0,1,1],'fast',[3,2,0,2],['craving','magnetism','obsession']],
    ['Tower','억눌린 긴장이 갑자기 폭발하거나 관계 방식이 급격히 바뀌는 카드.','충동적 접근, 경계 붕괴, 감정적 후폭풍이 생길 수 있다.',[1,2,2,-1,-2,-1,-2,-1,-1],'variable',[1,2,0,3],['shock','eruption','instability']],
    ['Star','솔직하고 편안하게 자신을 드러낼 수 있는 친밀감. 치유와 신뢰가 중심.','이상화만 강하면 현실의 욕구 차이나 불편함을 늦게 볼 수 있다.',[1,1,0,2,2,2,2,2,1],'steady',[0,0,0,0],['openness','healing','trust']],
    ['Moon','말하지 않은 욕망과 판타지, 불안이 함께 움직인다. 감정 해석이 흔들리기 쉽다.','상상과 실제 상대의 의사를 혼동하거나 불안을 욕망으로 오인할 수 있다.',[1,1,-1,1,-1,-2,-1,0,1],'variable',[1,1,1,2],['fantasy','ambiguity','hidden_feelings']],
    ['Sun','편안하고 솔직하며 서로의 반응을 즐기는 밝은 친밀감. 만족과 안전감이 높다.','과도한 자신감으로 상대의 미세한 불편 신호를 가볍게 볼 수 있다.',[2,2,1,2,2,2,2,2,2],'matched',[0,0,0,0],['joy','openness','mutuality']],
    ['Judgement','과거 경험을 돌아보고 친밀감의 의미와 관계를 다시 결정하는 시기.','과거의 죄책감이나 평가가 현재의 자연스러운 반응을 방해할 수 있다.',[1,1,1,1,1,2,1,1,2],'matched',[0,0,0,0],['reassessment','reconnection','decision']],
    ['World','신체적·정서적·관계적 친밀감이 한 흐름으로 통합되는 완성도 높은 상태.','완벽함을 기대하면 작은 차이를 실패로 과장할 수 있다.',[2,2,1,2,2,2,2,2,2],'steady',[0,0,0,0],['integration','completion','deep_bond']]
  ];

  const MINOR_ROWS = {
    Wands: [
      ['욕망이 빠르게 점화된다. 강한 신체적 관심과 시작 에너지.','열기만 강하고 정서적 기반이나 지속성이 약할 수 있다.',[2,2,2,0,0,0,0,1,0],'fast',[0,0,0,1],['spark','desire','heat']],
      ['끌림은 있으나 행동 전에 가능성과 다음 단계를 계산한다.','계획만 반복하며 실제 접근은 늦어질 수 있다.',[1,1,0,0,0,0,0,0,0],'steady',[0,0,1,0],['planning','anticipation']],
      ['서로 가까워질 가능성을 기대하며 반응을 기다리는 확장 단계.','기대가 실제 상호성보다 앞서면 혼자 흐름을 키울 수 있다.',[1,1,1,0,0,0,1,1,0],'steady',[0,0,0,0],['expansion','expectation']],
      ['편안하고 즐겁게 가까워질 수 있는 안정된 케미.','분위기는 좋지만 깊은 욕구 차이를 가볍게 넘길 수 있다.',[1,1,1,1,2,1,2,2,1],'steady',[0,0,0,0],['comfort','celebration','ease']],
      ['끌리지만 주도권·욕구·방식이 충돌한다. 긴장 자체가 자극이 되기도 한다.','경쟁과 승부가 친밀감보다 앞서면 경계 침범이나 피로로 이어진다.',[1,1,1,-1,-1,-1,-1,0,0],'variable',[0,2,0,2],['friction','competition','tension']],
      ['상대에게 매력적으로 보이고 인정받고 싶은 욕구가 강하다.','칭찬과 반응 확인에 의존하면 실제 상호 만족보다 자존감 문제가 앞설 수 있다.',[2,1,2,0,0,0,0,1,0],'fast',[1,0,0,1],['confidence','validation','pursuit']],
      ['자기 페이스와 경계를 지키며 쉽게 밀리지 않는다.','방어가 과하면 친밀한 상호 조율까지 거부할 수 있다.',[0,0,0,-1,0,0,0,0,0],'blocked',[0,1,1,0],['boundary','defense','self_protection']],
      ['급격한 접근과 빠른 반응. 서로 신호가 맞으면 단기간에 가까워진다.','속도가 너무 빨라 감정 확인과 경계 합의가 뒤처질 수 있다.',[2,2,2,1,0,1,1,1,0],'fast',[0,1,0,2],['speed','messages','momentum']],
      ['끌림은 남아 있지만 과거 경험 때문에 몸과 마음이 경계한다.','경계심이 상대의 현재 행동과 무관하게 자동으로 올라올 수 있다.',[1,1,-1,-1,-1,0,0,0,1],'slow',[0,0,2,0],['guarded','resilience','history']],
      ['친밀감이 즐거움보다 부담·의무·피로처럼 느껴질 수 있다.','욕구 차이를 참고 버티면 불만과 회피가 누적된다.',[0,-1,-1,-1,-1,-1,-1,-1,0],'blocked',[0,0,2,1],['burden','fatigue','pressure']],
      ['새로운 친밀감 방식에 대한 호기심과 장난스러운 탐색.','호기심은 크지만 책임감이나 지속성은 아직 약할 수 있다.',[1,1,1,1,0,1,0,1,0],'fast',[0,0,0,1],['curiosity','playfulness','exploration']],
      ['강하고 즉각적인 욕망과 적극성. 불꽃 같은 케미.','뜨겁게 접근한 뒤 빠르게 식거나 상대 템포를 놓칠 수 있다.',[2,2,2,0,-1,0,0,1,0],'fast',[0,1,0,3],['passion','pursuit','instability']],
      ['자기 매력을 편안하게 알고 표현하며 상대의 반응도 잘 받아준다.','관심을 끌고 싶은 욕구가 커지면 경쟁이나 질투가 섞일 수 있다.',[2,2,1,2,1,1,1,2,1],'steady',[1,0,0,0],['magnetism','confidence','receptivity']],
      ['강한 추진력과 일관된 주도성. 원하는 방향을 분명히 제시한다.','상대 반응보다 자신의 속도와 방식이 앞서면 압박감이 생긴다.',[2,2,2,0,1,1,1,2,1],'steady',[0,2,0,1],['leadership','desire','consistency']]
    ],
    Cups: [
      ['마음이 열리며 신체적 친밀감이 감정적 교감으로 이어지기 시작한다.','감정 기대가 너무 빨리 커지면 실제 관계 수준과 어긋날 수 있다.',[1,1,0,2,2,2,2,2,2],'steady',[0,0,0,0],['emotional_opening','tenderness']],
      ['서로의 반응이 자연스럽게 맞물리는 상호 호응. 감정과 신체 케미가 함께 좋다.','상호 호감만 보고 현실적 경계나 장기 차이를 생략할 수 있다.',[2,2,1,2,2,2,2,2,2],'matched',[0,0,0,0],['mutuality','chemistry','bond']],
      ['즐겁고 가벼운 교감, 장난스러운 친밀감.','관계 정의가 모호하거나 제3의 사회적 변수가 섞이면 깊이가 제한될 수 있다.',[1,1,1,1,1,1,1,1,0],'variable',[0,0,0,1],['playful','social','fun']],
      ['반응 부족, 권태, 욕구 차이. 제안이 와도 마음이나 몸이 잘 움직이지 않는다.','무관심을 상대 전체에 대한 거절로 단정하거나 회피가 굳어질 수 있다.',[0,-1,-1,-1,0,-1,-1,-1,0],'blocked',[0,0,2,0],['apathy','boredom','low_response']],
      ['상실과 과거 상처가 현재 친밀감에 영향을 준다.','후회와 비교가 커져 현재의 좋은 신호까지 놓칠 수 있다.',[0,-1,-1,-1,-1,-1,-1,-1,1],'slow',[0,0,2,1],['grief','regret','wound']],
      ['익숙함, 그리움, 과거의 좋은 접촉 기억. 재회 질문에서 친밀감 기억이 살아 있다.','추억을 현재 궁합으로 착각하거나 과거 패턴을 미화할 수 있다.',[1,1,0,1,2,1,1,1,2],'slow',[1,0,0,1],['nostalgia','reunion','familiarity']],
      ['판타지와 가능성이 많고 상상 속 친밀감이 강하다.','상상과 실제 상대의 욕구·반응을 혼동하기 쉽다.',[1,1,-1,1,-1,-1,-1,0,0],'variable',[1,0,1,2],['fantasy','options','projection']],
      ['감정적으로 거리를 두거나 이미 떠나려는 흐름.','말없이 철수하면 상대는 이유를 알지 못한 채 거절감만 느낄 수 있다.',[0,-1,-2,-2,-1,-1,-2,-1,-1],'blocked',[0,0,3,0],['withdrawal','distance','leaving']],
      ['자신의 욕구가 충족되는 만족감. 감각적 만족도는 높다.','자기 만족에 집중하면 상호성이나 상대의 경험을 놓칠 수 있다.',[1,1,0,1,1,0,0,2,1],'steady',[0,1,0,0],['satisfaction','pleasure','wish']],
      ['정서적 안정과 친밀감이 장기 관계의 편안함으로 연결된다.','가족적 익숙함이 욕망의 신선함을 약화시킬 수 있다.',[1,1,0,2,2,2,2,2,2],'steady',[0,0,0,0],['emotional_completion','security','bond']],
      ['조심스럽고 부드러운 호감 표현. 상대의 반응을 살피며 다가간다.','미숙함이나 수줍음 때문에 원하는 것을 명확히 말하지 못할 수 있다.',[1,1,0,2,1,1,1,1,1],'slow',[0,0,1,0],['tender_interest','soft_signal']],
      ['감정적 분위기를 만들며 상대에게 적극적으로 다가간다.','로맨틱한 표현이 실제 지속성보다 앞서면 기대가 커질 수 있다.',[1,1,1,2,1,2,1,1,1],'steady',[0,0,0,1],['romance','pursuit','affection']],
      ['상대의 감정과 반응을 섬세하게 읽고 수용하는 친밀감.','상대 기분을 지나치게 읽느라 자기 욕구와 경계를 뒤로 미룰 수 있다.',[1,1,0,2,2,2,2,2,2],'slow',[0,1,0,0],['empathy','receptivity','care']],
      ['감정적으로 안정되고 욕구를 조절하며 솔직한 대화를 유지한다.','통제와 성숙을 강조하다 감정적 자발성이 줄 수 있다.',[1,1,1,1,2,2,2,2,2],'steady',[0,0,0,0],['maturity','emotional_safety','communication']]
    ],
    Swords: [
      ['원하는 것과 싫은 것을 명료하게 말할 수 있는 상태.','말이 지나치게 날카로우면 안전감과 분위기를 깨뜨릴 수 있다.',[0,0,1,0,1,2,1,1,0],'steady',[0,1,0,0],['clarity','communication','truth']],
      ['욕구나 관계 방향을 결정하지 못하고 멈춰 있다.','불편한 대화를 피할수록 긴장과 오해가 쌓인다.',[0,0,-2,0,0,-1,-1,0,0],'blocked',[0,0,2,0],['indecision','avoidance','stalemate']],
      ['상처·거절·삼각 변수의 기억이 친밀감을 방해한다.','현재 상대에게 과거의 상처를 투사하거나 비교할 수 있다.',[0,-1,-1,-1,-2,-1,-2,-1,-1],'slow',[1,0,2,1],['heartbreak','wound','triangle']],
      ['욕구보다 휴식과 거리, 회복이 필요한 시기.','정지 상태가 길어지면 관계 의욕 자체가 떨어질 수 있다.',[0,-1,-2,-1,1,0,0,0,0],'slow',[0,0,2,0],['rest','pause','recovery']],
      ['친밀감에서도 이기려 하거나 자기 욕구를 우선하는 갈등.','상호성과 경계를 해치면 관계 후 불쾌감과 거리감이 커진다.',[0,0,2,-2,-2,-2,-2,-2,-1],'fast',[1,3,0,2],['conflict','power_struggle','selfishness']],
      ['불편했던 패턴에서 벗어나 더 안전한 방식으로 이동하는 과정.','거리를 두는 것만으로 해결했다고 생각하면 핵심 대화가 남을 수 있다.',[0,0,0,0,1,1,1,1,1],'slow',[0,0,1,0],['transition','healing','distance']],
      ['욕구·행동·판타지 일부를 숨기거나 우회한다.','비밀과 회피가 신뢰를 약화시키고 실제 합의를 어렵게 만든다.',[1,1,0,0,-1,-2,-1,0,0],'variable',[1,2,2,1],['secrecy','strategy','hidden_desire']],
      ['욕구가 있어도 불안·수치심·자기검열 때문에 행동이 막힌다.','스스로 만든 제한을 상대의 거절로 단정할 수 있다.',[0,1,-2,-2,-2,-1,-1,-1,0],'blocked',[0,0,3,0],['inhibition','anxiety','restriction']],
      ['친밀감에 대한 걱정과 과잉사고가 반응을 압도한다.','실제 문제가 생기기 전에 실패나 거절을 상상해 회피할 수 있다.',[0,0,-2,-1,-2,-1,-1,-1,0],'blocked',[0,0,3,1],['anxiety','overthinking','fear']],
      ['현재의 친밀감 방식이 소진되었거나 끝나야 한다.','끝났다는 감각에 머물면 회복과 새 패턴의 가능성을 못 본다.',[-1,-2,-2,-2,-2,-2,-2,-2,-2],'blocked',[0,0,3,2],['ending','exhaustion','reset']],
      ['상대를 관찰하고 궁금해하지만 행동보다 생각이 앞선다.','과도한 관찰이나 추측이 실제 대화를 대신할 수 있다.',[1,1,-1,0,0,1,0,0,0],'slow',[1,0,1,0],['curiosity','observation','mind']],
      ['생각이 나면 바로 말하거나 행동한다. 빠르고 직접적인 접근.','직설성과 속도가 상대 감정과 경계를 놓치게 할 수 있다.',[1,1,2,-1,-1,1,-1,0,0],'fast',[0,2,0,2],['directness','speed','initiative']],
      ['자기 욕구와 경계를 분명하게 표현하고 원치 않는 것을 잘 구분한다.','방어가 지나치게 강하면 따뜻한 수용과 자발성이 줄 수 있다.',[0,0,0,-1,1,2,1,1,0],'steady',[0,0,1,0],['boundary','clarity','independence']],
      ['감정보다 이성적 통제로 친밀감을 관리한다. 기준과 합의가 명확하다.','지나친 분석과 통제가 감각적 자발성을 억누를 수 있다.',[0,0,1,-1,1,2,1,1,0],'steady',[0,0,1,0],['control','reason','communication']]
    ],
    Pents: [
      ['현실적이고 편안한 친밀감의 시작. 몸의 안정감과 실제 만남 가능성이 중요하다.','안전과 조건만 확인하다 욕망과 감정의 생동감을 놓칠 수 있다.',[1,1,0,1,2,1,1,2,1],'steady',[0,0,0,0],['body_comfort','grounding','beginning']],
      ['서로의 일정·에너지·속도를 맞추며 균형을 찾는 과정.','조율할 것이 너무 많으면 관계가 계속 가변 상태로 남을 수 있다.',[1,1,1,1,1,1,1,1,0],'variable',[0,0,0,1],['rhythm','balance','adjustment']],
      ['서로의 반응을 배우고 피드백을 받아 실제 궁합을 개선한다.','기술적으로 맞추는 데 집중해 감정적 연결을 잊을 수 있다.',[1,1,1,1,2,2,2,2,1],'matched',[0,0,0,0],['learning','teamwork','adaptability']],
      ['몸과 마음을 쉽게 열지 않고 통제권을 유지하려 한다.','소유·통제·경직이 강하면 상대가 거리감을 느낀다.',[0,0,-1,-2,0,-1,-1,0,1],'blocked',[1,2,1,0],['control','guarded','holding']],
      ['거절감·자존감 저하·친밀감 결핍이 반응에 영향을 준다.','결핍감 때문에 상대의 작은 반응을 크게 해석하거나 매달릴 수 있다.',[-1,-1,-2,-1,-2,-1,-2,-2,-1],'slow',[2,0,2,1],['rejection','scarcity','insecurity']],
      ['주고받는 균형이 좋다. 욕구·배려·반응의 상호성이 핵심.','한쪽이 계속 주거나 받기만 하면 권력 불균형으로 변할 수 있다.',[1,1,1,1,2,2,2,2,1],'matched',[0,1,0,0],['reciprocity','balance','mutuality']],
      ['천천히 반응을 관찰하고 시간을 들여 맞춰간다.','평가와 기다림이 길어지면 자연스러운 발전이 정체될 수 있다.',[0,0,-1,1,1,1,1,1,1],'slow',[0,0,1,0],['patience','assessment','slow_growth']],
      ['반복과 피드백으로 서로의 선호를 배우며 점점 좋아지는 궁합.','완벽하게 맞추려는 노력 자체가 압박으로 변할 수 있다.',[1,1,1,1,2,2,2,2,1],'steady',[0,0,0,0],['practice','adaptation','skill']],
      ['자기 몸과 욕구에 비교적 편안하고 독립적으로 만족을 안다.','독립성이 강해 상대와 욕구를 나누는 과정이 적을 수 있다.',[1,1,0,1,2,1,0,2,0],'steady',[0,0,0,0],['body_confidence','independence','comfort']],
      ['장기적 신뢰와 생활 안정 속에서 친밀감이 지속된다.','익숙함이 지나치면 새로움과 욕망 표현이 줄어들 수 있다.',[1,1,0,2,2,2,2,2,2],'steady',[0,0,0,0],['stability','long_term','security']],
      ['조심스럽게 배우고 경험하려는 태도. 현실적 호기심.','미숙함이나 지나친 신중함 때문에 표현이 늦어질 수 있다.',[1,1,0,1,1,1,1,1,0],'slow',[0,0,1,0],['learning','curiosity','practical']],
      ['느리지만 안정적이고 일관된 친밀감. 신뢰가 쌓일수록 만족이 좋아진다.','변화가 적어 상대가 지루함이나 답답함을 느낄 수 있다.',[1,1,0,1,2,1,2,2,2],'slow',[0,0,0,0],['consistency','stability','endurance']],
      ['편안함과 감각적 안정, 세심한 돌봄이 함께하는 친밀감.','돌봄 역할에 고정되면 자신의 욕구를 덜 표현할 수 있다.',[1,1,0,2,2,2,2,2,2],'steady',[0,0,0,0],['sensual_comfort','care','receptivity']],
      ['안정적이고 일관되며 현실적인 만족을 중시한다.','소유감이나 고정된 방식이 강하면 유연성이 떨어질 수 있다.',[1,1,1,1,2,1,2,2,2],'steady',[1,1,0,0],['stability','consistency','grounded']]
    ]
  };

  const CARDS = {};
  for (const [code, core, shadow, axes, pace, risks, tags] of MAJOR_ROWS) {
    CARDS[code] = card(core, shadow, axes, pace, risks, tags);
  }
  for (const [suit, rows] of Object.entries(MINOR_ROWS)) {
    rows.forEach((row, index) => {
      const code = `${suit}${String(index + 1).padStart(2, '0')}`;
      CARDS[code] = card(...row);
    });
  }
  Object.freeze(CARDS);

  const spread = (id, title, description, positions) => Object.freeze({
    id, title, description, cardCount: positions.length,
    positions: Object.freeze(positions.map((p, index) => Object.freeze({
      index: index + 1,
      label: p.label,
      focusAxes: Object.freeze([...(p.focusAxes || [])]),
      focusRisks: Object.freeze([...(p.focusRisks || [])])
    })))
  });

  const SPREADS = Object.freeze({
    intimacy_core_5: spread('intimacy_core_5','신체적 속궁합 · CORE 5','끌림과 욕구 방식, 어긋남, 실제 만족 가능성을 다섯 축으로 분리합니다.',[
      {label:'현재 두 사람 사이의 신체적 끌림',focusAxes:['attraction','desire']},
      {label:'내가 원하는 친밀감 방식과 리듬',focusAxes:['initiative','receptivity']},
      {label:'상대가 원하는 친밀감 방식과 리듬',focusAxes:['initiative','receptivity']},
      {label:'실제로 어긋나기 쉬운 지점',focusAxes:['communication','emotionalSafety'],focusRisks:['boundary','avoidance','instability']},
      {label:'둘의 신체적·정서적 만족 가능성',focusAxes:['mutuality','satisfaction','emotionalSafety','attachment']}
    ]),
    desire_tension_6: spread('desire_tension_6','성적 끌림 & 텐션','양쪽의 끌림을 분리하고 숨은 욕구와 행동 장벽, 가까운 흐름을 봅니다.',[
      {label:'내가 상대에게 느끼는 신체적 끌림',focusAxes:['attraction','desire']},
      {label:'상대가 나에게 느끼는 신체적 끌림',focusAxes:['attraction','desire']},
      {label:'둘 사이에 실제로 형성된 케미와 긴장감',focusAxes:['mutuality','attraction','satisfaction']},
      {label:'상대가 표현하지 않거나 억누르는 욕구',focusAxes:['desire','receptivity'],focusRisks:['avoidance']},
      {label:'욕구가 실제 행동으로 이어지는 것을 막는 것',focusAxes:['initiative','communication','emotionalSafety'],focusRisks:['boundary','avoidance']},
      {label:'가까운 시기의 친밀감 발전 흐름',focusAxes:['initiative','mutuality','attachment'],focusRisks:['instability']}
    ]),
    rhythm_boundary_7: spread('rhythm_boundary_7','리듬 · 경계 · 조율','속도·편안함·경계 표현을 양쪽으로 나눠 실제로 맞춰갈 수 있는지를 봅니다.',[
      {label:'나의 친밀감 속도와 템포',focusAxes:['initiative','receptivity']},
      {label:'상대의 친밀감 속도와 템포',focusAxes:['initiative','receptivity']},
      {label:'내가 신체적으로 편안함을 느끼는 조건',focusAxes:['emotionalSafety','satisfaction']},
      {label:'상대가 신체적으로 편안함을 느끼는 조건',focusAxes:['emotionalSafety','satisfaction']},
      {label:'욕구와 경계를 서로 말하는 방식',focusAxes:['communication','mutuality'],focusRisks:['boundary']},
      {label:'실제로 충돌하거나 어긋날 가능성이 큰 지점',focusAxes:['mutuality','communication'],focusRisks:['boundary','avoidance','instability']},
      {label:'둘이 서로의 리듬을 맞춰갈 수 있는 정도',focusAxes:['mutuality','satisfaction','emotionalSafety']}
    ]),
    reunion_intimacy_6: spread('reunion_intimacy_6','재회 후 친밀감','재회 욕구와 신체적 끌림을 분리하고, 다시 가까워졌을 때 반복될 패턴까지 확인합니다.',[
      {label:'아직 남아 있는 신체적 끌림',focusAxes:['attraction','desire']},
      {label:'아직 남아 있는 정서적 애착',focusAxes:['attachment','emotionalSafety']},
      {label:'다시 가까워지고 싶은 진짜 동기',focusAxes:['desire','initiative','attachment']},
      {label:'다시 친밀해졌을 때 관계 전체에 미치는 영향',focusAxes:['mutuality','satisfaction','attachment']},
      {label:'과거의 불편한 패턴을 반복할 위험',focusAxes:['communication','emotionalSafety'],focusRisks:['obsession','boundary','avoidance','instability']},
      {label:'이번에는 건강하고 지속 가능한 친밀감을 만들 수 있는가',focusAxes:['mutuality','satisfaction','emotionalSafety','communication']}
    ]),
    intimacy_ab_9: spread('intimacy_ab_9','A/B 친밀감 비교','A와 B를 같은 기준으로 비교하되 점수 경쟁이 아니라 케미의 성격과 안정성을 질적으로 비교합니다.',[
      {label:'A와의 신체적 끌림',focusAxes:['attraction','desire']},
      {label:'A와의 리듬·편안함',focusAxes:['mutuality','satisfaction','emotionalSafety']},
      {label:'A와의 정서적 안전감',focusAxes:['emotionalSafety','communication','attachment']},
      {label:'B와의 신체적 끌림',focusAxes:['attraction','desire']},
      {label:'B와의 리듬·편안함',focusAxes:['mutuality','satisfaction','emotionalSafety']},
      {label:'B와의 정서적 안전감',focusAxes:['emotionalSafety','communication','attachment']},
      {label:'내가 실제로 원하는 친밀감의 핵심',focusAxes:['desire','receptivity','emotionalSafety','attachment']},
      {label:'A와 친밀감이 발전했을 때의 방향',focusAxes:['mutuality','satisfaction','attachment'],focusRisks:['instability','boundary']},
      {label:'B와 친밀감이 발전했을 때의 방향',focusAxes:['mutuality','satisfaction','attachment'],focusRisks:['instability','boundary']}
    ])
  });

  const SPREAD_BY_TITLE = Object.freeze(Object.fromEntries(Object.values(SPREADS).map(value => [value.title, value])));
  function getCard(code) { return CARDS[String(code || '')] || null; }
  function getSpread(idOrTitle) { const key=String(idOrTitle || ''); return SPREADS[key] || SPREAD_BY_TITLE[key] || null; }
  function isIntimacyTitle(title) { return !!SPREAD_BY_TITLE[String(title || '')]; }
  function isMinorQuestion(input) {
    const q = String(input || '').normalize('NFKC');
    return /미성년|청소년|아동|초등학생|중학생|고등학생|고교생|중고생|만\s*1[0-7]\s*세|(?:^|\D)(?:[1-9]|1[0-7])\s*(?:살|세)(?:\D|$)/i.test(q);
  }
  function isIntimacyContext() {
    try { return String(state?.category || '').toUpperCase() === 'INTIMACY' || isIntimacyTitle(state?.title); }
    catch { return false; }
  }
  function cardLayerLine(drawnCard, positionMeta) {
    const meta=getCard(drawnCard?.code); if(!meta)return '';
    const meaning=drawnCard?.isReversed?meta.shadow:meta.core;
    const axes=(positionMeta?.focusAxes?.length?positionMeta.focusAxes:AXES).map(key=>`${key}:${meta.axes[key]}`).join(', ');
    const risks=(positionMeta?.focusRisks?.length?positionMeta.focusRisks:RISKS).map(key=>`${key}:${meta.risks[key]}`).join(', ');
    return `- ${drawnCard.code} / ${drawnCard?.isReversed?'shadow':'core'} / pace:${meta.pace}\n  meaning: ${meaning}\n  focus axes: ${axes}\n  focus risks: ${risks}\n  tags: ${meta.tags.join(', ')}`;
  }
  function buildPromptLayer(drawn=[], title='', question='') {
    const selected=getSpread(title);
    const lines=drawn.map((item,index)=>cardLayerLine(item,selected?.positions?.[index])).filter(Boolean);
    return `[LUNEA INTIMACY 18+ INTERPRETATION LAYER · V${RELEASE}]
- 성인 간 친밀감 질문에만 사용한다. 미성년자가 포함된 성적/신체적 질문은 해석하지 않는다.
- 이 레이어의 내부 축 값은 해석 강도 조절용이다. 사용자에게 임의의 퍼센트·궁합 점수로 변환하지 않는다.
- attraction/desire는 끌림과 욕구의 상징이지 실제 동의(consent)의 증거가 아니다. 실제 의사와 동의는 현실의 명확한 표현으로만 확인된다.
- 카드로 실제 신체 크기, 해부학적 특성, 성기능, 질환, 임신 가능성, 성병 여부를 단정하거나 추정하지 않는다.
- 속궁합은 끌림만으로 판정하지 않는다. mutuality, satisfaction, emotionalSafety, communication과 boundary/avoidance/instability 위험을 함께 비교한다.
- Devil/Tower/Knight of Wands처럼 강한 열기를 보여도 obsession·boundary·instability가 높으면 "강렬함 ≠ 좋은 궁합"을 명시한다.
- 역방향은 무조건 반대 의미가 아니라 억압·내면화·과잉·왜곡 가능성을 shadow 설명과 포지션 맥락으로 판단한다.
- 결론은 선정적 묘사보다 욕구 방식, 리듬, 편안함, 경계, 상호성, 만족, 관계 후 감정 변화를 중심으로 쓴다.
- 질문: ${String(question || '').trim() || '(없음)'}
- 고정 배열: ${selected?.title || String(title || '') || '(AI/기타)'}
${lines.join('\n')}`;
  }

  W.LUNEA_INTIMACY_V34 = Object.freeze({
    version:RELEASE, axes:AXES, risks:RISKS, cards:CARDS, spreads:SPREADS,
    getCard, getSpread, isMinorQuestion, buildPromptLayer
  });

  if (typeof document === 'undefined') return;

  function installStyles() {
    if (document.getElementById('luneaIntimacyV34Style')) return;
    const style=document.createElement('style'); style.id='luneaIntimacyV34Style';
    style.textContent=`
      .lunea-intimacy-category{--intimacy:#d58aa7;--intimacy2:#8f3f68;--intimacy3:#4c213d;background:radial-gradient(circle at 92% -10%,rgba(213,138,167,.15),transparent 34%),linear-gradient(145deg,rgba(72,28,54,.34),rgba(24,17,35,.82))!important;border-color:rgba(213,138,167,.30)!important}
      .lunea-intimacy-category .cat-icon{color:#f2b4ca!important;background:rgba(143,63,104,.20)!important;border-color:rgba(213,138,167,.34)!important;box-shadow:0 0 18px rgba(143,63,104,.12)}
      .lunea-intimacy-category .cat-text h3{color:#ffe7ef!important}.lunea-intimacy-category .count{color:#f5bdd2!important;border-color:rgba(213,138,167,.34)!important;background:rgba(143,63,104,.15)!important}
      .lunea-intimacy-18-badge{font-size:8px;letter-spacing:1px;color:#f2b4ca;border:1px solid rgba(213,138,167,.35);border-radius:999px;padding:2px 6px;margin-left:5px;vertical-align:2px}
      body.lunea-intimacy-reading #spreadOverlay .modal{border-color:rgba(213,138,167,.34)!important;box-shadow:0 24px 60px rgba(0,0,0,.72),0 0 38px rgba(143,63,104,.11)!important}
      body.lunea-intimacy-reading #spreadOverlay .sub,body.lunea-intimacy-reading #spreadOverlay .pos{color:#ef9fbd!important}
      .lunea-intimacy-card-note{margin-top:7px!important;padding:7px 9px;border-radius:9px;background:rgba(143,63,104,.10);border-left:2px solid rgba(213,138,167,.58);color:#e8c7d4!important}`;
    document.head.appendChild(style);
  }
  function adultAcknowledged(){try{return localStorage.getItem(ACK_KEY)==='1'}catch{return false}}
  function requestAdultAcknowledgement(){
    if(adultAcknowledged())return true;
    const ok=typeof confirm==='function'?confirm('INTIMACY 18+는 성인 사용자 전용 친밀감 리딩이야. 성인 간의 합의된 관계와 친밀감 질문에만 사용해줘. 계속할까?'):true;
    if(!ok)return false; try{localStorage.setItem(ACK_KEY,'1')}catch{} return true;
  }
  function findLoveCategory(){return Array.from(document.querySelectorAll('.category')).find(node=>/LOVE\s*&\s*INNER\s*HEART/i.test(node.querySelector('.cat-text h3')?.textContent||''))||null}
  function installCategory(){
    if(document.querySelector('.lunea-intimacy-category'))return;
    const love=findLoveCategory(); if(!love)return;
    const legacy=love.querySelector('.reading-item[data-title="속궁합 · 19+"]'); if(legacy){legacy.hidden=true;legacy.dataset.luneaLegacyIntimacyHidden='1'}
    const loveDesc=love.querySelector('.cat-text p'); if(loveDesc)loveDesc.textContent='속마음 · 외모/몸매 · 인연운 · 연락 · 재회';
    const root=document.createElement('div'); root.className='category lunea-intimacy-category'; root.dataset.luneaSector='INTIMACY';
    root.innerHTML=`<div class="category-header" role="button" tabindex="0" aria-expanded="false"><div class="cat-left"><div class="cat-icon">♡</div><div class="cat-text"><h3>INTIMACY <span class="lunea-intimacy-18-badge">18+</span></h3><p>끌림 · 신체적 속궁합 · 리듬 · 경계 · 재회 후 친밀감</p></div></div><div class="toggle">+</div></div><div class="category-content">${Object.values(SPREADS).map(s=>`<div class="reading-item" data-cat="INTIMACY" data-intimacy-id="${s.id}" data-title="${s.title}" data-desc="${s.description}" data-count="${s.cardCount}"><div><h4>${s.title}</h4><p>${s.positions.map(p=>p.label.replace(/^(내가|상대가|둘 사이에|현재 두 사람 사이의|실제로|아직|다시|이번에는)\s*/, '')).slice(0,4).join(' · ')}</p></div><div class="count">${s.cardCount}</div></div>`).join('')}</div>`;
    love.insertAdjacentElement('afterend',root);
    const header=root.querySelector('.category-header');
    const toggle=()=>{document.querySelectorAll('.category').forEach(node=>{if(node!==root){node.classList.remove('active');node.querySelector('.category-header')?.setAttribute('aria-expanded','false')}});root.classList.toggle('active');header?.setAttribute('aria-expanded',root.classList.contains('active')?'true':'false')};
    header?.addEventListener('click',toggle); header?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle()}});
    root.querySelectorAll('.reading-item').forEach(item=>{
      item.setAttribute('role','button');item.setAttribute('tabindex','0');
      const open=()=>{if(!requestAdultAcknowledgement())return;document.body.classList.add('lunea-intimacy-reading');openSheet('LOVE',item.dataset.title,item.dataset.desc,Number(item.dataset.count));const sheetCat=document.getElementById('sheetCat');if(sheetCat)sheetCat.textContent='INTIMACY 18+'};
      item.addEventListener('click',open); item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}});
    });
  }
  function patchCoreHooks(){
    if(typeof fixedPositions==='function'&&!fixedPositions.__luneaIntimacyV34){const base=fixedPositions;const wrapped=function(title,count){const selected=getSpread(title);return selected?selected.positions.map(p=>p.label):base(title,count)};wrapped.__luneaIntimacyV34=true;fixedPositions=wrapped}
    if(typeof deckBackPrefix==='function'&&!deckBackPrefix.__luneaIntimacyV34){const base=deckBackPrefix;const wrapped=function(){try{if(String(state?.category||'').toUpperCase()==='INTIMACY')return'back_love'}catch{}return base()};wrapped.__luneaIntimacyV34=true;deckBackPrefix=wrapped}
    if(typeof promptString==='function'&&!promptString.__luneaIntimacyV34){const base=promptString;const wrapped=function(){const master=base();if(!isIntimacyContext())return master;return`${master}\n\n${buildPromptLayer(state?.drawn||[],state?.title||'',state?.question||'')}`};wrapped.__luneaIntimacyV34=true;promptString=wrapped}
    if(typeof renderInfo==='function'&&!renderInfo.__luneaIntimacyV34){const base=renderInfo;const wrapped=function(index){base(index);if(!isIntimacyContext())return;let item;try{item=state?.drawn?.[index]}catch{return}const meta=getCard(item?.code);const box=document.getElementById(`info-${index}`);if(!meta||!box||box.querySelector('.lunea-intimacy-card-note'))return;const note=document.createElement('p');note.className='lunea-intimacy-card-note';note.textContent=`INTIMACY · ${item?.isReversed?meta.shadow:meta.core}`;box.appendChild(note)};wrapped.__luneaIntimacyV34=true;renderInfo=wrapped}
  }
  function installMinorGuard(){
    const button=document.getElementById('drawBtn');if(!button||button.__luneaIntimacyMinorGuard)return;button.__luneaIntimacyMinorGuard=true;
    button.addEventListener('click',event=>{if(!isIntimacyContext())return;const question=document.getElementById('question')?.value||'';if(!isMinorQuestion(question))return;event.preventDefault();event.stopImmediatePropagation();alert('INTIMACY 18+에서는 미성년자가 포함된 성적·신체적 친밀감 질문을 다루지 않아. 성인 간 질문으로 바꿔줘.')},true);
  }
  function installCategoryExitReset(){document.addEventListener('click',event=>{const item=event.target?.closest?.('.reading-item');if(!item)return;if(String(item.dataset.cat||'').toUpperCase()!=='INTIMACY')document.body.classList.remove('lunea-intimacy-reading')},true)}
  function boot(){installStyles();installCategory();patchCoreHooks();installMinorGuard();installCategoryExitReset();console.info(`🌹 LUNEA INTIMACY 18+ V${RELEASE} ready · 78-card layer / 5 spreads`)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
