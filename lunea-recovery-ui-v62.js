'use strict';
/* LUNEA RECOVERY UI V62
   - preserves current sector card backs
   - row 4 order: Thai Taksa / Thai period / master prompt copy
   - fixes Timing artwork/text mismatch without a whole-page MutationObserver
   - watches only timingImage.src and timing labels; no draw-loop / no RNG changes
*/
(()=>{
  const W=window;
  if(W.__LUNEA_RECOVERY_UI_V62__) return;
  W.__LUNEA_RECOVERY_UI_V62__=true;
  const VER='20260907-v62';
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
  let cards=[], byLabel=new Map();

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

  function nFromCard(c){const m=String(c?.id||c?.filename||'').match(/(?:LT-|timing_)(\d{3})/i);const n=Number(m?.[1]||0);return n>=1&&n<=60?n:0}
  function asset(n){const ext=n>=41&&n<=50?'PNG':'jpg';return `./timing_${String(n).padStart(3,'0')}.${ext}?v=${VER}`}
  async function loadDeck(){
    try{const r=await fetch('./lunea_timing_oracle_v1.json?v=102',{cache:'no-cache'});if(!r.ok)throw new Error(String(r.status));const d=await r.json();cards=Array.isArray(d?.cards)?d.cards:[];byLabel.clear();for(const c of cards){const n=nFromCard(c);for(const v of [c.label_ko,c.label_en,c.id,c.filename]){const k=norm(v);if(k)byLabel.set(k,{n,c})}}}catch(e){console.warn('[V62] timing deck',e)}
  }
  function semantic(){
    const ko=norm($('timingLabelKo')?.textContent), en=norm($('timingLabelEn')?.textContent);
    return byLabel.get(en)||byLabel.get(ko)||null;
  }
  function syncTiming(){
    const hit=semantic(), img=$('timingImage'); if(!hit||!img)return false;
    const want=asset(hit.n); const cur=String(img.getAttribute('src')||'');
    if(!cur.includes(`timing_${String(hit.n).padStart(3,'0')}`)) img.setAttribute('src',want);
    img.dataset.luneaTimingSemantic=String(hit.n); img.alt=hit.c.label_ko||'';
    const inline=$('luneaTimingInline'); if(inline){const ii=inline.querySelector('img');if(ii&& !String(ii.getAttribute('src')||'').includes(`timing_${String(hit.n).padStart(3,'0')}`))ii.setAttribute('src',want);const b=inline.querySelector('.txt b,b');if(b)b.textContent=hit.c.label_ko||'';const s=inline.querySelector('.txt span,span');if(s)s.textContent=hit.c.meaning||''}
    return true;
  }
  function scheduleTiming(){[0,120,320,700,1200].forEach(ms=>setTimeout(syncTiming,ms))}
  function observeTiming(){
    const img=$('timingImage'); if(img&&!img.__luneaV62Obs){img.__luneaV62Obs=true;let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;queueMicrotask(()=>{syncTiming();busy=false})}).observe(img,{attributes:true,attributeFilter:['src']})}
    for(const id of ['timingLabelKo','timingLabelEn']){const el=$(id);if(el&&!el.__luneaV62Obs){el.__luneaV62Obs=true;new MutationObserver(()=>queueMicrotask(syncTiming)).observe(el,{childList:true,subtree:true,characterData:true})}}
  }
  function boot(){
    loadDeck().then(()=>{observeTiming();syncTiming()}); reorder();
    const bar=document.querySelector('#spreadOverlay .actionbar');if(bar&&!bar.__luneaV62OrderObs){bar.__luneaV62OrderObs=true;let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;reorder()})}).observe(bar,{childList:true})}
    document.addEventListener('click',e=>{if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,[data-open="timing"]'))scheduleTiming();if(e.target?.closest?.('#spreadOverlay'))setTimeout(reorder,0)},true);
    W.addEventListener('pageshow',()=>{reorder();observeTiming();scheduleTiming()},{passive:true});
    W.LUNEA_RECOVERY_UI_V62=Object.freeze({version:62,reorder,syncTiming});
    console.info('✅ LUNEA Recovery UI V62 loaded');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();