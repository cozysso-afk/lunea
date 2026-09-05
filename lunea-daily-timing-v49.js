'use strict';

/* LUNEA DAILY TIMING PERSISTENCE V49
   - keep DAILY Timing Oracle result across "오늘의 카드 다시 보기" / reloads
   - attach restored Timing evidence to the saved archive record
   - keep inline Timing result compact on iPhone
*/
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_TIMING_V49__) return;
  W.__LUNEA_DAILY_TIMING_V49__ = true;

  const DAILY_KEY = 'LUNEA_DAILY_ORBIT_V1';
  const SNAP_KEY = 'LUNEA_DAILY_TIMING_V49';
  const ARCHIVE_KEY = 'LUNEA_ARCHIVE_V3';
  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  function getState(){ try{return state}catch{return null} }
  function localDay(ts=Date.now()){
    const d=new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function readDaily(){
    try{
      const d=JSON.parse(localStorage.getItem(DAILY_KEY)||'null');
      return d && d.day===localDay() && Array.isArray(d.drawn) && d.drawn.length>=4 ? d : null;
    }catch{return null}
  }
  function isDailyContext(){
    const s=getState();
    return s?.category==='DAILY' || !!readDaily();
  }
  function readSnap(){
    try{
      const s=JSON.parse(localStorage.getItem(SNAP_KEY)||'null');
      if(s && s.day===localDay() && s.imgSrc) return s;
    }catch{}
    const d=readDaily();
    return d?.timingSupport?.day===localDay() && d.timingSupport.imgSrc ? d.timingSupport : null;
  }
  function mergeIntoDaily(snap){
    if(!snap) return;
    try{
      const d=readDaily();
      if(!d) return;
      d.timingSupport={...snap,day:localDay()};
      d.savedAt=Date.now();
      localStorage.setItem(DAILY_KEY,JSON.stringify(d));
    }catch(err){console.warn('[LUNEA Daily Timing] daily merge failed',err)}
  }
  function snapshotInline(){
    if(!isDailyContext()) return null;
    const box=$('luneaTimingInline');
    const img=box?.querySelector(':scope > img');
    if(!box || !img?.src) return null;
    const txt=box.querySelector(':scope > .txt');
    const d=readDaily();
    const s=getState();
    const snap={
      version:49,
      day:localDay(),
      savedAt:Date.now(),
      title:String(s?.title||d?.title||'DAILY ORBIT'),
      question:String(s?.question||d?.question||''),
      imgSrc:String(img.src||''),
      kicker:norm(txt?.querySelector('small')?.textContent||'LUNEA TIME SIGNAL'),
      label:norm(txt?.querySelector('b')?.textContent||''),
      meaning:norm(txt?.querySelector('span')?.textContent||'')
    };
    try{localStorage.setItem(SNAP_KEY,JSON.stringify(snap))}catch{}
    mergeIntoDaily(snap);
    return snap;
  }
  function timingObject(snap){
    if(!snap) return null;
    let filename='';
    try{filename=new URL(snap.imgSrc,location.href).pathname.split('/').pop()||''}catch{}
    return {
      deck:'LUNEA_TIMING_ORACLE_V1',
      restoredFromDaily:true,
      savedAt:snap.savedAt||Date.now(),
      primary:{
        label_ko:snap.label||'',
        meaning:snap.meaning||'',
        filename,
        image:snap.imgSrc||''
      },
      summary:[snap.label,snap.meaning].filter(Boolean).join(' · ')
    };
  }
  function attachTimingToNewestArchive(){
    const snap=readSnap();
    const d=readDaily();
    if(!snap||!d) return;
    try{
      const rows=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||'[]');
      if(!Array.isArray(rows)||!rows.length) return;
      const q=norm(d.question), title=norm(d.title);
      let idx=rows.findIndex(r=>q && norm(r?.q)===q);
      if(idx<0) idx=rows.findIndex(r=>title && norm(r?.title)===title);
      if(idx<0 && Number(rows[0]?.createdAt||0)>Date.now()-10000) idx=0;
      if(idx<0) return;
      if(!rows[idx].timing) rows[idx].timing=timingObject(snap);
      if(typeof W.setArchive==='function') W.setArchive(rows);
      else localStorage.setItem(ARCHIVE_KEY,JSON.stringify(rows));
    }catch(err){console.warn('[LUNEA Daily Timing] archive attach failed',err)}
  }

  function force(el,prop,value){try{el?.style?.setProperty(prop,value,'important')}catch{}}
  function compactInline(){
    const box=$('luneaTimingInline');
    if(!box) return false;
    box.querySelectorAll('.lunea-inline-orb,.lunea-v7-time-art,.lunea-v15-time-art').forEach(n=>n.remove());
    force(box,'display','grid');
    force(box,'grid-template-columns','110px minmax(0,1fr)');
    force(box,'align-items','center');
    force(box,'justify-content','stretch');
    force(box,'gap','14px');
    force(box,'width','100%');
    force(box,'padding','13px 14px');
    force(box,'text-align','left');
    force(box,'overflow','hidden');
    const img=box.querySelector(':scope > img');
    if(img){
      force(img,'display','block');force(img,'position','static');force(img,'inset','auto');
      force(img,'transform','none');force(img,'float','none');
      force(img,'width','110px');force(img,'min-width','110px');force(img,'max-width','110px');
      force(img,'height','auto');force(img,'max-height','185px');force(img,'aspect-ratio','auto');
      force(img,'margin','0');force(img,'object-fit','contain');force(img,'border-radius','10px');
    }
    const txt=box.querySelector(':scope > .txt');
    if(txt){
      force(txt,'display','block');force(txt,'position','static');force(txt,'inset','auto');
      force(txt,'transform','none');force(txt,'width','100%');force(txt,'min-width','0');
      force(txt,'max-width','none');force(txt,'margin','0');force(txt,'padding','0');force(txt,'text-align','left');
      const small=txt.querySelector('small'), b=txt.querySelector('b'), span=txt.querySelector('span');
      force(small,'font-size','9px');force(small,'line-height','1.4');force(small,'letter-spacing','1.15px');
      force(b,'font-size','17px');force(b,'line-height','1.35');force(b,'margin','5px 0 5px');
      force(span,'font-size','11.5px');force(span,'line-height','1.55');
    }
    return true;
  }
  function scheduleCompact(){
    [0,80,260,650,1300,2500,4200].forEach(ms=>setTimeout(()=>{compactInline();snapshotInline()},ms));
  }

  function restoreInline(){
    if(!isDailyContext()) return false;
    if($('luneaTimingInline')){compactInline();snapshotInline();return true}
    const snap=readSnap();
    const cards=$('cards');
    if(!snap||!cards||!snap.imgSrc) return false;
    const box=document.createElement('div');
    box.id='luneaTimingInline';
    box.className='timing-inline';
    box.dataset.dailyTimingRestored='1';
    const img=document.createElement('img');img.src=snap.imgSrc;img.alt='LUNEA Timing Oracle';
    const txt=document.createElement('div');txt.className='txt';
    const small=document.createElement('small');small.textContent=snap.kicker||'LUNEA TIME SIGNAL';
    const b=document.createElement('b');b.textContent=snap.label||'시기 오라클';
    const span=document.createElement('span');span.textContent=snap.meaning||'';
    txt.append(small,b,span);box.append(img,txt);cards.insertAdjacentElement('afterend',box);
    const btn=$('timingSupportBtn');if(btn)btn.textContent='◐ 시기 오라클 ✓';
    compactInline();mergeIntoDaily(snap);
    return true;
  }
  function scheduleRestore(){[40,140,320,700,1300].forEach(ms=>setTimeout(()=>{restoreInline();compactInline()},ms))}

  function boot(){
    scheduleCompact();
    if(isDailyContext()) scheduleRestore();

    const mo=new MutationObserver(mutations=>{
      const relevant=mutations.some(m=>m.target?.id==='luneaTimingInline'||m.target?.closest?.('#luneaTimingInline')||Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.id==='luneaTimingInline'||n.querySelector?.('#luneaTimingInline'))));
      if(relevant) scheduleCompact();
    });
    if(document.body)mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});

    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')) scheduleCompact();
      if(e.target?.closest?.('#dailyBtn')) scheduleRestore();
      if(e.target?.closest?.('#saveReading,#luneaBottomSaveReading')) {
        setTimeout(()=>{snapshotInline();attachTimingToNewestArchive()},350);
        setTimeout(attachTimingToNewestArchive,950);
      }
    },true);

    W.addEventListener('pagehide',()=>snapshotInline());
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)snapshotInline();
      else if(isDailyContext())scheduleRestore();
    });
    W.addEventListener('pageshow',()=>{if(isDailyContext())scheduleRestore()},{passive:true});

    W.LUNEA_DAILY_TIMING_V49={snapshot:snapshotInline,restore:restoreInline,compact:compactInline,read:readSnap};
    console.info('⏳ LUNEA Daily Timing V49 loaded · compact + persistent');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
