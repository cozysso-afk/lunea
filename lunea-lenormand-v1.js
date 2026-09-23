'use strict';

/*
  LUNEA LENORMAND V1
  ==================
  - 36-card upright Lenormand deck, using approved LUNEA artwork at repo root.
  - Standalone Home entry with 3-card line, 5-card line and 9-card box.
  - Secure draw without replacement.
  - Structural evidence (center, adjacency, mirrors, rows/columns/diagonals).
  - Gemini interprets deterministic card/evidence data; it never redraws cards.
  - Archive save uses existing LUNEA_ARCHIVE_V3 contract.
*/
(() => {
  const W = window;
  if (W.__LUNEA_LENORMAND_V1__) return;
  W.__LUNEA_LENORMAND_V1__ = true;

  const VERSION = 1;
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const RAW = [
    [1,'Rider','기수','arrival · news · movement','도착 · 소식 · 움직임','rider'],
    [2,'Clover','클로버','luck · opening · brief chance','행운 · 기회 · 짧은 창구','clover'],
    [3,'Ship','배','travel · distance · expansion','이동 · 거리 · 확장','ship'],
    [4,'House','집','home · safety · private sphere','집 · 안정 · 사적 영역','house'],
    [5,'Tree','나무','health · growth · duration','건강 · 성장 · 장기성','tree'],
    [6,'Clouds','구름','uncertainty · confusion · obscurity','불확실 · 혼란 · 흐림','clouds'],
    [7,'Snake','뱀','complexity · strategy · detour','복잡성 · 전략 · 우회','snake'],
    [8,'Coffin','관','ending · pause · closure','끝 · 정지 · 종결','coffin'],
    [9,'Bouquet','꽃다발','gift · joy · invitation','선물 · 기쁨 · 초대','bouquet'],
    [10,'Scythe','낫','sudden cut · decision · separation','급작스런 절단 · 결정 · 분리','scythe'],
    [11,'Whip','채찍','repetition · conflict · tension','반복 · 갈등 · 긴장','whip'],
    [12,'Birds','새','conversation · exchange · nervousness','대화 · 교환 · 초조','birds'],
    [13,'Child','아이','new start · smallness · curiosity','새 시작 · 작음 · 호기심','child'],
    [14,'Fox','여우','strategy · work · caution','전략 · 일 · 경계','fox'],
    [15,'Bear','곰','power · protection · authority','힘 · 보호 · 영향력','bear'],
    [16,'Stars','별','hope · direction · clarity','희망 · 방향 · 명료함','stars'],
    [17,'Stork','황새','change · move · transition','변화 · 이동 · 전환','stork'],
    [18,'Dog','개','friend · trust · support','친구 · 신뢰 · 지원','dog'],
    [19,'Tower','탑','distance · institution · isolation','거리 · 기관 · 독립/고립','tower'],
    [20,'Garden','정원','public · society · gathering','공개 · 사회 · 모임','garden'],
    [21,'Mountain','산','obstacle · delay · distance','장애 · 지연 · 거리','mountain'],
    [22,'Crossroads','갈림길','choice · alternatives · divergence','선택 · 대안 · 분기','crossroads'],
    [23,'Mice','쥐','loss · worry · erosion','손실 · 걱정 · 소모','mice'],
    [24,'Heart','하트','love · affection · passion','사랑 · 애정 · 열정','heart'],
    [25,'Ring','반지','commitment · contract · bond','약속 · 계약 · 관계','ring'],
    [26,'Book','책','secret · knowledge · hidden matter','비밀 · 지식 · 숨은 정보','book'],
    [27,'Letter','편지','message · document · communication','메시지 · 문서 · 연락','letter'],
    [28,'Man','남자','man · person marker · counterpart','남성 · 인물 표지 · 상대','man'],
    [29,'Woman','여자','woman · person marker · counterpart','여성 · 인물 표지 · 상대','woman'],
    [30,'Lily','백합','maturity · peace · dignity','성숙 · 평온 · 품위','lily'],
    [31,'Sun','태양','success · vitality · certainty','성공 · 활력 · 확실성','sun'],
    [32,'Moon','달','emotion · recognition · intuition','감정 · 인정 · 직관','moon'],
    [33,'Key','열쇠','solution · certainty · discovery','해결 · 확실성 · 발견','key'],
    [34,'Fish','물고기','money · resources · flow','돈 · 자원 · 흐름','fish'],
    [35,'Anchor','닻','stability · persistence · settling','안정 · 지속 · 정착','anchor'],
    [36,'Cross','십자가','burden · fated task · endurance','부담 · 과제 · 인내','cross']
  ];

  const DECK = Object.freeze(RAW.map(([number,en,ko,keywords_en,keywords_ko,slug]) => Object.freeze({
    id:`LN-${String(number).padStart(3,'0')}`,
    number,en,ko,keywords_en,keywords_ko,slug,
    image:`./lenormand_${String(number).padStart(3,'0')}_${slug}.jpg`
  })));

  const SPREADS = Object.freeze({
    3:{key:'line3',label:'3장 라인',note:'핵심 흐름을 빠르게 읽는 기본 라인'},
    5:{key:'line5',label:'5장 라인',note:'중심 카드와 양쪽 흐름·미러링을 함께 읽는 라인'},
    9:{key:'box9',label:'9장 박스',note:'3×3 행·열·대각선과 중심을 함께 읽는 박스'}
  });

  const state = {question:'', count:5, cards:[], structure:null, ai:'', busy:false};

  function randomInt(max) {
    if (!Number.isInteger(max) || max <= 0) throw new RangeError('max must be positive');
    try {
      if (crypto?.getRandomValues) {
        const limit = Math.floor(0x100000000 / max) * max;
        const buf = new Uint32Array(1);
        do crypto.getRandomValues(buf); while (buf[0] >= limit);
        return buf[0] % max;
      }
    } catch {}
    return Math.floor(Math.random() * max);
  }

  function draw(count) {
    const pool = DECK.slice();
    const out = [];
    while (out.length < count) {
      const index = randomInt(pool.length);
      out.push(pool.splice(index,1)[0]);
    }
    return out;
  }

  function pair(cards,a,b,type='adjacent') {
    return {type,a,b,left:cards[a],right:cards[b]};
  }

  function analyze(cards) {
    const n = cards.length;
    const adjacent = [];
    for (let i=0;i<n-1;i++) adjacent.push(pair(cards,i,i+1));
    const mirrors = [];
    for (let i=0;i<Math.floor(n/2);i++) mirrors.push(pair(cards,i,n-1-i,'mirror'));
    const result = {
      count:n,
      centerIndex:Math.floor(n/2),
      center:cards[Math.floor(n/2)],
      adjacent, mirrors,
      flow:cards.map((card,index)=>({index,card})),
      rows:[], columns:[], diagonals:[]
    };
    if (n === 9) {
      result.rows = [[0,1,2],[3,4,5],[6,7,8]].map(indices => indices.map(i=>cards[i]));
      result.columns = [[0,3,6],[1,4,7],[2,5,8]].map(indices => indices.map(i=>cards[i]));
      result.diagonals = [[0,4,8],[2,4,6]].map(indices => indices.map(i=>cards[i]));
    }
    return result;
  }

  function cardShort(card) { return `${String(card.number).padStart(2,'0')} ${card.en}(${card.ko})`; }
  function sequence(cards) { return cards.map(cardShort).join(' → '); }
  function pairLines(rows) { return rows.map((row,i)=>`${i+1}. ${cardShort(row.left)} + ${cardShort(row.right)}`).join('\n') || '- 없음'; }
  function groupLines(groups) { return groups.map((group,i)=>`${i+1}. ${sequence(group)}`).join('\n') || '- 없음'; }

  function evidenceText() {
    const s = state.structure;
    if (!s) return '';
    let text = `[LENORMAND STRUCTURE V1]\n- spread: ${SPREADS[s.count].label}\n- center: ${cardShort(s.center)}\n- full flow: ${sequence(state.cards)}\n\n[인접 조합]\n${pairLines(s.adjacent)}\n\n[미러링]\n${pairLines(s.mirrors)}`;
    if (s.count === 9) text += `\n\n[행]\n${groupLines(s.rows)}\n\n[열]\n${groupLines(s.columns)}\n\n[대각선]\n${groupLines(s.diagonals)}`;
    return text;
  }

  function buildPrompt() {
    const cards = state.cards.map((card,i)=>`${i+1}. ${cardShort(card)} — ${card.keywords_ko}`).join('\n');
    return `너는 LUNEA의 레노먼드 리더다. 아래 카드와 구조 데이터는 앱이 이미 확정한 결과다. 카드를 다시 뽑거나 번호·순서·이미지를 바꾸지 마라.\n\n[질문]\n${state.question}\n\n[확정 카드]\n${cards}\n\n${evidenceText()}\n\n[해석 규칙]\n1. 카드 뜻을 따로따로 나열하지 말고, 카드 간 연결과 전체 흐름 중심으로 해석한다.\n2. 레노먼드를 문장처럼 왼쪽에서 오른쪽으로 읽는다. 인접 카드 조합이 단일 카드 사전 의미보다 우선한다.\n3. 중심 카드가 질문의 핵심 축이다. 5장에서는 3번, 3장에서는 2번, 9장에서는 5번 카드다.\n4. 미러링은 바깥 조건과 안쪽 조건의 대응으로 읽는다.\n5. 9장 박스는 가운데 행·가운데 열을 우선하고, 나머지 행·열·대각선은 보조 근거로 사용한다.\n6. Man/Woman은 실제 성별을 멋대로 단정하지 말고 질문 맥락의 인물 표지로 사용한다.\n7. 타이밍은 카드가 제공하는 속도·지연 단서만 설명한다. 근거 없는 날짜를 창작하지 않는다.\n8. 미래를 확정적으로 단언하지 말고, 카드 조합이 지지하는 조건과 변수를 분리한다.\n9. 같은 말을 반복하지 말고 질문에 직접 답한다.\n\n[출력 형식]\n### 한줄 결론\n질문에 대한 핵심 흐름을 1~2문장.\n\n### 카드가 만드는 문장\n전체 배열을 하나의 사건 흐름으로 연결해 설명.\n\n### 핵심 조합 근거\n중심 카드, 중요한 인접 조합, 미러링${state.cards.length===9?' 및 주요 행·열':''}을 근거로 설명. 카드별 사전식 나열 금지.\n\n### 구체적으로 예상되는 전개\n현실에서 어떤 형태의 사건·연락·행동·변화로 나타날 수 있는지.\n\n### 조건과 변수\n흐름을 강화하거나 막는 요인.\n\n### 타이밍 단서\n배열에 실제 속도/지연 단서가 있을 때만 설명. 없으면 '뚜렷한 타이밍 단서는 약함'이라고 말한다.\n\n### 실행 조언\n- 1\n- 2\n- 3`;
  }

  function installStyle() {
    if ($('luneaLenormandV1Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaLenormandV1Style';
    style.textContent = `
      #luneaLenormandOverlay{z-index:10030}
      #luneaLenormandOverlay .ln-modal{max-width:720px;width:min(94vw,720px);max-height:91vh;overflow:auto;padding:18px;-webkit-overflow-scrolling:touch}
      .ln-intro{font-size:10.5px;line-height:1.55;color:var(--dim);margin:4px 0 13px}
      .ln-question{width:100%;box-sizing:border-box;min-height:78px;resize:vertical}
      .ln-spreads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:9px 0 11px}
      .ln-spread{min-width:0;padding:10px 7px;border-radius:12px;border:1px solid rgba(205,177,105,.23);background:rgba(255,255,255,.035);color:var(--text);font-size:10.5px}
      .ln-spread[aria-pressed="true"]{border-color:rgba(224,190,104,.6);background:rgba(205,177,105,.11);color:#f4dfae}
      .ln-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
      .ln-actions button{flex:1;min-width:110px}
      .ln-status{font-size:10px;line-height:1.5;color:var(--dim);min-height:16px;margin:5px 0}
      .ln-status.err{color:#ffc2ca}.ln-status.ok{color:#c7edd6}
      .ln-board{display:none;margin-top:12px}.ln-board.show{display:block}
      .ln-cards{display:grid;gap:7px;align-items:start}
      .ln-cards[data-count="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
      .ln-cards[data-count="5"]{grid-template-columns:repeat(5,minmax(0,1fr))}
      .ln-cards[data-count="9"]{grid-template-columns:repeat(3,minmax(0,1fr));max-width:510px;margin:auto}
      .ln-card{min-width:0;text-align:center}
      .ln-card img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:9px;border:1px solid rgba(221,185,102,.28);box-shadow:0 8px 20px rgba(0,0,0,.24)}
      .ln-card b{display:block;margin-top:5px;font:600 9.3px/1.25 'Noto Serif KR',serif;color:#eee7f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ln-structure{margin-top:11px;padding:11px;border-radius:13px;background:rgba(205,177,105,.055);border:1px solid rgba(205,177,105,.14)}
      .ln-structure h4{margin:0 0 6px;color:#f1dfa8;font-size:11px}.ln-structure p{margin:3px 0;font-size:9.7px;line-height:1.55;color:var(--dim)}
      .ln-ai{display:none;margin-top:11px;padding:13px;border-radius:14px;background:rgba(189,164,248,.07);border:1px solid rgba(189,164,248,.16);white-space:pre-wrap;font:400 12px/1.78 'Noto Serif KR',serif;color:var(--text)}
      .ln-ai.show{display:block}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"] .lunea-v8-object{overflow:hidden;padding:0}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="lenormand"] .lunea-v8-object img{width:100%;height:100%;object-fit:cover;border-radius:inherit}
      @media(max-width:520px){
        #luneaLenormandOverlay .ln-modal{width:94vw;padding:15px}
        .ln-spreads{grid-template-columns:1fr}
        .ln-cards[data-count="5"]{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function createModal() {
    if ($('luneaLenormandOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'luneaLenormandOverlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `
      <div class="modal ln-modal">
        <button class="close" id="lnClose" type="button">×</button>
        <div class="sub">LUNEA · LENORMAND</div>
        <h3 class="modal-h">36 CARD LENORMAND</h3>
        <p class="ln-intro">카드를 개별 사전처럼 나열하지 않고, 인접 조합·중심·미러링과 전체 문장 흐름으로 읽습니다.</p>
        <div class="field"><label for="lnQuestion">질문</label><textarea class="ln-question" id="lnQuestion" placeholder="예: 그에게서 세 달 안으로 연락이 올까요?"></textarea></div>
        <div class="ln-spreads" id="lnSpreads">
          <button class="ln-spread" type="button" data-count="3" aria-pressed="false"><b>3장 라인</b><br><small>빠른 핵심 흐름</small></button>
          <button class="ln-spread" type="button" data-count="5" aria-pressed="true"><b>5장 라인</b><br><small>중심 + 미러링</small></button>
          <button class="ln-spread" type="button" data-count="9" aria-pressed="false"><b>9장 박스</b><br><small>행 · 열 · 대각선</small></button>
        </div>
        <button class="primary full-btn" id="lnDraw" type="button">✦ 레노먼드 카드 뽑기</button>
        <p class="ln-status" id="lnStatus" role="status"></p>
        <div class="ln-board" id="lnBoard">
          <div class="ln-cards" id="lnCards" data-count="5"></div>
          <div class="ln-structure" id="lnStructure"></div>
          <div class="ln-actions" id="lnActions">
            <button class="mini" id="lnAI" type="button">🔮 조합 AI 해석</button>
            <button class="mini" id="lnCopy" type="button">📋 결과 복사</button>
            <button class="mini" id="lnSave" type="button">💾 기록</button>
          </div>
          <div class="ln-ai" id="lnAIText"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    $('lnClose').onclick = close;
    overlay.addEventListener('pointerup', e => { if (e.target === overlay) close(); });
    $('lnSpreads').addEventListener('click', e => {
      const button = e.target.closest('[data-count]');
      if (!button) return;
      state.count = Number(button.dataset.count);
      [...$('lnSpreads').querySelectorAll('[data-count]')].forEach(node => node.setAttribute('aria-pressed', node === button ? 'true' : 'false'));
      clearResult();
    });
    $('lnDraw').onclick = runDraw;
    $('lnAI').onclick = runAI;
    $('lnCopy').onclick = copyResult;
    $('lnSave').onclick = saveResult;
  }

  function ensureHomeTile() {
    const grid = document.querySelector('#luneaHomePortalV8 .lunea-v8-grid');
    if (!grid) return false;
    let tile = grid.querySelector('.lunea-v8-tile[data-key="lenormand"]');
    if (tile) return true;
    tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'lunea-v8-tile';
    tile.dataset.key = 'lenormand';
    tile.setAttribute('aria-pressed','false');
    tile.innerHTML = `<span class="lunea-v8-object"><img src="./lenormand_033_key.jpg" alt="" aria-hidden="true"></span><span class="lunea-v8-label">LENORMAND</span><span class="lunea-v8-sub">조합 · 흐름 · 사건 · 타이밍</span><span class="lunea-v8-open">＋</span>`;
    tile.onclick = open;
    grid.appendChild(tile);
    W.LUNEA_MOBILE_INTERACTION_HOTFIX_V1?.normalizePortalOrder?.();
    return true;
  }

  function open() {
    installStyle();
    createModal();
    $('luneaLenormandOverlay').classList.add('show');
    $('luneaLenormandOverlay').setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setTimeout(()=>$('lnQuestion')?.focus(),40);
  }

  function close() {
    $('luneaLenormandOverlay')?.classList.remove('show');
    $('luneaLenormandOverlay')?.setAttribute('aria-hidden','true');
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  }

  function clearResult() {
    state.cards = [];
    state.structure = null;
    state.ai = '';
    $('lnBoard')?.classList.remove('show');
    if ($('lnCards')) $('lnCards').innerHTML = '';
    if ($('lnStructure')) $('lnStructure').innerHTML = '';
    if ($('lnAIText')) { $('lnAIText').textContent=''; $('lnAIText').classList.remove('show'); }
    if ($('lnStatus')) { $('lnStatus').textContent=''; $('lnStatus').className='ln-status'; }
  }

  function render() {
    const cards = $('lnCards');
    cards.dataset.count = String(state.cards.length);
    cards.innerHTML = state.cards.map((card,index)=>`<div class="ln-card"><img src="${esc(card.image)}" alt="${esc(card.ko)}" loading="eager"><b>${index+1}. ${String(card.number).padStart(2,'0')} ${esc(card.en)} · ${esc(card.ko)}</b></div>`).join('');
    const s = state.structure;
    let structure = `<h4>${esc(SPREADS[s.count].label)} · 구조 근거</h4><p><b>중심:</b> ${esc(cardShort(s.center))}</p><p><b>전체:</b> ${esc(sequence(state.cards))}</p><p><b>미러:</b> ${s.mirrors.map(x=>`${esc(cardShort(x.left))} ↔ ${esc(cardShort(x.right))}`).join(' · ')}</p>`;
    if (s.count === 9) structure += `<p><b>가운데 행:</b> ${esc(sequence(s.rows[1]))}</p><p><b>가운데 열:</b> ${esc(sequence(s.columns[1]))}</p>`;
    $('lnStructure').innerHTML = structure;
    $('lnAIText').textContent = state.ai;
    $('lnAIText').classList.toggle('show',!!state.ai);
    $('lnBoard').classList.add('show');
  }

  function runDraw() {
    const question = String($('lnQuestion')?.value || '').trim();
    if (!question) {
      $('lnStatus').textContent = '질문을 먼저 입력해줘.';
      $('lnStatus').className = 'ln-status err';
      $('lnQuestion').focus();
      return;
    }
    state.question = question;
    state.cards = draw(state.count);
    state.structure = analyze(state.cards);
    state.ai = '';
    $('lnStatus').textContent = `${SPREADS[state.count].label} · ${state.count}장 중복 없이 추첨 완료`;
    $('lnStatus').className = 'ln-status ok';
    render();
  }

  async function runAI() {
    if (!state.cards.length) return alert('먼저 레노먼드 카드를 뽑아줘.');
    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) return alert('LUNEA API 설정을 먼저 해줘.');
    const button = $('lnAI');
    button.disabled = true;
    button.textContent = '해석 중…';
    $('lnStatus').className = 'ln-status';
    $('lnStatus').textContent = '카드 순서와 조합 근거를 유지한 채 해석하고 있어…';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:buildPrompt()}]}],generationConfig:{temperature:.72,topP:.92}})
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data?.error?.message || `HTTP ${response.status}`);
      const text = (data?.candidates?.[0]?.content?.parts || []).map(part=>part.text||'').join('\n').trim();
      if (!text) throw new Error('해석 응답이 비어 있어.');
      state.ai = text;
      render();
      $('lnStatus').textContent = '조합 중심 해석 완료';
      $('lnStatus').className = 'ln-status ok';
    } catch (error) {
      $('lnStatus').textContent = 'AI 해석 실패: ' + (error?.message || error);
      $('lnStatus').className = 'ln-status err';
    } finally {
      button.disabled = false;
      button.textContent = '🔮 조합 AI 해석';
    }
  }

  function copyText() {
    return `LUNEA · LENORMAND\n\n[질문]\n${state.question}\n\n[배열]\n${SPREADS[state.cards.length]?.label || ''}\n${sequence(state.cards)}\n\n${evidenceText()}${state.ai?`\n\n[AI 조합 해석]\n${state.ai}`:''}`;
  }

  async function copyResult() {
    if (!state.cards.length) return alert('먼저 레노먼드 카드를 뽑아줘.');
    try {
      await navigator.clipboard.writeText(copyText());
      const b=$('lnCopy'), old=b.textContent; b.textContent='✓ 복사 완료'; setTimeout(()=>b.textContent=old,1400);
    } catch { alert('복사 권한을 확인해줘.'); }
  }

  function makeId() {
    try { if (typeof W.secureId === 'function') return W.secureId(); } catch {}
    try { const a=new Uint8Array(12); crypto.getRandomValues(a); return [...a].map(x=>x.toString(16).padStart(2,'0')).join(''); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  }

  function readArchive() {
    try { if (typeof W.getArchive === 'function') return W.getArchive(); } catch {}
    try { const value=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]'); return Array.isArray(value)?value:[]; } catch { return []; }
  }

  function writeArchive(rows) {
    if (typeof W.setArchive === 'function') return W.setArchive(rows);
    localStorage.setItem(ARCHIVE_KEY,JSON.stringify(rows.slice(0,100)));
  }

  function saveResult() {
    if (!state.cards.length) return alert('먼저 레노먼드 카드를 뽑아줘.');
    try {
      const archive = readArchive();
      const cardRows = state.cards.map(card=>({code:card.id,text:`${card.en} · ${card.ko}`,img:card.image,image:card.image}));
      archive.unshift({
        id:makeId(), createdAt:Date.now(), date:new Date().toLocaleString('ko-KR'),
        title:`LENORMAND · ${SPREADS[state.cards.length].label}`,
        q:state.question,
        rationale:'카드 개별 나열이 아닌 중심·인접 조합·미러링과 전체 흐름 중심의 레노먼드 리딩',
        cards:cardRows,
        lenormand:{version:VERSION,spread:SPREADS[state.cards.length].key,cards:state.cards.map(c=>c.id),structure:{center:state.structure.center.id,adjacent:state.structure.adjacent.map(x=>[x.left.id,x.right.id]),mirrors:state.structure.mirrors.map(x=>[x.left.id,x.right.id])},ai:state.ai},
        ai:state.ai || ''
      });
      writeArchive(archive);
      $('lnStatus').textContent = '기록함에 저장 완료';
      $('lnStatus').className = 'ln-status ok';
    } catch (error) {
      console.error('[Lenormand] save failed',error);
      $('lnStatus').textContent = '기록 저장 실패: ' + (error?.message || error);
      $('lnStatus').className = 'ln-status err';
    }
  }

  function install() {
    installStyle();
    createModal();
    let tries=0;
    const timer=setInterval(()=>{tries++; if(ensureHomeTile()||tries>=100) clearInterval(timer);},100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  W.addEventListener('pageshow',()=>setTimeout(ensureHomeTile,70),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensureHomeTile,70)});

  W.LUNEA_LENORMAND_V1 = Object.freeze({
    version:VERSION, cards:DECK, spreads:SPREADS,
    draw, analyze, buildPrompt,
    open, close, ensureHomeTile,
    snapshot:()=>({question:state.question,count:state.count,cards:state.cards.map(c=>c.id),structure:state.structure,ai:state.ai})
  });
})();
