'use strict';

/*
  LUNEA INTIMACY ORACLE V35
  =========================
  Data + combination-rule layer only. No UI/draw button is added here.

  Design:
  - 36 original LUNEA oracle cards in six 6-card families.
  - Same 9 intimacy axes + 4 risk axes as LUNEA_INTIMACY_V34.
  - Oracle never overrides Tarot. Position > Tarot > Oracle modifier > optional astrology support.
  - Contradictions stay visible; strong attraction and poor boundary safety are not averaged away.
*/
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_ORACLE_V35__) return;
  W.__LUNEA_INTIMACY_ORACLE_V35__ = true;

  const RELEASE = '35.0';
  const AXES = Object.freeze([
    'attraction','desire','initiative','receptivity','emotionalSafety',
    'communication','mutuality','satisfaction','attachment'
  ]);
  const RISKS = Object.freeze(['obsession','boundary','avoidance','instability']);
  const PACES = new Set(['fast','slow','steady','variable','matched','blocked','cyclical']);
  const FAMILIES = Object.freeze({
    spark:     Object.freeze({label:'SPARK', ko:'끌림', focus:['attraction','desire','initiative']}),
    rhythm:    Object.freeze({label:'RHYTHM', ko:'리듬', focus:['initiative','receptivity','mutuality','satisfaction']}),
    desire:    Object.freeze({label:'DESIRE', ko:'욕구 표현', focus:['desire','initiative','receptivity','communication']}),
    boundary:  Object.freeze({label:'BOUNDARY', ko:'경계·안전', focus:['emotionalSafety','communication','mutuality']}),
    bond:      Object.freeze({label:'BOND', ko:'애착·정서', focus:['emotionalSafety','mutuality','attachment']}),
    afterglow: Object.freeze({label:'AFTERGLOW', ko:'여운·결과', focus:['satisfaction','attachment','emotionalSafety']})
  });

  const zip = (keys, values, fallback = 0) => Object.freeze(Object.fromEntries(
    keys.map((key, index) => [key, Number(values?.[index] ?? fallback)])
  ));
  const makeCard = (code, title, family, tone, pace, light, shadow, axes, risks, tags = []) => Object.freeze({
    code, title, family, tone,
    pace: PACES.has(pace) ? pace : 'steady',
    light, shadow,
    axes: zip(AXES, axes),
    risks: zip(RISKS, risks),
    tags: Object.freeze([...tags])
  });

  // Axis order:
  // attraction, desire, initiative, receptivity, emotionalSafety,
  // communication, mutuality, satisfaction, attachment
  // Risk order: obsession, boundary, avoidance, instability
  const ROWS = [
    ['O01','첫 불꽃','spark','supportive','fast','서로에게 호기심과 신체적 관심이 막 켜지는 순간. 아직 깊이보다 “다가가 보고 싶다”는 점화가 핵심.','새로움의 흥분이 실제 궁합이나 안전감을 앞서갈 수 있다.',[2,1,1,0,0,0,0,0,0],[0,0,0,1],['spark','curiosity','new_attraction']],
    ['O02','자석','spark','mixed','fast','설명하기 어려울 만큼 서로를 강하게 의식하는 자기장 같은 끌림. 거리를 좁히고 싶은 힘이 크다.','강한 끌림을 운명이나 좋은 궁합으로 과대평가하면 집착과 소유욕을 놓칠 수 있다.',[3,2,1,0,0,0,0,1,1],[2,0,0,1],['magnetism','chemistry','craving']],
    ['O03','시선','spark','mixed','steady','말보다 눈길과 관찰에서 드러나는 관심. 상대의 분위기·몸짓·표정에 예민하게 반응한다.','서로 확인하지 않은 신호를 혼자 해석해 확신으로 만들 수 있다.',[2,1,0,1,0,-1,0,0,0],[0,0,1,0],['gaze','attention','unspoken']],
    ['O04','온도','spark','supportive','steady','가까이 있을 때 체감되는 따뜻함과 긴장. 끌림이 편안한 감각으로 이어질 가능성을 본다.','분위기의 열기만으로 감정적 준비나 상호성을 판단하면 오독하기 쉽다.',[2,2,0,1,1,0,1,1,0],[0,0,0,0],['heat','sensuality','comfort']],
    ['O05','추격','spark','caution','fast','한쪽 또는 양쪽이 거리를 빠르게 좁히고 싶어 하는 적극적 욕구. 행동 전환이 빠르다.','속도 차이를 무시하면 압박감·경계 침범·승부욕으로 변할 수 있다.',[1,2,3,-1,-1,0,-1,0,0],[1,2,0,1],['pursuit','initiative','pressure_risk']],
    ['O06','잔불','spark','mixed','cyclical','끝난 줄 알았던 끌림이 약하게 남아 다시 살아날 여지가 있다. 재회·옛 인연에서 특히 강하다.','익숙함이나 미련을 실제 변화와 혼동하면 같은 패턴을 반복할 수 있다.',[1,1,0,0,0,0,0,0,2],[1,0,1,1],['ember','reunion','lingering_attraction']],

    ['O07','호흡','rhythm','supportive','matched','서로의 속도와 반응을 자연스럽게 읽고 맞추는 상태. 말하지 않아도 조율이 쉬운 편이다.','초반의 자연스러운 호흡이 모든 영역의 장기 궁합까지 보장하는 것은 아니다.',[1,1,0,1,2,1,2,2,1],[0,0,0,0],['breath','rhythm','attunement']],
    ['O08','파도','rhythm','mixed','variable','강약과 거리의 변화가 있는 리듬. 일정하지 않지만 서로 그 변화에 적응하면 지루하지 않다.','뜨거움과 식음이 반복되면 안정감보다 불안정성이 커질 수 있다.',[1,1,1,1,0,0,0,1,0],[0,0,0,2],['wave','variable_pace','cycles']],
    ['O09','동조','rhythm','supportive','matched','속도·완급·반응의 주고받음이 잘 맞는다. 서로 수정 요청을 받아들이기 쉬운 리듬형 궁합.','잘 맞는 리듬 때문에 다른 불편 신호를 과소평가하지 않는 것이 중요하다.',[1,1,1,2,2,2,3,3,1],[0,0,0,0],['synchrony','mutuality','matched_pace']],
    ['O10','엇박','rhythm','caution','variable','끌림은 있어도 원하는 속도나 반응 방식이 어긋나는 상태. 조율 가능성 자체는 남아 있다.','엇박을 참기만 하면 만족 저하와 피로가 누적된다. 누가 맞는지가 아니라 차이를 말해야 한다.',[1,1,1,-1,0,-1,-2,-2,0],[0,1,0,2],['offbeat','mismatch','pace_gap']],
    ['O11','멈춤','rhythm','mixed','blocked','지금은 속도를 늦추거나 잠시 중단해야 더 정확한 반응을 읽을 수 있다는 신호.','필요한 멈춤을 거절로 단정하거나, 반대로 장기 회피를 계속 “시간이 필요함”으로 포장할 수 있다.',[0,0,-2,0,1,0,0,0,0],[0,0,2,0],['pause','reset','slow_down']],
    ['O12','재점화','rhythm','mixed','cyclical','한 번 식었던 리듬이 다시 맞기 시작한다. 재회나 장기 관계에서 새로운 방식의 재시도가 가능하다.','예전과 똑같은 방식으로 다시 시작하면 잠깐의 열기 뒤에 같은 문제가 돌아올 수 있다.',[2,2,1,1,0,1,1,1,2],[0,0,0,2],['rekindle','reunion','new_rhythm']],

    ['O13','초대','desire','supportive','steady','상대의 반응을 확인하면서 친밀감을 제안하는 에너지. 강요보다 선택권을 남긴 접근에 가깝다.','간접 표현만 반복하면 상대가 의도를 알아차리지 못하거나 추측만 늘 수 있다.',[1,1,1,1,1,2,2,1,0],[0,0,0,0],['invitation','communication','choice']],
    ['O14','리드','desire','mixed','fast','한쪽이 방향과 템포를 분명하게 잡는 성향. 상대가 편안하게 동의하고 반응하면 장점이 된다.','리드가 통제나 일방 결정으로 바뀌면 상호성과 안전감이 빠르게 떨어진다.',[1,2,3,0,0,1,0,1,0],[0,2,0,0],['lead','initiative','control_check']],
    ['O15','수용','desire','supportive','slow','서두르지 않고 상대의 접근을 느끼며 받아들이는 방식. 편안함과 신뢰가 욕구를 열어 준다.','수용을 수동성이나 무조건적 동의로 잘못 읽으면 실제 의사 표현이 묻힐 수 있다.',[1,1,-1,3,2,1,2,2,1],[0,0,0,0],['receptivity','comfort','trust']],
    ['O16','탐색','desire','supportive','variable','서로 무엇을 좋아하고 불편해하는지 질문하고 시험해 보며 알아가는 호기심.','호기심이 상대의 경계를 시험하거나 반응을 평가하는 태도로 바뀌면 안전감이 깨진다.',[1,2,1,1,1,2,2,1,0],[0,1,0,0],['exploration','curiosity','communication']],
    ['O17','판타지','desire','mixed','variable','상상과 욕망의 이미지가 강한 카드. 말하지 않았던 취향이나 기대가 의식 위로 올라온다.','상상을 상대의 실제 욕구로 투사하거나, 상상 속 케미를 현실 궁합으로 착각할 수 있다.',[1,3,0,1,0,-1,0,1,0],[1,0,1,1],['fantasy','projection','hidden_desire']],
    ['O18','억눌림','desire','caution','blocked','욕구는 존재하지만 표현하지 못하거나 스스로 금지하고 있는 상태. 행동보다 긴장과 회피가 크다.','말하지 않은 욕구가 삐침·시험·과잉 반응으로 새어 나오면 관계가 더 복잡해진다.',[1,2,-3,-1,-1,-3,-1,-1,1],[1,0,3,1],['restraint','suppression','avoidance']],

    ['O19','문턱','boundary','mixed','slow','한 단계 더 가까워지기 전에 서로의 편안함과 선을 확인해야 하는 지점. 서두르지 않는 것이 핵심.','문턱을 넘는 것 자체를 목표로 삼으면 상대의 변화하는 의사를 놓치기 쉽다.',[0,1,0,1,2,2,1,0,0],[0,1,0,0],['threshold','boundary','check_in']],
    ['O20','신호','boundary','supportive','steady','좋다·싫다·더 천천히·멈추자 같은 반응을 읽고 표현하는 능력. 친밀감의 정확도를 높인다.','암묵적 신호만 믿고 명확한 의사 확인을 생략하면 오해가 생길 수 있다.',[0,0,0,1,2,3,2,1,0],[0,0,0,0],['signal','communication','feedback']],
    ['O21','명확한 합의','boundary','supportive','matched','서로 선택권을 가진 상태에서 원하는 것과 원하지 않는 것을 분명히 확인하는 카드.','이 카드는 현실의 동의를 “증명”하는 카드가 아니다. 카드가 좋아도 실제 동의는 매 순간 직접 확인해야 한다.',[0,1,0,2,3,3,3,2,1],[0,0,0,0],['consent_symbol','clarity','mutual_choice']],
    ['O22','거리','boundary','mixed','slow','가까워지기 위해 오히려 개인 공간과 속도를 존중할 필요가 있다. 건강한 거리 조절 가능성.','거리를 존중하는 것과 감정적 회피를 구분하지 못하면 관계가 정체될 수 있다.',[0,0,-1,0,2,1,1,0,1],[0,0,1,0],['space','autonomy','distance']],
    ['O23','압박','boundary','caution','fast','한쪽의 욕구나 속도가 상대에게 부담으로 느껴질 수 있는 상태. 즉시 속도 조절이 필요한 카드.','끌림이나 관계 유지 욕구를 이유로 불편함을 무시하면 상호성과 안전감이 무너진다.',[1,2,2,-3,-3,-2,-3,-2,-1],[1,3,0,2],['pressure','boundary_risk','slow_down']],
    ['O24','회복','boundary','supportive','slow','불편함이나 엇갈림 뒤에 사과·설명·속도 재조율을 통해 안전감을 복구하는 과정.','말로만 회복을 약속하고 행동 패턴이 바뀌지 않으면 같은 손상이 반복된다.',[0,0,0,1,3,3,2,1,2],[0,0,0,0],['repair','aftercare','trust_rebuild']],

    ['O25','포옹','bond','supportive','steady','친밀감 뒤에도 정서적으로 가까이 있고 싶은 욕구. 몸과 감정의 연결이 편안하게 이어진다.','정서적 위안을 위해 상대에게 과하게 의존하면 개인의 욕구 구분이 흐려질 수 있다.',[1,1,0,2,3,1,2,2,3],[1,0,0,0],['embrace','aftercare','closeness']],
    ['O26','신뢰','bond','supportive','slow','취약한 부분을 보여도 존중받을 거라는 믿음. 깊은 친밀감을 오래 유지시키는 기반.','신뢰를 이미 확보했다고 가정해 새로운 경계나 변화한 욕구 확인을 생략하면 안 된다.',[1,1,0,2,3,2,3,2,3],[0,0,0,0],['trust','safety','deep_bond']],
    ['O27','취약함','bond','mixed','slow','욕구·불안·콤플렉스처럼 숨기고 싶은 부분을 조심스럽게 드러내는 상태.','거절 두려움 때문에 상대 반응을 시험하거나 지나치게 방어적으로 변할 수 있다.',[0,1,-1,2,1,2,1,1,3],[0,0,2,1],['vulnerability','openness','fear_of_rejection']],
    ['O28','애착','bond','mixed','steady','신체적 친밀감이 정서적 유대와 강하게 연결된다. 가까워진 뒤 감정이 더 깊어지기 쉽다.','애착의 강도를 궁합의 질로 착각하면 불만족한 관계도 놓지 못할 수 있다.',[1,1,0,1,1,1,1,1,3],[2,0,1,0],['attachment','bonding','emotional_link']],
    ['O29','소유','bond','caution','fast','상대를 특별하게 독점하고 싶다는 욕구가 강해지는 카드. 강한 끌림과 불안이 함께 있을 수 있다.','질투·감시·통제는 애정이나 열정의 증거가 아니다. 경계 위험과 집착을 우선 점검해야 한다.',[1,2,2,-1,-2,-1,-2,0,2],[3,3,0,2],['possession','jealousy','obsession']],
    ['O30','독립','bond','supportive','steady','친밀해도 각자의 생활과 선택권을 유지하는 건강한 자율성. 의존 없이 가까울 수 있다.','독립을 이유로 감정적 책임과 소통을 피하면 사실상 거리두기가 될 수 있다.',[0,0,0,0,2,1,1,1,1],[0,0,1,0],['autonomy','independence','healthy_space']],

    ['O31','여운','afterglow','supportive','steady','친밀감 이후에도 만족감과 정서적 따뜻함이 남는다. 경험이 관계의 유대를 강화한다.','좋았던 여운 하나로 반복되는 구조적 문제를 덮어서는 안 된다.',[1,1,0,2,2,1,2,3,3],[0,0,0,0],['afterglow','satisfaction','bonding']],
    ['O32','안도','afterglow','supportive','slow','긴장이 풀리고 안전하다고 느끼는 상태. 관계 후 감정이 차분해지고 편안함이 남는다.','갈등을 피한 안도감과 실제 만족·친밀감을 혼동하지 않는 것이 중요하다.',[0,0,0,1,3,1,2,2,2],[0,0,0,0],['relief','safety','calm']],
    ['O33','공허','afterglow','caution','slow','신체적 접촉이나 끌림 뒤에 정서적으로 비어 있거나 멀어진 느낌. 만족과 애착이 연결되지 않는다.','공허함을 다시 강한 자극으로 메우려 하면 반복과 집착이 심해질 수 있다.',[1,1,0,-1,-2,-1,-2,-3,-2],[1,0,2,1],['hollow','disconnect','low_aftercare']],
    ['O34','반복','afterglow','caution','cyclical','익숙한 친밀감 패턴이 계속 재연되는 카드. 좋은 반복인지 소모적 반복인지 결과를 비교해야 한다.','끊기 어려운 패턴을 “케미가 강해서”라고 합리화하면 집착과 불안정성이 커진다.',[1,1,1,0,-1,-1,-1,0,2],[2,1,1,3],['loop','repetition','pattern']],
    ['O35','재회','afterglow','mixed','cyclical','과거의 친밀감과 애착이 다시 관계를 당기는 힘. 재접촉 뒤 새로운 방식으로 연결될 가능성.','육체적 친밀감이 관계 문제 해결을 대신하면 잠깐 가까워진 뒤 과거 갈등이 그대로 돌아올 수 있다.',[1,2,1,1,0,1,0,1,3],[1,0,1,2],['reunion','return','past_bond']],
    ['O36','통합','afterglow','supportive','matched','끌림·리듬·안전감·소통·정서적 유대가 서로 따로 놀지 않고 하나의 관계 경험으로 연결되는 상태.','완벽한 궁합을 뜻하지 않는다. 차이를 계속 조율할 수 있는 능력이 있다는 쪽에 가깝다.',[2,2,1,2,3,3,3,3,3],[0,0,0,0],['integration','whole_connection','mutual_fit']]
  ];

  const CARDS = Object.freeze(Object.fromEntries(ROWS.map(row => {
    const item = makeCard(...row);
    return [item.code, item];
  })));

  const COMBINATION_RULES = Object.freeze([
    Object.freeze({id:'attraction_boundary_conflict',priority:100,tone:'caution',description:'강한 끌림과 낮은 안전성/높은 경계 위험을 동시에 보존한다. 평균내서 “보통 궁합”으로 만들지 않는다.'}),
    Object.freeze({id:'magnetic_but_compulsive',priority:95,tone:'caution',description:'끌림·욕구가 강하면서 obsession 위험이 겹치면 “강렬함 ≠ 좋은 궁합”으로 판정한다.'}),
    Object.freeze({id:'desire_blocked',priority:90,tone:'mixed',description:'욕구는 높지만 initiative/communication이 낮거나 avoidance가 높으면 “욕구 존재 + 표현/행동 차단”으로 읽는다.'}),
    Object.freeze({id:'rhythm_mismatch',priority:85,tone:'mixed',description:'끌림과 애착이 좋아도 pace와 mutuality/satisfaction이 어긋나면 리듬 문제를 별도로 남긴다.'}),
    Object.freeze({id:'attachment_without_satisfaction',priority:80,tone:'caution',description:'attachment가 높고 satisfaction이 낮으면 “놓기 어려움”과 “잘 맞음”을 구분한다.'}),
    Object.freeze({id:'reunion_repeat_risk',priority:75,tone:'caution',description:'재회/반복 태그와 instability·obsession 위험이 겹치면 과거 패턴 반복 여부를 우선 점검한다.'}),
    Object.freeze({id:'repair_capacity',priority:70,tone:'supportive',description:'기존 위험이 있어도 emotionalSafety·communication·mutuality가 함께 높으면 조율·회복 능력을 별도 강점으로 본다.'}),
    Object.freeze({id:'mutual_fit',priority:60,tone:'supportive',description:'attraction/desire뿐 아니라 emotionalSafety·communication·mutuality·satisfaction이 함께 지지될 때만 전반적 속궁합 강점으로 본다.'})
  ]);

  function getCard(code){return CARDS[String(code||'').toUpperCase()]||null}
  function getTarotMeta(code){try{return W.LUNEA_INTIMACY_V34?.getCard?.(code)||null}catch{return null}}
  function paceRelation(a,b){if(!a||!b)return'unknown';if(a===b||a==='matched'||b==='matched')return'aligned';if(a==='blocked'||b==='blocked')return'blocked';if(a==='variable'||b==='variable'||a==='cyclical'||b==='cyclical')return'variable';if((a==='fast'&&b==='slow')||(a==='slow'&&b==='fast'))return'mismatch';return'adjustable'}
  function axisSignal(tarot,oracle,key){const t=Number(tarot?.axes?.[key]||0),o=Number(oracle?.axes?.[key]||0);if(t>=2&&o>=2)return'reinforced_positive';if(t<=-2&&o<=-2)return'reinforced_negative';if((t>=2&&o<=-2)||(t<=-2&&o>=2))return'conflict';if(t>0||o>0)return'positive';if(t<0||o<0)return'negative';return'neutral'}
  function riskLevel(tarot,oracle,key){const t=Number(tarot?.risks?.[key]||0),o=Number(oracle?.risks?.[key]||0);if(Math.max(t,o)>=3||t+o>=4)return'high';if(Math.max(t,o)>=2||t+o>=2)return'medium';return'low'}
  function hasTag(card,tag){return!!card?.tags?.includes?.(tag)}

  function evaluateRules(tarot,oracle,context={}){
    const hits=[];const axis=key=>axisSignal(tarot,oracle,key),risk=key=>riskLevel(tarot,oracle,key),tAxis=key=>Number(tarot?.axes?.[key]||0),oAxis=key=>Number(oracle?.axes?.[key]||0);
    const attractionHigh=Math.max(tAxis('attraction'),oAxis('attraction'))>=2,desireHigh=Math.max(tAxis('desire'),oAxis('desire'))>=2,safetyLow=Math.min(tAxis('emotionalSafety'),oAxis('emotionalSafety'))<=-2,mutualLow=Math.min(tAxis('mutuality'),oAxis('mutuality'))<=-2,satisfactionLow=Math.min(tAxis('satisfaction'),oAxis('satisfaction'))<=-2,attachmentHigh=Math.max(tAxis('attachment'),oAxis('attachment'))>=2,communicationLow=Math.min(tAxis('communication'),oAxis('communication'))<=-2,initiativeLow=Math.min(tAxis('initiative'),oAxis('initiative'))<=-2,pace=paceRelation(tarot?.pace,oracle?.pace);
    if((attractionHigh||desireHigh)&&(safetyLow||mutualLow||risk('boundary')==='high'))hits.push('attraction_boundary_conflict');
    if((attractionHigh||desireHigh)&&risk('obsession')==='high')hits.push('magnetic_but_compulsive');
    if(desireHigh&&(initiativeLow||communicationLow||risk('avoidance')==='high'))hits.push('desire_blocked');
    if(pace==='mismatch'||(attractionHigh&&axis('mutuality')==='conflict')||satisfactionLow)hits.push('rhythm_mismatch');
    if(attachmentHigh&&satisfactionLow)hits.push('attachment_without_satisfaction');
    const reunionContext=context?.mode==='reunion'||hasTag(oracle,'reunion')||hasTag(oracle,'loop')||hasTag(oracle,'repetition');
    if(reunionContext&&(risk('instability')!=='low'||risk('obsession')!=='low'))hits.push('reunion_repeat_risk');
    if(['emotionalSafety','communication','mutuality'].every(key=>Math.max(tAxis(key),oAxis(key))>=2)&&risk('boundary')!=='high')hits.push('repair_capacity');
    const mutualFit=['emotionalSafety','communication','mutuality','satisfaction'].every(key=>Math.max(tAxis(key),oAxis(key))>=2);
    if((attractionHigh||desireHigh)&&mutualFit&&risk('boundary')==='low'&&risk('obsession')!=='high')hits.push('mutual_fit');
    const byId=new Map(COMBINATION_RULES.map(rule=>[rule.id,rule]));return hits.map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>b.priority-a.priority)
  }

  function combinePair(tarotCode,oracleCode,context={}){
    const tarot=typeof tarotCode==='object'?tarotCode:getTarotMeta(tarotCode),oracle=typeof oracleCode==='object'?oracleCode:getCard(oracleCode);if(!tarot||!oracle)return null;
    const axes=Object.freeze(Object.fromEntries(AXES.map(key=>[key,Object.freeze({tarot:Number(tarot.axes?.[key]||0),oracle:Number(oracle.axes?.[key]||0),signal:axisSignal(tarot,oracle,key)})]))),risks=Object.freeze(Object.fromEntries(RISKS.map(key=>[key,Object.freeze({tarot:Number(tarot.risks?.[key]||0),oracle:Number(oracle.risks?.[key]||0),level:riskLevel(tarot,oracle,key)})]))),rules=Object.freeze(evaluateRules(tarot,oracle,context));
    return Object.freeze({tarotCode:String(tarotCode?.code||tarotCode||''),oracleCode:oracle.code,oracleTitle:oracle.title,oracleFamily:oracle.family,pace:Object.freeze({tarot:tarot.pace||'steady',oracle:oracle.pace,relation:paceRelation(tarot.pace,oracle.pace)}),axes,risks,rules,principle:'Tarot is the core symbolic state; Oracle is a lens/modifier. Contradictions are preserved, not averaged.'})
  }

  function combineOracleCards(codes=[]){
    const cards=codes.map(code=>typeof code==='object'?code:getCard(code)).filter(Boolean).slice(0,3),families=cards.map(card=>card.family),repeatedFamilies=[...new Set(families.filter((family,index)=>families.indexOf(family)!==index))],caution=cards.some(card=>card.tone==='caution');
    return Object.freeze({cards:Object.freeze(cards),repeatedFamilies:Object.freeze(repeatedFamilies),familyRule:repeatedFamilies.length?'같은 계열이 반복되면 해당 주제가 강화된다. 다른 계열의 반대 신호를 지우지는 않는다.':'서로 다른 계열은 각각 별도 차원으로 병렬 해석한다.',cautionRule:caution?'경고 카드가 포함되면 긍정 카드가 있어도 경계·안전·불안정 신호를 삭제하지 않는다.':'긍정 신호는 상호성·안전감·소통과 함께 확인될 때 강화한다.'})
  }

  function promptContract(){return`[LUNEA INTIMACY ORACLE · V${RELEASE}]
- Tarot = 핵심 상태/에너지, Oracle = 그 에너지가 친밀감에서 어떤 방식으로 작동하는지 보여주는 보조 렌즈다.
- 해석 우선순위는 스프레드 포지션 > Tarot > Oracle > 선택적 점성 보조다.
- 서로 모순되는 신호는 평균내지 않는다. 예: 강한 attraction + 높은 boundary risk = "강한 끌림 + 낮은 안전성"으로 병기한다.
- attachment와 satisfaction을 분리한다. 놓기 어려운 관계가 좋은 속궁합을 뜻하지 않는다.
- obsession/possession/pressure 신호는 로맨틱한 열정으로 미화하지 않는다.
- Oracle의 "명확한 합의" 카드도 현실의 동의를 증명하지 않는다. 실제 동의는 현실에서 직접 확인한다.
- 카드로 실제 신체 크기·성기능·질환·임신·성병 여부를 판단하지 않는다.
- 내부 축/위험 값은 추론용이며 사용자에게 임의의 퍼센트나 점수로 변환하지 않는다.`}

  W.LUNEA_INTIMACY_ORACLE_V35=Object.freeze({version:RELEASE,axes:AXES,risks:RISKS,families:FAMILIES,cards:CARDS,rules:COMBINATION_RULES,getCard,paceRelation,combinePair,combineOracleCards,promptContract});
  console.info(`🌹 LUNEA INTIMACY ORACLE V${RELEASE} data ready · 36 cards / 6 families / rule engine`);
})();
