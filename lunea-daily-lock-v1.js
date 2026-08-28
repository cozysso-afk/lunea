'use strict';

/*
  LUNEA DAILY ORBIT LOCK V1
  =========================
  Keeps the first DAILY ORBIT 4 reading fixed for the user's local calendar day.

  - First draw of the day is persisted in localStorage.
  - Reopening DAILY on the same day restores the exact saved cards instead of redrawing RNG.
  - The session can keep extra cards / clarifiers / flips / AI text and restores them too.
  - The retry button cannot bypass the daily lock.
  - At the next local midnight, a new daily draw becomes available automatically.
  - If a DAILY reading was already the current autosaved draft when this patch arrives,
    it is adopted as today's daily instead of forcing an unnecessary redraw.
*/
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_LOCK_V1__) return;
  W.__LUNEA_DAILY_LOCK_V1__ = true;

  const KEY = 'LUNEA_DAILY_ORBIT_V1';
  const DRAFT_KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  const $ = id => document.getElementById(id);
  let saving = false;
  let timer = 0;
  let installed = false;
  let baseDailyHandler = null;
  let baseRetryHandler = null;

  function getState(){ try{return state}catch{return null} }
  function clone(v){ try{return JSON.parse(JSON.stringify(v))}catch{return null} }
  function localDay(ts = Date.now()){
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function isToday(tsOrDay){
    if(!tsOrDay) return false;
    return String(tsOrDay).includes('-') ? String(tsOrDay) === localDay() : localDay(Number(tsOrDay)) === localDay();
  }
  function read(){
    try{
      const d = JSON.parse(localStorage.getItem(KEY)||'null');
      return d && d.day === localDay() && Array.isArray(d.drawn) && d.drawn.length >= 4 ? d : null;
    }catch{return null}
  }
  function currentFlipped(){
    return [...document.querySelectorAll('#cards .tarot-card.flipped')]
      .map(el=>Number(String(el.id||'').replace('card-','')))
      .filter(Number.isInteger);
  }
  function currentAIText(){
    const el = $('aiText');
    if(!el) return '';
    const text = String(el.textContent||'').trim();
    if(!text || /카드 간 중첩과 반증을 확인하는 중/.test(text)) return '';
    return text;
  }
  function dailyPayloadFromState(){
    const s = getState();
    if(!s || s.category !== 'DAILY' || !Array.isArray(s.drawn) || s.drawn.length < 4) return null;
    return {
      version:1,
      day:localDay(),
      savedAt:Date.now(),
      category:'DAILY',
      title:String(s.title||'DAILY ORBIT 4'),
      desc:String(s.desc||''),
      count:Number(s.count||4),
      isAi:false,
      allowReversed:false,
      positions:clone(Array.isArray(s.positions)?s.positions:[])||[],
      rationale:String(s.rationale||'하루를 네 구간의 역할로 나눈 고정형 데일리 배열'),
      question:String(s.question||'오늘 하루 나의 전반적인 에너지와 대인관계 흐름'),
      drawn:clone(s.drawn)||[],
      flipped:currentFlipped(),
      aiText:currentAIText()
    };
  }
  function saveNow(){
    if(saving) return;
    const p = dailyPayloadFromState();
    if(!p) return;
    try{
      saving = true;
      localStorage.setItem(KEY,JSON.stringify(p));
      updateHome();
      syncRetry();
    }catch(err){console.warn('[LUNEA Daily] save failed',err)}
    finally{saving=false}
  }
  function scheduleSave(delay=80){clearTimeout(timer);timer=setTimeout(saveNow,delay)}

  function adoptExistingDraft(){
    if(read()) return;
    try{
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(!d || d.category !== 'DAILY' || !isToday(d.savedAt) || !Array.isArray(d.drawn) || d.drawn.length < 4) return;
      const p = {
        version:1, day:localDay(), savedAt:Number(d.savedAt||Date.now()),
        category:'DAILY', title:d.title||'DAILY ORBIT 4', desc:d.desc||'', count:Number(d.count||4), isAi:false,
        allowReversed:false, positions:clone(d.positions||[])||[], rationale:d.rationale||'하루를 네 구간의 역할로 나눈 고정형 데일리 배열',
        question:d.question||'오늘 하루 나의 전반적인 에너지와 대인관계 흐름', drawn:clone(d.drawn)||[],
        flipped:Array.isArray(d.flipped)?d.flipped.map(Number):[], aiText:String(d.aiText||'')
      };
      localStorage.setItem(KEY,JSON.stringify(p));
      console.info('🌙 LUNEA Daily adopted today\'s existing autosaved DAILY reading');
    }catch{}
  }

  function setState(d){
    const s = getState();
    if(!s) throw new Error('리딩 상태를 찾지 못했어.');
    s.category='DAILY';
    s.title=d.title||'DAILY ORBIT 4';
    s.desc=d.desc||'';
    s.count=Number(d.count||4);
    s.isAi=false;
    s.allowReversed=false;
    s.positions=clone(d.positions||[])||[];
    s.rationale=d.rationale||'';
    s.question=d.question||'오늘 하루 나의 전반적인 에너지와 대인관계 흐름';
    s.drawn=clone(d.drawn)||[];
    s.used=new Set();
    s.drawn.forEach(card=>{
      if(card?.code)s.used.add(card.code);
      (card?.subCards||[]).forEach(c=>{if(c?.code)s.used.add(c.code)});
    });
    return s;
  }
  function appendClarifiers(i){
    const s=getState(),item=s?.drawn?.[i];
    if(!item?.subCards?.length)return;
    const cont=$('clar-'+i),btn=$('clarBtn-'+i);
    if(!cont)return;
    cont.replaceChildren(); cont.style.display='flex';
    item.subCards.forEach((c,idx)=>{
      const div=document.createElement('div');div.className='clar';
      const b=document.createElement('b');b.textContent=`보조 #${idx+1}`;
      div.append('↳ ',b,` ${c.name||''} (${c.isReversed?'역':'정'}) · ${c.keyword||''}`);cont.appendChild(div);
    });
    if(btn){btn.textContent=`+ 보조 (${item.subCards.length}/3)`;btn.disabled=item.subCards.length>=3}
  }
  function restoreAI(text){
    const box=$('aiBox');if(!box)return;box.replaceChildren();if(!text)return;
    const card=document.createElement('div');card.className='ai-card';
    const h=document.createElement('h4');h.textContent='LUNEA INTERPRETATION · 오늘의 리딩';
    const body=document.createElement('div');body.className='ai-body';body.id='aiText';body.textContent=text;
    card.append(h,body);box.appendChild(card);
  }
  function restoreToday(){
    const d=read(); if(!d)return false;
    try{
      const s=setState(d);
      $('cards')?.replaceChildren(); $('results')?.replaceChildren(); $('aiBox')?.replaceChildren();
      if($('spreadType'))$('spreadType').textContent=s.title;
      if($('spreadQuestion'))$('spreadQuestion').textContent='“'+s.question+'”';
      if($('spreadRationale')){
        $('spreadRationale').style.display=s.rationale?'block':'none';
        $('spreadRationale').textContent=s.rationale||'';
      }
      s.drawn.forEach((card,i)=>{
        let wrapper=null;
        try{wrapper=(W.makeCardWrapper||makeCardWrapper)(i,card,!!card.isReversed)}catch{}
        if(wrapper)$('cards')?.appendChild(wrapper);
      });
      try{(W.showOverlay||showOverlay)('spreadOverlay')}
      catch{$('spreadOverlay')?.classList.add('show');document.body.classList.add('modal-open')}
      requestAnimationFrame(()=>{
        const flipped=new Set((d.flipped||[]).map(Number));
        s.drawn.forEach((_,i)=>{
          if(flipped.has(i)){
            try{(W.flipAt||flipAt)(i)}catch{$('card-'+i)?.classList.add('flipped')}
          }
          appendClarifiers(i);
        });
        restoreAI(d.aiText||'');
        syncRetry();
        scheduleSave(160);
      });
      return true;
    }catch(err){console.error('[LUNEA Daily] restore failed',err);return false}
  }

  function drawFirstToday(){
    const s=getState();
    if(!s || typeof baseDailyHandler!=='function') return;
    baseDailyHandler();
    // startSpread is synchronous; wait one frame so cards/info DOM is fully settled before snapshot.
    requestAnimationFrame(()=>{saveNow();syncRetry();updateHome()});
  }

  function updateHome(){
    const btn=$('dailyBtn'); if(!btn)return;
    const locked=!!read();
    btn.textContent=locked?'오늘의 카드 다시 보기':'운세 펼치기';
    btn.dataset.dailyLocked=locked?'1':'0';
    const p=document.querySelector('.daily p');
    if(p && !p.dataset.dailyLockCopy){
      const line=document.createElement('span');
      line.className='lunea-daily-lock-note';
      line.textContent='첫 4장은 하루 1회 고정 · 자정에 새로 열림';
      p.appendChild(document.createElement('br'));p.appendChild(line);p.dataset.dailyLockCopy='1';
    }
  }
  function syncRetry(){
    const btn=$('retry'),s=getState();if(!btn)return;
    const daily=s?.category==='DAILY' && $('spreadOverlay')?.classList.contains('show');
    if(daily){
      btn.disabled=true;btn.textContent='오늘 카드 고정';btn.setAttribute('aria-label','데일리 첫 4장은 오늘 하루 고정');
    }else{
      btn.disabled=false;btn.textContent='↺ 다시 뽑기';btn.removeAttribute('aria-label');
    }
  }
  function addStyles(){
    if($('luneaDailyLockStyle'))return;
    const s=document.createElement('style');s.id='luneaDailyLockStyle';s.textContent=`
      .lunea-daily-lock-note{display:inline-block;margin-top:3px;color:rgba(214,220,238,.67);font-size:9.5px;letter-spacing:.15px}
      #dailyBtn[data-daily-locked="1"]{background:linear-gradient(112deg,rgba(211,205,236,.86),rgba(155,137,218,.92) 48%,rgba(115,158,205,.88))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.33),0 9px 24px rgba(108,91,171,.20)!important}
      #retry:disabled{opacity:.62!important;cursor:default!important;color:rgba(225,226,238,.72)!important;background:rgba(255,255,255,.045)!important;border-color:rgba(221,224,239,.10)!important}
    `;document.head.appendChild(s);
  }

  function install(){
    if(installed)return true;
    const daily=$('dailyBtn'),retry=$('retry');
    if(!daily||!retry||typeof daily.onclick!=='function')return false;
    baseDailyHandler=daily.onclick;
    baseRetryHandler=retry.onclick;

    daily.onclick=()=>{
      adoptExistingDraft();
      if(read()) restoreToday();
      else drawFirstToday();
    };
    retry.onclick=(event)=>{
      const s=getState();
      if(s?.category==='DAILY'){
        syncRetry();
        event?.preventDefault?.();
        return;
      }
      return typeof baseRetryHandler==='function'?baseRetryHandler.call(retry,event):undefined;
    };

    const obsTargets=[$('cards'),$('results'),$('aiBox')].filter(Boolean);
    if(obsTargets.length){
      const mo=new MutationObserver(()=>{const s=getState();if(s?.category==='DAILY')scheduleSave(110)});
      obsTargets.forEach(el=>mo.observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['class'],characterData:true}));
    }
    const overlay=$('spreadOverlay');
    if(overlay)new MutationObserver(()=>{syncRetry();if(!overlay.classList.contains('show'))saveNow()}).observe(overlay,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#extraCard,#flipAll,[data-clarify],#aiRead'))scheduleSave(150)},true);
    window.addEventListener('pagehide',saveNow);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow();else{adoptExistingDraft();updateHome();syncRetry()}});

    // If the app remains open across midnight, refresh the home CTA shortly after the date changes.
    const msToMidnight=()=>{const n=new Date(),x=new Date(n);x.setHours(24,0,2,0);return Math.max(1000,x-n)};
    const armMidnight=()=>setTimeout(()=>{updateHome();syncRetry();armMidnight()},msToMidnight());
    armMidnight();

    adoptExistingDraft();updateHome();syncRetry();
    W.LUNEA_DAILY_ORBIT_V1={read,restoreToday,saveNow,day:localDay};
    installed=true;
    console.info('🌙 LUNEA Daily Orbit Lock V1 installed · one base draw per local day');
    return true;
  }
  function boot(){addStyles();let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(t)},80);install()}
  if(document.readyState==='complete')setTimeout(boot,0);else W.addEventListener('load',boot,{once:true});
})();
