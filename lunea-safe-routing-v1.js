'use strict';

/*
  LUNEA SAFE ROUTING V1
  =====================
  Scope: AI custom spread routing ONLY.

  HARD SAFETY RULES
  - DOES NOT replace window.analyzeQuestionIntent
  - DOES NOT replace window.readingDirective
  - DOES NOT touch promptString / startSpread / Timing Oracle
  - DOES NOT touch astrology / transit / return / profile functions
  - DOES NOT touch RNG / card sampling / archive
  - ONLY wraps window.designSpread
  - No MutationObserver
  - 22-card mode keeps individual 3D flip; only bulk shuffle animation is disabled
*/
(() => {
  const W = window;
  if (W.__LUNEA_SAFE_ROUTING_V1_BOOT__) return;
  W.__LUNEA_SAFE_ROUTING_V1_BOOT__ = true;

  const START = Date.now();
  const TIMEOUT = 15000;
  const RETRY = 25;
  const DEEP_THRESHOLD = 12;

  const AXES = [
    {
      id:'past_relationship',
      label:'과거 관계의 핵심 성격',
      patterns:[/과거.{0,14}(어떤|무슨).{0,6}관계/,/어떤\s*관계였/,/과거\s*관계/,/관계의?\s*(본질|성격)/]
    },
    {
      id:'relationship_atmosphere',
      label:'당시 관계의 분위기',
      patterns:[/당시.{0,10}분위기/,/관계의?\s*분위기/,/어떤\s*분위기였/]
    },
    {
      id:'personality',
      label:'상대의 성격',
      patterns:[/상대.{0,8}성격/,/각\s*사람.{0,8}성격/,/성격/]
    },
    {
      id:'love_style',
      label:'상대의 연애 방식',
      patterns:[/연애\s*(방식|스타일|패턴|성향)/,/관계\s*방식/]
    },
    {
      id:'past_attitude',
      label:'당시 질문자를 대했던 태도',
      patterns:[/나를.{0,8}대했/,/질문자.{0,8}대했/,/대했던.{0,6}태도/,/당시.{0,8}태도/]
    },
    {
      id:'breakup_reason',
      label:'관계가 끝나거나 멀어진 핵심 이유',
      patterns:[/끝난\s*(이유|원인)/,/헤어진\s*(이유|원인)/,/멀어진\s*(이유|원인)/,/단절.{0,5}(이유|원인)/]
    },
    {
      id:'current_feeling',
      label:'현재 남아 있는 감정',
      patterns:[/현재.{0,8}(감정|마음|미련|그리움)/,/지금.{0,8}(감정|마음|미련|그리움)/]
    },
    {
      id:'recall_reason',
      label:'현재 다시 떠올리는 이유',
      patterns:[/다시.{0,6}떠올/,/떠올리.{0,10}(이유|왜)/,/다시.{0,6}생각/,/생각나.{0,8}(이유|왜)/]
    },
    {
      id:'return_motivation',
      label:'다시 다가오려는 이유와 동기',
      patterns:[/다시.{0,8}(다가|접근|돌아).{0,10}(이유|동기|왜)/,/다가오.{0,10}(이유|동기|왜)/,/재접근.{0,8}(이유|동기|목적)/]
    },
    {
      id:'approach_style',
      label:'다시 접근한다면 보일 방식',
      patterns:[/접근\s*(방식|스타일)/,/다가오.{0,6}(방식|방법)/,/어떻게.{0,8}(다가|접근|연락)/]
    },
    {
      id:'action_likelihood',
      label:'질문에서 지정한 기간 안 실제 행동 가능성',
      patterns:[/실제로.{0,10}(움직|행동|연락)/,/(움직|행동|연락).{0,10}가능성/,/누가.{0,12}더.{0,8}(움직|행동|연락)/,/나타날\s*가능성/]
    },
    {
      id:'reconnection_potential',
      label:'다시 연결될 경우 관계가 이어질 가능성',
      patterns:[/관계.{0,10}다시.{0,8}이어/,/다시.{0,10}이어질\s*가능성/,/재연결.{0,8}가능성/,/재회.{0,8}(가능성|발전|지속)/]
    },
    {
      id:'distinguishing_features',
      label:'서로 구별되는 특징과 식별 단서',
      patterns:[/각각.{0,12}특징/,/특징/,/구별/,/식별/]
    }
  ];

  function norm(s) {
    return String(s || '').normalize('NFKC').replace(/\s+/g,' ').trim();
  }

  function low(s) {
    return norm(s).toLowerCase();
  }

  function numbered(list) {
    return list.map((x,i)=>`${i+1}. ${String(x).replace(/^\d+[.)]\s*/,'')}`);
  }

  function makeSpread(title, rationale, layoutType, positions, meta={}) {
    return {
      spreadTitle:title,
      designRationale:rationale,
      layoutType,
      positions:numbered(positions),
      safeRouting:meta
    };
  }

  function fixedTargetCount(q) {
    const s = low(q);
    if (/(?:a\s*(?:와|과|랑|\/|vs)\s*b|a\/b)/i.test(s)) return 2;
    if (/(?:두|2)\s*(?:명|사람|인연|대상|선택지)/.test(s)) return 2;
    if (/(?:세|3)\s*(?:명|사람|인연|대상|선택지)/.test(s)) return 3;
    return null;
  }

  function asksUnknownCount(q) {
    const s = low(q);
    if (fixedTargetCount(s) !== null) return false;
    return /(몇\s*(?:명|사람|인연)|인연이\s*몇|몇\s*개의?\s*(?:과거\s*)?인연)/.test(s);
  }

  function isPastConnectionTopic(q) {
    return /(과거\s*인연|예전\s*인연|전남친|전여친|전애인|구남친|구여친|헤어진\s*사람|헤어진\s*연인)/i.test(q);
  }

  function comparisonStrength(q) {
    const s = low(q);
    let score = 0;
    if (/(?:a\s*(?:와|과|랑|\/|vs)\s*b|a\/b)/i.test(s)) score += 4;
    if (/(두\s*(?:사람|인연|대상|선택지)|각\s*사람|각\s*인연)/.test(s)) score += 3;
    if (/(각각|서로\s*구별|구별해|나누어|나눠서|a와\s*b로)/.test(s)) score += 2;
    if (/(비교해|비교해서|비교하고|누가\s*더|어느\s*쪽|둘\s*중|차이)/.test(s)) score += 3;

    // Two people can be one dyadic relationship, not a parallel comparison.
    if (/(a와\s*b|두\s*사람).{0,12}(서로|사이).{0,12}(관계|어때|어떤)/.test(s)
        && !/(비교|각각|누가\s*더|구별)/.test(s)) score -= 4;
    return score;
  }

  function isPersonComparison(q) {
    const count = fixedTargetCount(q);
    if (count !== 2) return false;
    if (!/(인연|사람|상대|남자|여자|연인|전남|전여|구남|구여|a\s*(?:와|과|\/)\s*b)/i.test(q)) return false;
    return comparisonStrength(q) >= 4;
  }

  function extractAxes(q) {
    const s = low(q);
    const out = [];
    for (const axis of AXES) {
      if (axis.patterns.some(re=>re.test(s))) out.push(axis);
    }

    // "A/B를 자세히 비교"만 있고 축을 거의 안 쓴 경우에만 최소 비교축.
    if (isPersonComparison(q) && out.length <= 1) {
      for (const id of ['current_feeling','return_motivation','action_likelihood']) {
        const a = AXES.find(x=>x.id===id);
        if (a && !out.some(x=>x.id===id)) out.push(a);
      }
    }

    // Preserve semantic order and remove duplicates.
    const seen = new Set();
    return out.filter(a=>{
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }

  function buildComparison(q) {
    let axes = extractAxes(q);

    if (!axes.length) {
      axes = [
        AXES.find(x=>x.id==='current_feeling'),
        AXES.find(x=>x.id==='return_motivation'),
        AXES.find(x=>x.id==='action_likelihood')
      ];
    }

    // This router is intentionally capped at 11 axes per person.
    axes = axes.slice(0,11);

    const positions = [
      ...axes.map(a=>`A — ${a.label}`),
      ...axes.map(a=>`B — ${a.label}`)
    ];

    return makeSpread(
      `A/B 완전 대칭 비교 · ${axes.length}축 × 2`,
      [
        '명시적 A/B 병렬 비교 구조를 주제 키워드보다 우선',
        `사용자 요구축 ${axes.length}개를 A와 B에 동일 순서로 1:1 복제`,
        'A의 카드로 B를 추론하거나 B의 카드로 A를 추론하지 않음',
        '행동 가능성과 재연결 후 관계의 질을 서로 다른 결론축으로 유지',
        '사용자가 실제 선택을 요청하지 않았다면 A/B를 “더 유리한 선택”으로 판정하지 않음'
      ].join(' · '),
      positions.length > 12 ? 'dual-compare-deep' : 'dual-compare',
      positions,
      {
        route:'person_comparison',
        target_count:2,
        axes:axes.map(x=>x.id),
        physical_cards:positions.length,
        symmetric:true
      }
    );
  }

  function buildUnknownConnectionScan() {
    const positions = [
      '전체 판별 — 한 사람 중심인지 복수의 독립 과거 인연 흐름인지',
      'A 후보 — 과거 관계와 서로 구별되는 핵심 특징',
      'A 후보 — 다시 떠올리거나 다가오려는 이유',
      'A 후보 — 질문에서 지정한 기간 안 실제 행동 가능성',
      'B 후보 — 과거 관계와 서로 구별되는 핵심 특징',
      'B 후보 — 다시 떠올리거나 다가오려는 이유',
      'B 후보 — 질문에서 지정한 기간 안 실제 행동 가능성',
      'C 후보 — 과거 관계와 서로 구별되는 핵심 특징',
      'C 후보 — 다시 떠올리거나 다가오려는 이유',
      'C 후보 — 질문에서 지정한 기간 안 실제 행동 가능성',
      '중복 검증 — A·B·C 중 사실상 같은 인연 흐름으로 합쳐야 하는 후보가 있는지',
      '최종 판별 — 독립적으로 지지되는 인연 흐름의 수와 가장 현실적으로 움직임이 강한 후보'
    ];

    return makeSpread(
      '과거 인연 수·특징·재접근 · 최대 3흐름 판별형',
      [
        '사용자가 사람 수 자체를 묻기 때문에 처음부터 2명으로 고정하지 않음',
        '카드 숫자·수비학·코트 카드 수로 사람 수를 세지 않음',
        'A/B/C는 실제 사람을 선결한 것이 아니라 독립 흐름 후보',
        '관계 성격·식별 특징·재접근 동기·행동 신호가 반복해서 구별될 때만 별도 인연으로 인정'
      ].join(' · '),
      'connection-scan-12',
      positions,
      {
        route:'unknown_connection_count',
        target_count:null,
        target_count_mode:'infer',
        max_candidate_lanes:3,
        physical_cards:12
      }
    );
  }

  function setSemanticForDirective(question, route) {
    // We NEVER replace analyzers/directives. We only update their normal
    // "last semantic" state so an old choice/cause directive does not leak
    // into a custom comparison/scan prompt.
    try {
      if (W.LUNEA_SPREAD_ENGINE_V7?.analyze) {
        const base = W.LUNEA_SPREAD_ENGINE_V7.analyze(question);
        if (base && typeof base === 'object') {
          const copy = {...base};
          copy.kind = route === 'comparison' ? 'comparison' : 'compound';
          W.LUNEA_V7_LAST_SEMANTIC = copy;
        }
      }
    } catch (e) {
      console.warn('[LUNEA SAFE ROUTING] base semantic state update skipped', e);
    }

    try {
      if (W.LUNEA_SPREAD_ENGINE_V74?.analyze) {
        const enriched = W.LUNEA_SPREAD_ENGINE_V74.analyze(question);
        if (enriched && typeof enriched === 'object') {
          const copy = {
            ...enriched,
            axes: {...(enriched.axes || {})}
          };
          copy.axes.structure = route === 'comparison' ? 'comparison' : 'compound';
          W.LUNEA_V72_LAST_SEMANTIC = copy;
        }
      }
    } catch (e) {
      console.warn('[LUNEA SAFE ROUTING] V7.4 semantic state update skipped', e);
    }
  }

  function installPerformanceCss() {
    if (document.getElementById('lunea-safe-routing-perf')) return;
    const st = document.createElement('style');
    st.id = 'lunea-safe-routing-perf';
    st.textContent = `
      /* Deep comparison only: remove bulk entrance/shuffle animation.
         Individual card 3D flip (.card-rotator) is intentionally untouched. */
      body.lunea-deep-comparison .shuffle .tarot {
        animation: none !important;
        animation-delay: 0s !important;
      }

      body.lunea-deep-comparison .cards {
        grid-template-columns: repeat(4, minmax(82px, 125px)) !important;
        align-items: start;
      }

      body.lunea-deep-comparison .slot {
        contain: layout paint;
      }

      @supports (content-visibility:auto) {
        body.lunea-deep-comparison .slot {
          content-visibility: auto;
          contain-intrinsic-size: 125px 250px;
        }
      }

      @media (max-width:520px) {
        body.lunea-deep-comparison .cards {
          grid-template-columns: repeat(2, minmax(104px, 1fr)) !important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  function setDeepMode(result) {
    if (!document.body) return;
    installPerformanceCss();
    const deep = Number(result?.positions?.length || 0) > DEEP_THRESHOLD
      && result?.layoutType === 'dual-compare-deep';
    document.body.classList.toggle('lunea-deep-comparison', deep);
    W.LUNEA_SAFE_DEEP_MODE = deep;
  }

  function routeQuestion(q) {
    if (asksUnknownCount(q) && isPastConnectionTopic(q)) return 'unknown_count';
    if (isPersonComparison(q)) return 'comparison';
    return 'fallback';
  }

  function boot() {
    if (W.__LUNEA_SAFE_ROUTING_V1_ACTIVE__) return true;
    if (!W.LUNEA_SPREAD_ENGINE_V74 || typeof W.designSpread !== 'function') return false;

    W.__LUNEA_SAFE_ROUTING_V1_ACTIVE__ = true;
    const originalDesignSpread = W.designSpread;

    W.designSpread = async function(question) {
      const q = norm(question);
      const route = routeQuestion(q);

      if (route === 'comparison') {
        setSemanticForDirective(q, 'comparison');
        const result = buildComparison(q);
        setDeepMode(result);
        W.LUNEA_SAFE_ROUTING_LAST = {route, question:q, result};
        return result;
      }

      if (route === 'unknown_count') {
        setSemanticForDirective(q, 'unknown_count');
        const result = buildUnknownConnectionScan();
        setDeepMode(result);
        W.LUNEA_SAFE_ROUTING_LAST = {route, question:q, result};
        return result;
      }

      const result = await originalDesignSpread.apply(this, arguments);
      setDeepMode(result);
      W.LUNEA_SAFE_ROUTING_LAST = {route:'fallback', question:q, result};
      return result;
    };

    // Developer-only inspection API; no core functions are exposed/changed.
    W.LUNEA_SAFE_ROUTING = {
      route: routeQuestion,
      extractAxes: q => extractAxes(norm(q)).map(x=>x.id),
      last: () => W.LUNEA_SAFE_ROUTING_LAST || null,
      safety: () => ({
        overrides: ['designSpread'],
        untouched: [
          'analyzeQuestionIntent',
          'readingDirective',
          'promptString',
          'startSpread',
          'Timing Oracle',
          'astrology/transit/return/profile',
          'RNG/card draw/archive'
        ],
        mutationObserver:false,
        individual3DFlip:'preserved'
      }),
      selfTest: () => {
        const samples = [
          {
            name:'복합 A/B 비교 11축',
            q:'2026년 하반기(8월 말~12월 말)에 다시 나타날 가능성이 있는 과거 인연이 두 명이라고 가정했을 때, 각 인연을 서로 구별할 수 있도록 A와 B로 나누어 자세히 비교해줘. 각 사람과 내가 과거에 어떤 관계였는지, 당시 관계의 분위기와 끝난 이유, 상대의 성격과 연애 방식, 나를 대했던 태도, 현재 나를 다시 떠올리는 이유, 다시 다가오려는 이유, 접근 방식, 두 사람 중 실제로 다시 움직일 가능성이 더 강한 사람과 관계가 다시 이어질 가능성이 더 있는 사람이 누구인지 비교해줘.',
            route:'comparison',
            count:22
          },
          {
            name:'대상 수 미정 과거 인연',
            q:'2026년 하반기 나타날 수 있는 과거 인연에 대해 자세히 말해줘. 몇 명인지도. 특징도. 왜 내게 다시 다가오는지도',
            route:'unknown_count',
            count:12
          },
          {
            name:'두 사람 관계 자체',
            q:'A와 B 두 사람은 서로 어떤 관계야?',
            route:'fallback'
          }
        ];
        return samples.map(s=>{
          const route = routeQuestion(s.q);
          let count = null;
          if (route === 'comparison') count = buildComparison(s.q).positions.length;
          if (route === 'unknown_count') count = buildUnknownConnectionScan().positions.length;
          return {
            name:s.name,
            ok: route === s.route && (s.count == null || count === s.count),
            route,
            count
          };
        });
      }
    };

    // UI label only.
    try {
      const aiItem=[...document.querySelectorAll('.reading-item')]
        .find(x=>x.dataset?.title==='질문 맞춤 AI 배열');
      if (aiItem) {
        const count=aiItem.querySelector('.count');
        if (count) count.textContent='AI 2~22';
      }
    } catch {}

    console.info('🌙 LUNEA SAFE ROUTING V1 loaded', W.LUNEA_SAFE_ROUTING.safety());
    return true;
  }

  function wait() {
    if (boot()) return;
    if (Date.now() - START >= TIMEOUT) {
      console.error('[LUNEA SAFE ROUTING] V7.4 not ready within 15s. No patch installed.');
      return;
    }
    setTimeout(wait, RETRY);
  }

  wait();
})();
