'use strict';

/*
  LUNEA AI SPREAD PREFLIGHT V2
  ============================
  Casebook-grounded question understanding + pre-draw editable preview.

  - Reads LUNEA_QUESTION_CASEBOOK_V1 and retrieves only the most relevant cases.
  - One semantic AI pass audits the existing LUNEA spread.
  - Distinguishes person count from scenario count.
  - Preserves explicit user axes and manual/fixed spreads.
  - RNG cards are never drawn before user confirmation.
*/
(() => {
  const W = window;
  if (W.__LUNEA_AI_SPREAD_PREFLIGHT_V2__) return;
  W.__LUNEA_AI_SPREAD_PREFLIGHT_V2__ = true;

  const $ = id => document.getElementById(id);
  let installed = false;
  let baseDesign = null;
  let baseDraw = null;

  function getState(){ try{return state}catch{return null} }
  function clean(v){return String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim()}
  function stripNum(v){return String(v||'').replace(/^\s*\d{1,2}\s*[.)]\s*/,'').trim()}
  function normalizePositions(items){
    const out=[];
    for(const x of Array.isArray(items)?items:[]){
      const t=stripNum(x); if(!t||out.includes(t))continue; out.push(t);
    }
    return out.slice(0,12).map((x,i)=>`${i+1}. ${x}`);
  }
  function safeBaseline(sp){
    return {
      spreadTitle:String(sp?.spreadTitle||''),
      designRationale:String(sp?.designRationale||''),
      layoutType:String(sp?.layoutType||''),
      positions:(sp?.positions||[]).map(String).slice(0,12)
    };
  }
  function isStructural(sp){
    if(!sp||typeof sp!=='object')return false;
    if(sp._luneaStructuralV4||sp.routerV8)return true;
    return /STRUCTURAL ROUTING|A\/B same axes|대칭 비교|parallel_comparison|target_count=2/i.test(String(sp.designRationale||''));
  }
  function caseContext(question){
    try{
      const book=W.LUNEA_QUESTION_CASEBOOK_V1;
      if(book&&typeof book.formatForPrompt==='function'){
        return {
          text:book.formatForPrompt(question,4),
          matches:typeof book.find==='function'?book.find(question,4):[],
          stats:{families:book.familyCount||0,utterances:book.utteranceCount||0}
        };
      }
    }catch(e){console.warn('[LUNEA Preflight V2] casebook lookup failed',e)}
    return {text:'관련 사례 없음',matches:[],stats:{families:0,utterances:0}};
  }
  function schema(){
    return {
      type:'OBJECT',
      properties:{
        intentSummary:{type:'STRING'},
        primaryIntent:{type:'STRING'},
        targetStructure:{type:'STRING'},
        requestedAxes:{type:'ARRAY',items:{type:'STRING'}},
        timeScope:{type:'STRING'},
        keepBaseline:{type:'BOOLEAN'},
        spreadTitle:{type:'STRING'},
        designRationale:{type:'STRING'},
        layoutType:{type:'STRING'},
        positions:{type:'ARRAY',items:{type:'STRING'}}
      },
      required:['intentSummary','primaryIntent','targetStructure','requestedAxes','timeScope','keepBaseline','spreadTitle','designRationale','layoutType','positions']
    };
  }

  async function askEditor(question, baseline, options={}){
    const key=localStorage.getItem('LUNEA_API_KEY');
    if(!key)return null;
    const model=localStorage.getItem('LUNEA_MODEL')||'gemini-2.5-flash';
    const cases=caseContext(question);
    const structural=isStructural(baseline);
    const avoid=Array.isArray(options.avoid)?options.avoid.join(' / '):'';
    const prompt=`너는 LUNEA의 타로 해석자가 아니라 '질문 분류기 + 스프레드 편집장'이다.\n\n[질문 원문 — 문장을 예쁘게 고치는 것이 목적이 아니다. 의미와 요구축만 정확히 이해할 것]\n${question}\n\n[현재 LUNEA 후보]\n${JSON.stringify(safeBaseline(baseline),null,2)}\n\n[이 질문과 가까운 LUNEA 내부 사례집]\n${cases.text}\n\n사례는 정답을 복사하라는 뜻이 아니다. 사례의 '대상 구조 / 보존할 축 / 금지 오분류'를 참고해 현재 질문을 독립적으로 판정한다.\n\n[판정 순서]\n1. 사건 단계: 아직 기회 전 / 이미 예정 / 이미 발생 후 / 현재 진행 중을 먼저 구분한다.\n2. 대상 구조: 한 사람 / 두 사람 / 대상 수 미정 / 선택지 / 한 사람에 대한 여러 시나리오를 구분한다.\n3. 질문 기능: 사실·관찰 / 인식 / 감정 / 행동 / 원인 / 시기 / 결과 / 조언 / 비교 / 선택 / 복합을 구분한다.\n4. 사용자가 직접 요구한 정보축을 requestedAxes에 빠짐없이 적는다.\n5. 현재 후보가 그 구조를 정확히 덮으면 keepBaseline=true. 아니면 false로 하고 더 좋은 배열을 작성한다.\n\n[강제 규칙]\n- 오타, 반말, 줄임말, 문장 파편을 허용한다. 문법이 나빠도 핵심 의도를 버리지 않는다.\n- '각각'만으로 두 사람이라 판정하지 않는다.\n- A라는 한 사람 + 지금/몇 시간 뒤/내일/더 늦게 = 한 사람에 대한 시간 시나리오 비교다.\n- 답장 길게/짧게/이모티콘, 카톡/DM/전화처럼 방식이 여러 개여도 사람이 한 명이면 다중 인물이 아니다.\n- A/B 두 사람이 명시된 비교는 선택을 요구하지 않는 한 '누가 더 낫나'로 바꾸지 않는다. 동일 축 대칭을 지킨다.\n- 감정, 생각, 행동 의도, 실제 행동은 서로 다른 축이다.\n- '봤나/읽었나/들었나/그 계정이 그 사람인가' 같은 사실 불확실 질문은 지지 신호와 반대 신호를 모두 둔다.\n- 사용자가 직접 나열한 항목은 최소 한 포지션씩 보존한다.\n- 질문에 없는 재회, 제3자, 연락, 조언, 운명, 미래를 자동 추가하지 않는다.\n- '현재 상황 / 숨은 변수 / 핵심 조언 / 미래 결과' 같은 범용 자리를 원문 요구축 대신 쓰지 않는다.\n- 시기 질문은 날짜를 창작하지 않는다. 사용자가 준 기간·시나리오는 그대로 보존한다.\n- 사건이 이미 끝났다면 사전 조언 배열로 되돌리지 않는다. 아직 일정도 없다면 사후 평가 배열을 쓰지 않는다.\n- 건강은 진단·예후가 아니라 체감 부담, 생활 리듬, 회복 자원, 객관적 확인 기준만 다룬다.\n- 투자 질문은 가격 예언보다 근거·반증·리스크·판단 기준을 다룬다.\n- 2~12장. 복잡도 때문에 필요한 경우만 늘리고 같은 뜻 반복은 금지한다.\n${structural?`- 현재 후보는 LUNEA 구조 강제 결과다. 대상 수/대칭 topology가 맞으면 카드 수를 바꾸지 말고 같은 수의 더 정확한 포지션으로 교정한다.`:''}\n${avoid?`\n[이번 재생성에서 피할 직전 포지션]\n${avoid}\n말만 바꾼 반복 배열을 만들지 않는다.`:''}\n\n최종 positions는 번호 없는 한국어 문자열 배열로 반환한다. JSON만 출력한다.`;
    try{
      const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts:[{text:prompt}]}],
          generationConfig:{
            temperature:options.regenerate?.62:.28,
            topP:.88,
            responseMimeType:'application/json',
            responseSchema:schema()
          }
        })
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error.message||'AI 질문 분류 실패');
      const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if(!raw)return null;
      const ai=JSON.parse(raw);
      ai.__casebookMatches=cases.matches.map(x=>({id:x.case?.id||'',score:x.score||0,sample:x.sample||''}));
      ai.__casebookStats=cases.stats;
      return ai;
    }catch(err){
      console.warn('[LUNEA Preflight V2] AI editor fallback',err);
      return null;
    }
  }

  function merge(baseline,ai){
    if(!ai)return baseline;
    const bp=normalizePositions(baseline?.positions||[]);
    const ap=normalizePositions(ai.positions||[]);
    const structural=isStructural(baseline);
    let keep=!!ai.keepBaseline;
    if(!bp.length)keep=false;
    if(!ap.length)keep=true;
    if(structural&&ap.length&&ap.length!==bp.length)keep=true;
    const positions=keep?bp:ap;
    const out={
      ...(baseline||{}),
      spreadTitle:keep?String(baseline?.spreadTitle||ai.spreadTitle||'질문 맞춤 배열'):String(ai.spreadTitle||baseline?.spreadTitle||'질문 맞춤 배열'),
      designRationale:keep?String(baseline?.designRationale||'질문 구조 기반 설계'):String(ai.designRationale||'사례집 기반 질문 분류 후 설계'),
      layoutType:keep?String(baseline?.layoutType||'custom'):String(ai.layoutType||'casebook-preflight'),
      positions
    };
    out._luneaPreflight={
      version:2,
      intentSummary:String(ai.intentSummary||''),
      primaryIntent:String(ai.primaryIntent||''),
      targetStructure:String(ai.targetStructure||''),
      requestedAxes:Array.isArray(ai.requestedAxes)?ai.requestedAxes.map(String):[],
      timeScope:String(ai.timeScope||'미지정'),
      usedBaseline:keep,
      casebookMatches:ai.__casebookMatches||[],
      casebookStats:ai.__casebookStats||{}
    };
    return out;
  }

  async function smartDesign(question,options={}){
    const q=clean(question);
    if(!q||typeof baseDesign!=='function')return baseDesign?.call(this,q);
    const baseline=await baseDesign.call(this,q);
    if(!baseline||!Array.isArray(baseline.positions)||!baseline.positions.length)return baseline;
    const ai=await askEditor(q,baseline,options);
    const result=merge(baseline,ai);
    W.LUNEA_AI_SPREAD_PREFLIGHT_LAST={question:q,baseline:safeBaseline(baseline),ai,result:safeBaseline(result)};
    return result;
  }

  function addStyles(){
    if($('luneaSpreadPreviewStyle'))return;
    const s=document.createElement('style'); s.id='luneaSpreadPreviewStyle';
    s.textContent=`
      #luneaSpreadPreviewOverlay{position:fixed;inset:0;z-index:420;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(5,3,10,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      #luneaSpreadPreviewOverlay.show{display:flex}
      #luneaSpreadPreviewModal{width:100%;max-width:440px;max-height:92dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(197,178,250,.25);border-radius:24px;background:#140f21;padding:18px 14px calc(22px + env(safe-area-inset-bottom));box-shadow:0 24px 60px rgba(0,0,0,.72);position:relative}
      #luneaSpreadPreviewClose{position:absolute;right:13px;top:9px;border:0;background:none;color:var(--dim);font-size:24px;cursor:pointer}
      .lsp-kicker{font:700 9.5px 'Cinzel',serif;letter-spacing:1.4px;color:var(--moon);margin:2px 34px 5px 0}
      .lsp-title{margin:0 34px 12px 0;font:600 18px 'Noto Serif KR',serif}
      .lsp-intent{margin:0 0 12px;padding:10px 11px;border-radius:12px;background:rgba(157,228,193,.06);border:1px solid rgba(157,228,193,.16)}
      .lsp-intent b{display:block;margin-bottom:4px;color:#bfe7d2;font-size:10px}.lsp-intent div{font-size:11px;line-height:1.55;color:#ebe6f4}.lsp-intent small{display:block;margin-top:5px;color:var(--dim);font-size:9.5px;line-height:1.5}
      #luneaSpreadPreviewModal label{display:block;margin:9px 0 5px;font-size:11px;font-weight:700;color:#ddd5eb}
      #luneaSpreadPreviewPositions{min-height:210px;line-height:1.55;resize:vertical}.lsp-count{margin:5px 2px 10px;color:var(--gold);font-size:9.5px;font-weight:700}
      .lsp-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:7px;margin-top:10px}.lsp-actions button{min-height:44px}.lsp-note{margin:9px 2px 0;color:var(--dim);font-size:9.5px;line-height:1.5}`;
    document.head.appendChild(s);
  }
  function ensurePreview(){
    let o=$('luneaSpreadPreviewOverlay'); if(o)return o;
    addStyles(); o=document.createElement('div'); o.id='luneaSpreadPreviewOverlay'; o.setAttribute('aria-hidden','true');
    o.innerHTML=`<div id="luneaSpreadPreviewModal">
      <button type="button" id="luneaSpreadPreviewClose" aria-label="미리보기 닫기">×</button>
      <div class="lsp-kicker">LUNEA · CASEBOOK PREFLIGHT V2</div><h3 class="lsp-title">카드 뽑기 전 배열 확인</h3>
      <div class="lsp-intent"><b>AI가 이해한 질문의 핵심</b><div id="luneaSpreadPreviewIntent"></div><small id="luneaSpreadPreviewMeta"></small></div>
      <label for="luneaSpreadPreviewTitle">스프레드 이름</label><input id="luneaSpreadPreviewTitle">
      <label for="luneaSpreadPreviewPositions">카드 포지션 · 한 줄에 한 자리</label><textarea id="luneaSpreadPreviewPositions"></textarea>
      <div class="lsp-count" id="luneaSpreadPreviewCount"></div>
      <div class="lsp-actions"><button type="button" class="mini" id="luneaSpreadPreviewRegenerate">↻ 다른 배열</button><button type="button" class="primary" id="luneaSpreadPreviewConfirm">✦ 이 배열로 카드 뽑기</button></div>
      <div class="lsp-note">질문 원문은 바뀌지 않아. 포지션만 수정할 수 있고, 확정 전까지 RNG 카드는 생성되지 않아.</div>
    </div>`;
    document.body.appendChild(o); return o;
  }
  function textareaLines(){return String($('luneaSpreadPreviewPositions')?.value||'').split(/\n+/).map(stripNum).filter(Boolean).slice(0,12)}
  function updateCount(){const a=textareaLines(); if($('luneaSpreadPreviewCount'))$('luneaSpreadPreviewCount').textContent=`총 ${a.length}장 · 확정 전 카드 추출 없음`}
  function fill(sp){
    const m=sp?._luneaPreflight||{};
    $('luneaSpreadPreviewTitle').value=sp?.spreadTitle||'질문 맞춤 배열';
    $('luneaSpreadPreviewPositions').value=(sp?.positions||[]).map(stripNum).join('\n');
    $('luneaSpreadPreviewIntent').textContent=m.intentSummary||'LUNEA 기본 구조 분석 결과';
    const matched=Array.isArray(m.casebookMatches)?m.casebookMatches.length:0;
    const bits=[m.targetStructure,m.primaryIntent,m.timeScope&&m.timeScope!=='미지정'?`기간: ${m.timeScope}`:'',matched?`사례집 ${matched}개 참조`:''].filter(Boolean);
    $('luneaSpreadPreviewMeta').textContent=bits.join(' · '); updateCount();
  }
  function openPreview(question,initial){
    const o=ensurePreview(); let current=initial; fill(current); o.classList.add('show'); o.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
    return new Promise(resolve=>{
      let done=false;
      const finish=v=>{if(done)return;done=true;o.classList.remove('show');o.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');resolve(v)};
      $('luneaSpreadPreviewClose').onclick=()=>finish(null);
      o.onclick=e=>{if(e.target===o)finish(null)};
      $('luneaSpreadPreviewPositions').oninput=updateCount;
      $('luneaSpreadPreviewConfirm').onclick=()=>{
        const lines=textareaLines(); if(lines.length<2)return alert('카드 포지션을 최소 2개는 남겨줘.');
        const title=clean($('luneaSpreadPreviewTitle').value)||current?.spreadTitle||'질문 맞춤 배열';
        finish({...current,spreadTitle:title,positions:lines.map((x,i)=>`${i+1}. ${x}`),designRationale:String(current?.designRationale||'사례집 기반 AI 배열')+' · PRE-DRAW USER CONFIRMED'});
      };
      $('luneaSpreadPreviewRegenerate').onclick=async()=>{
        const b=$('luneaSpreadPreviewRegenerate'),c=$('luneaSpreadPreviewConfirm'),avoid=textareaLines();
        b.disabled=true;c.disabled=true;b.textContent='사례 다시 매칭 중…';
        try{current=await smartDesign(question,{regenerate:true,avoid});fill(current)}
        catch(err){console.error('[LUNEA Preflight V2] regenerate failed',err);alert('다른 배열 생성에 실패했어. 현재 배열은 유지할게.')}
        finally{b.disabled=false;c.disabled=false;b.textContent='↻ 다른 배열'}
      };
    });
  }

  function install(){
    if(installed)return true;
    const drawBtn=$('drawBtn');
    if(!drawBtn||typeof W.designSpread!=='function')return false;
    baseDesign=W.designSpread; W.designSpread=smartDesign; try{designSpread=smartDesign}catch{}
    baseDraw=drawBtn.onclick;
    drawBtn.onclick=async function(event){
      const s=getState();
      if(!s||s.__luneaManualMode||!s.isAi)return typeof baseDraw==='function'?baseDraw.call(this,event):undefined;
      const q=clean($('question')?.value||''); if(!q){alert('질문 원문을 먼저 입력해줘.');$('question')?.focus();return}
      const label=$('drawLabel'); drawBtn.disabled=true; if(label)label.textContent='질문 사례 매칭 & 배열 검수 중…';
      try{
        const sp=await W.designSpread(q); if(!sp||!Array.isArray(sp.positions)||sp.positions.length<2)throw new Error('배열 결과가 비어 있음');
        const confirmed=await openPreview(q,sp); if(!confirmed)return;
        const start=W.startSpread||(typeof startSpread==='function'?startSpread:null); if(typeof start!=='function')throw new Error('카드 펼치기 함수를 찾지 못했어.');
        start(q,confirmed.positions,confirmed.spreadTitle,confirmed.designRationale);
      }catch(err){console.error('[LUNEA Preflight V2] custom spread failed',err);alert('맞춤 배열을 만드는 중 오류가 났어. 질문은 그대로 유지돼.')}
      finally{drawBtn.disabled=false;if(label)label.textContent='질문 분석 & 맞춤 배열 설계'}
    };
    ensurePreview(); installed=true;
    W.LUNEA_AI_SPREAD_PREFLIGHT={version:2,design:smartDesign,getLast:()=>W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||null,casebook:()=>W.LUNEA_QUESTION_CASEBOOK_V1||null};
    console.info('🧠 LUNEA AI Spread Preflight V2 installed · casebook-grounded semantic QA + pre-draw preview');
    return true;
  }
  function boot(){let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(t)},80);install()}
  if(document.readyState==='complete')setTimeout(boot,0);else W.addEventListener('load',boot,{once:true});
})();
