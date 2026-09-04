'use strict';

/*
  LUNEA MANUAL SPREAD + RECALL COMPARISON V1
  ==========================================
  Additive UI/structure layer loaded after Structural Routing V4.

  - Adds a user-authored spread mode without changing RNG/card draw logic.
  - Keeps every manual position verbatim (except leading list markers).
  - Optional A/B symmetric expansion from shared user-authored axes.
  - Repairs the common A/B "오늘 나를 생각/의식 + 감정의 결" question
    into a fixed 3-axis parallel comparison (6 cards).
  - Does not alter Horary calculations.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MANUAL_STRUCTURE_V1__) return;
  W.__LUNEA_MANUAL_STRUCTURE_V1__ = true;

  const MANUAL_KEY = 'LUNEA_MANUAL_SPREAD_DRAFT_V1';
  const MAX_MANUAL_CARDS = 12;

  const recallAxes = [
    '오늘 현재 나를 의식하거나 떠올리는 정도',
    '떠올린다면 감정의 기본 결',
    '그 생각이 향하는 방향 — 그리움/호감/후회/궁금증/거리두기 등'
  ];

  function qnorm(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isRecallTonePairQuestion(question) {
    const q = qnorm(question);
    const pair = /(A\s*(?:와|과|랑|\/|·|및)\s*B|A와B|두\s*사람|두\s*명|둘|각각)/i.test(q);
    const thought = /(생각하|생각나|떠올|의식하|의식되|머릿속|마음에\s*떠오)/i.test(q);
    const emotionTone = /(감정(?:의)?\s*(?:결|차이|성격|느낌|온도|톤)|정서(?:의)?\s*(?:결|차이|성격)|마음(?:의)?\s*(?:결|차이))/i.test(q);
    const relational = /(과거\s*인연|옛\s*인연|전남친|전여친|전애인|구남친|구여친|인연|상대)/i.test(q);
    return pair && thought && emotionTone && relational;
  }

  function mutateRecallComparison(result, question) {
    if (!result || result?._luneaStructuralV4?.mode !== 'person_comparison') return result;
    if (!isRecallTonePairQuestion(question)) return result;

    const positions = [
      ...recallAxes.map((axis, i) => `A · 축 ${i + 1} · ${axis}`),
      ...recallAxes.map((axis, i) => `B · 축 ${i + 1} · ${axis}`)
    ];

    result.spreadTitle = '과거 인연 A/B · 3축 대칭 비교 · 6카드';
    result.layoutType = 'structural-v4-person-comparison-recall-tone';
    result.positions = positions;
    result.designRationale = [
      '[STRUCTURAL ROUTING V4 + MANUAL STRUCTURE V1]',
      'primary_intent=person_comparison',
      'target_count=2',
      'target_count_mode=fixed',
      'relation=parallel_comparison',
      'decision_requested=false',
      `requested_axes=${recallAxes.join(' / ')}`,
      'comparison != choice',
      'coverage=100%',
      'A/B same axes, same order',
      'thought_claim=awareness_or_recall_flow_not_CCTV_fact'
    ].join(' · ');
    result._luneaStructuralV4 = {
      ...(result._luneaStructuralV4 || {}),
      mode: 'person_comparison',
      axes: [...recallAxes],
      axisCount: recallAxes.length,
      decisionRequested: false,
      pages: [
        {label:'과거 인연 A', indices:[0,1,2]},
        {label:'과거 인연 B', indices:[3,4,5]}
      ]
    };
    return result;
  }

  function cleanManualLine(line) {
    return String(line || '')
      .replace(/^\s*(?:[-*•]+|\d{1,2}\s*[.)]|[A-Za-z]\s*[.)])\s*/, '')
      .trim();
  }

  function readDraft() {
    try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}') || {}; }
    catch { return {}; }
  }

  function saveDraft() {
    const title = document.getElementById('luneaManualTitle')?.value || '';
    const positions = document.getElementById('luneaManualPositions')?.value || '';
    const symmetric = !!document.getElementById('luneaManualAB')?.checked;
    try { localStorage.setItem(MANUAL_KEY, JSON.stringify({title, positions, symmetric})); } catch {}
  }

  function parseManualPositions() {
    const area = document.getElementById('luneaManualPositions');
    const symmetric = !!document.getElementById('luneaManualAB')?.checked;
    const lines = String(area?.value || '')
      .split(/\n+/)
      .map(cleanManualLine)
      .filter(Boolean);

    if (!lines.length) return {positions:[], symmetric, axes:[]};

    if (!symmetric) {
      return {positions:lines, symmetric:false, axes:[]};
    }

    return {
      positions:[
        ...lines.map((axis, i) => `A · 축 ${i + 1} · ${axis}`),
        ...lines.map((axis, i) => `B · 축 ${i + 1} · ${axis}`)
      ],
      symmetric:true,
      axes:lines
    };
  }

  function updateManualCount() {
    const out = document.getElementById('luneaManualCount');
    if (!out) return;
    const parsed = parseManualPositions();
    if (!parsed.positions.length) {
      out.textContent = '포지션을 한 줄에 하나씩 입력해줘.';
      return;
    }
    out.textContent = parsed.symmetric
      ? `공통 축 ${parsed.axes.length}개 → A/B 총 ${parsed.positions.length}장`
      : `총 ${parsed.positions.length}장`;
  }

  function ensureManualStyles() {
    if (document.getElementById('luneaManualSpreadStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaManualSpreadStyle';
    style.textContent = `
      #luneaManualPanel{display:none;margin:0 0 12px;padding:11px;border-radius:14px;background:rgba(255,210,125,.055);border:1px solid rgba(255,210,125,.18)}
      #luneaManualPanel.show{display:block}
      #luneaManualPanel .manual-help{margin:4px 0 9px;color:var(--dim);font-size:10px;line-height:1.5}
      #luneaManualPanel textarea{min-height:128px;line-height:1.55;resize:vertical}
      #luneaManualPanel .manual-row{display:flex;gap:7px;align-items:flex-start}
      #luneaManualPanel .manual-row input{flex:1}
      #luneaManualPanel .manual-check{display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding:9px;border-radius:11px;background:rgba(189,164,248,.07);border:1px solid rgba(189,164,248,.14);cursor:pointer}
      #luneaManualPanel .manual-check input{width:auto;margin:2px 0 0;accent-color:#a582ff}
      #luneaManualPanel .manual-check b{display:block;font-size:10.5px;color:#eee8f8}
      #luneaManualPanel .manual-check span{display:block;margin-top:2px;font-size:9.5px;color:var(--dim);line-height:1.45}
      #luneaManualCount{margin-top:6px;color:var(--gold);font-size:9.5px;font-weight:750}
      #luneaManualReadingItem .count{color:var(--gold);border-color:rgba(255,210,125,.35);background:rgba(255,210,125,.09)}
    `;
    document.head.appendChild(style);
  }

  function ensureManualPanel() {
    let panel = document.getElementById('luneaManualPanel');
    if (panel) return panel;

    const question = document.getElementById('question');
    const questionField = question?.closest('.field');
    if (!questionField) return null;

    panel = document.createElement('div');
    panel.id = 'luneaManualPanel';
    panel.innerHTML = `
      <div class="field">
        <label>직접 스프레드 이름 <span style="color:var(--dim);font-weight:400">· 선택</span></label>
        <input id="luneaManualTitle" placeholder="예: A/B 오늘 감정 3축 비교">
      </div>
      <div class="field" style="margin-bottom:8px">
        <label>카드 포지션 · 한 줄에 한 자리</label>
        <textarea id="luneaManualPositions" placeholder="예:\n오늘 나를 의식하거나 떠올리는 정도\n떠올린다면 감정의 기본 결\n그 생각이 향하는 방향"></textarea>
        <div id="luneaManualCount">포지션을 한 줄에 하나씩 입력해줘.</div>
      </div>
      <label class="manual-check" for="luneaManualAB">
        <input type="checkbox" id="luneaManualAB">
        <span><b>A/B 대칭 비교로 펼치기</b><span>위에는 공통 축만 입력해. A와 B에 같은 축·같은 순서로 자동 복제해.</span></span>
      </label>
      <p class="manual-help">직접 입력 모드에서는 AI가 배열을 다시 설계하지 않아. 네가 쓴 포지션 문구가 그대로 카드 자리에 고정돼. 카드 펼치기를 확정하면 이 배열은 비슷한 자동 배열의 학습 정답으로 저장돼.</p>
    `;
    questionField.insertAdjacentElement('afterend', panel);

    const draft = readDraft();
    const title = document.getElementById('luneaManualTitle');
    const positions = document.getElementById('luneaManualPositions');
    const ab = document.getElementById('luneaManualAB');
    if (title) title.value = draft.title || '';
    if (positions) positions.value = draft.positions || '';
    if (ab) ab.checked = !!draft.symmetric;

    [title, positions, ab].forEach(el => {
      el?.addEventListener('input', () => { saveDraft(); updateManualCount(); });
      el?.addEventListener('change', () => { saveDraft(); updateManualCount(); });
    });
    updateManualCount();
    return panel;
  }

  function setManualPanelVisible(visible) {
    document.getElementById('luneaManualPanel')?.classList.toggle('show', !!visible);
  }

  function ensureManualReadingItem(openManual) {
    if (document.getElementById('luneaManualReadingItem')) return;
    const aiItem = [...document.querySelectorAll('.reading-item')]
      .find(el => el.dataset?.title === '질문 맞춤 AI 배열');
    if (!aiItem) return;

    const item = document.createElement('div');
    item.className = 'reading-item';
    item.id = 'luneaManualReadingItem';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `
      <div><h4>직접 입력 배열</h4><p>포지션을 네가 직접 고정 · 필요하면 A/B 대칭 복제.</p></div>
      <div class="count">직접</div>`;
    aiItem.insertAdjacentElement('afterend', item);
    item.addEventListener('click', openManual);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openManual();
      }
    });
  }

  function startManualSpread(question, positions, title, rationale, learn=true) {
    const originCategory = String(state?.__luneaManualOriginCategory || state?.category || 'GENERAL').trim().toUpperCase() || 'GENERAL';
    state.__luneaManualOriginCategory = originCategory;
    state.category = originCategory;
    state.__luneaIntimacyReading = originCategory === 'INTIMACY';
    state.__luneaManualReading = true;
    state.question = question || '현재 나에게 필요한 흐름';
    state.positions = [...positions];
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

    document.getElementById('luneaStructuralV4Pager')?.classList.remove('show');

    const shuffled = secureShuffle(TAROT_DECK);
    const selected = shuffled.slice(0, positions.length);
    selected.forEach((card, i) => {
      const isReversed = state.allowReversed && secureBool();
      state.used.add(card.code);
      state.drawn.push({...card, isReversed, position:positions[i], subCards:[]});
      document.getElementById('cards')?.appendChild(makeCardWrapper(i, card, isReversed));
    });

    if (learn && W.LUNEA_SPREAD_LEARNING_V1?.recordManual) {
      try {
        W.LUNEA_SPREAD_LEARNING_V1.recordManual({
          question:state.question,
          spreadTitle:title,
          positions,
          symmetric:!!document.getElementById('luneaManualAB')?.checked,
          axes:parseManualPositions().axes
        });
      } catch (error) {
        console.warn('[LUNEA Manual V1] manual spread learning failed', error);
      }
    }

    document.getElementById('sheet')?.classList.remove('open');
    showOverlay('spreadOverlay');
  }

  function installFinalWrappers() {
    const structural = W.LUNEA_STRUCTURAL_ROUTING_V4;
    const drawBtn = document.getElementById('drawBtn');
    if (!structural || !drawBtn) {
      console.warn('[LUNEA Manual V1] structural base or draw button missing');
      return;
    }

    ensureManualStyles();
    ensureManualPanel();

    const priorDesign = W.designSpread;
    if (typeof priorDesign === 'function' && !priorDesign.__luneaRecallToneWrapped) {
      const wrappedDesign = async function(question) {
        const result = await priorDesign.apply(this, arguments);
        return mutateRecallComparison(result, question);
      };
      wrappedDesign.__luneaRecallToneWrapped = true;
      W.designSpread = wrappedDesign;
      try { designSpread = wrappedDesign; } catch {}
    }

    const priorDirective = W.readingDirective;
    if (typeof priorDirective === 'function' && !priorDirective.__luneaManualWrapped) {
      const wrappedDirective = function() {
        let out = String(priorDirective.apply(this, arguments) || '');
        let q = '';
        try { q = qnorm(state?.question || ''); } catch {}

        if (state?.__luneaManualReading) {
          out += `\n[MANUAL SPREAD LOCK · 사용자 직접 배열]\n- 카드 포지션은 사용자가 직접 지정했다. 포지션을 합치거나 이름을 바꾸거나 다른 스프레드로 재설계하지 않는다.\n- 각 카드가 맡은 질문 범위를 그대로 지키고, 사용자가 넣지 않은 축을 새 필수축처럼 끼워 넣지 않는다.`;
        }
        if (isRecallTonePairQuestion(q)) {
          out += `\n[A/B 현재 의식·감정 결 비교]\n- A/B를 동일 축·동일 순서로 병렬 비교한다. 비교를 선택 질문으로 바꾸지 않는다.\n- 1축은 오늘 현재 나를 의식하거나 떠올리는 흐름의 정도, 2축은 떠올린다면 감정의 기본 결, 3축은 그 생각이 향하는 방향이다.\n- “생각한다/안 한다”를 CCTV처럼 실제 머릿속 사건으로 단정하지 않는다. 카드상 의식·회상 흐름의 지지/반증 우세로 표현한다.\n- 감정의 존재와 연락·재회·행동 의향은 별개다. 질문하지 않은 행동 예측으로 확장하지 않는다.`;
        }
        return out;
      };
      wrappedDirective.__luneaManualWrapped = true;
      W.readingDirective = wrappedDirective;
      try { readingDirective = wrappedDirective; } catch {}
    }

    const priorPrompt = W.promptString || (typeof promptString === 'function' ? promptString : null);
    if (typeof priorPrompt === 'function' && !priorPrompt.__luneaManualWrapped) {
      const wrappedPrompt = function() {
        let prompt = String(priorPrompt.apply(this, arguments) || '');
        let q = '';
        try { q = qnorm(state?.question || ''); } catch {}

        if (state?.__luneaManualReading) {
          prompt += `\n\n[MANUAL SPREAD LOCK]\n- 이 스프레드는 사용자가 직접 입력했다. 각 포지션의 문구·순서·대상 관계를 그대로 유지한다.\n- AI는 배열을 재설계하거나 포지션을 병합·축소·추가하지 않는다.`;
        }
        if (isRecallTonePairQuestion(q)) {
          prompt += `\n\n[타로 구조 · A/B 현재 의식 비교]\nA/B 두 사람을 동일 축으로 병렬 비교한다.\n1축: 오늘 현재 나를 의식하거나 떠올리는 정도\n2축: 떠올린다면 감정의 기본 결\n3축: 그 생각이 향하는 방향 — 그리움/호감/후회/궁금증/거리두기 등\nA와 B에 같은 축·같은 순서를 적용하고, 어느 한 사람을 선택하는 질문으로 바꾸지 않는다.\n“생각하나요?”는 객관적 머릿속 사건을 증명한다는 뜻이 아니라 의식하거나 떠올리는 흐름의 우세를 상징적으로 판정한다.`;
        }
        return prompt;
      };
      wrappedPrompt.__luneaManualWrapped = true;
      W.promptString = wrappedPrompt;
      try { promptString = wrappedPrompt; } catch {}
    }

    const priorOpenSheet = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof priorOpenSheet === 'function' && !priorOpenSheet.__luneaManualWrapped) {
      const wrappedOpenSheet = function() {
        state.__luneaManualMode = false;
        state.__luneaManualReading = false;
        setManualPanelVisible(false);
        return priorOpenSheet.apply(this, arguments);
      };
      wrappedOpenSheet.__luneaManualWrapped = true;
      W.openSheet = wrappedOpenSheet;
      try { openSheet = wrappedOpenSheet; } catch {}
    }

    const openManual = () => {
      const opener = W.openSheet || openSheet;
      const manualItem = document.getElementById('luneaManualReadingItem');
      const containerCategory = String(manualItem?.closest?.('.category-content')?.querySelector?.('.reading-item[data-cat]')?.dataset?.cat || '').trim().toUpperCase();
      let currentCategory = '';
      try { currentCategory = String(state?.category || '').trim().toUpperCase(); } catch {}
      const originCategory = containerCategory || currentCategory || 'GENERAL';
      try {
        state.__luneaManualOriginCategory = originCategory;
        state.category = originCategory;
        state.__luneaIntimacyReading = originCategory === 'INTIMACY';
      } catch {}
      opener(originCategory, '직접 입력 배열', 'AI 자동 배열이 마음에 안 들 때 카드 포지션을 직접 고정합니다.', 1);
      state.__luneaManualMode = true;
      state.__luneaManualReading = false;
      state.isAi = false;
      state.__luneaManualOriginCategory = originCategory;
      state.category = originCategory;
      state.__luneaIntimacyReading = originCategory === 'INTIMACY';
      setManualPanelVisible(true);
      const label = document.getElementById('drawLabel');
      if (label) label.textContent = '직접 배열로 카드 펼치기';
      setTimeout(() => document.getElementById('luneaManualPositions')?.focus(), 0);
    };
    ensureManualReadingItem(openManual);

    const originalDraw = drawBtn.onclick;
    drawBtn.onclick = async function(event) {
      if (!state?.__luneaManualMode) {
        return typeof originalDraw === 'function' ? originalDraw.call(this, event) : undefined;
      }

      const q = String(document.getElementById('question')?.value || '').trim();
      if (!q) {
        alert('질문 원문을 먼저 입력해줘.');
        document.getElementById('question')?.focus();
        return;
      }

      const parsed = parseManualPositions();
      if (!parsed.positions.length) {
        alert('직접 배열의 포지션을 한 줄에 하나씩 입력해줘.');
        document.getElementById('luneaManualPositions')?.focus();
        return;
      }
      if (parsed.positions.length > MAX_MANUAL_CARDS) {
        alert(`직접 배열은 한 번에 최대 ${MAX_MANUAL_CARDS}장까지 펼칠 수 있어. 지금 ${parsed.positions.length}장이야.`);
        return;
      }

      const rawTitle = String(document.getElementById('luneaManualTitle')?.value || '').trim();
      const title = rawTitle || (parsed.symmetric
        ? `A/B 직접 대칭 배열 · ${parsed.axes.length}축 · ${parsed.positions.length}카드`
        : `직접 입력 배열 · ${parsed.positions.length}카드`);
      const rationale = parsed.symmetric
        ? `[USER MANUAL SPREAD] · 사용자 직접 지정 · A/B same axes, same order · 축 ${parsed.axes.length}개 · AI 재설계 금지`
        : `[USER MANUAL SPREAD] · 사용자 직접 지정 · 포지션 ${parsed.positions.length}개 · AI 재설계 금지`;

      saveDraft();
      startManualSpread(q, parsed.positions, title, rationale);
    };

    const retry = document.getElementById('retry');
    if (retry && !retry.__luneaManualWrapped) {
      const originalRetry = retry.onclick;
      retry.onclick = function(event) {
        if (state?.__luneaManualReading) {
          return startManualSpread(state.question, state.positions, state.title, state.rationale, false);
        }
        return typeof originalRetry === 'function' ? originalRetry.call(this, event) : undefined;
      };
      retry.__luneaManualWrapped = true;
    }

    const priorStart = W.startSpread || (typeof startSpread === 'function' ? startSpread : null);
    if (typeof priorStart === 'function' && !priorStart.__luneaManualWrapped) {
      const wrappedStart = function() {
        state.__luneaManualReading = false;
        return priorStart.apply(this, arguments);
      };
      wrappedStart.__luneaManualWrapped = true;
      W.startSpread = wrappedStart;
      try { startSpread = wrappedStart; } catch {}
    }

    const badge = document.querySelector('.engine-strip span:last-child');
    if (badge && !/Manual/.test(badge.textContent || '')) {
      badge.innerHTML += ' · <b>Manual Spread</b>';
    }

    W.LUNEA_MANUAL_SPREAD_V1 = {
      parseManualPositions,
      isRecallTonePairQuestion,
      mutateRecallComparison,
      recallAxes:[...recallAxes]
    };
    console.info('🌙 LUNEA Manual Spread + Recall Comparison V1 loaded');
  }

  function boot() {
    setTimeout(installFinalWrappers, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
