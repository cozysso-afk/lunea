'use strict';

/*
  LUNEA STRUCTURAL ROUTING V2
  ---------------------------
  Narrow, structure-first patch for two cases that V7.4 previously collapsed:
  1) A/B comparison of two past/personal connections
  2) unknown-count past-connection scan

  Safety boundaries:
  - does NOT replace analyzeQuestionIntent
  - does NOT touch promptString / RNG / astrology / Timing / storage
  - does NOT use MutationObserver
  - does NOT add contain/content-visibility to 3D cards
  - delegates every unrelated question to the existing V7.4 designSpread
*/
(() => {
  const W = window;
  if (W.__LUNEA_STRUCTURAL_ROUTING_V2__) return;
  W.__LUNEA_STRUCTURAL_ROUTING_V2__ = true;

  const previousDesign = W.designSpread;
  const previousDirective = W.readingDirective;
  const previousStartSpread = W.startSpread;

  if (typeof previousDesign !== 'function' || typeof previousStartSpread !== 'function') {
    console.warn('[LUNEA Structural V2] base functions not ready; patch skipped');
    return;
  }

  const ROUTE_STATE = {
    last: null
  };

  const AXES = [
    {
      id: 'past_relationship',
      label: '과거 관계의 성격',
      re: /(과거\s*관계|당시\s*관계|어떤\s*관계였|관계의\s*성격)/i
    },
    {
      id: 'atmosphere',
      label: '당시 관계 분위기',
      re: /(당시|그때).{0,8}(분위기|기류)|관계\s*분위기/i
    },
    {
      id: 'breakup_reason',
      label: '관계가 끝난 이유',
      re: /(끝난\s*이유|헤어진\s*이유|이별\s*이유|단절.{0,6}이유|관계가.{0,8}끝)/i
    },
    {
      id: 'personality',
      label: '성격·기본 성향',
      re: /(성격|기본\s*성향|사람\s*성향|개인적\s*성향)/i
    },
    {
      id: 'love_style',
      label: '연애 방식·애정 표현',
      re: /(연애\s*(방식|스타일|성향)|애정\s*표현\s*방식|사랑\s*방식)/i
    },
    {
      id: 'attitude_to_me',
      label: '나를 대했던 태도',
      re: /(나를\s*(대했던|대하는)\s*태도|나에\s*대한\s*태도|내게\s*보였던\s*태도)/i
    },
    {
      id: 'recall_reason',
      label: '현재 나를 다시 떠올리는 이유',
      re: /(다시\s*떠올리는\s*이유|현재.{0,12}(떠올|생각).{0,8}이유|왜.{0,8}(다시\s*)?(떠올|생각))/i
    },
    {
      id: 'return_motive',
      label: '다시 다가오려는 이유·동기',
      re: /(다시\s*(다가오|접근|돌아오).{0,8}(이유|동기)|재접근.{0,8}(이유|동기)|다가오려는\s*이유)/i
    },
    {
      id: 'approach_style',
      label: '실제 접근·연락 방식',
      re: /(접근\s*방식|다가오는\s*방식|연락\s*방식|어떤\s*식으로.{0,6}(접근|연락|다가))/i
    },
    {
      id: 'action_likelihood',
      label: '실제로 움직일 가능성',
      re: /(실제.{0,8}(움직|행동).{0,8}가능성|누가.{0,14}(움직|행동).{0,8}(강|높)|행동\s*가능성)/i
    },
    {
      id: 'reconnection_potential',
      label: '관계가 다시 이어질 가능성',
      re: /(관계가.{0,8}다시.{0,8}이어질.{0,8}가능성|재연결.{0,8}가능성|재회.{0,8}가능성|다시\s*이어질\s*가능성)/i
    }
  ];

  const DEFAULT_COMPARE_AXES = [
    '과거 관계의 성격',
    '관계가 끝난 이유',
    '성격·기본 성향',
    '연애 방식·애정 표현',
    '나를 대했던 태도',
    '현재 나를 다시 떠올리는 이유',
    '다시 다가오려는 이유·동기',
    '실제로 움직일 가능성',
    '관계가 다시 이어질 가능성'
  ];

  function norm(q) {
    return String(q || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  }

  function sameQuestion(a, b) {
    return norm(a) === norm(b);
  }

  function pastConnectionCue(q) {
    return /(과거\s*인연|예전\s*인연|지난\s*인연|전남친|전여친|전애인|구남친|구여친|구\s*썸|과거\s*썸|헤어졌던\s*사람|예전에\s*만났)/i.test(q);
  }

  function pairCue(q) {
    return /(두\s*명|두\s*사람|2\s*명|A\s*(?:와|과|랑)\s*B|A\s*\/\s*B|A\s*와\s*B|A와\s*B|A\s*·\s*B)/i.test(q);
  }

  function comparisonCue(q) {
    return /(비교|나눠서|나누어|각각|대칭|둘을.{0,10}보|A.{0,10}B.{0,12}(비교|나눠)|누가.{0,16}더\s*(강|높|크))/i.test(q);
  }

  function explicitChoiceDecision(q) {
    return /(둘\s*중\s*누구.{0,10}(선택|고르|택)|누구를.{0,8}(선택|고르|택)|A\s*(?:와|과)\s*B\s*중.{0,8}(누구|어느)|어느\s*사람과.{0,10}(만나|이어|재회)|최종\s*선택)/i.test(q);
  }

  function unknownCountCue(q) {
    return /(몇\s*명|몇명|몇\s*사람|인원\s*수|한\s*명인지|두\s*명인지|복수.{0,8}인지|몇\s*개의?\s*인연)/i.test(q);
  }

  function extractAxes(q) {
    const hits = [];
    for (const axis of AXES) {
      const m = q.match(axis.re);
      if (!m) continue;
      hits.push({
        label: axis.label,
        id: axis.id,
        index: Number.isFinite(m.index) ? m.index : 99999
      });
    }
    hits.sort((a, b) => a.index - b.index);

    const labels = [];
    for (const hit of hits) {
      if (!labels.includes(hit.label)) labels.push(hit.label);
    }

    if (labels.length >= 3) return labels.slice(0, 11);
    return DEFAULT_COMPARE_AXES.slice();
  }

  function makeABComparison(q) {
    const axes = extractAxes(q);
    const decisionRequested = explicitChoiceDecision(q);

    const positions = [
      ...axes.map((axis, i) => `A · ${i + 1}. ${axis}`),
      ...axes.map((axis, i) => `B · ${i + 1}. ${axis}`)
    ];

    const rationale = [
      '[STRUCTURAL ROUTING V2]',
      'primary_intent=person_comparison',
      'target_count=2',
      'target_count_mode=fixed',
      'relation=parallel_comparison',
      `decision_requested=${decisionRequested ? 'true' : 'false'}`,
      `requested_axes=${axes.join(' / ')}`,
      'A와 B에 완전히 같은 축을 적용한다.',
      '한쪽에만 장점/단점을 몰아주지 않는다.',
      decisionRequested
        ? '사용자가 최종 선택까지 물었으므로 마지막에만 선택 관점의 비교를 허용한다.'
        : '사용자는 사람 비교를 요청했지 선택을 요청한 것이 아니다. 승자/선택 결론을 임의로 만들지 않는다.',
      '감정·회상·재접근 동기와 실제 행동 가능성을 서로 다른 층으로 분리한다.',
      '화면은 iPhone 안정성을 위해 A 카드군과 B 카드군을 분리 렌더하지만 AI 해석/저장 데이터에는 전 카드가 함께 들어간다.'
    ].join(' · ');

    return {
      spreadTitle: `과거 인연 A/B · 대칭 비교 ${axes.length}축 ${positions.length}카드`,
      designRationale: rationale,
      layoutType: 'structural-v2-person-comparison',
      positions,
      _luneaStructural: {
        mode: 'person_comparison',
        axes,
        axisCount: axes.length,
        decisionRequested
      }
    };
  }

  function makeUnknownPastCountScan(q) {
    const positions = [
      '전체 · 질문한 기간에 과거 인연 재유입 흐름이 실제로 활성화되는가',
      '전체 · 한 사람의 단일 흐름인지 복수의 독립 흐름인지 가르는 분리 신호',

      '후보 A · 다른 후보와 구분되는 독립 존재 신호',
      '후보 A · 과거 관계 시그니처·성격·특징',
      '후보 A · 지금 다시 다가오려는 이유·동기',

      '후보 B · 다른 후보와 구분되는 독립 존재 신호',
      '후보 B · 과거 관계 시그니처·성격·특징',
      '후보 B · 지금 다시 다가오려는 이유·동기',

      '후보 C · 다른 후보와 구분되는 독립 존재 신호',
      '후보 C · 과거 관계 시그니처·성격·특징',
      '후보 C · 지금 다시 다가오려는 이유·동기'
    ];

    const rationale = [
      '[STRUCTURAL ROUTING V2]',
      'primary_intent=past_connection_scan',
      'target_count_mode=infer',
      'candidate_flow_limit=3',
      'relation=independent_candidate_flows',
      '인원수는 카드 번호·수비학·궁정카드 개수로 세지 않는다.',
      '후보 A/B/C 각각의 독립 존재 신호가 실제로 지지되는지를 먼저 판별한 뒤, 성립하는 흐름의 수만 인원 추정에 사용한다.',
      '서로 비슷한 카드가 나왔다고 같은 사람 또는 다른 사람이라고 자동 확정하지 않는다.',
      '특징과 재접근 동기는 독립 존재 신호가 지지되는 후보에 대해서만 구체화한다.',
      '3개보다 많은 흐름은 이 배열 하나로 억지 추정하지 않는다.'
    ].join(' · ');

    return {
      spreadTitle: '과거 인연 재유입 · 인원 추론 11카드',
      designRationale: rationale,
      layoutType: 'structural-v2-past-count-infer',
      positions,
      _luneaStructural: {
        mode: 'past_count_infer',
        targetCountMode: 'infer',
        candidateLimit: 3
      }
    };
  }

  function detectRoute(q) {
    const s = norm(q);

    if (pastConnectionCue(s) && pairCue(s) && comparisonCue(s)) {
      return {mode: 'person_comparison'};
    }

    if (pastConnectionCue(s) && unknownCountCue(s)) {
      return {mode: 'past_count_infer'};
    }

    return null;
  }

  W.designSpread = async function structuralDesignSpread(question) {
    const q = norm(question);
    const route = detectRoute(q);

    if (!route) {
      ROUTE_STATE.last = null;
      return previousDesign.apply(this, arguments);
    }

    const result = route.mode === 'person_comparison'
      ? makeABComparison(q)
      : makeUnknownPastCountScan(q);

    ROUTE_STATE.last = {
      question: q,
      mode: route.mode,
      result
    };

    W.LUNEA_STRUCTURAL_ROUTING_LAST = ROUTE_STATE.last;
    console.info('[LUNEA Structural V2]', ROUTE_STATE.last);
    return result;
  };

  /*
    V7's old "choice" directive tells the model to pick a winner.
    For person comparison that is wrong unless the user explicitly asked to choose.
    Only replace the directive for our two structural modes; everything else delegates.
  */
  W.readingDirective = function structuralReadingDirective() {
    const last = ROUTE_STATE.last;
    let current = '';
    try { current = norm(state?.question || ''); } catch {}

    if (!last || !sameQuestion(current, last.question)) {
      return typeof previousDirective === 'function'
        ? previousDirective.apply(this, arguments)
        : '';
    }

    if (last.mode === 'person_comparison') {
      const decisionRequested = !!last.result?._luneaStructural?.decisionRequested;
      return `
[STRUCTURAL V2 · A/B 사람 비교 해석 규칙]
- 이 질문의 primary_intent(주 의도)는 person_comparison(사람 비교)이다.
- A와 B는 동일한 축을 1:1로 대칭 비교한다.
- 각 축에서 A를 설명한 뒤 같은 축의 B를 비교하고, 카드 조합의 공통점과 차이를 정리한다.
- 감정/회상, 재접근 동기, 실제 행동 가능성, 관계 재연결 가능성을 서로 같은 뜻으로 취급하지 않는다.
- ${decisionRequested
        ? '사용자가 선택까지 명시했으므로 모든 비교 근거를 설명한 뒤에만 조건부 선택 결론을 낸다.'
        : '사용자가 선택을 요청하지 않았다. 누가 더 낫다/누구를 선택하라는 승자 결론을 임의로 만들지 않는다.'}
- 질문에 요청된 축을 누락하지 않는다.`;
    }

    if (last.mode === 'past_count_infer') {
      return `
[STRUCTURAL V2 · 과거 인연 인원 추론 규칙]
- target_count_mode(대상 수 모드)는 infer(추론)다. 질문자가 인원수를 미리 확정한 것이 아니다.
- 카드 번호, 수비학 숫자, 메이저/궁정카드 장수로 사람 수를 세지 않는다.
- 후보 A/B/C 각각의 '독립 존재 신호'가 지지되는지 먼저 판별하고, 지지되는 독립 흐름의 수만 0~3명 범위 추정에 사용한다.
- 독립 존재 신호가 약한 후보의 성격·접근 동기를 실제 사람의 특징처럼 확정하지 않는다.
- 3개를 넘는 인원은 이 배열로 억지 추정하지 않는다.
- 존재 가능성, 인물 특징, 다시 다가오는 이유를 서로 분리해 설명한다.`;
    }

    return typeof previousDirective === 'function'
      ? previousDirective.apply(this, arguments)
      : '';
  };

  // ---------------------------
  // iPhone-safe A/B page renderer
  // ---------------------------

  const cardsEl = document.getElementById('cards');
  const flipAllBtn = document.getElementById('flipAll');
  const extraCardBtn = document.getElementById('extraCard');

  const originalFlipAll = flipAllBtn?.onclick || null;
  const originalExtraCard = extraCardBtn?.onclick || null;
  const originalExtraDisplay = extraCardBtn?.style?.display || '';

  function ensurePagerStyle() {
    if (document.getElementById('luneaStructuralPagerStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaStructuralPagerStyle';
    style.textContent = `
      #luneaStructuralPager{
        display:none;
        margin:6px 0 10px;
        padding:9px 10px;
        border:1px solid rgba(189,164,248,.18);
        border-radius:13px;
        background:rgba(189,164,248,.055);
      }
      #luneaStructuralPager.show{display:block}
      #luneaStructuralPager .lsr-head{
        display:flex;align-items:center;justify-content:space-between;gap:8px;
        margin-bottom:7px;font-size:10px;color:#d8d0e3
      }
      #luneaStructuralPager .lsr-title{font-weight:800;color:#f2edfa}
      #luneaStructuralPager .lsr-actions{display:flex;gap:6px}
      #luneaStructuralPager button{
        flex:1;border:1px solid rgba(189,164,248,.25);
        background:rgba(189,164,248,.10);color:#e6dcfa;
        border-radius:10px;padding:8px 9px;font-size:10px;font-weight:750;
        touch-action:manipulation
      }
      #luneaStructuralPager button:disabled{opacity:.35}
    `;
    document.head.appendChild(style);
  }

  function ensurePager() {
    ensurePagerStyle();
    let pager = document.getElementById('luneaStructuralPager');
    if (pager) return pager;

    pager = document.createElement('div');
    pager.id = 'luneaStructuralPager';
    pager.innerHTML = `
      <div class="lsr-head">
        <span class="lsr-title" id="lsrPageTitle">A · 1/2</span>
        <span id="lsrPageProgress">0/0 공개</span>
      </div>
      <div class="lsr-actions">
        <button type="button" id="lsrPrev">← A</button>
        <button type="button" id="lsrNext">B →</button>
      </div>`;
    cardsEl?.insertAdjacentElement('beforebegin', pager);

    document.getElementById('lsrPrev').addEventListener('click', () => {
      if (!state?.__luneaPagedComparison) return;
      renderComparisonPage(Math.max(0, state.__luneaPagedComparison.page - 1));
    });

    document.getElementById('lsrNext').addEventListener('click', () => {
      if (!state?.__luneaPagedComparison) return;
      renderComparisonPage(Math.min(1, state.__luneaPagedComparison.page + 1));
    });

    return pager;
  }

  function restoreNormalControls() {
    const pager = document.getElementById('luneaStructuralPager');
    pager?.classList.remove('show');

    if (flipAllBtn && originalFlipAll) {
      flipAllBtn.onclick = originalFlipAll;
      flipAllBtn.textContent = '✦ 일괄 뒤집기';
    }

    if (extraCardBtn) {
      extraCardBtn.onclick = originalExtraCard;
      extraCardBtn.disabled = false;
      extraCardBtn.style.display = originalExtraDisplay;
    }

    try { delete state.__luneaPagedComparison; } catch {}
  }

  function pageIndices(page, axisCount) {
    const start = page === 0 ? 0 : axisCount;
    return Array.from({length: axisCount}, (_, i) => start + i);
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
    const pg = state?.__luneaPagedComparison;
    if (!pg) return;

    const page = pg.page;
    const indices = pageIndices(page, pg.axisCount);
    const revealed = indices.filter(i => pg.flipped.has(i)).length;
    const label = page === 0 ? 'A' : 'B';

    const title = document.getElementById('lsrPageTitle');
    const progress = document.getElementById('lsrPageProgress');
    const prev = document.getElementById('lsrPrev');
    const next = document.getElementById('lsrNext');

    if (title) title.textContent = `${label} · ${page + 1}/2 · ${pg.axisCount}장`;
    if (progress) progress.textContent = `${revealed}/${pg.axisCount} 공개`;
    if (prev) prev.disabled = page === 0;
    if (next) next.disabled = page === 1;

    if (flipAllBtn) flipAllBtn.textContent = `✦ ${label} 전체 뒤집기`;
  }

  function renderComparisonPage(page) {
    const pg = state?.__luneaPagedComparison;
    if (!pg || !cardsEl) return;

    pg.page = page;
    const indices = pageIndices(page, pg.axisCount);

    cardsEl.replaceChildren();
    const results = document.getElementById('results');
    results?.replaceChildren();

    const frag = document.createDocumentFragment();

    indices.forEach(i => {
      const item = state.drawn[i];
      if (!item) return;
      frag.appendChild(makeCardWrapper(i, item, item.isReversed));
    });

    cardsEl.appendChild(frag);

    indices.forEach(i => {
      if (!pg.flipped.has(i)) return;
      const card = document.getElementById('card-' + i);
      card?.classList.add('flipped');
      try {
        renderInfo(i);
        restoreClarifiers(i);
      } catch (err) {
        console.warn('[LUNEA Structural V2] restore info failed', i, err);
      }
    });

    updatePager();

    const modal = document.querySelector('#spreadOverlay .modal');
    if (modal) {
      try { modal.scrollTo({top: 0, behavior: 'auto'}); }
      catch { modal.scrollTop = 0; }
    }
  }

  function startPagedComparison(question, positions, title, rationale, route) {
    const axisCount = route.result?._luneaStructural?.axisCount || Math.floor(positions.length / 2);

    state.question = question || '현재 나에게 필요한 흐름';
    state.positions = positions;
    state.title = title;
    state.rationale = rationale;
    state.drawn = [];
    state.used = new Set();

    document.getElementById('cards')?.replaceChildren();
    document.getElementById('results')?.replaceChildren();
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

    state.__luneaPagedComparison = {
      page: 0,
      axisCount,
      flipped: new Set()
    };

    const pager = ensurePager();
    pager?.classList.add('show');

    if (extraCardBtn) {
      extraCardBtn.disabled = true;
      extraCardBtn.style.display = 'none';
    }

    if (flipAllBtn) {
      flipAllBtn.onclick = () => {
        const pg = state.__luneaPagedComparison;
        if (!pg) return;
        const indices = pageIndices(pg.page, pg.axisCount);
        indices.forEach(i => {
          flipAt(i);
          pg.flipped.add(i);
        });
        updatePager();
      };
    }

    renderComparisonPage(0);

    document.getElementById('sheet')?.classList.remove('open');
    showOverlay('spreadOverlay');
  }

  W.startSpread = function structuralStartSpread(question, positions, title, rationale) {
    const last = ROUTE_STATE.last;
    const isPagedComparison =
      last?.mode === 'person_comparison' &&
      sameQuestion(question, last.question) &&
      Array.isArray(positions) &&
      positions.length === last.result.positions.length;

    if (!isPagedComparison) {
      restoreNormalControls();
      return previousStartSpread.apply(this, arguments);
    }

    return startPagedComparison(
      question,
      positions,
      title,
      rationale,
      last
    );
  };

  /*
    Existing card listener performs the actual flip first.
    This second listener only remembers visibility state for page switching.
  */
  if (cardsEl) {
    const cardEvent = W.PointerEvent ? 'pointerup' : 'click';
    cardsEl.addEventListener(cardEvent, event => {
      const pg = state?.__luneaPagedComparison;
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
    }, {passive: true});
  }

  const badge = document.querySelector('.engine-strip span:last-child');
  if (badge) {
    badge.innerHTML =
      '<b>Secure Draw + Spread V7.4 + Structural V2</b> · 구조 우선 · A/B 대칭 비교 · 인원 미지정 과거인연 독립흐름 추론';
  }

  console.info('🌙 LUNEA Structural Routing V2 loaded');
})();
