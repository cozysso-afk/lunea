'use strict';

/* LUNEA HOME PORTAL REPAIR V58
   Repairs an empty V8 cabinet when source category titles were transformed
   before Home Portal matched them. Visual/navigation only. */
(()=>{
  const W=window;
  if(W.__LUNEA_HOME_PORTAL_REPAIR_V58__)return;
  W.__LUNEA_HOME_PORTAL_REPAIR_V58__=true;

  const META=[
    {key:'general',title:'GENERAL & AI',sub:'자유 질문 · AI 맞춤 배열',sel:'.reading-item[data-cat="GENERAL"]'},
    {key:'career',title:'CAREER & EXAM',sub:'시험 · 직장 · 진로 · 금전',sel:'.reading-item[data-cat="CAREER"]'},
    {key:'love',title:'LOVE & HEART',sub:'속마음 · 연락 · 재회 · 관계',sel:'.reading-item[data-cat="LOVE"]'},
    {key:'stock',title:'STOCK & TRADING',sub:'매수 · 보유 · 익절 · 매도',sel:'.reading-item[data-cat="STOCK"]'},
    {key:'timing',title:'TIMING ORACLE',sub:'시기 · 시간대 · 계절 · 지연',sel:'#timingDraw, [data-title*="시기"], [data-title*="TIMING" i]'},
    {key:'horary',title:'HORARY',sub:'성사 · 상황 · 리셉션 · 타이밍',sel:'#astroHoraryBtn,#horaryBtn,[data-title*="HORARY" i]'}
  ];

  const glyph={general:'✦',career:'♜',love:'♡',stock:'↗',timing:'◷',horary:'◎'};
  const catFor=m=>{
    const hit=document.querySelector(m.sel);
    return hit?.closest?.('.category')||null;
  };

  function open(cat,tile){
    document.querySelectorAll('.category.lunea-v8-source-category').forEach(c=>c.classList.toggle('lunea-v8-source-active',c===cat));
    document.querySelectorAll('.lunea-v8-tile').forEach(b=>b.setAttribute('aria-pressed',b===tile?'true':'false'));
    const toggle=cat.querySelector('.toggle');
    const header=cat.querySelector('.category-header');
    if(header&&(!toggle||toggle.textContent.trim()==='+'))header.click();
    setTimeout(()=>cat.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }

  function repair(){
    const portal=document.getElementById('luneaHomePortalV8');
    const grid=portal?.querySelector('.lunea-v8-grid');
    if(!portal||!grid)return false;

    let changed=false;
    META.forEach(m=>{
      if(grid.querySelector(`.lunea-v8-tile[data-key="${m.key}"]`))return;
      const cat=catFor(m); if(!cat)return;
      cat.classList.add('lunea-v8-source-category');
      const b=document.createElement('button');
      b.type='button'; b.className='lunea-v8-tile'; b.dataset.key=m.key; b.setAttribute('aria-pressed','false');
      b.innerHTML=`<span class="lunea-v8-object" aria-hidden="true">${glyph[m.key]}</span><span class="lunea-v8-label">${m.title}</span><span class="lunea-v8-sub">${m.sub}</span><span class="lunea-v8-open">＋</span>`;
      b.addEventListener('click',()=>open(cat,b)); grid.appendChild(b); changed=true;
    });
    const count=grid.querySelectorAll('.lunea-v8-tile').length;
    const note=portal.querySelector('.v8-title-note'); if(note)note.textContent=count?`${count} ORACLES`:'ORACLE CABINET';
    return changed||count>=4;
  }

  function boot(){
    repair();
    [120,350,800,1500,2800,4500].forEach(ms=>setTimeout(repair,ms));
    W.addEventListener('pageshow',()=>setTimeout(repair,80),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(repair,80)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  W.LUNEA_HOME_PORTAL_REPAIR_V58=Object.freeze({version:58,repair});
})();
