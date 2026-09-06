'use strict';

/* LUNEA DAILY ORBIT 6 BOOT FIX V57
   Makes the current six-axis home card authoritative at DOM readiness instead
   of waiting for the legacy Daily Lock window-load hook. The legacy lock may
   still persist/restore the finished six-card draw once it becomes available.
   Only an obsolete current-day 4-card DAILY temp/draft can be discarded. */
(() => {
  const W = window;
  if (W.__LUNEA_DAILY_ORBIT6_FIX_V57__) return;
  W.__LUNEA_DAILY_ORBIT6_FIX_V57__ = true;

  const DAILY_KEY = 'LUNEA_DAILY_ORBIT_V1';
  const DRAFT_KEY = 'LUNEA_LAST_READING_DRAFT_V1';
  const $ = id => document.getElementById(id);
  const dayKey = (ts=Date.now()) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const weekend = () => { const d=new Date().getDay(); return d===0||d===6; };

  const positions = () => [
    '1. OVERALL · 오늘의 핵심 흐름',
    '2. VITAL · 컨디션·에너지',
    '3. FOCUS · 학업·업무 · 집중·성취 흐름',
    '4. CONNECTION · 대인·연애 · 연락·교류 흐름',
    weekend() ? '5. MONEY · 금전·재정 · 소비·현금흐름' : '5. MONEY & TRADING · 금전·투자 · 수익실현·보유 판단 흐름',
    '6. SIGNAL · 변수·기회·주의점·조언'
  ];
  const question = () => weekend()
    ? '오늘 하루 나의 전체 흐름, 컨디션, 학업·업무, 대인·연애, 금전·재정, 변수와 조언은 어떨까?'
    : '오늘 하루 나의 전체 흐름, 컨디션, 학업·업무, 대인·연애, 금전·투자와 수익실현 판단 흐름, 변수와 조언은 어떨까?';
  const rationale = () => `DAILY ORBIT 6 · 전체/컨디션/학업·업무/대인·연애/금전/변수의 6축 고정 배열 · ${weekend()?'주말 MONEY는 소비·재정·현금흐름 중심':'평일 MONEY & TRADING은 금전·투자 흐름 중심'}`;

  function readRaw() {
    try { return JSON.parse(localStorage.getItem(DAILY_KEY) || 'null'); }
    catch { return null; }
  }
  function valid6(d) {
    return !!(d && d.day===dayKey() && Array.isArray(d.drawn) && d.drawn.length>=6 && Array.isArray(d.positions) && d.positions.length>=6);
  }
  function dropLegacyTodayOnly() {
    try {
      const d = readRaw();
      if (d && d.day===dayKey() && Array.isArray(d.drawn) && d.drawn.length>0 && d.drawn.length<6) {
        localStorage.removeItem(DAILY_KEY);
      }
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft && draft.category==='DAILY' && Array.isArray(draft.drawn) && draft.drawn.length>0 && draft.drawn.length<6 && dayKey(Number(draft.savedAt||0))===dayKey()) {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {}
  }

  function axis(num, en, ko, glyph) {
    return `<div class="lunea-daily-axis"><div class="axis-num">${num}</div><div class="axis-icon" aria-hidden="true">${glyph}</div><b>${en}</b><span>${ko}</span></div>`;
  }

  function renderHome() {
    const daily = document.querySelector('.daily');
    const btn = $('dailyBtn');
    if (!daily || !btn) return false;

    document.documentElement.classList.add('lunea-daily-orbit6-v21');
    daily.classList.add('lunea-daily-orbit6');
    const h3 = daily.querySelector('h3');
    const p = daily.querySelector('p');
    if (h3) h3.textContent='DAILY ORBIT 6';
    if (p && p.dataset.luneaV57Six!=='1') {
      p.replaceChildren(document.createTextNode('오늘을 여섯 개의 실제 생활 축으로 읽는 고정 데일리 리딩.'));
      const note=document.createElement('span'); note.className='lunea-daily-lock-note';
      note.textContent=weekend()?'하루 1회 고정 · 주말 MONEY는 금전·재정 중심 · 자정에 새로 열림':'하루 1회 고정 · 평일 MONEY는 금전·주식 흐름 포함 · 자정에 새로 열림';
      p.appendChild(note); p.dataset.luneaV57Six='1';
    }

    let grid=daily.querySelector('.lunea-daily-six-grid');
    if(!grid){
      grid=document.createElement('div'); grid.className='lunea-daily-six-grid'; grid.setAttribute('aria-label','DAILY ORBIT 6 카드 포지션');
      grid.innerHTML=[
        axis('01','OVERALL','전체 흐름','◉'), axis('02','VITAL','컨디션 · 에너지','☾'), axis('03','FOCUS','학업 · 업무','✦'),
        axis('04','CONNECTION','대인 · 연애','♡'), axis('05',weekend()?'MONEY':'MONEY & TRADING',weekend()?'금전 · 재정':'금전 · 투자','◇'), axis('06','SIGNAL','변수 · 조언','✧')
      ].join('');
      daily.insertBefore(grid,btn);
    }

    const stored=readRaw();
    btn.textContent=valid6(stored)?'오늘의 카드 다시 보기':'오늘의 카드 열기';
    btn.dataset.dailyLocked=valid6(stored)?'1':'0';
    return true;
  }

  function decorateReading() {
    let s=null; try{s=W.state||state}catch{}
    const overlay=$('spreadOverlay');
    if(!overlay)return;
    if(s?.category==='DAILY' && Array.isArray(s.positions) && s.positions.length>=6){
      overlay.dataset.dailyOrbit='6';
      if($('spreadType'))$('spreadType').textContent='DAILY ORBIT 6';
      const retry=$('retry'); if(retry){retry.disabled=true;retry.textContent='오늘 카드 고정';retry.setAttribute('aria-label','데일리 기본 6장은 오늘 하루 고정');}
    }
  }

  function draw6() {
    let s=null; try{s=W.state||state}catch{}
    const start=W.startSpread;
    if(!s || typeof start!=='function') return false;
    s.category='DAILY'; s.title='DAILY ORBIT 6'; s.desc='오늘의 전체 흐름부터 금전·투자와 변수까지 여섯 축으로 읽는 데일리 리딩';
    s.count=6; s.isAi=false; s.allowReversed=false; s.__luneaDailyOrbit6=true;
    start(question(),positions(),'DAILY ORBIT 6',rationale());
    requestAnimationFrame(()=>{
      decorateReading();
      try{W.LUNEA_DAILY_ORBIT_V1?.saveNow?.()}catch{}
      setTimeout(renderHome,100);
    });
    return true;
  }

  function open6() {
    dropLegacyTodayOnly();
    const stored=readRaw();
    const lock=W.LUNEA_DAILY_ORBIT_V1;
    if(valid6(stored) && typeof lock?.restoreToday==='function'){
      lock.restoreToday(); requestAnimationFrame(decorateReading); return;
    }
    if(valid6(stored) && !lock){
      const btn=$('dailyBtn'); if(btn){btn.disabled=true;btn.textContent='오늘 카드 불러오는 중…';}
      let tries=0; const t=setInterval(()=>{
        tries++;
        const l=W.LUNEA_DAILY_ORBIT_V1;
        if(typeof l?.restoreToday==='function'){
          clearInterval(t); if(btn)btn.disabled=false; l.restoreToday(); requestAnimationFrame(()=>{decorateReading();renderHome()});
        } else if(tries>50){ clearInterval(t); if(btn){btn.disabled=false;btn.textContent='오늘의 카드 다시 보기';} }
      },80);
      return;
    }
    draw6();
  }

  function bind() {
    dropLegacyTodayOnly();
    if(!renderHome())return false;
    const btn=$('dailyBtn');
    if(btn && btn.dataset.luneaDailyV57!=='1'){
      btn.dataset.luneaDailyV57='1';
      btn.onclick=open6;
    }
    /* V22 watches for this grid and will decorate it with the approved celestial shell. */
    return true;
  }

  function boot(){
    let tries=0;
    const t=setInterval(()=>{tries++; if(bind()||tries>400)clearInterval(t)},50);
    bind();
    W.addEventListener('pageshow',()=>setTimeout(bind,0),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(bind,0)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  W.LUNEA_DAILY_ORBIT6_FIX_V57=Object.freeze({version:57,renderHome,open:open6,draw:draw6});
})();
