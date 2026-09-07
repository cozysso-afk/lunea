'use strict';
/* LUNEA THAI + TIMING REPAIR V60
   - restores Thai Taksa period button in the current action grid
   - makes uploaded timing artwork number authoritative for all visible labels/results
   - keeps inline timing thumbnail synchronized with the same uploaded artwork
   - improves timing modal fit on iPhone and resets scroll on open/draw
*/
(()=>{
  const W=window;
  if(W.__LUNEA_THAI_TIMING_REPAIR_V60__) return;
  W.__LUNEA_THAI_TIMING_REPAIR_V60__=true;
  const VERSION='20260907-v60';
  const GROUPS={short_range:['SHORT RANGE','가까운 시기'],day_window:['DAY WINDOW','하루 시간대'],seasonal:['SEASONAL','계절'],mid_range:['MID RANGE','중기'],long_range:['LONG RANGE','장기'],delay_non_event:['DELAY / NON-EVENT','지연/불발']};
  let deck=[]; const byNum=new Map();
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim();

  function numFromCard(c){const m=String(c?.id||c?.filename||'').match(/(?:LT-|timing_)(\d{3})/i);return m?Number(m[1]):0;}
  function numFromImg(img){
    const raw=`${img?.getAttribute?.('src')||''} ${img?.dataset?.luneaTimingSemantic||''} ${img?.dataset?.luneaTimingCardId||''}`;
    const m=raw.match(/timing_(\d{3})|LT-(\d{3})|\b(\d{1,2})\b/); const n=Number(m?.[1]||m?.[2]||m?.[3]||0);
    return n>=1&&n<=60?n:0;
  }
  function ext(n){return n>=41&&n<=50?'PNG':'jpg';}
  function art(n){return `./timing_${String(n).padStart(3,'0')}.${ext(n)}?v=${VERSION}`;}
  async function loadDeck(){
    try{const r=await fetch('./lunea_timing_oracle_v1.json?v=102',{cache:'no-cache'}); if(!r.ok) throw new Error(String(r.status)); const d=await r.json(); deck=Array.isArray(d?.cards)?d.cards:[]; byNum.clear(); deck.forEach(c=>{const n=numFromCard(c);if(n)byNum.set(n,c)});}catch(e){console.warn('[V60] timing deck load failed',e)}
  }
  function groupLabel(card){const g=GROUPS[card?.group]||[String(card?.group||'').toUpperCase(),'']; return `${g[0]}${g[1]?' · '+g[1]:''}`;}

  function reconcileTiming(){
    const img=$('timingImage'); if(!img) return false;
    const n=numFromImg(img); const card=byNum.get(n); if(!card) return false;
    const want=art(n); if(img.getAttribute('src')!==want) img.setAttribute('src',want);
    img.alt=card.label_ko||''; img.dataset.luneaTimingSemantic=String(n);
    if($('timingLabelKo')) $('timingLabelKo').textContent=card.label_ko||'';
    if($('timingLabelEn')) $('timingLabelEn').textContent=card.label_en||'';
    const result=$('timingResult');
    if(result){
      result.innerHTML=`<div class="group">${groupLabel(card)}</div><h4>${card.label_ko} · ${card.label_en}</h4><p>${card.meaning||''}</p>`;
      result.classList.add('show');
    }
    const inline=$('luneaTimingInline');
    if(inline){
      const ii=inline.querySelector('img'); if(ii){ii.src=want;ii.alt=card.label_ko||'';ii.style.objectFit='cover';}
      const b=inline.querySelector('.txt b, b'); if(b) b.textContent=card.label_ko||'';
      const s=inline.querySelector('.txt span, span'); if(s) s.textContent=card.meaning||'';
    }
    return true;
  }

  function ensureThaiRangeButton(){
    if($('luneaThaiTarotRangeBtn')) return true;
    const overlay=$('spreadOverlay'); if(!overlay) return false;
    const buttons=[...overlay.querySelectorAll('button')];
    const thai=buttons.find(b=>/Thai\s*Taksa/i.test(norm(b.textContent)) || /태국/.test(norm(b.textContent)));
    if(!thai) return false;
    const parent=thai.parentElement; if(!parent) return false;
    const btn=document.createElement('button');
    btn.type='button'; btn.id='luneaThaiTarotRangeBtn'; btn.className=thai.className||'mini'; btn.textContent='🇹🇭 Thai 기간';
    btn.title='현재 질문의 Thai Taksa 기간 달력 보기';
    btn.onclick=()=>{
      const api=W.LUNEA_THAI_RANGE_V33;
      if(typeof api?.openTarot==='function') api.openTarot();
      else alert('Thai 기간 기능을 불러오는 중이야. 잠시 후 다시 눌러줘.');
    };
    thai.insertAdjacentElement('afterend',btn);
    return true;
  }

  function fitTiming(){
    if($('luneaThaiTimingRepairV60Style')) return;
    const s=document.createElement('style'); s.id='luneaThaiTimingRepairV60Style'; s.textContent=`
      #timingOverlay .modal{max-height:88dvh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-top:max(16px,env(safe-area-inset-top))!important}
      #timingOverlay .timing-card{width:min(74vw,330px)!important;max-width:330px!important;margin-left:auto!important;margin-right:auto!important}
      #timingOverlay .timing-front{aspect-ratio:2/3!important;max-height:62dvh!important}
      #timingOverlay #timingImage{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important}
      #luneaTimingInline img{object-fit:cover!important;object-position:center!important}
      @media(max-width:390px){#timingOverlay .timing-card{width:min(72vw,300px)!important}.thai-v33-day{grid-template-columns:54px minmax(0,1fr) auto!important}}
    `; document.head.appendChild(s);
  }
  function resetTimingScroll(){const m=$('timingOverlay')?.querySelector('.modal'); if(m) requestAnimationFrame(()=>{m.scrollTop=0});}
  function maintain(){ensureThaiRangeButton(); reconcileTiming();}
  async function boot(){
    fitTiming(); await loadDeck(); maintain();
    const target=$('spreadOverlay')||document.body;
    new MutationObserver(()=>queueMicrotask(maintain)).observe(target,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['src','class']});
    document.addEventListener('click',e=>{
      const t=e.target?.closest?.('#timingDraw,#timingRefine,[data-open="timing"],#timingSupportBtn');
      if(t){resetTimingScroll();setTimeout(reconcileTiming,0);setTimeout(reconcileTiming,80);setTimeout(reconcileTiming,240);}
      if(e.target?.closest?.('#spreadOverlay')) setTimeout(ensureThaiRangeButton,0);
    },true);
    W.addEventListener('lunea:deterministic-ready',()=>setTimeout(maintain,0));
    W.addEventListener('pageshow',()=>setTimeout(maintain,80),{passive:true});
    W.LUNEA_THAI_TIMING_REPAIR_V60=Object.freeze({version:60,reconcileTiming,ensureThaiRangeButton});
    console.info('🛠 LUNEA Thai + Timing Repair V60 loaded');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
