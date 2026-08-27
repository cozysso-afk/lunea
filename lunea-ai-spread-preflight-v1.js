'use strict';

/*
  LUNEA AI SPREAD PREFLIGHT V1
  ============================
  AI custom-spread quality gate + pre-draw editable preview.

  Goals
  - Understand noisy / casual Korean before spread design is accepted.
  - Distinguish people, scenarios, choices, feelings and actions.
  - Preserve the user's original question and every explicit requested axis.
  - Critique the existing LUNEA spread and replace only when useful.
  - Never draw RNG cards until the user confirms the preview.
  - Manual spreads and fixed spreads remain untouched.
*/
(() => {
  const W = window;
  if (W.__LUNEA_AI_SPREAD_PREFLIGHT_V1__) return;
  W.__LUNEA_AI_SPREAD_PREFLIGHT_V1__ = true;

  const $ = id => document.getElementById(id);
  let installed = false;
  let baseDesign = null;
  let baseDraw = null;
  let variation = 0;

  function getState() {
    try { return state; } catch { return null; }
  }

  function cleanQuestion(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripNumber(text) {
    return String(text || '').replace(/^\s*\d{1,2}\s*[.)]\s*/, '').trim();
  }

  function normalizePositions(items) {
    const out = [];
    for (const item of Array.isArray(items) ? items : []) {
      const text = stripNumber(item);
      if (!text) continue;
      if (!out.includes(text)) out.push(text);
    }
    return out.slice(0, 12).map((text, i) => `${i + 1}. ${text}`);
  }

  function isHardStructural(sp) {
    if (!sp || typeof sp !== 'object') return false;
    if (sp._luneaStructuralV4 || sp.routerV8) return true;
    const why = String(sp.designRationale || '');
    return /STRUCTURAL ROUTING|A\/B same axes|대칭 비교|target_count=2|parallel_comparison/i.test(why);
  }

  function safeBaseline(sp) {
    return {
      spreadTitle: String(sp?.spreadTitle || ''),
      designRationale: String(sp?.designRationale || ''),
      layoutType: String(sp?.layoutType || ''),
      positions: (sp?.positions || []).map(String).slice(0, 12)
    };
  }

  function aiSchema() {
    return {
      type: 'OBJECT',
      properties: {
        intentSummary: {type:'STRING'},
        primaryIntent: {type:'STRING'},
        targetStructure: {type:'STRING'},
        requestedAxes: {type:'ARRAY', items:{type:'STRING'}},
        timeScope: {type:'STRING'},
        keepBaseline: {type:'BOOLEAN'},
        spreadTitle: {type:'STRING'},
        designRationale: {type:'STRING'},
        layoutType: {type:'STRING'},
        positions: {type:'ARRAY', items:{type:'STRING'}}
      },
      required: [
        'intentSummary','primaryIntent','targetStructure','requestedAxes','timeScope',
        'keepBaseline','spreadTitle','designRationale','layoutType','positions'
      ]
    };
  }

  async function askPreflight(question, baseline, options = {}) {
    const key = localStorage.getItem('LUNEA_API_KEY');
    if (!key) return null;
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    const avoid = Array.isArray(options.avoid) ? options.avoid.join(' / ') : '';
    const structural = isHardStructural(baseline);

    const prompt = `너는 타로 해석자가 아니라 LUNEA의 '질문 이해 + 스프레드 편집장'이다.\n\n` +
`[질문 원문 — 절대 바꾸거나 축소하지 말 것]\n${question}\n\n` +
`[현재 LUNEA가 만든 후보]\n${JSON.stringify(safeBaseline(baseline), null, 2)}\n\n` +
`[작업]\n` +
`1. 문법, 오타, 반말, 줄임말, 중간에 끊긴 문장이어도 사용자가 실제로 알고 싶은 것을 먼저 구조화한다.\n` +
`2. 질문의 대상 수와 '비교 대상'을 판정한다. 사람 수, 선택지 수, 시간/행동 시나리오 수를 서로 혼동하지 않는다.\n` +
`3. 질문에 사용자가 직접 요구한 정보축을 requestedAxes에 짧게 빠짐없이 적는다.\n` +
`4. 현재 LUNEA 후보가 원문을 정확히 덮으면 keepBaseline=true. 핵심축 누락, 대상 오분류, 범용 포지션 남발, 질문 범위 이탈이 있으면 false로 하고 더 좋은 최종 배열을 작성한다.\n\n` +
`[가장 중요한 판정 규칙]\n` +
`- 'A 한 사람'을 두고 지금/몇 시간 뒤/내일/더 늦게처럼 여러 경우를 비교하면 한 사람 + 시나리오 비교다. A/B 두 사람으로 만들지 않는다.\n` +
`- '각각'이라는 단어만으로 두 사람이라고 판정하지 않는다. A와 B, 두 사람, 두 명, 둘 다처럼 복수 인물이 실제로 명시돼야 사람 비교다.\n` +
`- A/B 두 사람 비교는 사용자가 선택을 요구하지 않는 한 양자택일로 바꾸지 않는다. 같은 질문축은 A와 B에 같은 순서로 대칭 배치한다.\n` +
`- 감정과 행동은 별개다. 마음이 있다고 연락/재회 행동을 자동 추가하지 않는다.\n` +
`- 관찰 사실(봤나/읽었나/들었나)은 지지 신호와 반대 신호를 모두 둔다.\n` +
`- 사용자가 여러 항목을 직접 나열했으면 각 항목이 최소 하나의 독립 포지션을 가져야 한다.\n` +
`- '현재 상황 / 숨은 변수 / 핵심 조언 / 미래 결과' 같은 범용 자리는 원문이 실제로 요구하지 않으면 쓰지 않는다.\n` +
`- 사용자가 묻지 않은 조언, 제3자, 재회, 연락, 운명적 의미를 새 필수축으로 끼워 넣지 않는다.\n` +
`- 시기 질문에서 근거 없는 날짜를 만들지 않는다. 사용자가 제시한 시간 선택지는 그대로 비교축으로 보존한다.\n` +
`- 한 포지션에 서로 다른 질문 두세 개를 억지로 합치지 않는다. 필요한 카드 수는 2~12장 범위에서 질문 복잡도에 맞춘다.\n` +
`- 원문에 이미 명확한 기간이 있으면 timeScope에 그대로 보존한다. 없으면 '미지정'이라고 쓴다.\n` +
`- 결과는 한국어로 자연스럽고 구체적으로 쓴다.\n` +
(structural ? `- 현재 후보는 LUNEA의 구조 강제 라우팅 결과다. 사람 수/대칭 구조가 맞다면 구조 자체는 유지하고 포지션 문구만 더 정확하게 다듬는다.\n` : '') +
(avoid ? `\n[이번에는 피할 이전 배열]\n${avoid}\n같은 의미 배열을 말만 바꿔 반복하지 않는다.\n` : '') +
`\n최종 positions는 번호를 붙이지 않은 문자열 배열로 반환한다. JSON 외 텍스트는 출력하지 않는다.`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts:[{text:prompt}]}],
          generationConfig:{
            temperature: options.regenerate ? 0.72 : 0.38,
            topP:0.9,
            responseMimeType:'application/json',
            responseSchema:aiSchema()
          }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'AI 질문 분석 실패');
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[LUNEA Preflight] AI question analysis fallback', err);
      return null;
    }
  }

  function mergePreflight(baseline, ai) {
    if (!ai) return baseline;
    const aiPositions = normalizePositions(ai.positions);
    const basePositions = normalizePositions(baseline?.positions || []);
    const structural = isHardStructural(baseline);

    let useBaseline = !!ai.keepBaseline;
    if (!basePositions.length) useBaseline = false;
    if (!aiPositions.length) useBaseline = true;

    // Structural routing already owns the target/page topology. If AI proposes a
    // different card count, keep the structural count to avoid stale pager meta.
    if (structural && aiPositions.length && aiPositions.length !== basePositions.length) {
      useBaseline = true;
    }

    const positions = useBaseline ? basePositions : aiPositions;
    const out = {
      ...(baseline || {}),
      spreadTitle: useBaseline
        ? String(baseline?.spreadTitle || ai.spreadTitle || '질문 맞춤 배열')
        : String(ai.spreadTitle || baseline?.spreadTitle || '질문 맞춤 배열'),
      designRationale: useBaseline
        ? String(baseline?.designRationale || '질문 구조 기반 설계')
        : String(ai.designRationale || 'AI 질문 의미 전처리 후 설계'),
      layoutType: useBaseline
        ? String(baseline?.layoutType || 'custom')
        : String(ai.layoutType || 'ai-preflight'),
      positions
    };

    out._luneaPreflight = {
      intentSummary:String(ai.intentSummary || ''),
      primaryIntent:String(ai.primaryIntent || ''),
      targetStructure:String(ai.targetStructure || ''),
      requestedAxes:Array.isArray(ai.requestedAxes) ? ai.requestedAxes.map(String) : [],
      timeScope:String(ai.timeScope || '미지정'),
      usedBaseline:useBaseline,
      version:1
    };
    return out;
  }

  async function smartDesign(question, options = {}) {
    const q = cleanQuestion(question);
    if (!q || typeof baseDesign !== 'function') return baseDesign?.apply(this, arguments);

    const baseline = await baseDesign.call(this, q);
    if (!baseline || !Array.isArray(baseline.positions) || !baseline.positions.length) return baseline;

    const ai = await askPreflight(q, baseline, options);
    const result = mergePreflight(baseline, ai);
    W.LUNEA_AI_SPREAD_PREFLIGHT_LAST = {question:q, baseline:safeBaseline(baseline), ai, result:safeBaseline(result)};
    return result;
  }

  function addStyles() {
    if ($('luneaSpreadPreviewStyle')) return;
    const style = document.createElement('style');
    style.id = 'luneaSpreadPreviewStyle';
    style.textContent = `
      #luneaSpreadPreviewOverlay{
        position:fixed;inset:0;z-index:420;display:none;align-items:center;justify-content:center;
        padding:12px;background:rgba(5,3,10,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)
      }
      #luneaSpreadPreviewOverlay.show{display:flex}
      #luneaSpreadPreviewModal{
        width:100%;max-width:440px;max-height:92dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;
        border:1px solid rgba(197,178,250,.25);border-radius:24px;background:#140f21;
        padding:18px 14px calc(22px + env(safe-area-inset-bottom));box-shadow:0 24px 60px rgba(0,0,0,.72);position:relative
      }
      #luneaSpreadPreviewClose{position:absolute;right:13px;top:9px;border:0;background:none;color:var(--dim);font-size:24px;cursor:pointer}
      .lsp-kicker{font:700 9.5px 'Cinzel',serif;letter-spacing:1.4px;color:var(--moon);margin:2px 34px 5px 0}
      .lsp-title{margin:0 34px 12px 0;font:600 18px 'Noto Serif KR',serif}
      .lsp-intent{margin:0 0 12px;padding:10px 11px;border-radius:12px;background:rgba(157,228,193,.06);border:1px solid rgba(157,228,193,.16)}
      .lsp-intent b{display:block;margin-bottom:4px;color:#bfe7d2;font-size:10px}
      .lsp-intent div{font-size:11px;line-height:1.55;color:#ebe6f4}
      .lsp-intent small{display:block;margin-top:5px;color:var(--dim);font-size:9.5px;line-height:1.5}
      #luneaSpreadPreviewModal label{display:block;margin:9px 0 5px;font-size:11px;font-weight:700;color:#ddd5eb}
      #luneaSpreadPreviewPositions{min-height:210px;line-height:1.55;resize:vertical}
      .lsp-count{margin:5px 2px 10px;color:var(--gold);font-size:9.5px;font-weight:700}
      .lsp-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:7px;margin-top:10px}
      .lsp-actions button{min-height:44px}
      .lsp-note{margin:9px 2px 0;color:var(--dim);font-size:9.5px;line-height:1.5}
    `;
    document.head.appendChild(style);
  }

  function ensurePreview() {
    let overlay = $('luneaSpreadPreviewOverlay');
    if (overlay) return overlay;
    addStyles();
    overlay = document.createElement('div');
    overlay.id = 'luneaSpreadPreviewOverlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `
      <div id="luneaSpreadPreviewModal">
        <button type="button" id="luneaSpreadPreviewClose" aria-label="미리보기 닫기">×</button>
        <div class="lsp-kicker">LUNEA · AI SPREAD PREFLIGHT</div>
        <h3 class="lsp-title">카드 뽑기 전 배열 확인</h3>
        <div class="lsp-intent">
          <b>AI가 이해한 질문의 핵심</b>
          <div id="luneaSpreadPreviewIntent"></div>
          <small id="luneaSpreadPreviewMeta"></small>
        </div>
        <label for="luneaSpreadPreviewTitle">스프레드 이름</label>
        <input id="luneaSpreadPreviewTitle">
        <label for="luneaSpreadPreviewPositions">카드 포지션 · 한 줄에 한 자리</label>
        <textarea id="luneaSpreadPreviewPositions"></textarea>
        <div class="lsp-count" id="luneaSpreadPreviewCount"></div>
        <div class="lsp-actions">
          <button type="button" class="mini" id="luneaSpreadPreviewRegenerate">↻ 다른 배열</button>
          <button type="button" class="primary" id="luneaSpreadPreviewConfirm">✦ 이 배열로 카드 뽑기</button>
        </div>
        <div class="lsp-note">질문 원문은 바뀌지 않아. 여기서 포지션만 직접 고쳐도 되고, 확정하기 전까지 카드는 아직 생성되지 않아.</div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function linesFromTextarea() {
    return String($('luneaSpreadPreviewPositions')?.value || '')
      .split(/\n+/)
      .map(stripNumber)
      .filter(Boolean)
      .slice(0, 12);
  }

  function updateCount() {
    const lines = linesFromTextarea();
    if ($('luneaSpreadPreviewCount')) $('luneaSpreadPreviewCount').textContent = `총 ${lines.length}장 · 확정 전에는 카드 추출 안 함`;
  }

  function fillPreview(sp) {
    const meta = sp?._luneaPreflight || {};
    $('luneaSpreadPreviewTitle').value = sp?.spreadTitle || '질문 맞춤 배열';
    $('luneaSpreadPreviewPositions').value = (sp?.positions || []).map(stripNumber).join('\n');
    $('luneaSpreadPreviewIntent').textContent = meta.intentSummary || '기존 LUNEA 질문 구조 분석 결과를 사용했어.';
    const bits = [meta.targetStructure, meta.primaryIntent, meta.timeScope && meta.timeScope !== '미지정' ? `기간: ${meta.timeScope}` : ''].filter(Boolean);
    $('luneaSpreadPreviewMeta').textContent = bits.join(' · ');
    updateCount();
  }

  function openPreview(question, initialSpread) {
    const overlay = ensurePreview();
    variation = 0;
    let current = initialSpread;
    fillPreview(current);
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');

    return new Promise(resolve => {
      let closed = false;
      const finish = value => {
        if (closed) return;
        closed = true;
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden','true');
        document.body.classList.remove('modal-open');
        resolve(value);
      };

      $('luneaSpreadPreviewClose').onclick = () => finish(null);
      overlay.onclick = event => { if (event.target === overlay) finish(null); };
      $('luneaSpreadPreviewPositions').oninput = updateCount;

      $('luneaSpreadPreviewConfirm').onclick = () => {
        const lines = linesFromTextarea();
        if (lines.length < 2) return alert('카드 포지션을 최소 2개는 남겨줘.');
        const title = String($('luneaSpreadPreviewTitle').value || '').trim() || current?.spreadTitle || '질문 맞춤 배열';
        finish({
          ...current,
          spreadTitle:title,
          positions:lines.map((x,i)=>`${i+1}. ${x}`),
          designRationale:String(current?.designRationale || 'AI 질문 의미 전처리 후 사용자 확인 배열') + ' · PRE-DRAW USER CONFIRMED'
        });
      };

      $('luneaSpreadPreviewRegenerate').onclick = async () => {
        const btn = $('luneaSpreadPreviewRegenerate');
        const confirm = $('luneaSpreadPreviewConfirm');
        const avoid = linesFromTextarea();
        btn.disabled = true;
        confirm.disabled = true;
        btn.textContent = '질문 다시 해석 중…';
        try {
          variation += 1;
          current = await smartDesign(question, {regenerate:true, avoid, variation});
          fillPreview(current);
        } catch (err) {
          console.error('[LUNEA Preflight] regenerate failed', err);
          alert('다른 배열 생성에 실패했어. 현재 배열은 그대로 유지할게.');
        } finally {
          btn.disabled = false;
          confirm.disabled = false;
          btn.textContent = '↻ 다른 배열';
        }
      };
    });
  }

  function install() {
    if (installed) return true;
    const drawBtn = $('drawBtn');
    if (!drawBtn || typeof W.designSpread !== 'function') return false;

    // Wait until all scripts declared after the structural loader have had a
    // chance to wrap the base handlers. This module is intentionally final.
    baseDesign = W.designSpread;
    W.designSpread = smartDesign;
    try { designSpread = smartDesign; } catch {}

    baseDraw = drawBtn.onclick;
    drawBtn.onclick = async function(event) {
      const s = getState();
      if (!s || s.__luneaManualMode || !s.isAi) {
        return typeof baseDraw === 'function' ? baseDraw.call(this, event) : undefined;
      }

      const q = cleanQuestion($('question')?.value || '');
      if (!q) {
        alert('질문 원문을 먼저 입력해줘.');
        $('question')?.focus();
        return;
      }

      const label = $('drawLabel');
      drawBtn.disabled = true;
      if (label) label.textContent = '질문 뜻 파악 & 배열 검수 중…';
      try {
        const sp = await W.designSpread(q);
        if (!sp || !Array.isArray(sp.positions) || sp.positions.length < 2) throw new Error('배열 결과가 비어 있음');
        const confirmed = await openPreview(q, sp);
        if (!confirmed) return;
        const start = W.startSpread || (typeof startSpread === 'function' ? startSpread : null);
        if (typeof start !== 'function') throw new Error('카드 펼치기 함수를 찾지 못했어.');
        start(q, confirmed.positions, confirmed.spreadTitle, confirmed.designRationale);
      } catch (err) {
        console.error('[LUNEA Preflight] custom spread failed', err);
        alert('맞춤 배열을 만드는 중 오류가 났어. 질문은 그대로 유지돼.');
      } finally {
        drawBtn.disabled = false;
        if (label) label.textContent = '질문 분석 & 맞춤 배열 설계';
      }
    };

    ensurePreview();
    installed = true;
    W.LUNEA_AI_SPREAD_PREFLIGHT = {
      design: smartDesign,
      getLast: () => W.LUNEA_AI_SPREAD_PREFLIGHT_LAST || null,
      version: 1
    };
    console.info('🧠 LUNEA AI Spread Preflight V1 installed · semantic QA + pre-draw preview');
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 100) clearInterval(timer);
    }, 80);
    install();
  }

  // The structural loader is parsed before some later index scripts. Waiting for
  // window.load guarantees this wrapper sees the final draw/design handlers.
  if (document.readyState === 'complete') setTimeout(boot, 0);
  else W.addEventListener('load', boot, {once:true});
})();
