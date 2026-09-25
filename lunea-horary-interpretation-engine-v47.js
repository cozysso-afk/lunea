'use strict';

/*
  LUNEA HORARY INTERPRETATION ENGINE V47 · V2
  =============================================
  Interpretation-only authority layer. It does NOT recalculate the chart.

  Goals:
  - Keep deterministic Horary calculations authoritative.
  - Route interpretation by question family before prose generation.
  - Separate intention/reception from actual event/perfection.
  - Separate direct, derived-event and indirect perfection.
  - Treat confirmed obstruction/refranation differently from mere candidates.
  - Prevent invented timing, invented aspects, invented houses and false precision.
  - Keep Prashna independent and cross-check only after Horary is read.
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_INTERPRETATION_V47__) return;
  W.__LUNEA_HORARY_INTERPRETATION_V47__ = true;

  const RELEASE = '47.0';
  const $ = id => document.getElementById(id);
  const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function currentQuestion() {
    return clean($('astroHoraryQuestion')?.value || '');
  }

  function currentTopic() {
    return String($('astroHoraryTopic')?.value || 'general').trim().toLowerCase();
  }

  function resultText() {
    const node = $('astroHoraryResult');
    if (!node?.classList?.contains('show')) return '';
    return String(node.innerText || node.textContent || '').trim();
  }

  function prashnaText() {
    const block = String(W.LUNEA_PRASHNA_V1?.promptBlock?.() || '').trim();
    return block;
  }

  function questionMode(question = currentQuestion()) {
    try {
      const row = W.LUNEA_HORARY_HARDENING_V38?.effectiveMode?.(question);
      if (row?.key) return row.key;
    } catch {}
    try {
      const row = W.LUNEA_HORARY_QUESTION_MODES_V37?.classifyQuestion?.(question);
      if (row?.key) return row.key;
    } catch {}
    return 'outcome';
  }

  function classifyFamily(question = currentQuestion(), topic = currentTopic(), mode = questionMode(question)) {
    const q = clean(question);
    if (mode === 'location') return {key:'location', label:'위치·행방', mode};
    if (mode === 'descriptive') return {key:'descriptive', label:'상태·감정·묘사', mode};
    if (mode === 'comparison') return {key:'comparison', label:'선택지·비교', mode};
    if (mode === 'multi_person') return {key:'multi_person', label:'다중 인물 보호', mode};

    if (topic === 'contact' || /(연락|답장|메시지|문자|카톡|전화|DM|디엠|먼저\s*(?:연락|말)|소식)/i.test(q)) {
      return {key:'contact', label:'연락·메시지', mode};
    }
    if (topic === 'reconciliation' || /(재회|다시\s*(?:만나|사귀)|돌아오|관계\s*회복|화해)/i.test(q)) {
      return {key:'reconciliation', label:'재회·관계 회복', mode};
    }
    if (topic === 'relationship' || /(연애|사귀|썸|관계|결혼|헤어|이별|상대(?:방)?\s*(?:마음|감정))/i.test(q)) {
      return {key:'relationship', label:'관계·연애', mode};
    }
    if (topic === 'exam' || /(시험|합격|불합격|성적|면접|자격증|입시)/i.test(q)) {
      return {key:'exam', label:'시험·합격', mode};
    }
    if (topic === 'career' || /(취업|이직|직장|회사|승진|채용|진로|프로젝트|계약)/i.test(q)) {
      return {key:'career', label:'직업·업무', mode};
    }
    if (topic === 'stock' || topic === 'money' || /(주식|매수|매도|익절|손절|투자|수익|금전|돈|대출)/i.test(q)) {
      return {key:'money', label:'금전·투자', mode};
    }
    if (mode === 'timing') return {key:'timing', label:'시기·전개', mode};
    return {key:'general', label:'일반 성사·결과', mode};
  }

  function familyPolicy(family) {
    const common = [
      '엔진이 표시한 질문자/상대/사건 시그니피케이터와 파생하우스 라우팅을 최우선으로 사용한다.',
      '엔진이 특정 파생하우스를 제공하지 않았다면 새 하우스나 주인행성을 즉석에서 만들지 않는다.'
    ];

    const policies = {
      contact: [
        '연락 질문의 핵심은 “마음”과 “실제 연락 행동”을 분리하는 것이다.',
        '기본 전통 라우팅은 질문자=1H, 상대=7H, 상대의 연락행위=상대의 3H=radical 9H다. 단, 화면/엔진에 다른 명시적 라우팅이 있으면 엔진 라우팅을 우선한다.',
        '7H 주인행성의 reception/dignity는 상대의 수용성·의향·상태 근거다. 이것만으로 실제 연락이 온다고 결론내리지 않는다.',
        '실제 연락 행동은 엔진의 quesited↔event / derived event axis, 유효 perfection, 또는 확정 Translation/Collection 같은 사건 연결 근거로 판정한다.',
        '질문이 “먼저 연락”이라면 상대 쪽 사건축이 움직이는 근거가 있는지 별도로 말한다. 질문자 쪽 의지만으로 상대의 선행 행동을 만들지 않는다.'
      ],
      reconciliation: [
        '재회는 1H↔7H 관계 성사축을 중심으로 읽고, 연락 자체와 재회 성사를 같은 사건으로 취급하지 않는다.',
        'reception은 서로의 수용성·감정·의향을 설명하지만 직접/간접 perfection을 대체하지 않는다.',
        '연락 이벤트 축이 살아 있어도 재회축이 약하면 “연락 가능성”과 “관계 회복 가능성”을 분리해 쓴다.'
      ],
      relationship: [
        '관계 질문은 1H↔7H를 주축으로 읽고, 감정·호감은 reception/상태, 관계의 실제 진전은 perfection/사건축으로 분리한다.',
        '5H 등 보조하우스는 엔진이 실제로 라우팅했을 때만 사용한다.'
      ],
      career: [
        '직업·업무 질문은 엔진이 선택한 직업/고용/상대 기관 축을 그대로 따른다.',
        '좋은 dignity나 reception은 조건·평가의 우호성이고, 실제 채용/계약/승인은 perfection 또는 사건축 근거와 분리한다.'
      ],
      exam: [
        '시험·합격 질문은 엔진의 시험/판정 사건축을 따른다.',
        '학업 상태나 능력 표시와 “합격이라는 사건 성사”를 구분한다. 능력 근거만으로 합격을 확정하지 않는다.'
      ],
      money: [
        '금전·투자 질문은 엔진이 지정한 소유/상대 자금/거래 사건축을 따른다.',
        '가격 방향이나 수익률을 차트에 없는 숫자로 만들지 않는다. 실제 거래 성사와 기대감·조건을 분리한다.'
      ],
      timing: [
        '시기 질문은 유효 applying perfection, Moon의 다음 적용각, sign ingress, angularity 등 엔진이 실제 제공한 타이밍 근거만 사용한다.',
        '각도 차이를 임의로 일/주/달로 환산하지 않는다. 엔진이 단위/후보시각을 제공하지 않으면 “빠름/중간/지연” 수준으로 제한한다.'
      ],
      location: [
        '위치·행방 질문은 성사/불성사 YES/NO보다 엔진의 대상 시그니피케이터, 별자리·원소·하우스·방향/환경 단서를 우선한다.',
        '찾을 수 있다는 결론과 물리적 위치 단서를 섞지 않는다.'
      ],
      descriptive: [
        '상태·감정·인상 질문은 dignity, house condition, reception을 중심으로 읽고 perfection을 억지로 YES/NO 결론으로 쓰지 않는다.',
        '감정·생각을 단정적 심리묘사로 확대하지 말고 차트가 보여주는 수용성/거리감/상태 수준으로 제한한다.'
      ],
      comparison: [
        '비교 질문은 엔진이 제공한 동일 기준으로 후보를 나란히 읽는다. 임의로 서로 다른 하우스를 배정해 공정하지 않은 비교를 만들지 않는다.'
      ],
      multi_person: [
        '다중 인물 질문은 엔진의 보호 모드를 존중한다. 임의로 A=7H, B=5H처럼 사람을 갈라 배정하지 않는다.'
      ],
      general: [
        '일반 성사 질문은 엔진의 direct/derived/indirect perfection과 reception, Moon, 방해 패턴의 계층을 그대로 따른다.'
      ]
    };
    return [...common, ...(policies[family.key] || policies.general)];
  }

  function evidenceHierarchy() {
    return [
      '0. 엔진의 authoritative/staged judgment가 있으면 그것을 가장 먼저 따른다. AI가 자체 점수로 재판정하지 않는다.',
      '1. 유효 direct perfection = 실제 사건 성사의 가장 강한 1차 근거. 단순 geometric aspect나 out-of-orb 각은 승격 금지.',
      '2. 질문에 필요한 derived event axis의 유효 perfection = 해당 사건(예: 연락·계약)의 직접 행동 근거. 관계 자체의 성사와는 분리할 수 있다.',
      '3. confirmed Translation of Light / Collection of Light = 간접 성사 근거. 직접 perfection보다 한 단계 낮게 설명한다.',
      '4. confirmed prohibition / frustration / refranation = 위 성사 경로를 실제로 끊거나 약화하는 반증. “잠재 후보”를 확정 방해처럼 쓰지 않는다.',
      '5. Reception = 의향·수용성·관계적 태도. 강한 reception도 perfection을 자동 대체하지 않는다.',
      '6. Essential/accidental dignity, retrograde, combustion 등 = 행동 능력·상태·조건. 이것만으로 사건 발생을 확정하지 않는다.',
      '7. Moon course = 사건의 순서·전개·보조 타이밍. Moon 하나만으로 다른 핵심축을 덮어쓰지 않는다.',
      '8. Early/Late ASC, 7H Saturn 등의 considerations = 신뢰도/해석 주의사항. 차트를 자동 무효화하지 않는다.'
    ];
  }

  function timingContract() {
    return [
      '정확각(exact aspect) 시각은 점성술적 후보이며 현실 사건 발생 보장시각이 아니다.',
      '엔진이 valid perfection이 아니라고 한 각에서 현실 날짜를 만들지 않는다.',
      '엔진에 없는 “3도니까 3일/3주” 같은 단위 변환을 발명하지 않는다.',
      '시기 근거가 여러 개 충돌하면 단일 날짜로 합치지 말고 범위와 불확실성을 그대로 쓴다.'
    ];
  }

  function outputContract(family, hasPrashna) {
    if (family.key === 'location') {
      return `### 질문 유형·판독축\n### 위치 핵심 단서\n### 대상 상태와 회수 가능성\n### Moon과 전개\n### 반증·제한\n${hasPrashna ? '### Horary ↔ Prashna 교차\n' : ''}### 신뢰도와 불확실성`;
    }
    if (family.key === 'descriptive') {
      return `### 질문 유형·판독축\n### 한줄 요약\n### 상태·감정·수용성\n### 행동으로 이어질 근거가 있는지\n### Moon과 변화\n### 반증·제한\n${hasPrashna ? '### Horary ↔ Prashna 교차\n' : ''}### 신뢰도와 불확실성`;
    }
    if (family.key === 'comparison') {
      return `### 질문 유형·판독축\n### 비교 기준\n### 후보별 근거\n### 공통 반증·제한\n${hasPrashna ? '### Horary ↔ Prashna 교차\n' : ''}### 신뢰도와 불확실성`;
    }
    return `### 질문 유형·판독축\n### 한줄 결론\n### 실제 성사·행동 근거\n### 의향·감정·수용성\n### Moon과 전개·시기\n### 방해·반증 근거\n${hasPrashna ? '### Horary ↔ Prashna 교차\n' : ''}### 신뢰도와 불확실성`;
  }

  function aiPrompt() {
    const result = resultText();
    if (!result) return '';
    const question = currentQuestion();
    const topic = currentTopic();
    const mode = questionMode(question);
    const family = classifyFamily(question, topic, mode);
    const prashna = prashnaText();
    const familyRules = familyPolicy(family).map((row, index) => `${index + 1}. ${row}`).join('\n');
    const hierarchy = evidenceHierarchy().join('\n');
    const timing = timingContract().map((row, index) => `${index + 1}. ${row}`).join('\n');

    return `당신은 LUNEA HORARY INTERPRETATION ENGINE V2다.\n` +
`아래의 Horary 계산값은 결정론적 엔진이 확정한 데이터다. 당신의 역할은 “재계산”이 아니라 “규칙에 맞는 해설”뿐이다.\n\n` +
`[질문 원문]\n${question}\n\n` +
`[질문 분류]\n- family: ${family.key} · ${family.label}\n- mode: ${mode}\n- topic: ${topic}\n\n` +
`[HORARY ENGINE RESULT · AUTHORITATIVE]\n${result}\n\n` +
`${prashna ? `${prashna}\n\n` : ''}` +
`[절대 금지]\n` +
`- 화면/엔진에 없는 행성 위치, 하우스, aspect, reception, dignity, 날짜, 점수, 확률을 만들지 마라.\n` +
`- nearest geometric aspect를 valid perfection으로 바꾸지 마라.\n` +
`- reception을 실제 사건 발생과 동일시하지 마라.\n` +
`- 잠재 개입 후보를 confirmed prohibition/frustration으로 승격하지 마라.\n` +
`- exact aspect를 현실 사건 확정시각이라고 쓰지 마라.\n` +
`- Prashna가 있어도 Horary와 수치 합산하거나 Horary 결론을 덮어쓰지 마라.\n` +
`- 엔진의 staged/authoritative 판단과 반대되는 결론을 만들려면 안 된다. 데이터가 부족하면 “판정 근거 부족/애매”라고 써라.\n\n` +
`[질문 유형별 판독 규칙]\n${familyRules}\n\n` +
`[증거 계층]\n${hierarchy}\n\n` +
`[시기 해석 계약]\n${timing}\n\n` +
`[의도와 행동 분리]\n` +
`- “마음/호감/수용성”은 reception·상태 근거로만 설명한다.\n` +
`- “실제로 연락함/만남/합격/계약/재회함”은 perfection·event axis·confirmed indirect perfection 같은 사건 근거로 설명한다.\n` +
`- 마음은 긍정인데 행동근거가 약하면 그 모순을 그대로 쓴다. 행동근거는 있는데 reception이 약하면 “행동 가능성은 있으나 정서적 동기/지속성은 약할 수 있음”처럼 분리한다.\n\n` +
`[근거 표기]\n` +
`각 핵심 판단에는 바로 뒤에 “근거:”를 붙여 화면에 실제 있는 엔진 라벨/문구를 짧게 적어라. 없는 근거를 보충하지 마라.\n\n` +
`${prashna ? `[Horary ↔ Prashna 교차]\nHorary를 먼저 독립적으로 결론낸 뒤 Prashna를 별도로 요약한다. 방향이 같으면 “교차 보조”, 다르면 “체계 간 충돌”이라고 쓰고 왜 다른지 근거를 분리한다.\n\n` : ''}` +
`[출력 형식]\n${outputContract(family, !!prashna)}\n\n` +
`문장은 한국어로 간결하게 쓴다. 전문용어 뒤에는 짧은 쉬운 설명을 붙인다. 최종 결론은 질문 원문에 직접 답하되, 근거가 약하면 단정하지 않는다.`;
  }

  W.LUNEA_HORARY_INTERPRETATION_V47 = Object.freeze({
    version: RELEASE,
    aiPrompt,
    classifyFamily,
    familyPolicy,
    evidenceHierarchy,
    timingContract,
    questionMode
  });

  console.info('✦ LUNEA Horary Interpretation Engine V47 · V2 active');
})();
