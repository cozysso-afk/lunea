'use strict';

/*
  LUNEA USER SPREAD LEARNING V1.3
  =============================
  Local-only correction memory for AI spread preflight.

  - Saves only when the user manually changes preview title/positions before confirm.
  - Stores the final corrected spread as a high-priority example for similar future questions.
  - Prepends only the closest structurally compatible corrections to the normal casebook prompt.
  - A single correction can generalize across paraphrases through domain / target / intent / stage cues.
  - Blocks misleading matches such as two-person comparison vs one-person scenarios.
  - Learns user-authored manual spreads after the user actually starts the draw.
  - Never uploads the memory as a dataset; matched examples travel only inside the user's
    normal Gemini preflight request for that current question.
  - Max 500 corrections, deduped by normalized question; shrinks safely only if storage is full.
  - Keeps up to 32 positions so A/B 24-card symmetric layouts are learned in full.
*/
(() => {
  const W=window;
  if(W.__LUNEA_SPREAD_LEARNING_V1__)return;
  W.__LUNEA_SPREAD_LEARNING_V1__=true;

  const KEY='LUNEA_SPREAD_CORRECTION_MEMORY_V1';
  const MAX=500;
  const MIN_ON_QUOTA=80;
  const MAX_POSITIONS=32;
  const $=id=>document.getElementById(id);

  function clean(v){return String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim()}
  function compact(v){return clean(v).toLowerCase().replace(/디엠/g,'dm').replace(/카톡/g,'메시지').replace(/선톡/g,'먼저연락').replace(/[^0-9a-z가-힣]+/g,'')}
  function words(v){return new Set(clean(v).toLowerCase().replace(/[^0-9a-z가-힣]+/g,' ').split(/\s+/).filter(x=>x.length>=2))}
  function grams(v,n){const s=compact(v),o=new Set();for(let i=0;i<=s.length-n;i++)o.add(s.slice(i,i+n));return o}
  function jac(a,b){if(!a.size||!b.size)return 0;let h=0;a.forEach(x=>b.has(x)&&h++);return h/Math.max(1,new Set([...a,...b]).size)}
  function overlap(a,b){if(!a.size||!b.size)return 0;let h=0;a.forEach(x=>b.has(x)&&h++);return h/Math.max(1,Math.min(a.size,b.size))}
  function stripNum(v){return clean(v).replace(/^\d{1,2}\s*[.)]\s*/,'')}
  function positions(v){return (Array.isArray(v)?v:[]).map(stripNum).filter(Boolean).slice(0,MAX_POSITIONS)}
  function lines(v){return String(v||'').split(/\n+/).map(stripNum).filter(Boolean).slice(0,MAX_POSITIONS)}
  function samePositions(a,b){const A=positions(a),B=positions(b);return A.length===B.length&&A.every((x,i)=>x===B[i])}

  function profile(question,meta={}){
    const q=clean(question).toLowerCase();
    const hint=[meta.intentSummary,meta.primaryIntent,meta.targetStructure,...(Array.isArray(meta.requestedAxes)?meta.requestedAxes:[])].map(clean).join(' ').toLowerCase();
    const all=`${q} ${hint}`;
    const domain=/(주식|종목|매수|매도|익절|손절|추매|보유)/.test(all)?'stock'
      :/(시험|합격|공부|학습|강의|점수)/.test(all)?'study'
      :/(직장|회사|이직|퇴사|상사|동료|면접|커리어)/.test(all)?'career'
      :/(돈|금전|재정|지출|수입|부채)/.test(all)?'money'
      :/(건강|몸|컨디션|피곤|회복|수면)/.test(all)?'wellbeing'
      :/(상대|연애|사랑|감정|마음|연락|재회|이별|썸|전남|전여|남친|여친)/.test(all)?'relationship'
      :'general';

    const explicitPair=/(?:\ba\s*(?:와|과|랑|\/|·|vs|및|그리고)\s*b\b|a와b|a\/b|a·b|두\s*(?:사람|명|인연|상대|대상)|2\s*(?:사람|명|인연|상대|대상)|대칭\s*비교)/i.test(all);
    const scenarioCues=[/지금|바로/,/몇\s*시간|좀\s*있/,/내일|모레/,/더\s*늦|나중/,/길게/,/짧게/,/이모티콘|ㅋㅋ|ㅎㅎ/,/카톡|메시지/,/dm|디엠/,/전화|문자/].reduce((n,re)=>n+(re.test(q)?1:0),0);
    const scenario= !explicitPair && (scenarioCues>=2 || /시나리오|경우별|각\s*방식|각각\s*반응/.test(q));
    const target=explicitPair?'pair':scenario?'single_scenarios':'single_or_unspecified';

    const modes=[];
    const add=(name,re)=>re.test(all)&&modes.push(name);
    add('observation',/봤|보았|읽었|들었|확인했|조회|염탐|정체|실제\s*여부/);
    add('perception',/인식|추측|어떻게\s*(?:보|생각)|이미지|평판|평가/);
    add('thought',/생각|떠올|기억|의식/);
    add('feeling',/감정|마음|좋아|그리|미련|끌림/);
    add('action',/행동|움직|다가|실행|답장|연락|선톡|dm|디엠/);
    add('timing',/언제|시기|타이밍|전조|방아쇠|지연|이번\s*주|몇\s*(?:시간|일|주|달)/);
    add('cause',/왜|이유|원인|병목|계기/);
    add('compare',/비교|vs|각각|차이|a\/b|둘\s*중|두\s*(?:사람|명|대상)/i);
    add('choice',/할까\s*말까|고를|선택|어디가\s*나|뭐가\s*나/);
    add('advice',/조언|대응|뭘\s*해야|어떻게\s*해야|행동\s*기준/);
    add('outcome',/결과|가능성|될까|올까|성사|합격|흐름/);
    if(!modes.length)modes.push('general');

    const stage=/(보고\s*왔|만나고\s*왔|끝났|이미\s*(?:했|옴|왔)|연락\s*(?:왔|옴)|발생\s*후)/.test(q)?'after'
      :/(예정|잡혀|앞두|내일\s*(?:만나|면접)|모레\s*(?:만나|면접))/.test(q)?'scheduled'
      :/(들어올|생길|잡힐|아직\s*(?:없|안)|기회)/.test(q)?'before_opportunity'
      :'current_or_unspecified';
    return {version:1,domain,target,modes:[...new Set(modes)].sort(),stage};
  }

  function compatibility(queryProfile,rowProfile){
    const q=queryProfile||{},r=rowProfile||{};
    if(q.target==='pair'&&r.target&&r.target!=='pair')return {blocked:true,boost:-1,reason:'target_pair_mismatch'};
    if(r.target==='pair'&&q.target&&q.target!=='pair')return {blocked:true,boost:-1,reason:'target_pair_mismatch'};
    if(q.target==='single_scenarios'&&r.target==='pair')return {blocked:true,boost:-1,reason:'scenario_pair_mismatch'};
    if(r.target==='single_scenarios'&&q.target==='pair')return {blocked:true,boost:-1,reason:'scenario_pair_mismatch'};
    if(q.stage==='after'&&['scheduled','before_opportunity'].includes(r.stage))return {blocked:true,boost:-1,reason:'event_stage_mismatch'};
    if(r.stage==='after'&&['scheduled','before_opportunity'].includes(q.stage))return {blocked:true,boost:-1,reason:'event_stage_mismatch'};

    let boost=0;
    if(q.domain&&r.domain&&q.domain===r.domain)boost+=.18;
    else if(q.domain&&r.domain&&q.domain!=='general'&&r.domain!=='general')boost-=.22;
    if(q.target&&r.target&&q.target===r.target)boost+=.22;
    const qm=new Set(q.modes||[]),rm=new Set(r.modes||[]);
    const modeOverlap=overlap(qm,rm);
    boost+=modeOverlap*.42;
    if(qm.size&&rm.size&&!modeOverlap&&!qm.has('general')&&!rm.has('general'))boost-=.18;
    if(q.stage&&r.stage&&q.stage===r.stage&&q.stage!=='current_or_unspecified')boost+=.12;
    return {blocked:false,boost,reason:'compatible'};
  }

  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(x)?x:[];
    }catch{return[]}
  }
  function write(rows){
    let kept=rows.slice(0,MAX);
    while(kept.length){
      try{localStorage.setItem(KEY,JSON.stringify(kept));return true}
      catch(e){
        if(kept.length<=MIN_ON_QUOTA){console.warn('[LUNEA Learning] save failed',e);return false}
        kept=kept.slice(0,Math.max(MIN_ON_QUOTA,Math.floor(kept.length*.8)));
      }
    }
    return false;
  }

  function record(payload={}){
    const q=clean(payload.question);
    const original=payload.originalSpread||{};
    const corrected=payload.correctedSpread||{};
    const finalPos=positions(corrected.positions);
    if(!q||finalPos.length<2)return {saved:false,reason:'invalid'};
    const title=clean(corrected.spreadTitle);
    const changed=!samePositions(original.positions,corrected.positions)||clean(original.spreadTitle)!==title;
    if(!changed)return {saved:false,reason:'unchanged'};

    const meta=payload.meta||corrected._luneaPreflight||{};
    const now=Date.now();
    const row={
      id:`u_${now.toString(36)}_${Math.random().toString(36).slice(2,7)}`,
      question:q,
      questionKey:compact(q),
      spreadTitle:title||'사용자 교정 배열',
      positions:finalPos,
      originalTitle:clean(original.spreadTitle),
      originalPositions:positions(original.positions),
      intentSummary:clean(meta.intentSummary),
      primaryIntent:clean(meta.primaryIntent),
      targetStructure:clean(meta.targetStructure),
      requestedAxes:Array.isArray(meta.requestedAxes)?meta.requestedAxes.map(clean).filter(Boolean).slice(0,MAX_POSITIONS):[],
      structureProfile:profile(q,meta),
      source:payload.source==='manual'?'manual':'ai_correction',
      createdAt:now,
      updatedAt:now
    };
    const rows=read();
    const idx=rows.findIndex(x=>x&&x.questionKey===row.questionKey);
    if(idx>=0){
      row.id=rows[idx].id||row.id;
      row.createdAt=rows[idx].createdAt||now;
      rows.splice(idx,1);
    }
    rows.unshift(row);
    const ok=write(rows);
    if(ok)console.info('🧠 LUNEA learned corrected spread',row.question);
    return {saved:ok,row};
  }

  function recordManual(payload={}){
    const finalPos=positions(payload.positions);
    const axes=positions(payload.axes);
    return record({
      question:payload.question,
      originalSpread:{spreadTitle:'',positions:[]},
      correctedSpread:{spreadTitle:clean(payload.spreadTitle)||'사용자 직접 배열',positions:finalPos},
      source:'manual',
      meta:{
        intentSummary:'사용자가 질문에 맞춰 처음부터 직접 설계한 최종 배열',
        primaryIntent:'사용자 직접 설계 배열',
        targetStructure:payload.symmetric?'두 사람 A/B 대칭 비교':'사용자 지정 대상 구조',
        requestedAxes:axes.length?axes:finalPos
      }
    });
  }

  function score(q,row){
    const exact=compact(q)===String(row.questionKey||'')?3:0;
    const q3=grams(q,3),q4=grams(q,4),qw=words(q);
    const r3=grams(row.question,3),r4=grams(row.question,4),rw=words(row.question);
    const base=jac(q3,r3)*1.0+jac(q4,r4)*.72+overlap(qw,rw)*.42;
    const axes=[row.intentSummary,row.primaryIntent,row.targetStructure,...(row.requestedAxes||[]),...(row.positions||[])].join(' ');
    const semantic=jac(q3,grams(axes,3))*.30;
    const queryProfile=profile(q);
    const rowProfile=row.structureProfile||profile(row.question,{intentSummary:row.intentSummary,primaryIntent:row.primaryIntent,targetStructure:row.targetStructure,requestedAxes:row.requestedAxes});
    const fit=compatibility(queryProfile,rowProfile);
    return {value:exact+base+semantic+fit.boost,blocked:fit.blocked,reason:fit.reason,queryProfile,rowProfile};
  }

  function find(question,limit=3){
    const q=clean(question);if(!q)return[];
    return read().map(row=>{const ranked=score(q,row);return {row,score:ranked.value,blocked:ranked.blocked,reason:ranked.reason,queryProfile:ranked.queryProfile,rowProfile:ranked.rowProfile}})
      .filter(x=>!x.blocked)
      .sort((a,b)=>b.score-a.score)
      .slice(0,Math.max(1,Math.min(5,Number(limit)||3)))
      .filter(x=>x.score>.20);
  }

  function formatForPrompt(question,limit=3){
    const rows=find(question,limit);
    if(!rows.length)return '사용자 교정 사례 없음';
    return rows.map((x,i)=>{
      const r=x.row;
      const meta=[r.targetStructure,r.primaryIntent].filter(Boolean).join(' · ');
      const p=x.rowProfile||r.structureProfile||{};
      const structure=[p.domain,p.target,...(p.modes||[]),p.stage].filter(Boolean).join(' · ');
      return `[사용자 교정 정답 ${i+1} · 구조 유사도 ${x.score.toFixed(2)}]\n과거 질문: ${r.question}\n당시 사용자가 직접 확정한 배열명: ${r.spreadTitle}\n당시 사용자가 직접 고친 최종 포지션: ${r.positions.join(' / ')}\n질문 구조: ${structure||'미분류'}\n질문 구조 메모: ${meta||'없음'}\n당시 보존축: ${(r.requestedAxes||[]).join(' / ')||'최종 포지션을 기준으로 판단'}`;
    }).join('\n\n');
  }

  function installCasebookBridge(){
    const book=W.LUNEA_QUESTION_CASEBOOK_V1;
    if(!book||typeof book.formatForPrompt!=='function'||book.__luneaLearningBridge)return false;
    const baseFormat=book.formatForPrompt.bind(book);
    book.formatForPrompt=(question,limit=4)=>{
      const learned=formatForPrompt(question,Math.min(3,limit));
      const staticCases=baseFormat(question,limit);
      if(learned==='사용자 교정 사례 없음')return staticCases;
      return `[최우선 · 이 사용자가 직접 고친 과거 정답]\n아래 사용자 교정 사례가 현재 질문과 충분히 유사하면 정적 사례보다 우선 참고한다.\n질문 구조가 다르면 포지션 문구를 그대로 복사하지 않는다.\n\n${learned}\n\n[정적 LUNEA 사례집]\n${staticCases}`;
    };
    book.__luneaLearningBridge=true;
    return true;
  }

  function installPreviewCapture(){
    const overlay=$('luneaSpreadPreviewOverlay');
    const title=$('luneaSpreadPreviewTitle');
    const ta=$('luneaSpreadPreviewPositions');
    const confirm=$('luneaSpreadPreviewConfirm');
    const regen=$('luneaSpreadPreviewRegenerate');
    if(!overlay||!title||!ta||!confirm||overlay.__luneaLearningCapture)return false;
    overlay.__luneaLearningCapture=true;

    let dirty=false;
    let snapshot={title:'',positions:[]};

    const takeSnapshot=()=>{
      snapshot={title:clean(title.value),positions:lines(ta.value)};
      dirty=false;
    };

    new MutationObserver(()=>{
      if(overlay.classList.contains('show'))requestAnimationFrame(takeSnapshot);
    }).observe(overlay,{attributes:true,attributeFilter:['class']});

    title.addEventListener('input',()=>{dirty=true});
    ta.addEventListener('input',()=>{dirty=true});

    if(regen){
      regen.addEventListener('click',()=>{
        dirty=false;
        const watch=setInterval(()=>{
          if(!regen.disabled){
            clearInterval(watch);
            requestAnimationFrame(takeSnapshot);
          }
        },80);
        setTimeout(()=>clearInterval(watch),15000);
      },true);
    }

    confirm.addEventListener('click',()=>{
      if(!dirty)return;
      const finalPositions=lines(ta.value);
      if(finalPositions.length<2)return;
      const last=W.LUNEA_AI_SPREAD_PREFLIGHT_LAST||{};
      const ai=last.ai||{};
      const res=record({
        question:clean($('question')?.value||last.question||''),
        originalSpread:{spreadTitle:snapshot.title,positions:snapshot.positions},
        correctedSpread:{spreadTitle:clean(title.value),positions:finalPositions},
        meta:{
          intentSummary:ai.intentSummary||'',
          primaryIntent:ai.primaryIntent||'',
          targetStructure:ai.targetStructure||'',
          requestedAxes:Array.isArray(ai.requestedAxes)?ai.requestedAxes:[]
        }
      });
      if(res.saved)console.info(`✅ LUNEA correction memory ${read().length}/${MAX}`);
    },true);
    return true;
  }

  function boot(){
    let tries=0;
    const t=setInterval(()=>{
      tries++;
      installCasebookBridge();
      if(installPreviewCapture()&&W.LUNEA_QUESTION_CASEBOOK_V1)clearInterval(t);
      else if(tries>160)clearInterval(t);
    },80);
    installCasebookBridge();
    installPreviewCapture();
  }

  W.LUNEA_SPREAD_LEARNING_V1={
    version:4,
    key:KEY,
    max:MAX,
    maxPositions:MAX_POSITIONS,
    record,
    recordManual,
    find,
    profile,
    compatibility,
    formatForPrompt,
    list:()=>read().slice(),
    count:()=>read().length,
    clear:()=>{localStorage.removeItem(KEY);return true}
  };

  if(document.readyState==='complete')setTimeout(boot,0);
  else W.addEventListener('load',boot,{once:true});
  console.info(`🧠 LUNEA User Spread Learning V1.3 loaded · ${read().length}/${MAX} learned corrections · AI edits + manual spreads · structural small-data matching`);
})();
