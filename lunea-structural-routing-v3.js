'use strict';

/*
  LUNEA STRUCTURAL ROUTING V3
  ===========================
  Purpose:
  - deterministic two-person comparison routing
  - comparison != choice
  - exact A/B symmetry
  - paged rendering for iPhone (A page / B page)
  - full logical draw preserved for AI prompt + archive

  Important:
  - load DIRECTLY after spread-engine-v7.4.js
  - blocks the older Structural V2 dynamic loader
  - does not touch RNG, Tarot deck, Timing, astrology, profile or storage
*/
(() => {
  const W = window;

  if (W.__LUNEA_STRUCTURAL_ROUTING_V3__) return;

  function install() {
    if (W.__LUNEA_STRUCTURAL_ROUTING_V3__) return true;

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
    ) {
      return false;
    }

    /*
      Structural V2 is still requested dynamically by iOS Performance V306.
      Mark V2 as already handled so that older script exits without overriding V3.
    */
    W.__LUNEA_STRUCTURAL_ROUTING_V2__ = true;
    W.__LUNEA_STRUCTURAL_ROUTING_V3__ = true;

    const ROUTE = { last: null };

    const AXES = [
      {
        id: 'past_relationship',
        label: '과거 관계의 성격',
        re: /(과거|당시|예전|그때).{0,12}(관계|사이)|어떤\s*관계였|어떤\s*사이였|관계의?\s*성격/i
      },
      {
        id: 'atmosphere',
        label: '당시 관계 분위기',
        re: /(당시|그때|예전).{0,10}(분위기|기류|온도)|관계\s*(분위기|기류)/i
      },
      {
        id: 'breakup_reason',
        label: '관계가 끝난 이유',
        re: /(끝난|끝나게\s*된|헤어진|이별한|단절된).{0,8}(이유|원인)|왜.{0,8}(끝났|헤어졌|끊겼)|관계\s*종료.{0,6}(이유|원인)/i
      },
      {
        id: 'personality',
        label: '성격·기본 성향',
        re: /(성격|기질|기본\s*성향|개인적\s*성향|사람\s*성향)/i
      },
      {
        id: 'love_style',
        label: '연애 방식·애정 표현',
        re: /(연애\s*(방식|스타일|성향)|애정\s*(표현|방식)|사랑\s*(방식|스타일))/i
      },
      {
        id: 'attitude_to_me',
        label: '나를 대했던 태도',
        re: /(나를|나한테|내게|나에게).{0,10}(대했던|대하는|보였던|취했던).{0,6}태도|나에\s*대한\s*태도/i
      },
      {
        id: 'recall_reason',
        label: '현재 나를 다시 떠올리는 이유',
        re: /(다시\s*)?(떠올리는|생각하는|생각나는).{0,8}(이유|원인)|왜.{0,10}(다시\s*)?(떠올|생각)|현재.{0,10}(떠올|생각).{0,8}(이유|원인)/i
      },
      {
        id: 'return_motive',
        label: '다시 다가오려는 이유·동기',
        re: /(다시\s*)?(다가오|접근|돌아오|재접근|연락하).{0,10}(이유|동기|목적)|다가오려는\s*(이유|동기)/i
      },
      {
        id: 'approach_style',
        label: '실제 접근·연락 방식',
        re: /(접근|다가오는|연락|재접근).{0,6}(방식|스타일|패턴)|어떤\s*식으로.{0,8}(접근|연락|다가)/i
      },
      {
        id: 'action_likelihood',
        label: '실제로 움직일 가능성',
        re: /(실제|현실에서).{0,10}(움직|행동|연락).{0,10}(가능성|확률|강|높)|누가.{0,18}(실제\s*)?(움직|행동|연락).{0,10}(강|높|먼저)|행동\s*가능성/i
      },
      {
        id: 'reconnection_potential',
        label: '관계가 다시 이어질 가능성',
        re: /(관계|인연).{0,10}다시.{0,10}(이어|연결|회복).{0,10}(가능성|여지)|재회\s*가능성|재연결\s*가능성|다시\s*이어질\s*가능성/i
      }
    ];

    const DEFAULT_COMPARE_AXES = AXES.map(x => x.label);

    function norm(q) {
      return String(q || '')
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function sameQuestion(a, b) {
      return norm(a) === norm(b);
    }

    function pastConnectionCue(q) {
      return /(과거\s*인연|옛\s*인연|예전\s*인연|지난\s*인연|전\s*인연|전남친|전여친|전애인|구남친|구여친|구\s*썸|과거\s*썸|예전에\s*만났|전에\s*만났|헤어졌던\s*사람|끝났던\s*사람)/i.test(q);
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

    function unknownCountCue(q) {
      return /(몇\s*명|몇명|몇\s*사람|인원\s*수|한\s*명인지|두\s*명인지|복수.{0,10}인지|몇\s*개의?\s*인연)/i.test(q);
    }

    function extractAxes(q) {
      const hits = [];

      AXES.forEach((axis, order) => {
        const match = q.match(axis.re);
        if (!match) return;
        hits.push({
          id: axis.id,
          label: axis.label,
          index: Number.isFinite(match.index) ? match.index : 999999,
          order
        });
      });

      hits.sort((a, b) => a.index - b.index || a.order - b.order);

      const labels = [];
      hits.forEach(hit => {
        if (!labels.includes(hit.label)) labels.push(hit.label);
      });

      /*
        "자세히 비교"만 있고 축을 따로 쓰지 않은 경우에만 표준 11축 사용.
        하나라도 구체 축을 썼으면 사용자가 쓴 축만 보존한다.
      */
      if (!labels.length && /자세히|세세하게|디테일|심층/i.test(q)) {
        return DEFAULT_COMPARE_AXES.slice();
      }

      return labels.length ? labels : DEFAULT_COMPARE_AXES.slice();
    }

    function detectRoute(question) {
      const q = norm(question);

      if (pastConnectionCue(q) && pairCue(q) && comparisonCue(q)) {
        return {
          mode: 'person_comparison',
          targetCount: 2,
          targetCountMode: 'fixed',
          relation: 'parallel_comparison',
          decisionRequested: explicitChoiceDecision(q)
        };
      }

      if (pastConnectionCue(q) && unknownCountCue(q)) {
        return {
          mode: 'past_count_infer',
          targetCount: null,
          targetCountMode: 'infer',
          relation: 'independent_candidate_flows',
          decisionRequested: false
        };
      }

      return null;
    }

    function buildComparison(question, route) {
      const axes = extractAxes(question);
      const positions = [
        ...axes.map((axis, i) => `A · 축 ${i + 1} · ${axis}`),
        ...axes.map((axis, i) => `B · 축 ${i + 1} · ${axis}`)
      ];

      return {
        spreadTitle: `과거 인연 A/B · ${axes.length}축 대칭 비교 · ${positions.length}카드`,
        layoutType: 'structural-v3-person-comparison',
        positions,
        designRationale: [
          '[STRUCTURAL ROUTING V3]',
          'primary_intent=person_comparison',
          'secondary_intent=relationship_history + return_behavior',
          'target_count=2',
          'target_count_mode=fixed',
          'relation=parallel_comparison',
          `decision_requested=${route.decisionRequested ? 'true' : 'false'}`,
          `requested_axes=${axes.join(' / ')}`,
          'comparison != choice',
          'A와 B에 같은 축을 같은 순서로 적용',
          '한 축에 A/B를 모두 답한 뒤 다음 축으로 비교',
          route.decisionRequested
            ? '사용자가 선택까지 명시했을 때만 마지막에 조건부 선택 가능'
            : '선택 요청 없음: 누가 더 좋은 사람인지/누굴 택할지 임의 결론 금지',
          '행동 가능성 비교와 재연결 가능성 비교는 각각 독립 축',
          '화면은 A/B 두 페이지로 나누되 논리적 리딩은 하나의 전체 리딩'
        ].join(' · '),
        _luneaStructuralV3: {
          mode: 'person_comparison',
          axes,
          axisCount: axes.length,
          targetCount: 2,
          targetCountMode: 'fixed',
          relation: 'parallel_comparison',
          decisionRequested: route.decisionRequested
        }
      };
    }

    function buildUnknownCount(question, route) {
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
        spreadTitle: '과거 인연 재유입 · 인원 추론 · 11카드',
        layoutType: 'structural-v3-past-count-infer',
        positions,
        designRationale: [
          '[STRUCTURAL ROUTING V3]',
          'primary_intent=past_connection_scan',
          'target_count_mode=infer',
          'candidate_flow_limit=3',
          'relation=independent_candidate_flows',
          '카드 번호·수비학·궁정카드 개수로 인원수 계산 금지',
          '각 후보의 독립 존재 신호가 먼저 성립해야 해당 후보를 실제 인연 흐름으로 취급',
          '특징과 재접근 이유는 존재 신호가 지지되는 후보에 대해서만 구체화'
        ].join(' · '),
        _luneaStructuralV3: {
          mode: 'past_count_infer',
          targetCountMode: 'infer',
          candidateLimit: 3
        }
      };
    }

    W.designSpread = async function luneaStructuralDesignV3(question) {
      const q = norm(question);
      const route = detectRoute(q);

      if (!route) {
        ROUTE.last = null;
        W.LUNEA_STRUCTURAL_ROUTING_LAST = null;
        return previousDesign.apply(this, arguments);
      }

      const result =
        route.mode === 'person_comparison'
          ? buildComparison(q, route)
          : buildUnknownCount(q, route);

      ROUTE.last = { question: q, route, result };
      W.LUNEA_STRUCTURAL_ROUTING_LAST = ROUTE.last;

      console.info('[LUNEA Structural V3 route]', ROUTE.last);
      return result;
    };

    /*
      V7.4 currently classifies the word "비교" as choice.
      Do NOT replace analyzeQuestionIntent globally.
      Instead, rewrite ONLY the visible prompt type for a reading that V3
      itself routed. This keeps Timing/other routers untouched.
    */
    W.promptString = function luneaStructuralPromptV3() {
      let prompt = String(previousPrompt.apply(this, arguments) || '');

      const last = ROUTE.last;
      let current = '';
      try { current = norm(state?.question || ''); } catch {}

      if (!last || !sameQuestion(current, last.question)) return prompt;

      if (last.route.mode === 'person_comparison') {
        prompt = prompt.replace(
          /\[질문 유형\]\s*\n(?:choice|양자택일)\b/i,
          '[질문 유형]\nperson_comparison · 두 사람 병렬 대칭 비교'
        );

        prompt += `

[STRUCTURAL V3 · 비교 해석 우선순위]
- 이것은 선택 리딩이 아니라 두 사람 비교 리딩이다.
- A와 B를 축별로 1:1 대칭 비교한다.
- 축 순서를 바꾸거나 A/B 중 한쪽 축을 누락하지 않는다.
- '누가 실제 움직일 가능성이 더 강한가'는 행동 가능성 비교다.
- '누가 관계가 다시 이어질 가능성이 더 있는가'는 재연결 가능성 비교다.
- 위 두 비교를 '누굴 선택해야 하나'로 바꾸지 않는다.
- ${last.route.decisionRequested
          ? '단, 질문자가 별도로 선택까지 명시했으므로 모든 축 분석 뒤 조건부 선택 결론은 허용한다.'
          : '질문자가 선택을 요청하지 않았으므로 최종 승자/선택 권고는 금지한다.'}`;
      }

      if (last.route.mode === 'past_count_infer') {
        prompt = prompt.replace(
          /\[질문 유형\]\s*\n(?:cause|general|reunion|choice)\b/i,
          '[질문 유형]\npast_connection_scan · 대상 수 추론'
        );

        prompt += `

[STRUCTURAL V3 · 인원 추론 우선순위]
- 카드 숫자, 수비학, 궁정카드 장수로 사람 수를 세지 않는다.
- 후보 A/B/C의 독립 존재 신호를 각각 판정한다.
- 독립 존재 신호가 약하면 그 후보는 실제 한 사람으로 세지 않는다.
- 존재 신호가 성립한 후보에 대해서만 특징과 재접근 이유를 해석한다.`;
      }

      return prompt;
    };

    /*
      Keep the global analyzer intact. Override only the extra reading directive
      while the current reading is one routed by V3.
    */
    W.readingDirective = function luneaStructuralDirectiveV3() {
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
[STRUCTURAL V3 · A/B 두 사람 비교 규칙]
- primary_intent는 person_comparison이다.
- comparison(비교)과 decision(선택)을 구분한다.
- A와 B에 완전히 동일한 축을 적용한다.
- 각 축마다 A 근거 → B 근거 → 차이/공통점 순으로 읽는다.
- 과거 관계/분위기/종료 이유/성격/연애 방식/과거 태도/회상 이유/재접근 동기/접근 방식/행동 가능성/재연결 가능성을 서로 섞지 않는다.
- ${last.route.decisionRequested
          ? '선택 요청이 명시되어 있으므로 마지막에만 조건부 선택 결론을 허용한다.'
          : '선택 요청이 없으므로 누가 더 낫다/누굴 선택하라는 결론은 금지한다.'}`;
      }

      if (last.route.mode === 'past_count_infer') {
        return `
[STRUCTURAL V3 · 과거 인연 인원 추론 규칙]
- target_count_mode는 infer다.
- 카드 번호·수비학·궁정카드 개수로 사람 수를 세지 않는다.
- 후보 A/B/C의 독립 존재 신호를 먼저 본다.
- 독립 존재 신호가 지지되는 후보만 인원 추정에 포함한다.
- 특징과 재접근 동기는 존재 신호가 지지된 후보에 대해서만 구체화한다.`;
      }

      return '';
    };

    // ------------------------------------------------------------
    // iPhone-safe two-page renderer (22 logical cards / <=11 live)
    // ------------------------------------------------------------

    const cardsEl = document.getElementById('cards');
    const resultsEl = document.getElementById('results');
    const flipAllBtn = document.getElementById('flipAll');
    const extraCardBtn = document.getElementById('extraCard');
    const aiReadBtn = document.getElementById('aiRead');

    const originalFlipAll = flipAllBtn?.onclick || null;
    const originalExtra = extraCardBtn?.onclick || null;
    const originalExtraDisplay = extraCardBtn?.style?.display || '';

    function ensurePager() {
      let pager = document.getElementById('luneaStructuralV3Pager');
      if (pager) return pager;

      const style = document.createElement('style');
      style.id = 'luneaStructuralV3PagerStyle';
      style.textContent = `
        #luneaStructuralV3Pager{
          display:none;margin:7px 0 11px;padding:10px;
          border:1px solid rgba(189,164,248,.20);
          border-radius:14px;background:rgba(189,164,248,.06)
        }
        #luneaStructuralV3Pager.show{display:block}
        #luneaStructuralV3Pager .v3top{
          display:flex;justify-content:space-between;align-items:center;
          gap:8px;margin-bottom:8px;font-size:10px;color:#d8d0e3
        }
        #luneaStructuralV3Pager .v3who{font-weight:850;color:#fff}
        #luneaStructuralV3Pager .v3nav{display:flex;gap:7px}
        #luneaStructuralV3Pager button{
          flex:1;padding:9px;border-radius:10px;
          border:1px solid rgba(189,164,248,.28);
          background:rgba(189,164,248,.11);color:#eee7ff;
          font-size:10.5px;font-weight:800;touch-action:manipulation
        }
        #luneaStructuralV3Pager button:disabled{opacity:.35}
      `;
      document.head.appendChild(style);

      pager = document.createElement('div');
      pager.id = 'luneaStructuralV3Pager';
      pager.innerHTML = `
        <div class="v3top">
          <span class="v3who" id="luneaV3Who">과거 인연 A · 1/2</span>
          <span id="luneaV3Progress">0/0 공개</span>
        </div>
        <div class="v3nav">
          <button type="button" id="luneaV3Prev">← A 보기</button>
          <button type="button" id="luneaV3Next">B 보기 →</button>
        </div>`;

      cardsEl?.insertAdjacentElement('beforebegin', pager);

      document.getElementById('luneaV3Prev')?.addEventListener('click', () => {
        const pg = state?.__luneaStructuralV3Page;
        if (!pg) return;
        renderPage(0);
      });

      document.getElementById('luneaV3Next')?.addEventListener('click', () => {
        const pg = state?.__luneaStructuralV3Page;
        if (!pg) return;
        renderPage(1);
      });

      return pager;
    }

    function restoreNormalUI() {
      document.getElementById('luneaStructuralV3Pager')?.classList.remove('show');

      if (flipAllBtn) {
        flipAllBtn.onclick = originalFlipAll;
        flipAllBtn.textContent = '✦ 일괄 뒤집기';
      }

      if (extraCardBtn) {
        extraCardBtn.onclick = originalExtra;
        extraCardBtn.disabled = false;
        extraCardBtn.style.display = originalExtraDisplay;
      }

      try { delete state.__luneaStructuralV3Page; } catch {}
    }

    function pageIndices(page, axisCount) {
      const start = page === 0 ? 0 : axisCount;
      return Array.from({ length: axisCount }, (_, i) => start + i);
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
        d.append(
          '↳ ',
          b,
          ` ${sub.name} (${sub.isReversed ? '역' : '정'}) · ${sub.keyword || ''}`
        );
        cont.appendChild(d);
      });

      if (btn) {
        btn.textContent = `+ 보조 (${item.subCards.length}/3)`;
        btn.disabled = item.subCards.length >= 3;
      }
    }

    function updatePager() {
      const pg = state?.__luneaStructuralV3Page;
      if (!pg) return;

      const page = pg.page;
      const indices = pageIndices(page, pg.axisCount);
      const label = page === 0 ? 'A' : 'B';
      const revealed = indices.filter(i => pg.flipped.has(i)).length;

      const who = document.getElementById('luneaV3Who');
      const progress = document.getElementById('luneaV3Progress');
      const prev = document.getElementById('luneaV3Prev');
      const next = document.getElementById('luneaV3Next');

      if (who) who.textContent = `과거 인연 ${label} · ${page + 1}/2 · ${pg.axisCount}축`;
      if (progress) progress.textContent = `${revealed}/${pg.axisCount} 공개`;
      if (prev) prev.disabled = page === 0;
      if (next) next.disabled = page === 1;
      if (flipAllBtn) flipAllBtn.textContent = `✦ ${label} ${pg.axisCount}장 전체 뒤집기`;
    }

    function renderPage(page) {
      const pg = state?.__luneaStructuralV3Page;
      if (!pg || !cardsEl) return;

      pg.page = page;
      const indices = pageIndices(page, pg.axisCount);

      cardsEl.replaceChildren();
      resultsEl?.replaceChildren();

      const frag = document.createDocumentFragment();

      indices.forEach(i => {
        const item = state.drawn[i];
        if (!item) return;
        frag.appendChild(makeCardWrapper(i, item, item.isReversed));
      });

      cardsEl.appendChild(frag);

      indices.forEach(i => {
        if (!pg.flipped.has(i)) return;
        document.getElementById('card-' + i)?.classList.add('flipped');
        try {
          renderInfo(i);
          restoreClarifiers(i);
        } catch (err) {
          console.warn('[LUNEA Structural V3] restore failed', i, err);
        }
      });

      updatePager();

      const modal = document.querySelector('#spreadOverlay .modal');
      if (modal) {
        try { modal.scrollTo({ top: 0, behavior: 'auto' }); }
        catch { modal.scrollTop = 0; }
      }
    }

    function startPagedComparison(question, positions, title, rationale, last) {
      const axisCount =
        last.result?._luneaStructuralV3?.axisCount ||
        Math.floor(positions.length / 2);

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

      selected.forEach((card, i) => {
        const isReversed = state.allowReversed && secureBool();
        state.used.add(card.code);
        state.drawn.push({
          ...card,
          isReversed,
          position: positions[i],
          subCards: []
        });
      });

      state.__luneaStructuralV3Page = {
        page: 0,
        axisCount,
        flipped: new Set()
      };

      ensurePager()?.classList.add('show');

      if (extraCardBtn) {
        extraCardBtn.disabled = true;
        extraCardBtn.style.display = 'none';
      }

      if (flipAllBtn) {
        flipAllBtn.onclick = () => {
          const pg = state.__luneaStructuralV3Page;
          if (!pg) return;

          pageIndices(pg.page, pg.axisCount).forEach(i => {
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

    W.startSpread = function luneaStructuralStartV3(question, positions, title, rationale) {
      const last = ROUTE.last;

      const isComparison =
        last?.route?.mode === 'person_comparison' &&
        sameQuestion(question, last.question) &&
        Array.isArray(positions) &&
        positions.length === last.result.positions.length;

      if (!isComparison) {
        restoreNormalUI();
        return previousStartSpread.apply(this, arguments);
      }

      return startPagedComparison(question, positions, title, rationale, last);
    };

    /*
      Remember individual flips so switching A/B pages restores what the user saw.
    */
    if (cardsEl) {
      const cardEvent = W.PointerEvent ? 'pointerup' : 'click';

      cardsEl.addEventListener(cardEvent, event => {
        const pg = state?.__luneaStructuralV3Page;
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
      }, { passive: true });
    }

    /*
      AI read logically reveals the whole spread. Mark both pages as revealed
      without forcing all 22 card DOM nodes to exist at once.
    */
    aiReadBtn?.addEventListener('click', () => {
      const pg = state?.__luneaStructuralV3Page;
      if (!pg) return;

      for (let i = 0; i < pg.axisCount * 2; i += 1) pg.flipped.add(i);
      requestAnimationFrame(updatePager);
    }, { capture: true, passive: true });

    const badge = document.querySelector('.engine-strip span:last-child');
    if (badge) {
      badge.innerHTML =
        '<b>Secure Draw + Spread V7.4 + Structural V3</b> · comparison≠choice · A/B 축 대칭 · 22논리/11라이브';
    }

    W.LUNEA_STRUCTURAL_ROUTING_V3 = {
      detectRoute,
      extractAxes,
      buildComparison,
      buildUnknownCount,
      getLast: () => ROUTE.last
    };

    console.info('🌙 LUNEA Structural Routing V3 loaded');
    return true;
  }

  /*
    Direct script load should succeed immediately. The short retry is only a
    safety net for mixed cache states; importantly, flags are not set until
    installation actually succeeds.
  */
  if (install()) return;

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries >= 20) {
      clearInterval(timer);
      if (tries >= 20 && !W.__LUNEA_STRUCTURAL_ROUTING_V3__) {
        console.warn('[LUNEA Structural V3] base functions never became ready');
      }
    }
  }, 50);
})();
