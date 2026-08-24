'use strict';

/*
  LUNEA STRUCTURAL ROUTING V4
  ===========================
  Structure-first router with narrow scope and regression boundaries.

  Handles:
  1) two-person A/B comparison (comparison != choice)
  2) mixed romance-field survey:
     fleeting / past / new connections + count + how + when + monthly flow
  3) unknown-count past-connection scan

  Does NOT replace:
  - analyzeQuestionIntent
  - RNG / secureShuffle / Tarot deck
  - Timing Oracle
  - Natal / Transit / Return / Thai calculations
  - archive storage

  Large V4 spreads are logically complete but rendered in small pages on iPhone.
*/
(() => {
  const W = window;
  if (W.__LUNEA_STRUCTURAL_ROUTING_V4__) return;

  function install() {
    if (W.__LUNEA_STRUCTURAL_ROUTING_V4__) return true;

    const previousDesign = W.designSpread;
    const previousStartSpread = W.startSpread;
    const previousDirective = W.readingDirective;
    const previousPrompt =
      typeof W.promptString === 'function'
        ? W.promptString
        : (typeof promptString === 'function' ? promptString : null);

    if (
      typeof previousDesign !== 'function' ||
      typeof previousStartSpread !== 'function' ||
      typeof previousPrompt !== 'function'
    ) return false;

    // Prevent older dynamic Structural V2 from overriding this router.
    W.__LUNEA_STRUCTURAL_ROUTING_V2__ = true;
    W.__LUNEA_STRUCTURAL_ROUTING_V3__ = true;
    W.__LUNEA_STRUCTURAL_ROUTING_V4__ = true;

    const ROUTE = { last: null };

    const COMPARE_AXES = [
      ['past_relationship', '과거 관계의 성격',
        /(과거|당시|예전|그때).{0,12}(관계|사이)|어떤\s*관계였|어떤\s*사이였|관계의?\s*성격/i],
      ['atmosphere', '당시 관계 분위기',
        /(당시|그때|예전).{0,10}(분위기|기류|온도)|관계\s*(분위기|기류)/i],
      ['breakup_reason', '관계가 끝난 이유',
        /(끝난|끝나게\s*된|헤어진|이별한|단절된).{0,8}(이유|원인)|왜.{0,8}(끝났|헤어졌|끊겼)/i],
      ['personality', '성격·기본 성향',
        /(성격|기질|기본\s*성향|개인적\s*성향|사람\s*성향)/i],
      ['love_style', '연애 방식·애정 표현',
        /(연애\s*(방식|스타일|성향)|애정\s*(표현|방식)|사랑\s*(방식|스타일))/i],
      ['attitude_to_me', '나를 대했던 태도',
        /(나를|나한테|내게|나에게).{0,10}(대했던|대하는|보였던|취했던).{0,6}태도|나에\s*대한\s*태도/i],
      ['recall_reason', '현재 나를 다시 떠올리는 이유',
        /(다시\s*)?(떠올리는|생각하는|생각나는).{0,8}(이유|원인)|왜.{0,10}(다시\s*)?(떠올|생각)/i],
      ['return_motive', '다시 다가오려는 이유·동기',
        /(다시\s*)?(다가오|접근|돌아오|재접근|연락하).{0,10}(이유|동기|목적)|다가오려는\s*(이유|동기)/i],
      ['approach_style', '실제 접근·연락 방식',
        /(접근|다가오는|연락|재접근).{0,6}(방식|스타일|패턴)|어떤\s*식으로.{0,8}(접근|연락|다가)/i],
      ['action_likelihood', '실제로 움직일 가능성',
        /(실제|현실에서).{0,10}(움직|행동|연락).{0,10}(가능성|확률|강|높)|누가.{0,18}(실제\s*)?(움직|행동|연락).{0,10}(강|높|먼저)/i],
      ['reconnection_potential', '관계가 다시 이어질 가능성',
        /(관계|인연).{0,10}다시.{0,10}(이어|연결|회복).{0,10}(가능성|여지)|재회\s*가능성|재연결\s*가능성|다시\s*이어질\s*가능성/i]
    ];

    function norm(q) {
      return String(q || '')
        .normalize('NFKC')
        .replace(/[／]/g, '/')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function sameQuestion(a, b) {
      return norm(a) === norm(b);
    }

    function pastCue(q) {
      return /(과거\s*인연|옛\s*인연|예전\s*인연|지난\s*인연|전\s*인연|기존\s*인연|전남친|전여친|전애인|구남친|구여친|구\s*썸|과거\s*썸|헤어졌던\s*사람|예전에\s*만났)/i.test(q);
    }

    function newCue(q) {
      return /(새로운?\s*인연|새\s*인연|신규\s*인연|처음\s*만나는|새로\s*만날|새\s*사람)/i.test(q);
    }

    function fleetingCue(q) {
      return /(스쳐\s*가는\s*인연|스쳐가는\s*인연|짧게\s*스치는|단기\s*인연|잠깐\s*만나는)/i.test(q);
    }

    function romanceCue(q) {
      return /(연애운|연애\s*운|연애|인연|호감|썸|만남)/i.test(q);
    }

    function unknownCountCue(q) {
      return /(몇\s*명|몇명|몇\s*사람|인원\s*수|몇\s*개의?\s*인연|몇\s*인연|총\s*몇)/i.test(q);
    }

    function monthlyCue(q) {
      return /(월별|매달|달별|개월별|월\s*단위)/i.test(q);
    }

    function howCue(q) {
      return /(어떻게\s*(등장|만나|나타나|접근|연결)|등장\s*방식|만나는\s*경로|어디서\s*만나|어떤\s*식으로\s*(등장|만나))/i.test(q);
    }

    function whenCue(q) {
      return /(언제|시기|몇\s*월|어느\s*달|등장.{0,6}시점|나타날.{0,6}시기)/i.test(q);
    }

    function pairCue(q) {
      return /(두\s*명|2\s*명|두\s*사람|2\s*사람|둘\s*이라고|둘이라고|A\s*(?:와|과|랑|\/|·)\s*B|A와B|A\s*및\s*B)/i.test(q);
    }

    function comparisonCue(q) {
      return /(비교|각각|나눠서|나누어|나눠\s*봐|대칭|A.{0,14}B|둘.{0,10}(차이|비교)|누가.{0,20}더\s*(강|높|크|가능))/i.test(q);
    }

    function explicitChoiceDecision(q) {
      return /(둘\s*중.{0,12}(누구|어느\s*사람).{0,12}(선택|고르|택)|누구를.{0,10}(선택|고르|택)|어느\s*사람과.{0,12}(만나|사귀|재회)|최종\s*선택|누굴\s*택)/i.test(q);
    }

    function explicitYear(q) {
      const m = q.match(/\b((?:19|20)\d{2})\s*년/);
      return m ? Number(m[1]) : null;
    }

    function periodInfo(q) {
      const year = explicitYear(q) || new Date().getFullYear();

      const monthMatches = [...q.matchAll(/(1[0-2]|0?[1-9])\s*월/g)]
        .map(m => Number(m[1]))
        .filter((n, i, a) => a.indexOf(n) === i);

      let months = [];
      let label = '';

      if (/하반기/i.test(q)) {
        months = [7,8,9,10,11,12];
        label = `${year}년 하반기`;
      } else if (/상반기/i.test(q)) {
        months = [1,2,3,4,5,6];
        label = `${year}년 상반기`;
      } else if (monthMatches.length >= 2) {
        const a = Math.min(monthMatches[0], monthMatches[monthMatches.length - 1]);
        const b = Math.max(monthMatches[0], monthMatches[monthMatches.length - 1]);
        months = Array.from({length: b-a+1}, (_,i)=>a+i);
        label = `${year}년 ${a}~${b}월`;
      } else if (monthMatches.length === 1) {
        months = [monthMatches[0]];
        label = `${year}년 ${monthMatches[0]}월`;
      } else {
        label = `${year}년 질문 기간`;
      }

      return { year, months, label };
    }

    function extractCompareAxes(q) {
      const hits = [];

      COMPARE_AXES.forEach(([id, label, re], order) => {
        const m = q.match(re);
        if (!m) return;
        hits.push({
          id, label,
          index: Number.isFinite(m.index) ? m.index : 999999,
          order
        });
      });

      hits.sort((a,b)=>a.index-b.index || a.order-b.order);

      const labels = [];
      hits.forEach(x => {
        if (!labels.includes(x.label)) labels.push(x.label);
      });

      if (!labels.length && /자세히|세세하게|디테일|심층/i.test(q)) {
        return COMPARE_AXES.map(x => x[1]);
      }
      return labels.length ? labels : COMPARE_AXES.map(x => x[1]);
    }

    function requestProfile(q) {
      const types = {
        fleeting: fleetingCue(q),
        past: pastCue(q),
        new: newCue(q)
      };

      return {
        count: unknownCountCue(q),
        timing: whenCue(q),
        method: howCue(q),
        monthly: monthlyCue(q),
        priorRelationship: /(기존|과거|예전|당시).{0,12}(나와|우리|사이|관계)|어떤\s*사이였/i.test(q),
        types
      };
    }

    function detectRoute(question) {
      const q = norm(question);
      const req = requestProfile(q);
      const typeCount = Object.values(req.types).filter(Boolean).length;

      // 1. Explicit A/B comparison outranks everything.
      if (pastCue(q) && pairCue(q) && comparisonCue(q)) {
        return {
          mode: 'person_comparison',
          targetCount: 2,
          targetCountMode: 'fixed',
          relation: 'parallel_comparison',
          decisionRequested: explicitChoiceDecision(q),
          request: req,
          period: periodInfo(q)
        };
      }

      // 2. Mixed relationship-field survey outranks past-only count scan.
      // This is the key V4 fix for:
      // "스쳐가는 / 과거 / 새로운 인연 몇 명 + 언제 + 어떻게 + 월별".
      if (
        romanceCue(q) &&
        req.count &&
        (
          typeCount >= 2 ||
          (req.monthly && (req.timing || req.method)) ||
          (pastCue(q) && newCue(q))
        )
      ) {
        return {
          mode: 'relationship_field_scan',
          targetCount: null,
          targetCountMode: 'infer',
          relation: 'mixed_connection_field',
          decisionRequested: false,
          request: req,
          period: periodInfo(q)
        };
      }

      // 3. Past-only unknown count remains available.
      if (pastCue(q) && req.count) {
        return {
          mode: 'past_count_infer',
          targetCount: null,
          targetCountMode: 'infer',
          relation: 'independent_candidate_flows',
          decisionRequested: false,
          request: req,
          period: periodInfo(q)
        };
      }

      return null;
    }

    function buildComparison(q, route) {
      const axes = extractCompareAxes(q);
      const positions = [
        ...axes.map((axis,i)=>`A · 축 ${i+1} · ${axis}`),
        ...axes.map((axis,i)=>`B · 축 ${i+1} · ${axis}`)
      ];

      return {
        spreadTitle: `과거 인연 A/B · ${axes.length}축 대칭 비교 · ${positions.length}카드`,
        layoutType: 'structural-v4-person-comparison',
        positions,
        designRationale: [
          '[STRUCTURAL ROUTING V4]',
          'primary_intent=person_comparison',
          'target_count=2',
          'target_count_mode=fixed',
          'relation=parallel_comparison',
          `decision_requested=${route.decisionRequested ? 'true' : 'false'}`,
          `requested_axes=${axes.join(' / ')}`,
          'comparison != choice',
          'coverage=100%',
          'A/B same axes, same order'
        ].join(' · '),
        _luneaStructuralV4: {
          mode: 'person_comparison',
          axes,
          axisCount: axes.length,
          decisionRequested: route.decisionRequested,
          pages: [
            {label:'과거 인연 A', indices:Array.from({length:axes.length},(_,i)=>i)},
            {label:'과거 인연 B', indices:Array.from({length:axes.length},(_,i)=>axes.length+i)}
          ]
        }
      };
    }

    function buildRelationshipFieldScan(q, route) {
      const p = route.period;
      const period = p.label;
      const req = route.request;

      const positions = [
        `전체 · ${period} 연애/인연장의 전체 활성도와 관계 흐름의 큰 방향`,
        `전체 · 후보 흐름들이 같은 사람의 중복 신호인지 서로 다른 독립 인연인지 가르는 분리 신호`
      ];

      const slots = ['A','B','C','D'];
      for (const s of slots) {
        positions.push(
          `후보 ${s} · 다른 후보와 구분되는 독립 존재 신호 — 실제 한 사람의 별도 흐름이 성립하는지`,
          `후보 ${s} · 관계 유형·정체 시그니처 — 스쳐가는 인연 / 과거·기존 인연 / 새로운 인연 중 어디에 가까운지${req.priorRelationship ? ' · 과거/기존 인연이라면 나와 어떤 관계였는지' : ''}`
        );

        if (req.method) {
          positions.push(
            `후보 ${s} · 등장·접근 방식 — 어떤 경로와 방식으로 연결되거나 다시 나타나는지`
          );
        }

        if (req.timing) {
          positions.push(
            `후보 ${s} · ${period} 안의 활성 시기 — 어느 달/단계에서 존재감이 커지는지`
          );
        }
      }

      const monthStartIndex = positions.length;
      const months = req.monthly ? p.months : [];

      months.forEach(m => {
        positions.push(
          `${p.year}년 ${m}월 · 월별 연애/인연 흐름 — 유입·접촉·관계 변화의 핵심 테마`
        );
      });

      // Max 10 live cards per page. Logical spread remains complete in state.drawn.
      const pages = [];
      for (let start = 0; start < positions.length; start += 10) {
        const indices = Array.from(
          {length: Math.min(10, positions.length - start)},
          (_,i)=>start+i
        );
        pages.push({
          label:
            start === 0 ? '전체 + 후보군'
            : (months.length && start >= monthStartIndex ? '월별 흐름' : '후보군 계속'),
          indices
        });
      }

      const covered = [
        'count',
        'connection_type',
        req.method ? 'entry_method' : null,
        req.timing ? 'timing' : null,
        req.priorRelationship ? 'prior_relationship' : null,
        req.monthly ? 'monthly_flow' : null
      ].filter(Boolean);

      return {
        spreadTitle:
          `${period} 연애 인연 지도 · ${covered.join('/')} · ${positions.length}카드`,
        layoutType: 'structural-v4-relationship-field-scan',
        positions,
        designRationale: [
          '[STRUCTURAL ROUTING V4]',
          'primary_intent=relationship_field_scan',
          `requested_axes=${covered.join('+')}`,
          'target_count_mode=infer',
          'candidate_flow_limit=4',
          'relation=mixed_connection_field',
          `period=${period}`,
          'candidate_types=fleeting/past/new/other',
          'count_method=independent_existence_signals + global_dedup_signal',
          'if all 4 candidate signals are strong -> report 4명 이상 / scan ceiling reached',
          'monthly cards do not equal person count',
          'card numerology/court-card count cannot determine people count',
          'unrequested axes are not added',
          'coverage=100%'
        ].join(' · '),
        _luneaStructuralV4: {
          mode: 'relationship_field_scan',
          candidateLimit: 4,
          period,
          months,
          request: req,
          pages,
          coverage: covered
        }
      };
    }

    function buildPastCount(q, route) {
      const positions = [
        '전체 · 질문한 기간에 과거 인연 재유입 흐름 자체가 활성화되는가',
        '전체 · 한 사람의 단일 흐름인지 복수의 독립 흐름인지 가르는 분리 신호',
        '후보 A · 다른 후보와 구분되는 독립 존재 신호',
        '후보 A · 과거 관계 시그니처·성격·특징',
        '후보 A · 다시 떠올리거나 다가오려는 이유·동기',
        '후보 B · 다른 후보와 구분되는 독립 존재 신호',
        '후보 B · 과거 관계 시그니처·성격·특징',
        '후보 B · 다시 떠올리거나 다가오려는 이유·동기',
        '후보 C · 다른 후보와 구분되는 독립 존재 신호',
        '후보 C · 과거 관계 시그니처·성격·특징',
        '후보 C · 다시 떠올리거나 다가오려는 이유·동기'
      ];

      return {
        spreadTitle:'과거 인연 재유입 · 인원 추론 · 11카드',
        layoutType:'structural-v4-past-count-infer',
        positions,
        designRationale:[
          '[STRUCTURAL ROUTING V4]',
          'primary_intent=past_connection_scan',
          'target_count_mode=infer',
          'candidate_flow_limit=3',
          'count_method=independent_existence_signals_only',
          'card numerology/court-card count prohibited'
        ].join(' · '),
        _luneaStructuralV4:{
          mode:'past_count_infer',
          candidateLimit:3
        }
      };
    }

    function buildResult(q, route) {
      if (route.mode === 'person_comparison') return buildComparison(q, route);
      if (route.mode === 'relationship_field_scan') return buildRelationshipFieldScan(q, route);
      return buildPastCount(q, route);
    }

    W.designSpread = async function structuralDesignV4(question) {
      const q = norm(question);
      const route = detectRoute(q);

      if (!route) {
        ROUTE.last = null;
        W.LUNEA_STRUCTURAL_ROUTING_LAST = null;
        return previousDesign.apply(this, arguments);
      }

      const result = buildResult(q, route);
      ROUTE.last = {question:q, route, result};
      W.LUNEA_STRUCTURAL_ROUTING_LAST = ROUTE.last;
      console.info('[LUNEA Structural V4 route]', ROUTE.last);
      return result;
    };

    W.readingDirective = function structuralDirectiveV4() {
      const last = ROUTE.last;
      let current = '';
      try { current = norm(state?.question || ''); } catch {}

      if (!last || !sameQuestion(current, last.question)) {
        return typeof previousDirective === 'function'
          ? previousDirective.apply(this, arguments)
          : '';
      }

      if (last.route.mode === 'person_comparison') {
        return `
[STRUCTURAL V4 · A/B 사람 비교]
- primary_intent는 person_comparison이다.
- comparison(비교)과 decision(선택)은 다르다.
- A/B에 같은 축을 같은 순서로 적용한다.
- 각 축에서 A → B → 공통점/차이 순으로 해석한다.
- ${last.route.decisionRequested
          ? '선택까지 명시됐으므로 모든 축 분석 뒤에만 조건부 선택 결론을 허용한다.'
          : '선택 요청이 없으므로 누가 더 낫다/누굴 택하라는 결론을 만들지 않는다.'}`;
      }

      if (last.route.mode === 'relationship_field_scan') {
        return `
[STRUCTURAL V4 · 혼합 연애 인연장 스캔]
- 이 질문은 과거 인연만 묻는 질문이 아니다. 스쳐가는/과거·기존/새로운 인연을 모두 같은 조사 범위에 둔다.
- 후보 A/B/C/D 각각의 독립 존재 신호를 먼저 판정한다.
- 사람 수는 독립 존재 신호가 지지되는 후보 수로만 추정한다.
- 카드 번호·수비학·궁정카드 개수·월별 카드 개수로 사람 수를 세지 않는다.
- 후보의 관계 유형 카드는 스쳐가는/과거·기존/새로운 인연을 분류하는 데 사용한다.
- 과거·기존 인연으로 분류된 후보에 대해서만 '예전에 나와 어떤 사이였는지'를 구체화한다. 새로운/스쳐가는 후보에게 과거사를 지어내지 않는다.
- 등장 방식과 등장 시기는 서로 다른 축이다.
- 월별 카드는 각 달의 연애장 흐름이며 1개월=1명으로 해석하지 않는다.
- 후보 4개의 독립 존재 신호가 모두 강하면 정확히 4명이라고 닫지 말고 '4명 이상 가능성 / 이 배열의 탐색 상한 도달'이라고 말한다.
- Timing Oracle/Transit 계산값이 있으면 후보의 시기 카드와 월별 흐름을 그 계산 범위 안에서만 교차 확인한다.`;
      }

      if (last.route.mode === 'past_count_infer') {
        return `
[STRUCTURAL V4 · 과거 인연 인원 추론]
- target_count_mode는 infer다.
- 카드 번호·수비학·궁정카드 개수로 사람 수를 세지 않는다.
- 후보 A/B/C의 독립 존재 신호를 먼저 판정한다.
- 존재 신호가 지지되는 후보만 인원 추정에 포함한다.`;
      }

      return '';
    };

    W.promptString = function structuralPromptV4() {
      let prompt = String(previousPrompt.apply(this, arguments) || '');
      const last = ROUTE.last;

      let current = '';
      try { current = norm(state?.question || ''); } catch {}
      if (!last || !sameQuestion(current, last.question)) return prompt;

      const replacement =
        last.route.mode === 'person_comparison'
          ? 'person_comparison · 두 사람 병렬 대칭 비교'
          : last.route.mode === 'relationship_field_scan'
            ? 'relationship_field_scan · 혼합 연애 인연장 종합 조사'
            : 'past_connection_scan · 대상 수 추론';

      prompt = prompt.replace(
        /\[질문 유형\]\s*\n[^\n]+/i,
        `[질문 유형]\n${replacement}`
      );

      prompt += `

[STRUCTURAL V4 · ROUTER TRACE]
- mode: ${last.route.mode}
- target_count_mode: ${last.route.targetCountMode}
- relation: ${last.route.relation}
- period: ${last.route.period?.label || 'unspecified'}
- requested: ${JSON.stringify(last.route.request || {})}
- spread coverage: 100%
- 라우터가 이미 보존한 질문 축을 다른 주제로 축소하거나 바꾸지 않는다.`;

      return prompt;
    };

    /*
      Later Timing/Gloss modules wrap the bare global promptString binding.
      Keep it identical to window.promptString before those modules load.
    */
    try { promptString = W.promptString; } catch {}

    // -------------------------
    // Paged renderer for V4-only large spreads
    // -------------------------
    const cardsEl = document.getElementById('cards');
    const resultsEl = document.getElementById('results');
    const flipAllBtn = document.getElementById('flipAll');
    const extraCardBtn = document.getElementById('extraCard');

    const originalFlipAll = flipAllBtn?.onclick || null;
    const originalExtra = extraCardBtn?.onclick || null;
    const originalExtraDisplay = extraCardBtn?.style?.display || '';

    function ensurePager() {
      let pager = document.getElementById('luneaStructuralV4Pager');
      if (pager) return pager;

      const style = document.createElement('style');
      style.id = 'luneaStructuralV4PagerStyle';
      style.textContent = `
        #luneaStructuralV4Pager{
          display:none;margin:7px 0 11px;padding:10px;
          border:1px solid rgba(189,164,248,.20);
          border-radius:14px;background:rgba(189,164,248,.06)
        }
        #luneaStructuralV4Pager.show{display:block}
        #luneaStructuralV4Pager .v4top{
          display:flex;justify-content:space-between;gap:8px;
          align-items:center;margin-bottom:8px;font-size:10px;color:#d8d0e3
        }
        #luneaStructuralV4Pager .v4label{font-weight:850;color:#fff}
        #luneaStructuralV4Pager .v4nav{display:flex;gap:7px}
        #luneaStructuralV4Pager button{
          flex:1;padding:9px;border-radius:10px;
          border:1px solid rgba(189,164,248,.28);
          background:rgba(189,164,248,.11);color:#eee7ff;
          font-size:10.5px;font-weight:800;touch-action:manipulation
        }
        #luneaStructuralV4Pager button:disabled{opacity:.35}
      `;
      document.head.appendChild(style);

      pager = document.createElement('div');
      pager.id = 'luneaStructuralV4Pager';
      pager.innerHTML = `
        <div class="v4top">
          <span class="v4label" id="luneaV4PageLabel">1/1</span>
          <span id="luneaV4PageProgress">0/0 공개</span>
        </div>
        <div class="v4nav">
          <button type="button" id="luneaV4Prev">← 이전</button>
          <button type="button" id="luneaV4Next">다음 →</button>
        </div>`;

      cardsEl?.insertAdjacentElement('beforebegin', pager);

      document.getElementById('luneaV4Prev')?.addEventListener('click', () => {
        const pg = state?.__luneaStructuralV4Page;
        if (!pg) return;
        renderPage(Math.max(0, pg.page - 1));
      });

      document.getElementById('luneaV4Next')?.addEventListener('click', () => {
        const pg = state?.__luneaStructuralV4Page;
        if (!pg) return;
        renderPage(Math.min(pg.pages.length - 1, pg.page + 1));
      });

      return pager;
    }

    function restoreNormalUI() {
      document.getElementById('luneaStructuralV4Pager')?.classList.remove('show');

      if (flipAllBtn) {
        flipAllBtn.onclick = originalFlipAll;
        flipAllBtn.textContent = '✦ 일괄 뒤집기';
      }

      if (extraCardBtn) {
        extraCardBtn.onclick = originalExtra;
        extraCardBtn.disabled = false;
        extraCardBtn.style.display = originalExtraDisplay;
      }

      try { delete state.__luneaStructuralV4Page; } catch {}
    }

    function restoreClarifiers(i) {
      const item = state?.drawn?.[i];
      if (!item?.subCards?.length) return;

      const cont = document.getElementById('clar-' + i);
      const btn = document.getElementById('clarBtn-' + i);
      if (!cont) return;

      cont.replaceChildren();
      cont.style.display = 'flex';

      item.subCards.forEach((sub, idx) => {
        const d = document.createElement('div');
        d.className = 'clar';
        const b = document.createElement('b');
        b.textContent = `보조 #${idx + 1}`;
        d.append('↳ ', b, ` ${sub.name} (${sub.isReversed ? '역' : '정'}) · ${sub.keyword || ''}`);
        cont.appendChild(d);
      });

      if (btn) {
        btn.textContent = `+ 보조 (${item.subCards.length}/3)`;
        btn.disabled = item.subCards.length >= 3;
      }
    }

    function updatePager() {
      const pg = state?.__luneaStructuralV4Page;
      if (!pg) return;

      const pageDef = pg.pages[pg.page];
      const revealed = pageDef.indices.filter(i => pg.flipped.has(i)).length;

      const label = document.getElementById('luneaV4PageLabel');
      const progress = document.getElementById('luneaV4PageProgress');
      const prev = document.getElementById('luneaV4Prev');
      const next = document.getElementById('luneaV4Next');

      if (label) label.textContent = `${pageDef.label} · ${pg.page + 1}/${pg.pages.length}`;
      if (progress) progress.textContent = `${revealed}/${pageDef.indices.length} 공개`;
      if (prev) prev.disabled = pg.page === 0;
      if (next) next.disabled = pg.page === pg.pages.length - 1;
      if (flipAllBtn) flipAllBtn.textContent = `✦ 현재 ${pageDef.indices.length}장 전체 뒤집기`;
    }

    function renderPage(page) {
      const pg = state?.__luneaStructuralV4Page;
      if (!pg || !cardsEl) return;

      pg.page = page;
      const pageDef = pg.pages[page];

      cardsEl.replaceChildren();
      resultsEl?.replaceChildren();

      const frag = document.createDocumentFragment();

      pageDef.indices.forEach(i => {
        const item = state.drawn[i];
        if (!item) return;
        frag.appendChild(makeCardWrapper(i, item, item.isReversed));
      });

      cardsEl.appendChild(frag);

      pageDef.indices.forEach(i => {
        if (!pg.flipped.has(i)) return;
        document.getElementById('card-' + i)?.classList.add('flipped');

        try {
          renderInfo(i);
          restoreClarifiers(i);
        } catch (err) {
          console.warn('[LUNEA Structural V4] restore info failed', i, err);
        }
      });

      updatePager();

      const modal = document.querySelector('#spreadOverlay .modal');
      if (modal) {
        try { modal.scrollTo({top:0, behavior:'auto'}); }
        catch { modal.scrollTop = 0; }
      }
    }

    function startPaged(question, positions, title, rationale, last) {
      const pages = last.result?._luneaStructuralV4?.pages;
      if (!Array.isArray(pages) || !pages.length) {
        return previousStartSpread(question, positions, title, rationale);
      }

      state.question = question || '현재 나에게 필요한 흐름';
      state.positions = positions;
      state.title = title;
      state.rationale = rationale;
      state.drawn = [];
      state.used = new Set();

      cardsEl?.replaceChildren();
      resultsEl?.replaceChildren();
      document.getElementById('aiBox')?.replaceChildren();

      const spreadType = document.getElementById('spreadType');
      const spreadQuestion = document.getElementById('spreadQuestion');
      const spreadRationale = document.getElementById('spreadRationale');

      if (spreadType) spreadType.textContent = title;
      if (spreadQuestion) spreadQuestion.textContent = '“' + state.question + '”';
      if (spreadRationale) {
        spreadRationale.style.display = rationale ? 'block' : 'none';
        spreadRationale.textContent = rationale || '';
      }

      const shuffled = secureShuffle(TAROT_DECK);
      const selected = shuffled.slice(0, positions.length);

      selected.forEach((card,i) => {
        const isReversed = state.allowReversed && secureBool();
        state.used.add(card.code);
        state.drawn.push({
          ...card,
          isReversed,
          position:positions[i],
          subCards:[]
        });
      });

      state.__luneaStructuralV4Page = {
        page:0,
        pages,
        flipped:new Set()
      };

      ensurePager()?.classList.add('show');

      // Extra cards on a multi-page structural reading create ambiguous parentage.
      if (extraCardBtn) {
        extraCardBtn.disabled = true;
        extraCardBtn.style.display = 'none';
      }

      if (flipAllBtn) {
        flipAllBtn.onclick = () => {
          const pg = state.__luneaStructuralV4Page;
          if (!pg) return;
          const pageDef = pg.pages[pg.page];

          pageDef.indices.forEach(i => {
            flipAt(i);
            pg.flipped.add(i);
          });
          updatePager();
        };
      }

      renderPage(0);
      document.getElementById('sheet')?.classList.remove('open');
      showOverlay('spreadOverlay');
    }

    W.startSpread = function structuralStartV4(question, positions, title, rationale) {
      const last = ROUTE.last;
      const pages = last?.result?._luneaStructuralV4?.pages;

      const shouldPage =
        last &&
        sameQuestion(question, last.question) &&
        Array.isArray(positions) &&
        positions.length === last.result.positions.length &&
        Array.isArray(pages) &&
        pages.length > 1;

      if (!shouldPage) {
        restoreNormalUI();
        return previousStartSpread.apply(this, arguments);
      }

      return startPaged(question, positions, title, rationale, last);
    };

    if (cardsEl) {
      const cardEvent = W.PointerEvent ? 'pointerup' : 'click';

      cardsEl.addEventListener(cardEvent, event => {
        const pg = state?.__luneaStructuralV4Page;
        if (!pg) return;

        const wrapper = event.target?.closest?.('.tarot-card-wrapper');
        if (!wrapper) return;

        const i = Number(wrapper.dataset.index);
        requestAnimationFrame(() => {
          if (document.getElementById('card-' + i)?.classList.contains('flipped')) {
            pg.flipped.add(i);
            updatePager();
          }
        });
      }, {passive:true});
    }

    const badge = document.querySelector('.engine-strip span:last-child');
    if (badge) {
      badge.innerHTML =
        '<b>Secure Draw + Spread V7.4 + Structural V4</b> · 구조 우선 · 혼합 인연장 · A/B 대칭 · 월별 커버리지';
    }

    W.LUNEA_STRUCTURAL_ROUTING_V4 = {
      detectRoute,
      periodInfo,
      extractCompareAxes,
      requestProfile,
      buildResult,
      getLast:()=>ROUTE.last
    };

    console.info('🌙 LUNEA Structural Routing V4 loaded');
    return true;
  }

  if (install()) return;

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries >= 20) {
      clearInterval(timer);
      if (tries >= 20 && !W.__LUNEA_STRUCTURAL_ROUTING_V4__) {
        console.warn('[LUNEA Structural V4] base functions never became ready');
      }
    }
  }, 50);
})();
