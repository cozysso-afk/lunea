'use strict';

/*
  LUNEA USER SPREAD LEARNING V1
  =============================
  Local-only correction memory for AI spread preflight.

  - Saves only when the user manually changes preview title/positions before confirm.
  - Stores the final corrected spread as a high-priority example for similar future questions.
  - Never sends the whole memory anywhere; only a few locally matched examples are inserted
    into the normal Gemini preflight prompt for the current question.
  - Max 120 corrections, deduped by normalized question.
*/
(() => {
  const W=window;
  if(W.__LUNEA_SPREAD_LEARNING_V1__)return;
  W.__LUNEA_SPREAD_LEARNING_V1__=true;

  const KEY='LUNEA_SPREAD_CORRECTION_MEMORY_V1';
  const MAX=120;

  function clean(v){return String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim()}
  function compact(v){return clean(v).toLowerCase().replace(/디엠/g,'dm').replace(/카톡/g,'메시지').replace(/선톡/g,'먼저연락').replace(/[^0-9a-z가-힣]+/g,'')}
  function words(v){return new Set(clean(v).toLowerCase().replace(/[^0-9a-z가-힣]+/g,' ').split(/\s+/).filter(x=>x.length>=2))}
  function grams(v,n){const s=compact(v),o=new Set();for(let i=0;i<=s.length-n;i++)o.add(s.slice(i,i+n));return o}
  function jac(a,b){if(!a.size||!b.size)return 0;let h=0;a.forEach(x=>b.has(x)&&h++);return h/Math.max(1,new Set([...a,...b]).size)}
  function overlap(a,b){if(!a.size||!b.size)return 0;let h=0;a.forEach(x=>b.has(x)&&h++);return h/Math.max(1,Math.min(a.size,b.size))}
  function stripNum(v){return clean(v).replace(/^\d{1,2}\s*[.)]\s*/,'')}
  function positions(v){return (Array.isArray(v)?v:[]).map(stripNum).filter(Boolean).slice(0,12)}
  function samePositions(a,b){const A=positions(a),B=positions(b);return A.length===B.length&&A.every((x,i)=>x===B[i])}

  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(x)?x:[];
    }catch{return[]}
  }
  function write(rows){
    try{localStorage.setItem(KEY,JSON.stringify(rows.slice(0,MAX)));return true}catch(e){console.warn('[LUNEA Learning] save failed',e);return false}
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
      requestedAxes:Array.isArray(meta.requestedAxes)?meta.requestedAxes.map(clean).filter(Boolean).slice(0,12):[],
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

  function score(q,row){
    const exact=compact(q)===String(row.questionKey||'')?3:0;
    const q3=grams(q,3),q4=grams(q,4),qw=words(q);
    const r3=grams(row.question,3),r4=grams(row.question,4),rw=words(row.question);
    const base=jac(q3,r3)*1.0+jac(q4,r4)*.72+overlap(qw,rw)*.42;
    const axes=[row.intentSummary,row.primaryIntent,row.targetStructure,...(row.requestedAxes||[]),...(row.positions||[])].join(' ');
    const semantic=jac(q3,grams(axes,3))*.30;
    return exact+base+semantic;
  }

  function find(question,limit=3){
    const q=clean(question);if(!q)return[];
    return read().map(row=>({row,score:score(q,row)}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,Math.max(1,Math.min(5,Number(limit)||3)))
      .filter(x=>x.score>.14);
  }

  function formatForPrompt(question,limit=3){
    const rows=find(question,limit);
    if(!rows.length)return '사용자 교정 사례 없음';
    return rows.map((x,i)=>{
      const r=x.row;
      const meta=[r.targetStructure,r.primaryIntent].filter(Boolean).join(' · ');
      return `[사용자 교정 정답 ${i+1}]\n과거 질문: ${r.question}\n당시 사용자가 직접 확정한 배열명: ${r.spreadTitle}\n당시 사용자가 직접 고친 최종 포지션: ${r.positions.join(' / ')}\n질문 구조 메모: ${meta||'없음'}\n당시 보존축: ${(r.requestedAxes||[]).join(' / ')||'최종 포지션을 기준으로 판단'}`;
    }).join('\n\n');
  }

  W.LUNEA_SPREAD_LEARNING_V1={
    version:1,
    key:KEY,
    max:MAX,
    record,
    find,
    formatForPrompt,
    list:()=>read().slice(),
    count:()=>read().length,
    clear:()=>{localStorage.removeItem(KEY);return true}
  };
  console.info(`🧠 LUNEA User Spread Learning V1 loaded · ${read().length} learned corrections`);
})();
