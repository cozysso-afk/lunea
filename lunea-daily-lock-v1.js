'use strict';

/* LUNEA DAILY ORBIT LOCK V1.6
   DAILY ORBIT 6 only. Legacy 4/5-card same-day temp state is ignored/retired.
   Other readings, profile, archive, journal, localStorage keys and IndexedDB are untouched. */
(() => {
  const W=window;
  if(W.__LUNEA_DAILY_LOCK_V1__)return;
  W.__LUNEA_DAILY_LOCK_V1__=true;

  const KEY='LUNEA_DAILY_ORBIT_V1';
  const DRAFT_KEY='LUNEA_LAST_READING_DRAFT_V1';
  const $=id=>document.getElementById(id);
  let saving=false,timer=0,installed=false,baseDailyHandler=null,baseRetryHandler=null;

  const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch{return null}};
  const getState=()=>{try{return state}catch{return null}};
  const dayKey=(ts=Date.now())=>{const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const isToday=tsOrDay=>!!tsOrDay&&(String(tsOrDay).includes('-')?String(tsOrDay)===dayKey():dayKey(Number(tsOrDay))===dayKey());
  const valid6=d=>!!(d&&d.day===dayKey()&&Array.isArray(d.drawn)&&d.drawn.length>=6&&Array.isArray(d.positions)&&d.positions.length>=6);

  function retireLegacyToday(){
    try{
      const d=JSON.parse(localStorage.getItem(KEY)||'null');
      if(d&&d.day===dayKey()&&Array.isArray(d.drawn)&&d.drawn.length>0&&d.drawn.length<6)localStorage.removeItem(KEY);
      const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(draft&&draft.category==='DAILY'&&isToday(draft.savedAt)&&Array.isArray(draft.drawn)&&draft.drawn.length>0&&draft.drawn.length<6)localStorage.removeItem(DRAFT_KEY);
    }catch{}
  }
  function read(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');return valid6(d)?d:null}catch{return null}}
  function currentFlipped(){return [...document.querySelectorAll('#cards .tarot-card.flipped')].map(el=>Number(String(el.id||'').replace('card-',''))).filter(Number.isInteger)}
  function currentAIText(){const el=$('aiText');if(!el)return'';const text=String(el.textContent||'').trim();return !text||/카드 간 중첩과 반증을 확인하는 중/.test(text)?'':text}

  function payload(){
    const s=getState();
    if(!s||s.category!=='DAILY'||!Array.isArray(s.drawn)||s.drawn.length<6||!Array.isArray(s.positions)||s.positions.length<6)return null;
    return {version:6,day:dayKey(),savedAt:Date.now(),category:'DAILY',title:'DAILY ORBIT 6',desc:String(s.desc||''),count:6,isAi:false,allowReversed:false,
      positions:clone(s.positions)||[],rationale:String(s.rationale||'DAILY ORBIT 6 · 여섯 생활 축 고정 배열'),question:String(s.question||'오늘 하루 나의 여섯 생활 축 흐름은 어떨까?'),
      drawn:clone(s.drawn)||[],flipped:currentFlipped(),aiText:currentAIText()};
  }
  function saveNow(){if(saving)return;const p=payload();if(!p)return;try{saving=true;localStorage.setItem(KEY,JSON.stringify(p));updateHome();syncRetry()}catch(err){console.warn('[LUNEA Daily6] save failed',err)}finally{saving=false}}
  function scheduleSave(delay=90){clearTimeout(timer);timer=setTimeout(saveNow,delay)}

  function adoptExistingDraft(){
    if(read())return;
    try{
      const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(!d||d.category!=='DAILY'||!isToday(d.savedAt)||!Array.isArray(d.drawn)||d.drawn.length<6||!Array.isArray(d.positions)||d.positions.length<6)return;
      localStorage.setItem(KEY,JSON.stringify({version:6,day:dayKey(),savedAt:Number(d.savedAt||Date.now()),category:'DAILY',title:'DAILY ORBIT 6',desc:d.desc||'',count:6,isAi:false,allowReversed:false,
        positions:clone(d.positions)||[],rationale:d.rationale||'DAILY ORBIT 6 · 여섯 생활 축 고정 배열',question:d.question||'오늘 하루 나의 여섯 생활 축 흐름은 어떨까?',drawn:clone(d.drawn)||[],
        flipped:Array.isArray(d.flipped)?d.flipped.map(Number):[],aiText:String(d.aiText||'')}));
    }catch{}
  }
  function setState(d){
    const s=getState();if(!s)throw new Error('리딩 상태를 찾지 못했어.');
    s.category='DAILY';s.title='DAILY ORBIT 6';s.desc=d.desc||'';s.count=6;s.isAi=false;s.allowReversed=false;s.positions=clone(d.positions)||[];s.rationale=d.rationale||'';s.question=d.question||'오늘 하루 나의 여섯 생활 축 흐름은 어떨까?';s.drawn=clone(d.drawn)||[];s.used=new Set();
    s.drawn.forEach(card=>{if(card?.code)s.used.add(card.code);(card?.subCards||[]).forEach(c=>{if(c?.code)s.used.add(c.code)})});return s;
  }
  function appendClarifiers(i){const s=getState(),item=s?.drawn?.[i];if(!item?.subCards?.length)return;const cont=$('clar-'+i),btn=$('clarBtn-'+i);if(!cont)return;cont.replaceChildren();cont.style.display='flex';item.subCards.forEach((c,idx)=>{const div=document.createElement('div');div.className='clar';const b=document.createElement('b');b.textContent=`보조 #${idx+1}`;div.append('↳ ',b,` ${c.name||''} (${c.isReversed?'역':'정'}) · ${c.keyword||''}`);cont.appendChild(div)});if(btn){btn.textContent=`+ 보조 (${item.subCards.length}/3)`;btn.disabled=item.subCards.length>=3}}
  function restoreAI(text){const box=$('aiBox');if(!box)return;box.replaceChildren();if(!text)return;const card=document.createElement('div');card.className='ai-card';const h=document.createElement('h4');h.textContent='LUNEA INTERPRETATION · 오늘의 리딩';const body=document.createElement('div');body.className='ai-body';body.id='aiText';body.textContent=text;card.append(h,body);box.appendChild(card)}
  function restoreToday(){
    const d=read();if(!d)return false;
    try{
      const s=setState(d);$('cards')?.replaceChildren();$('results')?.replaceChildren();$('aiBox')?.replaceChildren();if($('spreadType'))$('spreadType').textContent='DAILY ORBIT 6';if($('spreadQuestion'))$('spreadQuestion').textContent='“'+s.question+'”';if($('spreadRationale')){$('spreadRationale').style.display=s.rationale?'block':'none';$('spreadRationale').textContent=s.rationale||''}
      s.drawn.forEach((card,i)=>{let wrapper=null;try{wrapper=(W.makeCardWrapper||makeCardWrapper)(i,card,!!card.isReversed)}catch{}if(wrapper)$('cards')?.appendChild(wrapper)});
      try{(W.showOverlay||showOverlay)('spreadOverlay')}catch{$('spreadOverlay')?.classList.add('show');document.body.classList.add('modal-open')}
      requestAnimationFrame(()=>{const flipped=new Set((d.flipped||[]).map(Number));s.drawn.forEach((_,i)=>{if(flipped.has(i)){try{(W.flipAt||flipAt)(i)}catch{$('card-'+i)?.classList.add('flipped')}}appendClarifiers(i)});restoreAI(d.aiText||'');syncRetry();scheduleSave(160)});return true;
    }catch(err){console.error('[LUNEA Daily6] restore failed',err);return false}
  }
  function drawFirstToday(){const s=getState();if(!s||typeof baseDailyHandler!=='function')return;baseDailyHandler();requestAnimationFrame(()=>{saveNow();syncRetry();updateHome()})}
  function updateHome(){const btn=$('dailyBtn');if(!btn)return;const locked=!!read();btn.textContent=locked?'오늘의 카드 다시 보기':'오늘의 카드 열기';btn.dataset.dailyLocked=locked?'1':'0';const p=document.querySelector('.daily p');if(p&&!p.querySelector('.lunea-daily-lock-note')){const br=document.createElement('br'),line=document.createElement('span');line.className='lunea-daily-lock-note';line.textContent='기본 6장은 하루 1회 고정 · 자정에 새로 열림';p.append(br,line)}}
  function syncRetry(){const btn=$('retry'),s=getState();if(!btn)return;const daily=s?.category==='DAILY'&&$('spreadOverlay')?.classList.contains('show');if(daily){btn.disabled=true;btn.textContent='오늘 카드 고정';btn.setAttribute('aria-label','데일리 기본 6장은 오늘 하루 고정')}else{btn.disabled=false;btn.textContent='↺ 다시 뽑기';btn.removeAttribute('aria-label')}}
  function addStyles(){if($('luneaDailyLockStyle'))return;const s=document.createElement('style');s.id='luneaDailyLockStyle';s.textContent='.lunea-daily-lock-note{display:inline-block;margin-top:3px;color:rgba(214,220,238,.67);font-size:9.5px;letter-spacing:.15px}#retry:disabled{opacity:.62!important;cursor:default!important}';document.head.appendChild(s)}
  function install(){
    if(installed)return true;retireLegacyToday();const daily=$('dailyBtn'),retry=$('retry');if(!daily||!retry||typeof daily.onclick!=='function')return false;baseDailyHandler=daily.onclick;baseRetryHandler=retry.onclick;
    daily.onclick=()=>{retireLegacyToday();adoptExistingDraft();if(read())restoreToday();else drawFirstToday()};
    retry.onclick=event=>{const s=getState();if(s?.category==='DAILY'){syncRetry();event?.preventDefault?.();return}return typeof baseRetryHandler==='function'?baseRetryHandler.call(retry,event):undefined};
    const obsTargets=[$('cards'),$('results'),$('aiBox')].filter(Boolean);if(obsTargets.length){const mo=new MutationObserver(()=>{const s=getState();if(s?.category==='DAILY')scheduleSave(110)});obsTargets.forEach(el=>mo.observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['class'],characterData:true}))}
    const overlay=$('spreadOverlay');if(overlay)new MutationObserver(()=>{syncRetry();if(!overlay.classList.contains('show'))saveNow()}).observe(overlay,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#extraCard,#flipAll,[data-clarify],#aiRead'))scheduleSave(150)},true);window.addEventListener('pagehide',saveNow);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow();else{retireLegacyToday();adoptExistingDraft();updateHome();syncRetry()}});
    const msToMidnight=()=>{const n=new Date(),x=new Date(n);x.setHours(24,0,2,0);return Math.max(1000,x-n)};const armMidnight=()=>setTimeout(()=>{updateHome();syncRetry();armMidnight()},msToMidnight());armMidnight();
    adoptExistingDraft();updateHome();syncRetry();W.LUNEA_DAILY_ORBIT_V1={read,restoreToday,saveNow,day:dayKey};installed=true;console.info('🌙 LUNEA Daily Orbit 6 lock installed');return true;
  }
  function boot(){addStyles();let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>160)clearInterval(t)},50);install()}
  if(document.readyState==='complete')setTimeout(boot,0);else if(document.readyState==='loading')W.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();