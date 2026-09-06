'use strict';

/* LUNEA HOME PORTAL MINFIX V57
   Minimal recovery layer for the known-good 04367cbd UI.
   It only repairs the cabinet tiles when Home Portal V8 created the cabinet
   shell but failed to bind source categories. No draw/storage/astro changes. */
(()=>{
  const W=window;
  if(W.__LUNEA_HOME_PORTAL_MINFIX_V57__)return;
  W.__LUNEA_HOME_PORTAL_MINFIX_V57__=true;

  const META=[
    {key:'general',title:'GENERAL & AI',sub:'자유 질문 · AI 맞춤 배열',re:/GENERAL|AI CUSTOM/i,cats:['GENERAL']},
    {key:'career',title:'CAREER & EXAM',sub:'시험 · 직장 · 진로 · 금전',re:/CAREER|EXAM/i,cats:['CAREER']},
    {key:'love',title:'LOVE & HEART',sub:'속마음 · 연락 · 재회 · 관계',re:/LOVE|INNER HEART/i,cats:['LOVE','INTIMACY']},
    {key:'stock',title:'STOCK & TRADING',sub:'매수 · 보유 · 익절 · 매도',re:/STOCK|TRADING/i,cats:['STOCK']},
    {key:'timing',title:'TIMING ORACLE',sub:'시기 · 시간대 · 계절 · 지연',re:/TIMING ORACLE/i,cats:['TIMING']},
    {key:'horary',title:'HORARY',sub:'성사 · 상황 · 리셉션 · 타이밍',re:/HORARY/i,cats:['HORARY']}
  ];
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function catTokens(cat){
    const vals=$$('[data-cat]',cat).map(x=>String(x.dataset.cat||'').toUpperCase()).filter(Boolean);
    const txt=String(cat.textContent||'').toUpperCase();
    return {vals,txt};
  }
  function findCat(meta){
    return $$('.category').find(cat=>{
      const {vals,txt}=catTokens(cat);
      return meta.re.test(txt)||meta.cats.some(c=>vals.includes(c));
    })||null;
  }
  function openCat(cat,tile){
    $$('.category.lunea-v8-source-category').forEach(c=>c.classList.toggle('lunea-v8-source-active',c===cat));
    $$('.lunea-v8-tile').forEach(b=>b.setAttribute('aria-pressed',b===tile?'true':'false'));
    const header=cat.querySelector('.category-header');
    const toggle=cat.querySelector('.toggle');
    if(header&&(!toggle||toggle.textContent.trim()==='+'))header.click();
    setTimeout(()=>cat.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }
  function repair(){
    const portal=document.getElementById('luneaHomePortalV8');
    const grid=portal?.querySelector('.lunea-v8-grid');
    if(!portal||!grid)return false;

    let made=0;
    for(const meta of META){
      let tile=grid.querySelector(`.lunea-v8-tile[data-key="${meta.key}"]`);
      const cat=findCat(meta);
      if(!cat)continue;
      cat.classList.add('lunea-v8-source-category');
      if(!tile){
        tile=document.createElement('button');
        tile.type='button';
        tile.className='lunea-v8-tile';
        tile.dataset.key=meta.key;
        tile.setAttribute('aria-pressed','false');
        tile.innerHTML=`<span class="lunea-v8-label">${meta.title}</span><span class="lunea-v8-sub">${meta.sub}</span><span class="lunea-v8-open">＋</span>`;
        tile.addEventListener('click',()=>openCat(cat,tile));
        grid.appendChild(tile);
      }
      made++;
    }

    const note=portal.querySelector('.v8-title-note');
    if(note&&made)note.textContent=`${made} ORACLES`;
    if(made>=4){
      document.documentElement.classList.add('lunea-home-portal-v8');
      return true;
    }
    return false;
  }

  function boot(){
    [0,120,350,800,1500,2800,4500].forEach(ms=>setTimeout(repair,ms));
    W.addEventListener('pageshow',()=>setTimeout(repair,50),{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  W.LUNEA_HOME_PORTAL_MINFIX_V57=Object.freeze({repair});
})();
