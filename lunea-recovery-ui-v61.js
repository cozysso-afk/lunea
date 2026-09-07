'use strict';
/* LUNEA RECOVERY UI V61
   Narrow recovery patch only:
   1) keep Daily/General on the current opal GENERAL card back (not the legacy moon-person back)
   2) group Western timing controls on row 3 and Thai controls on row 4
   3) remove timing draw lag by using the existing semantic V58 sync only on meaningful events
*/
(()=>{
  const W=window;
  if(W.__LUNEA_RECOVERY_UI_V61__) return;
  W.__LUNEA_RECOVERY_UI_V61__=true;
  const VER='20260907-v61';
  const $=id=>document.getElementById(id);

  const BACKS={
    GENERAL:'tarot_back_general.jpeg', DAILY:'tarot_back_general.jpeg',
    LOVE:'tarot_back_love.jpeg', STOCK:'tarot_back_stock.jpeg',
    CAREER:'tarot_back_career_study.jpeg', STUDY:'tarot_back_career_study.jpeg',
    CAREER_STUDY:'tarot_back_career_study.jpeg',
    INTIMACY:'assets/intimacy-oracle/tarot_back_intimacy_final.png'
  };
  function category(){
    try{
      if(W.__LUNEA_INTIMACY_ACTIVE__||document.body?.classList?.contains('lunea-intimacy-reading')) return 'INTIMACY';
      const c=String(W.state?.category||globalThis.state?.category||'GENERAL').toUpperCase().replace('&','_').replace('-','_');
      return BACKS[c]?c:(c==='DAILY'?'DAILY':'GENERAL');
    }catch{return 'GENERAL'}
  }
  function backUrl(file){const u=new URL('./'+file,document.baseURI);u.searchParams.set('lunea_recovery_back',VER);return u.href}
  function repairBack(back){
    if(!(back instanceof HTMLElement)) return;
    const file=BACKS[category()]||BACKS.GENERAL; const src=backUrl(file);
    back.style.setProperty('background-image',`url("${src}")`,'important');
    back.style.setProperty('background-size','cover','important');
    back.style.setProperty('background-position','center','important');
    let img=back.querySelector(':scope > img');
    if(!img){img=document.createElement('img');back.prepend(img)}
    img.classList.add('lunea-recovery-cardback-v61'); img.alt=''; img.draggable=false;
    if(img.src!==src) img.src=src;
  }
  function repairBacks(root=document){
    const list=root===document?[...document.querySelectorAll('#cards .tarot-card .back')]:
      root instanceof HTMLElement?[...(root.matches?.('.tarot-card .back')?[root]:[]),...(root.querySelectorAll?.('.tarot-card .back')||[])]:[];
    [...new Set(list)].forEach(repairBack);
  }

  const ORDER=['flipAll','aiRead','saveReading','retry','extraCard','timingSupportBtn','astroTransitBtn','astroReturnBtn','astroHoraryBtn','luneaThaiTarotBridgeBtn','luneaThaiTarotRangeBtn','luneaTopCopyPrompt'];
  function ensureThaiRange(){
    let b=$('luneaThaiTarotRangeBtn'); if(b) return b;
    const bar=document.querySelector('#spreadOverlay .actionbar'); const thai=$('luneaThaiTarotBridgeBtn');
    if(!bar||!thai) return null;
    b=document.createElement('button'); b.type='button'; b.id='luneaThaiTarotRangeBtn'; b.className=thai.className||'mini'; b.textContent='🇹🇭 Thai 기간';
    b.onclick=()=>{const api=W.LUNEA_THAI_RANGE_V33;if(typeof api?.openTarot==='function')api.openTarot();else alert('Thai 기간 기능을 불러오는 중이야. 잠시 후 다시 눌러줘.')};
    bar.appendChild(b); return b;
  }
  function reorder(){
    ensureThaiRange(); const bar=document.querySelector('#spreadOverlay .actionbar'); if(!bar)return false;
    const rank=new Map(ORDER.map((id,i)=>[id,i])); const children=[...bar.children];
    children.sort((a,b)=>(rank.has(a.id)?rank.get(a.id):999)-(rank.has(b.id)?rank.get(b.id):999));
    children.forEach(n=>bar.appendChild(n)); return true;
  }

  function timingSync(){try{W.LUNEA_TIMING_UPLOADED_ART_V58?.syncAll?.()}catch(e){console.warn('[V61] timing sync',e)}}
  function addStyle(){
    if($('luneaRecoveryUiV61Style'))return;
    const s=document.createElement('style');s.id='luneaRecoveryUiV61Style';s.textContent=`
      #cards .tarot-card .back>.lunea-recovery-cardback-v61{position:absolute!important;inset:0!important;z-index:20!important;width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;opacity:1!important;visibility:visible!important;border-radius:inherit!important;pointer-events:none!important}
      #timingOverlay .modal{max-height:88dvh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-top:max(16px,env(safe-area-inset-top))!important}
      #timingOverlay .timing-card{width:min(72vw,310px)!important;max-width:310px!important;margin-left:auto!important;margin-right:auto!important}
      #timingOverlay .timing-front{aspect-ratio:2/3!important;max-height:60dvh!important}
      #timingOverlay #timingImage{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important}
      @media(max-width:390px){#timingOverlay .timing-card{width:min(70vw,290px)!important}}
    `;document.head.appendChild(s);
  }
  function boot(){
    addStyle(); repairBacks(); reorder(); timingSync();
    const cards=$('cards'); if(cards&&!cards.__luneaRecoveryV61Obs){cards.__luneaRecoveryV61Obs=true;new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes||[])if(n?.nodeType===1)repairBacks(n)}).observe(cards,{childList:true,subtree:true})}
    const bar=document.querySelector('#spreadOverlay .actionbar'); if(bar&&!bar.__luneaRecoveryV61Obs){bar.__luneaRecoveryV61Obs=true;let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;reorder()})}).observe(bar,{childList:true})}
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#flipAll,#retry,#extraCard')){setTimeout(()=>repairBacks(),0);setTimeout(()=>repairBacks(),120)}
      if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,[data-open="timing"]')){const m=$('timingOverlay')?.querySelector('.modal');if(m)m.scrollTop=0;setTimeout(timingSync,0);setTimeout(timingSync,100);setTimeout(timingSync,260)}
      if(e.target?.closest?.('#spreadOverlay'))setTimeout(reorder,0);
    },true);
    W.addEventListener('pageshow',()=>{repairBacks();reorder();timingSync()},{passive:true});
    W.LUNEA_RECOVERY_UI_V61=Object.freeze({version:61,repairBacks,reorder,timingSync});
    console.info('✅ LUNEA Recovery UI V61 loaded');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
