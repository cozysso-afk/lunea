'use strict';

/*
  LUNEA MEIHUA V1
  ===============
  UI / interpretation layer for deterministic MEIHUA_ENGINE_V1.
  The engine owns every calculation. AI only interprets the frozen evidence.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MEIHUA_V1__) return;
  W.__LUNEA_MEIHUA_V1__ = true;

  const VERSION = 1;
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = {question:'', result:null, ai:'', busy:false};
  let engine = null;

  function getEngine() {
    engine = engine || W.LUNEA_MEIHUA_ENGINE_V1;
    if (!engine) throw new Error('매화역수 계산 엔진을 불러오지 못했어.');
    return engine;
  }

  function installStyle() {
    if ($('luneaMeihuaV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaMeihuaV1Style';
    style.textContent = `
      #luneaMeihuaOverlay{z-index:10034}
      #luneaMeihuaOverlay .mh-modal{max-width:760px;width:min(94vw,760px);max-height:92vh;overflow:auto;padding:18px;-webkit-overflow-scrolling:touch}
      .mh-intro{margin:4px 0 13px;color:var(--dim);font-size:10.5px;line-height:1.6}
      .mh-question{width:100%;box-sizing:border-box;min-height:76px;resize:vertical}
      .mh-mode{display:flex;align-items:center;gap:8px;margin:9px 0 12px;padding:9px 10px;border:1px solid rgba(154,210,182,.16);border-radius:12px;background:rgba(78,135,111,.07);color:#aeb7b2;font-size:9.6px;line-height:1.45}
      .mh-mode b{color:#dcecdf;font-size:10.4px}
      .mh-status{min-height:17px;margin:7px 1px 4px;color:var(--dim);font-size:10px;line-height:1.5}
      .mh-status.ok{color:#9ed9ba}.mh-status.err{color:#ffb4b8}
      .mh-board{display:none;margin-top:12px}.mh-board.show{display:block}
      .mh-flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:stretch}
      .mh-hex{position:relative;min-width:0;padding:12px 9px 11px;border-radius:16px;border:1px solid rgba(223,229,220,.13);background:linear-gradient(150deg,rgba(17,35,31,.78),rgba(9,12,24,.94));text-align:center}
      .mh-hex::after{content:'';position:absolute;left:50%;right:-13px;top:50%;height:1px;background:linear-gradient(90deg,rgba(164,207,181,.28),transparent);pointer-events:none}
      .mh-hex:last-child::after{display:none}
      .mh-kind{color:#9fcdb4;font:750 8px/1.2 'Cinzel',serif;letter-spacing:1.4px;margin-bottom:6px}
      .mh-symbols{display:flex;justify-content:center;gap:4px;color:#e9eadf;font-size:26px;line-height:1;margin:4px 0 6px;text-shadow:0 0 14px rgba(154,214,184,.15)}
      .mh-name{color:#f4f1e8;font:650 13px/1.35 'Noto Serif KR',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mh-hanja{margin-top:3px;color:#8f988f;font-size:8.8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mh-lines{width:58px;margin:10px auto 5px;display:flex;flex-direction:column-reverse;gap:4px}
      .mh-line{position:relative;height:5px;display:flex;gap:7px;align-items:center;justify-content:center}
      .mh-line .seg{display:block;height:5px;border-radius:5px;background:#d7dfd5;box-shadow:0 0 7px rgba(187,221,198,.08)}
      .mh-line.yang .seg{width:48px}.mh-line.yin .seg{width:20px}
      .mh-line.moving .seg{background:#f0cf86;box-shadow:0 0 9px rgba(240,207,134,.21)}
      .mh-line.moving::after{content:'動';position:absolute;left:calc(100% + 5px);top:-5px;color:#e4bb69;font-size:7px;font-weight:800}
      .mh-evidence{margin-top:9px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .mh-panel{min-width:0;padding:11px;border-radius:14px;border:1px solid rgba(215,226,218,.11);background:rgba(255,255,255,.025)}
      .mh-panel h4{margin:0 0 7px;color:#dbe8dc;font-size:10.5px}
      .mh-panel p{margin:3px 0;color:#a9aeb2;font-size:9.6px;line-height:1.55}
      .mh-panel strong{color:#ece9de;font-weight:650}
      .mh-relation{margin:10px 0 0;padding:11px 12px;border-radius:14px;background:linear-gradient(145deg,rgba(78,145,112,.10),rgba(137,104,173,.06));border:1px solid rgba(143,205,166,.15)}
      .mh-relation b{color:#d6eadb}.mh-relation span{display:block;margin-top:4px;color:#9da6a2;font-size:9.6px;line-height:1.55}
      .mh-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.mh-actions button{flex:1;min-width:120px}
      .mh-ai{display:none;margin-top:10px;padding:13px;border-radius:14px;background:rgba(128,104,168,.07);border:1px solid rgba(182,160,220,.13);white-space:pre-wrap;color:var(--text);font:400 12px/1.78 'Noto Serif KR',serif}.mh-ai.show{display:block}
      .mh-provenance{margin-top:10px;padding:9px 10px;border-radius:12px;border:1px dashed rgba(170,186,176,.15);color:#858e8b;font-size:8.8px;line-height:1.55}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"]{grid-column:1/-1;min-height:108px;border-color:rgba(150,206,170,.18);background:radial-gradient(circle at 15% 5%,rgba(106,187,143,.11),transparent 28%),radial-gradient(circle at 93% 93%,rgba(165,132,207,.07),transparent 35%),linear-gradient(148deg,rgba(18,38,34,.92),rgba(8,10,23,.985))}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="meihua"] .lunea-v8-object{color:#d9eadc;border-color:rgba(177,219,191,.27);background:radial-gradient(circle at 32% 23%,rgba(255,255,255,.26),transparent 19%),linear-gradient(145deg,rgba(93,161,121,.25),rgba(117,92,157,.14));overflow:hidden}
      .mh-icon{position:relative;width:100%;height:100%;display:block}
      .mh-icon img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}
      .mh-icon::after{display:none}
      @media(max-width:520px){
        #luneaMeihuaOverlay .mh-modal{padding:15px}
        .mh-flow{gap:5px}.mh-hex{padding:10px 5px;border-radius:13px}.mh-symbols{font-size:23px}.mh-name{font-size:11px}.mh-lines{width:48px}.mh-line.yang .seg{width:42px}.mh-line.yin .seg{width:17px}.mh-evidence{grid-template-columns:1fr}.mh-actions button{min-width:100px}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function status(text, kind='') {
    const node = $('mhStatus');
    if (!node) return;
    node.textContent = text;
    node.className = `mh-status${kind ? ` ${kind}` : ''}`;
  }

  function lineMarkup(hex, movingLine=0) {
    return hex.lines.map((value,index) => {
      const cls = value ? 'yang' : 'yin';
      const moving = movingLine === index + 1 ? ' moving' : '';
      return `<div class="mh-line ${cls}${moving}" data-line="${index+1}">${value?'<span class="seg"></span>':'<span class="seg"></span><span class="seg"></span>'}</div>`;
    }).join('');
  }

  function hexCard(kind, hex, movingLine=0) {
    return `<div class="mh-hex" data-kind="${esc(kind)}"><div class="mh-kind">${esc(kind)}</div><div class="mh-symbols"><span>${esc(hex.upper.symbol)}</span><span>${esc(hex.lower.symbol)}</span></div><div class="mh-name">${hex.number}. ${esc(hex.ko)}</div><div class="mh-hanja">${esc(hex.hanja)}</div><div class="mh-lines">${lineMarkup(hex,movingLine)}</div></div>`;
  }

  function formatLocal(result) {
    const q = result.questionTime;
    const l = q.local;
    return `${l.year}.${String(l.month).padStart(2,'0')}.${String(l.day).padStart(2,'0')} ${String(l.hour).padStart(2,'0')}:${String(l.minute).padStart(2,'0')} · ${q.timeZone}`;
  }

  function evidenceText(result=state.result) {
    if (!result) return '';
    const bu = result.bodyUse;
    const q = result.questionTime;
    return `[MEIHUA ENGINE V1 · 확정 계산]\n` +
      `산법: ${result.methodKo}\n` +
      `질문시각: ${formatLocal(result)}\n` +
      `음력: ${q.lunar.relatedYear}년 ${q.lunar.isLeapMonth?'윤':''}${q.lunar.month}월 ${q.lunar.day}일\n` +
      `연지: ${q.yearBranch.hanja}(${q.yearBranch.n}) / 시지: ${q.hourBranch.hanja}(${q.hourBranch.n})\n` +
      `상괘 계산: ${result.arithmetic.upperSum} mod 8 = ${result.arithmetic.upperRemainder} → ${result.primary.upper.hanja}${result.primary.upper.symbol}\n` +
      `하괘 계산: ${result.arithmetic.total} mod 8 = ${result.arithmetic.lowerRemainder} → ${result.primary.lower.hanja}${result.primary.lower.symbol}\n` +
      `동효: ${result.arithmetic.total} mod 6 = ${result.movingLine}효\n` +
      `본괘: ${result.primary.number} ${result.primary.hanja}(${result.primary.ko})\n` +
      `호괘: ${result.mutual.number} ${result.mutual.hanja}(${result.mutual.ko})\n` +
      `변괘: ${result.changed.number} ${result.changed.hanja}(${result.changed.ko})\n` +
      `體: ${bu.body.hanja}${bu.body.symbol} ${bu.body.elementKo} / 用: ${bu.use.hanja}${bu.use.symbol} ${bu.use.elementKo}\n` +
      `체용 관계: ${bu.primaryRelation.hanja}(${bu.primaryRelation.ko}) — ${bu.primaryRelation.summary}\n` +
      `변화 후 관계: ${bu.changedRelation.hanja}(${bu.changedRelation.ko}) — ${bu.changedRelation.summary}`;
  }

  function buildPrompt() {
    if (!state.result) throw new Error('먼저 괘를 세워줘.');
    return `너는 LUNEA의 매화역수 해석자다. 아래 계산 결과는 결정론적 엔진이 이미 확정했다. 괘를 다시 계산하거나 다른 괘·동효·체용을 만들지 마라. 제공되지 않은 괘사·효사를 인용하거나 지어내지 마라.\n\n[질문]\n${state.question}\n\n${evidenceText()}\n\n[해석 원칙]\n1. 본괘=현재 구조, 호괘=내부 과정, 변괘=변화 후 흐름으로 연결해 읽는다. 세 괘를 따로 사전식으로 나열하지 않는다.\n2. 동효 위치가 상괘/하괘 중 어느 쪽을 움직이는지와 체·용 관계를 핵심 근거로 쓴다.\n3. 體는 질문자/기준축, 用은 상대·사건·외부 작용으로 읽되 질문 문맥에 맞게 명확히 설명한다.\n4. 오행 관계는 엔진이 제공한 체생용·용생체·체극용·용극체·비화만 사용한다. 다른 관계로 바꾸지 않는다.\n5. 질문에 사람의 자유의지나 외부 변수가 있으면 조건부로 표현한다. 미래를 확정적으로 단언하지 않는다.\n6. 시기를 말할 때 이 계산 데이터에 없는 날짜를 창작하지 않는다. 명확한 시기 근거가 없으면 그렇게 말한다.\n7. 전문용어를 쓴 뒤 바로 쉬운 한국어로 풀어준다.\n8. 결론은 질문에 직접 답하고 같은 말을 반복하지 않는다.\n\n[출력 형식]\n### 한줄 결론\n질문에 대한 핵심 방향을 1~2문장.\n\n### 본괘 → 호괘 → 변괘\n현재에서 내부 과정, 변화 후로 이어지는 하나의 흐름으로 설명.\n\n### 체와 용\n누가/무엇이 體와 用인지 질문 맥락에 맞춰 설명하고 ${state.result.bodyUse.primaryRelation.hanja} 관계의 의미를 설명.\n\n### ${state.result.movingLine}효가 움직이는 지점\n변화가 어느 층위에서 생기는지 구조적으로 설명. 제공되지 않은 효사 원문은 만들지 말 것.\n\n### 현실에서 나타날 수 있는 전개\n관찰 가능한 사건·행동·연락·결정 형태로 구체화.\n\n### 조건과 변수\n흐름을 강화하거나 약화시키는 조건.\n\n### 타이밍 단서\n계산 근거만으로 명확하지 않다면 '구체 날짜를 특정할 근거는 약함'이라고 명시.\n\n### 실행 조언\n- 1\n- 2\n- 3`;
  }

  function createModal() {
    if ($('luneaMeihuaOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'luneaMeihuaOverlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `
      <div class="modal mh-modal">
        <button class="close" id="mhClose" type="button">×</button>
        <div class="sub">LUNEA · 梅花易數</div>
        <h3 class="modal-h">MEIHUA · 매화역수</h3>
        <p class="mh-intro">질문한 순간의 현지 시각을 음력·지지 숫자로 변환해 본괘·호괘·변괘와 체용 관계를 계산합니다. AI는 계산 결과를 바꾸지 않고 해석만 합니다.</p>
        <div class="field"><label for="mhQuestion">질문</label><textarea class="mh-question" id="mhQuestion" placeholder="예: 그 사람에게서 다시 연락이 올까요?"></textarea></div>
        <div class="mh-mode"><span>☷</span><div><b>기본 산법 · 연월일시 기괘</b><br>연지 + 음력 월 + 일 → 상괘 · 시지 추가 → 하괘/동효 · 질문자의 브라우저 timezone 사용</div></div>
        <button class="primary full-btn" id="mhCast" type="button">✦ 지금 시각으로 괘 세우기</button>
        <p class="mh-status" id="mhStatus" role="status"></p>
        <div class="mh-board" id="mhBoard">
          <div class="mh-flow" id="mhFlow"></div>
          <div class="mh-evidence" id="mhEvidence"></div>
          <div class="mh-relation" id="mhRelation"></div>
          <div class="mh-provenance" id="mhProvenance"></div>
          <div class="mh-actions">
            <button class="mini" id="mhAI" type="button">🔮 AI 해석</button>
            <button class="mini" id="mhCopy" type="button">📋 결과 복사</button>
            <button class="mini" id="mhSave" type="button">💾 기록</button>
          </div>
          <div class="mh-ai" id="mhAIText"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    $('mhClose').onclick = close;
    overlay.addEventListener('pointerup',event => { if (event.target === overlay) close(); });
    $('mhCast').onclick = castNow;
    $('mhAI').onclick = runAI;
    $('mhCopy').onclick = copyResult;
    $('mhSave').onclick = saveResult;
  }

  function render() {
    const r = state.result;
    if (!r) return;
    $('mhFlow').innerHTML = hexCard('PRIMARY · 本卦',r.primary,r.movingLine) + hexCard('MUTUAL · 互卦',r.mutual,0) + hexCard('CHANGED · 變卦',r.changed,0);
    const q = r.questionTime;
    $('mhEvidence').innerHTML = `
      <div class="mh-panel"><h4>기괘 계산</h4><p><strong>질문 시각</strong> ${esc(formatLocal(r))}</p><p><strong>음력</strong> ${q.lunar.relatedYear}년 ${q.lunar.isLeapMonth?'윤':''}${q.lunar.month}월 ${q.lunar.day}일</p><p><strong>연지 / 시지</strong> ${q.yearBranch.hanja}${q.yearBranch.ko} ${q.yearBranch.n} · ${q.hourBranch.hanja}${q.hourBranch.ko} ${q.hourBranch.n}</p><p><strong>동효</strong> ${r.movingLine}효</p></div>
      <div class="mh-panel"><h4>체 · 용</h4><p><strong>體</strong> ${esc(r.bodyUse.body.hanja)}${esc(r.bodyUse.body.symbol)} ${esc(r.bodyUse.body.ko)} · ${esc(r.bodyUse.body.elementKo)}</p><p><strong>用</strong> ${esc(r.bodyUse.use.hanja)}${esc(r.bodyUse.use.symbol)} ${esc(r.bodyUse.use.ko)} · ${esc(r.bodyUse.use.elementKo)}</p><p><strong>움직이는 쪽</strong> ${r.bodyUse.movingSide==='upper'?'상괘':'하괘'} = 用</p><p><strong>변화 후 用</strong> ${esc(r.bodyUse.changedUse.hanja)}${esc(r.bodyUse.changedUse.symbol)} · ${esc(r.bodyUse.changedUse.elementKo)}</p></div>`;
    $('mhRelation').innerHTML = `<b>${esc(r.bodyUse.primaryRelation.hanja)} · ${esc(r.bodyUse.primaryRelation.ko)}</b><span>현재: ${esc(r.bodyUse.primaryRelation.summary)} → 변화 후: ${esc(r.bodyUse.changedRelation.hanja)} ${esc(r.bodyUse.changedRelation.ko)} · ${esc(r.bodyUse.changedRelation.summary)}</span>`;
    $('mhProvenance').textContent = `계산 근거 · ${r.methodKo} · ${r.provenance.trigramNumbering} · ${r.provenance.branchNumbering} · ${r.provenance.remainderRule} · ${r.provenance.dayBoundary} · ${r.provenance.timeZone}`;
    $('mhAIText').textContent = state.ai;
    $('mhAIText').classList.toggle('show',!!state.ai);
    $('mhBoard').classList.add('show');
  }

  function castNow() {
    const question = String($('mhQuestion')?.value || '').trim();
    if (!question) { status('질문을 먼저 입력해줘.','err'); $('mhQuestion')?.focus(); return; }
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
      state.question = question;
      state.ai = '';
      state.result = getEngine().calculateAt(new Date(),{timeZone:tz});
      render();
      status(`${state.result.primary.ko} → ${state.result.changed.ko} · ${state.result.movingLine}효 동 · 계산 완료`,'ok');
    } catch (error) {
      console.error('[Meihua] calculation failed',error);
      status(`계산 실패: ${error?.message || error}`,'err');
    }
  }

  async function runAI() {
    if (!state.result) return alert('먼저 괘를 세워줘.');
    if (state.busy) return;
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) return alert('LUNEA API 설정을 먼저 해줘.');
    const button = $('mhAI');
    state.busy = true;
    button.disabled = true;
    button.textContent = '해석 중…';
    status('확정된 괘와 체용 근거를 바꾸지 않고 해석하고 있어…');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:buildPrompt()}]}],generationConfig:{temperature:.55,topP:.9}})
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data?.error?.message || `HTTP ${response.status}`);
      const text = (data?.candidates?.[0]?.content?.parts || []).map(part=>part.text||'').join('\n').trim();
      if (!text) throw new Error('해석 응답이 비어 있어.');
      state.ai = text;
      render();
      status('매화역수 AI 해석 완료','ok');
    } catch (error) {
      console.error('[Meihua AI]',error);
      status(`AI 해석 실패: ${error?.message || error}`,'err');
    } finally {
      state.busy = false;
      button.disabled = false;
      button.textContent = '🔮 AI 해석';
    }
  }

  function copyText() {
    if (!state.result) return '';
    return `LUNEA · MEIHUA · 매화역수\n\n[질문]\n${state.question}\n\n${evidenceText()}${state.ai?`\n\n[AI 해석]\n${state.ai}`:''}`;
  }

  async function copyResult() {
    if (!state.result) return alert('먼저 괘를 세워줘.');
    try {
      await navigator.clipboard.writeText(copyText());
      const b=$('mhCopy'), old=b.textContent; b.textContent='✓ 복사 완료'; setTimeout(()=>b.textContent=old,1300);
    } catch { alert('복사 권한을 확인해줘.'); }
  }

  function makeId() {
    try { if (typeof W.secureId === 'function') return W.secureId(); } catch {}
    try { const a=new Uint8Array(12); crypto.getRandomValues(a); return [...a].map(x=>x.toString(16).padStart(2,'0')).join(''); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  }
  function readArchive() {
    try { if (typeof W.getArchive === 'function') return W.getArchive(); } catch {}
    try { const rows=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]'); return Array.isArray(rows)?rows:[]; } catch { return []; }
  }
  function writeArchive(rows) {
    if (typeof W.setArchive === 'function') return W.setArchive(rows);
    localStorage.setItem(ARCHIVE_KEY,JSON.stringify(rows.slice(0,100)));
  }

  function saveResult() {
    if (!state.result) return alert('먼저 괘를 세워줘.');
    try {
      const r = state.result;
      const rows = readArchive();
      const id = makeId();
      const item = {
        id, createdAt:Date.now(), date:formatLocal(r),
        title:`MEIHUA · ${r.primary.ko} → ${r.changed.ko}`,
        q:state.question,
        rationale:`${r.methodKo} · ${r.movingLine}효 동 · ${r.bodyUse.primaryRelation.hanja}(${r.bodyUse.primaryRelation.ko})`,
        cards:[
          {text:`본괘 · ${r.primary.number} ${r.primary.hanja} (${r.primary.ko})`},
          {text:`호괘 · ${r.mutual.number} ${r.mutual.hanja} (${r.mutual.ko})`},
          {text:`변괘 · ${r.changed.number} ${r.changed.hanja} (${r.changed.ko})`},
          {text:`體 ${r.bodyUse.body.hanja}${r.bodyUse.body.symbol} ${r.bodyUse.body.elementKo} · 用 ${r.bodyUse.use.hanja}${r.bodyUse.use.symbol} ${r.bodyUse.use.elementKo} · ${r.bodyUse.primaryRelation.hanja}`}
        ],
        ai:state.ai || '',
        meihua:{version:VERSION,questionTime:r.questionTime,calculation:r}
      };
      rows.unshift(item);
      writeArchive(rows);
      try { W.renderArchive?.(); } catch {}
      status('기록함에 저장 완료','ok');
    } catch (error) {
      console.error('[Meihua] save failed',error);
      status(`기록 저장 실패: ${error?.message || error}`,'err');
    }
  }

  function ensureHomeTile() {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid) return false;
    let tile = grid.querySelector('.lunea-v8-tile[data-key="meihua"]');
    if (!tile) {
      tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'lunea-v8-tile';
      tile.dataset.key = 'meihua';
      tile.setAttribute('aria-pressed','false');
      tile.innerHTML = `<span class="lunea-v8-object"><span class="mh-icon" aria-hidden="true"><img src="./assets/meihua/meihua_logo_v1.png" alt="" draggable="false"></span></span><span class="lunea-v8-label">MEIHUA</span><span class="lunea-v8-sub">본괘 · 호괘 · 변괘 · 체용</span><span class="lunea-v8-open">＋</span>`;
      tile.onclick = open;
    }
    const intimacy = grid.querySelector('.lunea-v8-tile[data-key="intimacy"]');
    if (tile.parentElement !== grid || (intimacy && tile.nextElementSibling !== intimacy)) grid.insertBefore(tile,intimacy || null);
    return true;
  }

  function open() {
    installStyle();
    createModal();
    $('luneaMeihuaOverlay').classList.add('show');
    $('luneaMeihuaOverlay').setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setTimeout(()=>$('mhQuestion')?.focus(),40);
  }
  function close() {
    $('luneaMeihuaOverlay')?.classList.remove('show');
    $('luneaMeihuaOverlay')?.setAttribute('aria-hidden','true');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  function install() {
    installStyle();
    createModal();
    let tries=0;
    const timer=setInterval(()=>{tries++; if(ensureHomeTile()||tries>=120) clearInterval(timer);},100);
  }

  W.LUNEA_MEIHUA_V1 = Object.freeze({
    version:VERSION,
    open,close,ensureHomeTile,castNow,buildPrompt,evidenceText,
    snapshot:()=>({question:state.question,result:state.result,ai:state.ai})
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  W.addEventListener('pageshow',()=>setTimeout(ensureHomeTile,120),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensureHomeTile,120)});
})();
