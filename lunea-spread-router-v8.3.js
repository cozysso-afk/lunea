'use strict';

/*
  LUNEA SPREAD ROUTER V8.3 — DEEP 22 + TIMING COMPAT + LOW-LAG
  ------------------------------------------------
  목적
  - V7.4의 키워드 우선 라우팅 위에 "질문 구조 → 대상 수/관계 → 요구축 → 주제" 우선 레이어를 추가
  - 비교 질문에서 choice / memory / cause 오분류 방지
  - A/B 또는 다중 대상 비교 시 동일 축 대칭 배열 강제
  - "몇 명인지도"처럼 대상 수 자체가 미정인 과거 인연 질문 별도 처리
  - 기존 RNG / 저장함 / Timing Oracle / Profile / fixed spread는 건드리지 않음

  설치 순서
  spread-engine-v7.4.js
  timing-oracle-v1.js
  general-5-6-v1.js (사용 중이면)
  lunea-spread-router-v8.3.js  <-- 가장 뒤

  기본 배열 상한: 12장
  심층 A/B 대칭 비교만 요구축 수에 따라 최대 22장까지 자동 확장한다.
  별도의 window.LUNEA_MAX_CUSTOM_CARDS = 22 설정은 필요하지 않다.
  RNG / 저장함 / Timing Oracle / 기존 고정 배열은 변경하지 않는다.
*/
(() => {
  const W = window;

  // V8.1 SAFE BOOT
  // spread-engine-v7.4.js is a loader bridge that injects the real engine later.
  // Therefore this router must wait until V7.4 has actually finished loading.
  if (W.__LUNEA_SPREAD_ROUTER_V83_BOOTSTRAP__) return;
  W.__LUNEA_SPREAD_ROUTER_V83_BOOTSTRAP__ = true;

  const BOOT_STARTED_AT = Date.now();
  const BOOT_TIMEOUT_MS = 15000;
  const BOOT_RETRY_MS = 25;

  function engineReady() {
    return !!W.LUNEA_SPREAD_ENGINE_V74
      && typeof W.designSpread === 'function'
      && typeof W.readingDirective === 'function'
      && typeof W.analyzeQuestionIntent === 'function';
  }

  function initRouterV83() {
    if (W.__LUNEA_SPREAD_ROUTER_V8__) return true;
    if (!engineReady()) return false;

    // Set the final guard only AFTER the real V7.4 engine is ready.
    W.__LUNEA_SPREAD_ROUTER_V8__ = true;

    const previous = {
      designSpread: W.designSpread,
      readingDirective: W.readingDirective,
      analyzeQuestionIntent: W.analyzeQuestionIntent
    };

  const ROUTER_MEMORY_KEY = 'LUNEA_ROUTER_V8_TRACE';
  const DEFAULT_MAX_CARDS = 12;
  const DEEP_COMPARE_MAX_CARDS = 22;
  const DEEP_COMPARE_MIN_AXES = 7;

  const AXES = {
    past_relationship: {
      id: 'past_relationship',
      label: '과거 관계의 형태와 핵심 성격',
      temporal: 'past',
      patterns: [
        /과거.{0,12}(어떤|무슨).{0,6}관계/,
        /어떤\s*관계였/,
        /과거\s*관계/,
        /관계의?\s*본질/
      ]
    },
    relationship_atmosphere: {
      id: 'relationship_atmosphere',
      label: '당시 관계의 분위기',
      temporal: 'past',
      patterns: [
        /당시.{0,10}분위기/,
        /관계의?\s*분위기/,
        /어떤\s*분위기였/
      ]
    },
    breakup_reason: {
      id: 'breakup_reason',
      label: '관계가 끝나거나 멀어진 핵심 이유',
      temporal: 'past',
      patterns: [
        /끝난\s*(이유|원인)/,
        /헤어진\s*(이유|원인)/,
        /멀어진\s*(이유|원인)/,
        /단절.{0,5}(이유|원인)/,
        /왜.{0,8}(끝|헤어|멀어)/
      ]
    },
    personality: {
      id: 'personality',
      label: '상대의 성격과 기본 성향',
      temporal: 'trait',
      patterns: [/성격/, /성향/, /어떤\s*사람/]
    },
    love_style: {
      id: 'love_style',
      label: '상대의 연애 방식과 관계 습관',
      temporal: 'trait',
      patterns: [/연애\s*(방식|스타일|패턴|성향)/, /관계\s*방식/]
    },
    past_attitude: {
      id: 'past_attitude',
      label: '당시 질문자를 대했던 태도',
      temporal: 'past',
      patterns: [
        /나를.{0,8}대했/,
        /질문자.{0,8}대했/,
        /대했던.{0,5}태도/,
        /당시.{0,8}태도/
      ]
    },
    current_feeling: {
      id: 'current_feeling',
      label: '현재 남아 있는 감정',
      temporal: 'current',
      patterns: [
        /현재.{0,8}(감정|마음|미련|그리움)/,
        /지금.{0,8}(감정|마음|미련|그리움)/
      ]
    },
    recall_reason: {
      id: 'recall_reason',
      label: '현재 다시 떠올리게 되는 이유',
      temporal: 'current',
      patterns: [
        /떠올리.{0,8}(이유|왜)/,
        /다시.{0,5}떠올/,
        /생각나.{0,8}(이유|왜)/,
        /다시.{0,5}생각/
      ]
    },
    return_motivation: {
      id: 'return_motivation',
      label: '다시 다가오려는 동기와 목적',
      temporal: 'current_future',
      patterns: [
        /다가오.{0,8}(이유|동기|왜)/,
        /왜.{0,16}(?:다시\s*)?(?:내게|나에게)?\s*(?:다가|접근|돌아)/,
        /다시.{0,8}(다가|접근|돌아).{0,8}(이유|동기|왜)/,
        /접근.{0,8}(이유|동기|목적)/,
        /재접근.{0,8}(이유|동기|목적)/
      ]
    },
    approach_style: {
      id: 'approach_style',
      label: '실제로 접근한다면 보일 방식',
      temporal: 'user_future',
      patterns: [
        /접근\s*(방식|스타일)/,
        /다가오.{0,5}(방식|방법)/,
        /어떻게.{0,8}(다가|접근|연락)/,
        /행동\s*방식/
      ]
    },
    action_likelihood: {
      id: 'action_likelihood',
      label: '지정 기간 안 실제 행동으로 옮길 가능성',
      temporal: 'user_future',
      patterns: [
        /실제로.{0,8}(움직|행동|연락)/,
        /(움직|행동|연락).{0,8}가능성/,
        /누가.{0,8}더.{0,8}(움직|행동|연락)/,
        /나타날\s*(?:가능성|수\s*있)/
      ]
    },
    reconnection_potential: {
      id: 'reconnection_potential',
      label: '다시 연결될 경우 관계가 이어질 가능성',
      temporal: 'conditional_future',
      patterns: [
        /관계.{0,8}다시.{0,8}이어/,
        /다시.{0,8}이어질\s*가능성/,
        /재연결.{0,8}가능성/,
        /재회.{0,8}(가능성|발전|지속)/,
        /관계.{0,8}(발전|지속).{0,8}가능성/
      ]
    },
    distinguishing_features: {
      id: 'distinguishing_features',
      label: '서로 구별되는 특징과 식별 단서',
      temporal: 'trait',
      patterns: [
        /특징/,
        /구별되는\s*(?:특징|단서)/,
        /식별\s*(?:특징|단서)/,
        /어떤\s*사람인지/
      ]
    }
  };

  const AXIS_ORDER = [
    'past_relationship',
    'relationship_atmosphere',
    'personality',
    'love_style',
    'past_attitude',
    'breakup_reason',
    'current_feeling',
    'recall_reason',
    'return_motivation',
    'approach_style',
    'action_likelihood',
    'reconnection_potential',
    'distinguishing_features'
  ];

  function norm(input) {
    return String(input || '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function lower(input) {
    return norm(input).toLowerCase();
  }

  function uniqueById(items) {
    const seen = new Set();
    return items.filter(item => {
      if (!item || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function numberPositions(items) {
    return items.map((text, index) => `${index + 1}. ${String(text).replace(/^\d+[.)]\s*/, '')}`);
  }

  function makeSpread(title, rationale, layoutType, positions, meta = {}) {
    return {
      spreadTitle: title,
      designRationale: rationale,
      layoutType,
      positions: numberPositions(positions),
      routerV8: meta
    };
  }

  function isDeepSymmetricComparison(sem) {
    return !!sem
      && sem.primary_intent === 'comparison'
      && sem.target_count === 2
      && sem.target_relation === 'parallel_comparison'
      && sem.comparison_mode === 'symmetric'
      && (sem.requested_axes || []).length >= DEEP_COMPARE_MIN_AXES;
  }

  // 일반 질문은 12장을 유지한다. 명시 요구축이 많은 A/B 대칭 비교만
  // 필요한 만큼 14~22장으로 확장한다. 전역 카드 상한을 올리지 않는다.
  function maxCards(sem = null) {
    if (isDeepSymmetricComparison(sem)) {
      const needed = (sem.requested_axes || []).length * 2;
      return Math.min(DEEP_COMPARE_MAX_CARDS, Math.max(DEFAULT_MAX_CARDS, needed));
    }
    return DEFAULT_MAX_CARDS;
  }

  function explicitTargetNumber(q) {
    const s = lower(q);

    // "두 명이라고 가정", "두 사람", "두 인연"처럼 숫자가 명시된 경우
    if (/(?:두|2)\s*(?:명|사람|인연|대상|선택지)/.test(s)) return 2;
    if (/(?:세|3)\s*(?:명|사람|인연|대상|선택지)/.test(s)) return 3;
    if (/(?:네|4)\s*(?:명|사람|인연|대상|선택지)/.test(s)) return 4;

    // A/B 명시 역시 2개 고정 대상으로 본다.
    if (/(?:a\s*(?:와|과|랑|\/|vs)\s*b|a와\s*b|a\/b|a\s*vs\s*b)/i.test(s)) return 2;
    return null;
  }

  function asksUnknownTargetCount(q) {
    const s = lower(q);
    if (explicitTargetNumber(s) !== null) return false;
    return /(몇\s*(?:명|사람|인연)|인연이\s*몇|몇\s*개의?\s*(?:과거\s*)?인연)/.test(s);
  }

  function targetType(q) {
    const s = lower(q);
    if (/(인연|사람|남자|여자|연인|전남|전여|구남|구여|상대|a와\s*b|두\s*사람|두\s*인연)/.test(s)) return 'person';
    if (/(회사|직장|학교|종목|제품|선택지|매도|보유|매수)/.test(s)) return 'option';
    return 'unspecified';
  }

  function comparisonStrength(q) {
    const s = lower(q);
    let score = 0;

    // 구조 신호
    if (/(a\s*(?:와|과|랑|\/|vs)\s*b|a\/b)/i.test(s)) score += 4;
    if (/(두\s*(?:사람|인연|대상|선택지)|각\s*사람|각\s*인연)/.test(s)) score += 3;
    if (/(각각|서로\s*구별|구별해|나누어|나눠서)/.test(s)) score += 2;
    if (/(비교해|비교해서|비교하고|차이|누가\s*더|어느\s*쪽|둘\s*중)/.test(s)) score += 3;

    // "두 사람이 서로 어떤 관계?"는 병렬 비교가 아니라 관계 자체 질문이므로 감점
    if (/(a와\s*b|두\s*사람).{0,12}(서로|사이).{0,12}(관계|어때|어떤)/.test(s) &&
        !/(비교|각각|누가\s*더|구별)/.test(s)) score -= 4;

    return score;
  }

  function decisionRequested(q) {
    const s = lower(q);
    return /(누구를\s*선택|어느\s*쪽을\s*선택|내가.{0,8}(누구|어느\s*쪽).{0,8}(고르|선택)|뭐가\s*나을|누가\s*더\s*나을)/.test(s);
  }

  function detectTopic(q, base) {
    const s = lower(q);
    if (/(전남친|전여친|전애인|구남친|구여친|과거\s*인연|예전\s*인연|헤어진\s*사람|헤어진\s*연인)/.test(s)) return 'ex_relationship';
    if (/(재회|다시\s*만나|다시\s*사귀|관계\s*회복)/.test(s)) return 'reconciliation';
    if (/(연애|호감|좋아하|사랑|썸|인연)/.test(s)) return 'love';
    if (base?.domains?.includes('stock')) return 'stock';
    if (base?.domains?.includes('career')) return 'career';
    if (base?.domains?.includes('exam')) return 'study_exam';
    if (base?.domains?.includes('money')) return 'finance';
    return base?.domains?.[0] || 'general';
  }

  function extractAxes(q) {
    const s = lower(q);
    const hits = [];
    for (const id of AXIS_ORDER) {
      const axis = AXES[id];
      if (axis.patterns.some(re => re.test(s))) hits.push(axis);
    }

    // 사용자가 "자세히 비교"만 쓰고 세부축이 적을 때 기본 비교축 보강.
    // 단, 질문에 없는 조언/제3자/정밀시기는 추가하지 않는다.
    if (comparisonStrength(s) >= 5 && targetType(s) === 'person') {
      if (!hits.length || hits.length <= 2) {
        ['current_feeling', 'return_motivation', 'action_likelihood'].forEach(id => {
          if (!hits.some(x => x.id === id)) hits.push(AXES[id]);
        });
      }
    }

    return uniqueById(hits).sort((a, b) => AXIS_ORDER.indexOf(a.id) - AXIS_ORDER.indexOf(b.id));
  }

  function intentBundle(axes, compare, unknownCount) {
    const secondary = new Set();
    const ids = new Set(axes.map(x => x.id));

    if ([...ids].some(x => ['past_relationship','relationship_atmosphere','personality','love_style','past_attitude','distinguishing_features'].includes(x))) secondary.add('description');
    if (ids.has('breakup_reason')) secondary.add('cause');
    if (ids.has('current_feeling')) secondary.add('feelings');
    if (ids.has('recall_reason')) secondary.add('memory');
    if (ids.has('return_motivation')) secondary.add('motivation');
    if (ids.has('approach_style') || ids.has('action_likelihood')) secondary.add('action_prediction');
    if (ids.has('reconnection_potential')) secondary.add('relationship_outcome');
    if (unknownCount) secondary.add('target_count_inference');

    return {
      primary_intent: unknownCount ? 'connection_scan' : (compare ? 'comparison' : 'compound'),
      secondary_intents: [...secondary]
    };
  }

  function analyzeV8(question) {
    const q = norm(question);
    let base = {};
    try {
      base = typeof previous.analyzeQuestionIntent === 'function'
        ? (previous.analyzeQuestionIntent(q) || {})
        : {};
    } catch (e) {
      console.warn('[LUNEA Router V8.3] previous analyze failed:', e);
    }

    const explicitCount = explicitTargetNumber(q);
    const unknownCount = asksUnknownTargetCount(q);
    const compareScore = comparisonStrength(q);
    const compare = explicitCount >= 2 && compareScore >= 4;
    const axes = extractAxes(q);
    const bundle = intentBundle(axes, compare, unknownCount);

    let targetRelation = 'single';
    if (unknownCount) targetRelation = 'unknown_scan';
    else if (compare) targetRelation = 'parallel_comparison';
    else if ((explicitCount || 0) >= 2) targetRelation = 'multi_target';

    const advanced = {
      ...base,
      question: q,
      // IMPORTANT: downstream modules (especially Timing Oracle) may still
      // branch on the legacy V7 `kind` values. Do not overwrite that contract.
      kind: base?.kind ?? bundle.primary_intent,
      router_kind: bundle.primary_intent,
      primary_intent: bundle.primary_intent,
      secondary_intents: bundle.secondary_intents,
      topic: detectTopic(q, base),
      target_type: targetType(q),
      target_count: unknownCount ? null : explicitCount,
      target_count_mode: unknownCount ? 'infer' : (explicitCount ? 'fixed' : 'unspecified'),
      target_relation: targetRelation,
      comparison_mode: compare ? 'symmetric' : 'none',
      decision_requested: decisionRequested(q),
      comparison_strength: compareScore,
      requested_axes: axes.map(x => ({...x})),
      requested_axis_ids: axes.map(x => x.id)
    };

    return advanced;
  }

  function axisText(axis, target) {
    const label = axis.label;
    if (!target) return label;
    return `${target} — ${label}`;
  }

  function pairedPositions(axes) {
    return [
      ...axes.map(axis => axisText(axis, 'A')),
      ...axes.map(axis => axisText(axis, 'B'))
    ];
  }

  function compressedPairAxes(axes) {
    const ids = new Set(axes.map(a => a.id));
    const groups = [];

    const groupLabel = (present, fallback) => {
      const labels = {
        past_relationship: '과거 관계의 성격',
        relationship_atmosphere: '당시 관계의 분위기',
        personality: '상대의 성격',
        love_style: '연애 방식',
        distinguishing_features: '구별되는 특징',
        past_attitude: '질문자를 대했던 태도',
        breakup_reason: '관계가 끝난 핵심 원인',
        current_feeling: '현재 남은 감정',
        recall_reason: '다시 떠올리는 이유',
        return_motivation: '재접근 동기',
        action_likelihood: '지정 기간 안 실제 행동 가능성',
        approach_style: '접근 방식',
        reconnection_potential: '다시 연결될 경우 관계가 이어질 가능성'
      };
      const parts = present.map(id => labels[id] || AXES[id]?.label).filter(Boolean);
      return parts.length ? parts.join(' · ') : fallback;
    };

    const pushGroup = (id, memberIds, fallbackLabel) => {
      const present = memberIds.filter(x => ids.has(x));
      if (!present.length) return;
      groups.push({
        id,
        label: groupLabel(present, fallbackLabel),
        temporal: present.map(x => AXES[x]?.temporal).filter(Boolean).join('+'),
        source_ids: present
      });
      present.forEach(x => ids.delete(x));
    };

    // 의미가 가까운 것끼리만 묶는다. 질문에 없던 세부축은 라벨에 새로 추가하지 않는다.
    pushGroup('past_relationship_context', ['past_relationship','relationship_atmosphere'], '과거 관계 맥락');
    pushGroup('personality_love_style', ['personality','love_style','distinguishing_features'], '성격·연애 방식');
    pushGroup('past_attitude_breakup', ['past_attitude','breakup_reason'], '과거 태도·단절 원인');
    pushGroup('current_recall_motive', ['current_feeling','recall_reason','return_motivation'], '현재 감정·회상·재접근 동기');
    pushGroup('action_approach', ['action_likelihood','approach_style'], '행동 가능성·접근 방식');
    pushGroup('reconnection', ['reconnection_potential'], '재연결 가능성');

    // 미분류 축은 자체 그룹으로 보존
    for (const id of AXIS_ORDER) {
      if (!ids.has(id)) continue;
      const a = AXES[id];
      groups.push({id, label:a.label, temporal:a.temporal, source_ids:[id]});
      ids.delete(id);
    }

    return groups.slice(0, 6);
  }

  function buildSymmetricComparison(sem) {
    let axes = sem.requested_axes || [];
    if (!axes.length) {
      axes = [
        AXES.current_feeling,
        AXES.return_motivation,
        AXES.action_likelihood
      ];
    }

    const cap = maxCards(sem);
    const exactNeeded = axes.length * 2;
    let finalAxes = axes;
    let compressed = false;

    if (exactNeeded > cap) {
      finalAxes = compressedPairAxes(axes);
      compressed = true;
    }

    // 혹시 축이 너무 많아도 양쪽 대칭을 깨지 않도록 짝수로 자른다.
    const maxPerTarget = Math.max(1, Math.floor(cap / 2));
    finalAxes = finalAxes.slice(0, maxPerTarget);

    const positions = pairedPositions(finalAxes);
    const exact = !compressed && positions.length === exactNeeded;

    return makeSpread(
      exact ? `A/B 완전 대칭 비교 · ${finalAxes.length}축 × 2` : `A/B 대칭 비교 · ${finalAxes.length}축 × 2`,
      [
        '주제 키워드보다 명시적 A/B 비교 구조를 우선',
        `사용자 요구축 ${axes.length}개 추출`,
        exact ? '모든 요구축을 A/B에 1:1 복제' : `현재 카드 상한 ${cap}장에 맞춰 의미상 가까운 축만 묶고 A/B 대칭성 유지`,
        '회상형·단일 대상 스프레드 사용 금지'
      ].join(' · '),
      exact ? 'dual-compare-exact' : 'dual-compare-compact',
      positions,
      {
        route: 'person_comparison',
        target_count: 2,
        comparison_mode: 'symmetric',
        exact_axes: exact,
        source_axes: axes.map(x => x.id),
        rendered_axes: finalAxes.map(x => x.id),
        axis_groups: finalAxes.map(x => x.source_ids || [x.id]),
        semantic_coverage: 1,
        axis_separation: exact ? 1 : Number((finalAxes.length / axes.length).toFixed(3)),
        performance_mode: positions.length > DEFAULT_MAX_CARDS ? 'deep_22_light_render' : 'standard',
        max_cards_for_this_spread: cap
      }
    );
  }

  function buildUnknownPastConnectionScan(sem) {
    // 12장 호환형. 사람 수를 숫자 카드/코트 수로 세지 않는다.
    // A/B/C는 실제 인물을 미리 확정한 이름이 아니라 '독립 인연 흐름 후보'다.
    const positions = [
      '전체 판별 — 한 사람 중심 흐름인지 복수의 독립 과거 인연 흐름인지',

      'A 후보 — 다른 흐름과 분리되는 독립 인연으로 성립하는지',
      'A 후보 — 과거 관계의 성격과 서로 구별되는 성격·연애 방식·식별 특징',
      'A 후보 — 현재 다시 떠올리는 이유·재접근 동기·지정 기간 안 실제 행동 가능성과 접근 방식',

      'B 후보 — A와 다른 독립 인연 흐름으로 성립하는지',
      'B 후보 — 과거 관계의 성격과 서로 구별되는 성격·연애 방식·식별 특징',
      'B 후보 — 현재 다시 떠올리는 이유·재접근 동기·지정 기간 안 실제 행동 가능성과 접근 방식',

      'C 후보 — A·B와 다른 독립 인연 흐름으로 성립하는지',
      'C 후보 — 과거 관계의 성격과 서로 구별되는 성격·연애 방식·식별 특징',
      'C 후보 — 현재 다시 떠올리는 이유·재접근 동기·지정 기간 안 실제 행동 가능성과 접근 방식',

      '중복 검증 — A·B·C 후보 중 사실상 같은 인연 흐름으로 합쳐 읽어야 하는 후보가 있는지',
      '최종 판별 — 지정 기간 안 현실적으로 움직임이 잡히는 독립 인연 흐름의 수와 가장 강한 후보'
    ];

    return makeSpread(
      '과거 인연 수·특징·재접근 · 최대 3흐름 판별형',
      '대상 수를 사용자가 지정하지 않았으므로 처음부터 두 명으로 고정하지 않는다 · A/B/C는 후보 흐름일 뿐 실제 사람 수를 선결하지 않는다 · 카드 숫자/코트 카드 개수로 사람 수를 세지 않고 독립성·식별 특징·동기·행동 신호의 일관성으로만 분리한다',
      'connection-scan-12',
      positions,
      {
        route: 'unknown_target_connection_scan',
        target_count: null,
        target_count_mode: 'infer',
        max_distinct_lanes: 3,
        coverage: 1,
        count_rule: 'coherent_independent_lane_only'
      }
    );
  }

  function buildSingleDynamic(sem) {
    const axes = (sem.requested_axes || []).slice(0, maxCards());
    if (axes.length < 3) return null;
    return makeSpread(
      '질문 요구축 직결 · 동적 배열',
      `사용자가 명시한 요구축 ${axes.length}개를 기존 범용 템플릿보다 우선하여 1:1 배치`,
      'dynamic-axis-map',
      axes.map(a => a.label),
      {
        route: 'dynamic_single',
        source_axes: axes.map(a => a.id),
        coverage: 1
      }
    );
  }

  function coverageOfSpread(spread, sem) {
    const requested = sem?.requested_axes || [];
    if (!requested.length) {
      return {coverage:1, missing:[], overloaded:0, weighted:1};
    }

    const positions = (spread?.positions || []).map(x => lower(x));
    let covered = 0;
    const missing = [];

    for (const axis of requested) {
      const labelTokens = axis.label
        .replace(/[·/]/g, ' ')
        .split(/\s+/)
        .filter(x => x.length >= 2);
      const direct = positions.some(p => {
        const hit = labelTokens.filter(t => p.includes(t)).length;
        return hit >= Math.min(2, labelTokens.length);
      });
      if (direct) covered += 1;
      else missing.push(axis.id);
    }

    // 한 포지션에 "가능성 + 방식 + 이유 + 감정"처럼 너무 많은 독립 축이 몰리면 과부하로 기록.
    const loadMarkers = [
      /감정|마음|미련/,
      /이유|원인|동기/,
      /가능성|성립|실제\s*행동/,
      /방식|스타일|방법/,
      /관계|분위기/,
      /성격|성향/,
      /태도/,
      /끝난|헤어진|단절/
    ];
    let overloaded = 0;
    for (const p of positions) {
      const n = loadMarkers.filter(re => re.test(p)).length;
      if (n >= 4) overloaded += 1;
    }

    const raw = covered / requested.length;
    const weighted = Math.max(0, raw - overloaded * 0.04);

    return {coverage:raw, missing, overloaded, weighted};
  }

  function saveTrace(trace) {
    W.LUNEA_ROUTER_V8_LAST_TRACE = trace;
    try {
      const arr = JSON.parse(localStorage.getItem(ROUTER_MEMORY_KEY) || '[]');
      arr.unshift(trace);
      localStorage.setItem(ROUTER_MEMORY_KEY, JSON.stringify(arr.slice(0, 30)));
    } catch {}
  }

  function routeDecision(sem) {
    if (
      sem.target_type === 'person' &&
      sem.target_count_mode === 'infer' &&
      sem.topic === 'ex_relationship'
    ) {
      return {mode:'unknown_connection_scan', hard:true};
    }

    if (
      sem.target_type === 'person' &&
      sem.target_count === 2 &&
      sem.target_relation === 'parallel_comparison' &&
      sem.comparison_mode === 'symmetric'
    ) {
      return {mode:'symmetric_person_comparison', hard:true};
    }

    if ((sem.requested_axes || []).length >= 4 && sem.primary_intent === 'compound') {
      return {mode:'dynamic_single', hard:false};
    }

    return {mode:'fallback', hard:false};
  }

  // ------------------------------------------------------------
  // DEEP 22 PERFORMANCE LAYER · V8.3
  // - MutationObserver를 사용하지 않는다. (22장 생성 중 연쇄 mutation이 렉을 키울 수 있음)
  // - 카드 RNG/추첨/포지션은 건드리지 않는다.
  // - 13장 이상일 때 "전체 카드 입장/셔플 애니메이션"만 끄고
  //   사용자가 탭한 개별 카드의 flip은 기존 엔진에 맡긴다.
  // - DOM 최적화는 렌더 뒤 최대 2회만 가볍게 실행한다.
  // ------------------------------------------------------------
  let deepOptimizeTicket = 0;

  function installDeepPerformanceStyles() {
    if (document.getElementById('luneaV83DeepPerfStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaV83DeepPerfStyle';
    style.textContent = `
      body.lunea-deep-spread .shuffle .tarot,
      body.lunea-deep-spread .shuffle .tarot-card,
      body.lunea-deep-spread .shuffle .card-shell,
      body.lunea-deep-spread .shuffle .slot,
      body.lunea-deep-spread .shuffling .tarot,
      body.lunea-deep-spread .shuffling .tarot-card,
      body.lunea-deep-spread .shuffling .card-shell,
      body.lunea-deep-spread .shuffling .slot {
        animation: none !important;
        animation-delay: 0s !important;
      }

      /* 22개 카드 모두를 GPU 레이어로 강제 승격하지 않는다. */
      body.lunea-deep-spread .slot,
      body.lunea-deep-spread .card-slot,
      body.lunea-deep-spread .tarot,
      body.lunea-deep-spread .tarot-card {
        will-change: auto !important;
      }

      /* 각 카드 레이아웃/페인트 범위를 최대한 분리. */
      @supports (contain: layout paint) {
        body.lunea-deep-spread .slot,
        body.lunea-deep-spread .card-slot {
          contain: layout paint;
        }
      }

      /* 개별 flip 자체는 없애지 않는다. */
      @media (prefers-reduced-motion: reduce) {
        body.lunea-deep-spread .card-rotator,
        body.lunea-deep-spread .card-inner,
        body.lunea-deep-spread .tarot-inner {
          transition-duration: .01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function oneShotDeepOptimize(ticket) {
    if (ticket !== deepOptimizeTicket || !W.LUNEA_DEEP_SPREAD_ACTIVE) return;

    const containers = [
      '#cards', '#cardGrid', '#drawnCards', '#spreadCards',
      '.cards', '.card-grid', '.spread-cards', '.reading-cards', '.drawn-cards'
    ].flatMap(sel => [...document.querySelectorAll(sel)]);

    let best = null;
    let bestCount = 0;
    for (const c of containers) {
      const n = c.children?.length || 0;
      if (n > bestCount) {
        best = c;
        bestCount = n;
      }
    }
    if (!best || bestCount < 13) return;

    // 이미지 속성만 1회 설정. subtree 감시는 하지 않는다.
    const imgs = [...best.querySelectorAll('img')];
    imgs.forEach((img, index) => {
      try {
        img.decoding = 'async';
        if (index >= 10) {
          img.loading = 'lazy';
          if ('fetchPriority' in img) img.fetchPriority = 'low';
        }
      } catch {}
    });
  }

  function scheduleOneShotDeepOptimize() {
    const ticket = ++deepOptimizeTicket;
    // 렌더가 designSpread 반환 뒤에 일어나므로 짧은 두 시점만 확인.
    setTimeout(() => oneShotDeepOptimize(ticket), 80);
    setTimeout(() => oneShotDeepOptimize(ticket), 260);
  }

  function updateDeepPerformanceMode(result) {
    const count = Number(result?.positions?.length || 0);
    const deep = count > DEFAULT_MAX_CARDS
      && result?.routerV8?.performance_mode === 'deep_22_light_render';

    W.LUNEA_DEEP_SPREAD_ACTIVE = deep;
    W.LUNEA_DEEP_SPREAD_CARD_COUNT = deep ? count : 0;

    if (!document.body) return;
    installDeepPerformanceStyles();
    document.body.classList.toggle('lunea-deep-spread', deep);

    if (deep) scheduleOneShotDeepOptimize();
  }

  // Legacy spread를 한 번 통과시키는 이유:
  // Timing Oracle / General 계층이 designSpread를 래핑해 부가 계산/메타를 붙이는 경우,
  // V8이 자체 스프레드를 바로 반환하면 그 계층을 우회하게 된다.
  async function getLegacySpreadForCompatibility(question) {
    try {
      return await previous.designSpread(question);
    } catch (e) {
      console.warn('[LUNEA Router V8.3] legacy designSpread compatibility pass failed:', e);
      return null;
    }
  }

  function mergeLegacyMeta(customSpread, legacySpread) {
    if (!legacySpread || typeof legacySpread !== 'object') return customSpread;
    if (!customSpread || typeof customSpread !== 'object') return legacySpread;

    // legacy의 Timing/보조 메타는 살리고, 실제 배열 정의만 V8.3 것을 우선한다.
    return {
      ...legacySpread,
      ...customSpread,
      spreadTitle: customSpread.spreadTitle,
      designRationale: customSpread.designRationale,
      layoutType: customSpread.layoutType,
      positions: customSpread.positions,
      routerV8: {
        ...(legacySpread.routerV8 || {}),
        ...(customSpread.routerV8 || {}),
        legacy_compat_pass: true
      }
    };
  }

  async function designSpreadV8(question) {
    const sem = analyzeV8(question);
    const decision = routeDecision(sem);
    let result = null;
    let legacyResult = null;

    // 하드 라우팅에서도 기존 엔진을 1회 통과시켜 Timing Oracle 등
    // 기존 래퍼/부가 계산을 우회하지 않도록 한다.
    if (decision.mode !== 'fallback') {
      legacyResult = await getLegacySpreadForCompatibility(question);
    }

    if (decision.mode === 'unknown_connection_scan') {
      result = buildUnknownPastConnectionScan(sem);
    } else if (decision.mode === 'symmetric_person_comparison') {
      result = buildSymmetricComparison(sem);
    } else if (decision.mode === 'dynamic_single') {
      result = buildSingleDynamic(sem);
    }

    if (result && legacyResult) {
      result = mergeLegacyMeta(result, legacyResult);
    }

    if (!result) {
      result = await previous.designSpread(question);

      // 기존 배열이 명시 요구축을 거의 못 덮을 때만 동적 배열로 교체.
      const cov = coverageOfSpread(result, sem);
      const essentialMissing = cov.missing.some(id =>
        ['action_likelihood','reconnection_potential','breakup_reason'].includes(id)
      );

      if (
        (sem.requested_axes || []).length >= 3 &&
        (cov.weighted < 0.50 || essentialMissing)
      ) {
        const dynamic = buildSingleDynamic(sem);
        if (dynamic) {
          dynamic.designRationale += ` · 기존 후보 커버리지 ${Math.round(cov.weighted * 100)}%로 교체`;
          result = mergeLegacyMeta(dynamic, result);
        }
      }
    }

    updateDeepPerformanceMode(result);

    const trace = {
      at: Date.now(),
      question: sem.question,
      topic: sem.topic,
      legacy_kind: sem.kind,
      router_kind: sem.router_kind,
      primary_intent: sem.primary_intent,
      secondary_intents: sem.secondary_intents,
      target_count: sem.target_count,
      target_count_mode: sem.target_count_mode,
      target_relation: sem.target_relation,
      comparison_mode: sem.comparison_mode,
      comparison_strength: sem.comparison_strength,
      requested_axes: sem.requested_axis_ids,
      route_mode: decision.mode,
      selected_spread: result?.spreadTitle || '',
      selected_layout: result?.layoutType || '',
      positions: result?.positions?.length || 0,
      max_cards: maxCards(sem),
      performance_mode: result?.routerV8?.performance_mode || 'standard',
      legacy_compat_pass: !!result?.routerV8?.legacy_compat_pass
    };

    W.LUNEA_ROUTER_V8_LAST_SEMANTIC = sem;
    saveTrace(trace);
    console.info('[LUNEA Router V8.3]', trace, result);
    return result;
  }

  function comparisonDirective(sem) {
    if (!sem) return '';

    if (sem.primary_intent === 'comparison' && sem.comparison_mode === 'symmetric') {
      return `
[LUNEA ROUTER V8 · 대칭 비교 해석 규칙]
1. 이 질문의 최상위 구조는 A/B 비교다. 과거·기억·원인 같은 주제어가 비교 구조를 덮어쓰면 안 된다.
2. A와 B는 반드시 동일한 판별축끼리 비교한다.
3. A의 카드로 B의 성격·감정·행동을 추론하지 않고, B의 카드로 A를 설명하지 않는다.
4. 한쪽만 자세히 읽고 다른 쪽을 축약하지 않는다.
5. 카드 번호, 메이저 카드 개수, 코트 카드 개수만으로 어느 쪽이 우세하다고 판정하지 않는다.
6. 행동 가능성, 접근 방식, 현재 감정, 재접근 동기, 재연결 후 관계의 질을 서로 다른 결론축으로 유지한다.
7. "먼저 행동할 가능성이 높은 사람"과 "다시 이어졌을 때 관계 발전성이 높은 사람"이 다를 수 있음을 허용한다.
8. 사용자가 직접 명시한 요구축을 빠뜨리지 않는다.
9. 압축형 포지션에 두 세부축이 함께 있으면 카드 한 장을 핑계로 둘을 뭉개지 말고, 같은 카드 안에서 각 세부축을 분리해 설명한다.
10. 우세가 명확하지 않으면 A/B 우세를 억지로 만들지 말고 구분이 어렵다고 말한다.
11. 사용자가 누구를 선택할지 묻지 않았다면 A/B 중 어느 쪽이 '더 좋은 선택'인지로 질문을 바꾸지 않는다.`;
    }

    if (sem.primary_intent === 'connection_scan' && sem.target_count_mode === 'infer') {
      return `
[LUNEA ROUTER V8 · 대상 수 미정 과거 인연 해석 규칙]
1. 사용자가 사람 수 자체를 물었으므로 처음부터 "두 명"이라고 전제하지 않는다.
2. 카드 숫자, 수비학 숫자, 코트 카드 개수, 메이저 카드 개수를 사람 수로 변환하지 않는다.
3. 먼저 1번·2번 포지션으로 한 사람 중심인지 복수의 독립 흐름인지 판별한다.
4. B 후보는 A와 구별되는 독립된 관계 성격·특징·동기 패턴이 반복해서 지지될 때만 별도 인연으로 본다.
5. B 독립성이 약하면 "한 인연 흐름이 우세하고 두 번째 인연은 분명하지 않다"고 말한다.
6. B 독립성이 강하면 "카드상 두 개의 구별되는 인연 흐름이 잡힌다"고 표현할 수 있다.
7. 이 12장 스캔은 최대 두 개의 독립 흐름까지 정밀 비교한다. 그 이상은 카드상 확정하지 않는다.
8. 각 후보마다 과거 관계, 식별 특징, 다시 떠올리는 이유, 재접근 동기, 지정 기간 안 행동 가능성을 분리한다.
9. 객관적 사실처럼 "정확히 몇 명이 반드시 온다"고 단정하지 않는다.`;
    }

    if (sem.primary_intent === 'compound') {
      return `
[LUNEA ROUTER V8 · 복합 질문 해석 규칙]
- 사용자가 직접 나열한 요구축을 질문의 일부가 아니라 각각 독립된 판별축으로 취급한다.
- 원인 하나가 감정·행동·미래 질문을 덮어쓰지 않게 한다.
- 포지션이 담당하지 않는 다른 축으로 의미를 확장하지 않는다.`;
    }

    return '';
  }

  function stripLegacyChoiceDirective(text, sem) {
    let out = String(text || '');
    if (!(sem?.primary_intent === 'comparison' && !sem?.decision_requested)) return out;

    // V7의 choice 전용 규칙이 A/B 비교 프롬프트에 남는 문제 제거.
    out = out.replace(
      /\n?\[이 질문 전용 해석 규칙\]\s*\n-\s*두 선택을 동일한 기준으로 비교한다\.[^\n]*\n-\s*최종 결론은 카드상 더 유리한 선택과 그 선택이 유리해지는 조건을 함께 말한다\.\s*/g,
      '\n'
    );
    return out.replace(/\n{3,}/g, '\n\n').trimEnd();
  }

  W.designSpread = designSpreadV8;

  W.analyzeQuestionIntent = function(question) {
    return analyzeV8(question);
  };

  W.readingDirective = function(...args) {
    let base = '';
    try {
      if (typeof previous.readingDirective === 'function') {
        base = previous.readingDirective.apply(this, args) || '';
      }
    } catch (e) {
      console.warn('[LUNEA Router V8.3] previous readingDirective failed:', e);
    }

    let sem = W.LUNEA_ROUTER_V8_LAST_SEMANTIC;
    if (!sem) {
      const first = args[0];
      if (typeof first === 'string') sem = analyzeV8(first);
      else if (first?.question) sem = analyzeV8(first.question);
    }
    base = stripLegacyChoiceDirective(base, sem);
    return base + comparisonDirective(sem);
  };

  // 개발/검증용 API
  W.LUNEA_ROUTER_V8 = {
    analyze: analyzeV8,
    extractAxes,
    coverageOfSpread,
    maxCards,
    isDeepSymmetricComparison,
    stripLegacyChoiceDirective,
    routeDecision,
    buildSymmetricComparison,
    buildUnknownPastConnectionScan,
    getTrace: () => W.LUNEA_ROUTER_V8_LAST_TRACE || null,
    performanceStatus: () => ({
      active: !!W.LUNEA_DEEP_SPREAD_ACTIVE,
      cardCount: Number(W.LUNEA_DEEP_SPREAD_CARD_COUNT || 0),
      mode: W.LUNEA_DEEP_SPREAD_ACTIVE ? 'deep_22_css_only' : 'standard',
      mutationObserver: false
    }),
    selfTest: () => {
      const longQ = '2026년 하반기(8월 말~12월 말)에 다시 나타날 가능성이 있는 과거 인연이 두 명이라고 가정했을 때, 각 인연을 서로 구별할 수 있도록 A와 B로 나누어 자세히 비교해줘. 각 사람과 내가 과거에 어떤 관계였는지, 당시 관계의 분위기와 끝난 이유, 상대의 성격과 연애 방식, 나를 대했던 태도, 현재 나를 다시 떠올리는 이유, 다시 다가오려는 이유, 접근 방식, 두 사람 중 실제로 다시 움직일 가능성이 더 강한 사람과 관계가 다시 이어질 가능성이 더 있는 사람이 누구인지 비교해줘.';
      const longSem = analyzeV8(longQ);
      const longSpread = buildSymmetricComparison(longSem);
      const legacy = `[이 질문 전용 해석 규칙]
- 두 선택을 동일한 기준으로 비교한다. 한쪽만 장점, 다른 쪽만 단점으로 편향되게 읽지 않는다.
- 최종 결론은 카드상 더 유리한 선택과 그 선택이 유리해지는 조건을 함께 말한다.`;
      const stripped = stripLegacyChoiceDirective(legacy, longSem);

      const samples = [
        {
          name: '대상 수 미정 과거 인연',
          q: '2026년 하반기(8월 말 ~ 12월 말) 나타날 수 있는 과거 인연에 대해 자세히 말해줘. 몇 명인지도. 그리고 특징도. 왜 내게 다시 다가오는지도',
          test: a => a.primary_intent === 'connection_scan'
        },
        {
          name: 'A/B 복합 대칭 비교 라우팅',
          q: longQ,
          test: a => a.primary_intent === 'comparison' && a.target_count === 2 && a.comparison_mode === 'symmetric'
        },
        {
          name: '11축이면 22장 완전 대칭',
          q: longQ,
          test: a => {
            const sp = buildSymmetricComparison(a);
            return a.requested_axes.length === 11 && sp.positions.length === 22 && sp.routerV8.exact_axes === true;
          }
        },
        {
          name: '구형 choice 지시문 제거',
          q: longQ,
          test: () => !/더 유리한 선택/.test(stripped) && !/두 선택을 동일한 기준/.test(stripped)
        },
        {
          name: '단순 A/B 비교는 12장 이하',
          q: 'A와 B 중 누가 나에 대한 마음이 더 크고 실제 행동 가능성이 높은지 각각 비교해줘.',
          test: a => buildSymmetricComparison(a).positions.length <= DEFAULT_MAX_CARDS
        },
        {
          name: '두 사람 관계 자체 — 비교 아님',
          q: 'A와 B 두 사람은 서로 어떤 관계야?',
          test: a => a.primary_intent !== 'comparison'
        }
      ];

      return samples.map(t => {
        const a = analyzeV8(t.q);
        let ok = false;
        try { ok = !!t.test(a); } catch {}
        return {
          name: t.name,
          ok,
          primary_intent: a.primary_intent,
          target_count: a.target_count,
          requested_axes: a.requested_axis_ids,
          positions: a.primary_intent === 'comparison' ? buildSymmetricComparison(a).positions.length : null,
          max_cards_for_semantic: maxCards(a)
        };
      });
    }
  };

  // UI 설명은 실제 제한값만 표시.
  const updateUi = () => {
    try {
      const badge = document.querySelector('.engine-strip span:last-child');
      if (badge) {
        badge.innerHTML = `<b>Secure Draw + Spread Router V8.3</b> · 구조/대상수 우선 · 대칭 비교 · 심층 최대 22장`;
      }
      const aiItem = [...document.querySelectorAll('.reading-item')]
        .find(x => x.dataset?.title === '질문 맞춤 AI 배열');
      if (aiItem) {
        aiItem.dataset.desc = 'V8.3이 대상 수·비교 구조·요구축을 먼저 읽고, 복합 A/B 비교는 필요한 축만큼 최대 22장까지 대칭 확장합니다.';
        const p = aiItem.querySelector('p');
        if (p) p.textContent = '일반 질문은 기존 상한 유지 · 명시축이 많은 A/B 비교만 14~22장 심층 대칭 배열.';
        const cnt = aiItem.querySelector('.count');
        if (cnt) cnt.textContent = 'AI 2~12 · 심층 비교 최대 22';
      }
    } catch (e) {
      console.warn('[LUNEA Router V8.3] UI update skipped:', e);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUi, {once:true});
  } else {
    updateUi();
  }

    console.info('🌙 LUNEA Spread Router V8.3 deep-22 loaded safely', {
      standardMaxCards: maxCards(),
      deepCompareMaxCards: DEEP_COMPARE_MAX_CARDS,
      previousV74: !!W.LUNEA_SPREAD_ENGINE_V74,
      waitedMs: Date.now() - BOOT_STARTED_AT
    });
    return true;
  }

  function bootWhenReady() {
    if (initRouterV83()) return;
    if (Date.now() - BOOT_STARTED_AT >= BOOT_TIMEOUT_MS) {
      console.error(
        '[LUNEA Router V8.3] V7.4 engine was not ready within 15s. ' +
        'Router was NOT installed; existing LUNEA remains untouched.'
      );
      return;
    }
    setTimeout(bootWhenReady, BOOT_RETRY_MS);
  }

  bootWhenReady();
})();
