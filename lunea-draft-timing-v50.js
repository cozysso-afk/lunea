'use strict';

/* LUNEA DRAFT TIMING PERSISTENCE V50
   - preserve Timing Oracle for every RWS reading, not only DAILY
   - survive accidental close / PWA termination / ↩ 복원
   - cooperate with the existing LAST READING draft writer without changing RNG/card state
*/
(() => {
  const W = window;
  if (W.__LUNEA_DRAFT_TIMING_V50__) return;
  W.__LUNEA_DRAFT_TIMING_V50__ = true;

  const DRAFT_KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  const $ = id => document.getElementById(id);
  const nativeSetItem = Storage.prototype.setItem;
  const nativeGetItem = Storage.prototype.getItem;
  const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function clone(v){ try{return JSON.parse(JSON.stringify(v))}catch{return null} }
  function getState(){ try{return state}catch{return null} }
  function readDraft(){
    try{
      const raw = nativeGetItem.call(localStorage, DRAFT_KEY);
      const d = JSON.parse(raw || 'null');
      return d && Array.isArray(d.drawn) && d.drawn.length ? d : null;
    }catch{return null}
  }
  function cardKey(card){
    if(!card) return '';
    return [card.code||card.id||card.name||'', card.isReversed?'R':'U'].join(':');
  }
  function signature(obj){
    const drawn = Array.isArray(obj?.drawn) ? obj.drawn : [];
    return [norm(obj?.category), norm(obj?.title), norm(obj?.question), drawn.map(cardKey).join('|')].join('::');
  }
  function stateLike(){
    const s=getState();
    if(!s || !Array.isArray(s.drawn) || !s.drawn.length) return null;
    return {category:s.category,title:s.title,question:s.question,drawn:s.drawn};
  }
  function sameReading(a,b){
    const sa=signature(a), sb=signature(b);
    return !!sa && !!sb && sa===sb;
  }

  function captureTiming(){
    const box=$('luneaTimingInline');
    const img=box?.querySelector(':scope > img');
    if(!box || !img?.src) return null;
    const txt=box.querySelector(':scope > .txt');
    const ctx=stateLike();
    if(!ctx) return null;
    return {
      version:50,
      savedAt:Date.now(),
      readingSignature:signature(ctx),
      imgSrc:String(img.src||''),
      kicker:norm(txt?.querySelector('small')?.textContent||'LUNEA TIME SIGNAL'),
      label:norm(txt?.querySelector('b')?.textContent||''),
      meaning:norm(txt?.querySelector('span')?.textContent||'')
    };
  }

  function mergeTimingIntoDraft(){
    const snap=captureTiming();
    if(!snap) return false;
    try{
      const d=readDraft();
      const ctx=stateLike();
      if(!d || !ctx || !sameReading(d,ctx)) return false;
      d.timingSupport=snap;
      nativeSetItem.call(localStorage,DRAFT_KEY,JSON.stringify(d));
      return true;
    }catch(err){
      console.warn('[LUNEA Draft Timing] merge failed',err);
      return false;
    }
  }

  // The base draft writer replaces the whole JSON object. Preserve Timing only when
  // the incoming snapshot is still the exact same reading; never leak it to a new spread.
  Storage.prototype.setItem = function(key,value){
    if(this===localStorage && key===DRAFT_KEY){
      try{
        const incoming=JSON.parse(String(value||'null'));
        if(incoming && Array.isArray(incoming.drawn) && incoming.drawn.length){
          const current=captureTiming();
          if(current && sameReading(incoming,stateLike())){
            incoming.timingSupport=current;
            value=JSON.stringify(incoming);
          }else{
            const old=readDraft();
            if(old?.timingSupport && sameReading(old,incoming)){
              incoming.timingSupport=clone(old.timingSupport);
              value=JSON.stringify(incoming);
            }
          }
        }
      }catch{}
    }
    return nativeSetItem.call(this,key,value);
  };

  function makeTimingBox(snap){
    const box=document.createElement('div');
    box.id='luneaTimingInline';
    box.className='timing-inline';
    box.dataset.draftTimingRestored='1';
    const img=document.createElement('img');
    img.src=snap.imgSrc;
    img.alt='LUNEA Timing Oracle';
    const txt=document.createElement('div');
    txt.className='txt';
    const small=document.createElement('small'); small.textContent=snap.kicker||'LUNEA TIME SIGNAL';
    const b=document.createElement('b'); b.textContent=snap.label||'시기 오라클';
    const span=document.createElement('span'); span.textContent=snap.meaning||'';
    txt.append(small,b,span);
    box.append(img,txt);
    return box;
  }

  function restoreTiming(draft){
    const snap=draft?.timingSupport;
    if(!snap?.imgSrc) return false;
    const ctx=stateLike();
    if(ctx && !sameReading(draft,ctx)) return false;

    let box=$('luneaTimingInline');
    if(!box){
      const cards=$('cards');
      if(!cards) return false;
      box=makeTimingBox(snap);
      cards.insertAdjacentElement('afterend',box);
    }else{
      let img=box.querySelector(':scope > img');
      let txt=box.querySelector(':scope > .txt');
      if(!img){img=document.createElement('img');box.prepend(img)}
      if(!txt){txt=document.createElement('div');txt.className='txt';box.appendChild(txt)}
      let small=txt.querySelector('small'); if(!small){small=document.createElement('small');txt.appendChild(small)}
      let b=txt.querySelector('b'); if(!b){b=document.createElement('b');txt.appendChild(b)}
      let span=txt.querySelector('span'); if(!span){span=document.createElement('span');txt.appendChild(span)}
      img.src=snap.imgSrc; img.alt='LUNEA Timing Oracle';
      small.textContent=snap.kicker||'LUNEA TIME SIGNAL';
      b.textContent=snap.label||'시기 오라클';
      span.textContent=snap.meaning||'';
      box.dataset.draftTimingRestored='1';
    }

    const btn=$('timingSupportBtn');
    if(btn) btn.textContent='◐ 시기 오라클 ✓';
    try{W.LUNEA_DAILY_TIMING_V49?.compact?.()}catch{}
    try{W.LUNEA_ARCHIVE_TIMING_V48?.compact?.()}catch{}
    return true;
  }

  function scheduleMerge(){
    // Ask the base draft module to snapshot first, then attach Timing to that exact snapshot.
    [80,220,500,950,1800].forEach(ms=>setTimeout(()=>{
      try{W.LUNEA_READING_DRAFT_V1?.snapshot?.()}catch{}
      setTimeout(mergeTimingIntoDraft,20);
    },ms));
  }
  function scheduleRestore(draft){
    [60,140,300,650,1200].forEach(ms=>setTimeout(()=>restoreTiming(draft),ms));
  }

  function boot(){
    // Restore button: capture the saved draft before the base handler starts rebuilding DOM.
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#luneaDraftRestore')){
        const d=readDraft();
        if(d?.timingSupport) scheduleRestore(d);
        return;
      }
      if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')) scheduleMerge();
    },true);

    const mo=new MutationObserver(mutations=>{
      const relevant=mutations.some(m=>
        m.target?.id==='luneaTimingInline' ||
        m.target?.closest?.('#luneaTimingInline') ||
        Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.id==='luneaTimingInline'||n.querySelector?.('#luneaTimingInline')))
      );
      if(relevant) scheduleMerge();
    });
    if(document.body) mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class'],characterData:true});

    W.addEventListener('pagehide',()=>mergeTimingIntoDraft());
    W.addEventListener('beforeunload',()=>mergeTimingIntoDraft());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)mergeTimingIntoDraft()});

    W.LUNEA_DRAFT_TIMING_V50={readDraft,capture:captureTiming,merge:mergeTimingIntoDraft,restore:restoreTiming};
    console.info('↩ LUNEA Draft Timing V50 loaded · all readings preserve Timing Oracle');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
