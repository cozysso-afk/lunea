'use strict';
/* LUNEA RECOVERY UI V63
   Narrow patch on top of the working 300z65r1k preview.
   - Timing artwork follows the deck's semantic filename (never generic timing_###.jpg).
   - Thai controls stay together without disturbing the Western row.
   - Reading draft autosave/resume is re-asserted, never cleared.
*/
(()=>{
  const W=window;if(W.__LUNEA_RECOVERY_UI_V63__)return;W.__LUNEA_RECOVERY_UI_V63__=true;
  const $=id=>document.getElementById(id),norm=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
  let deck=[],byLabel=new Map();

  async function loadDeck(){
    try{
      const r=await fetch('./lunea_timing_oracle_v1.json?v=63',{cache:'no-cache'});if(!r.ok)throw new Error(String(r.status));
      const d=await r.json();deck=Array.isArray(d?.cards)?d.cards:[];byLabel.clear();
      for(const c of deck){for(const v of[c.label_ko,c.label_en,c.id]){const k=norm(v);if(k)byLabel.set(k,c)}}
    }catch(e){console.warn('[V63] timing deck',e)}
  }
  function currentTiming(){return byLabel.get(norm($('timingLabelEn')?.textContent))||byLabel.get(norm($('timingLabelKo')?.textContent))||null}
  function semanticUrl(card){
    if(!card?.filename)return'';
    try{return new URL('./'+String(card.filename).replace(/^\.\//,''),document.baseURI).href}catch{return'./'+card.filename}
  }
  function syncTiming(){
    const c=currentTiming(),img=$('timingImage');if(!c||!img)return false;
    const want=semanticUrl(c);if(!want)return false;
    const now=img.getAttribute('src')||'';
    if(!now.includes(c.filename))img.setAttribute('src',want);
    img.alt=c.label_ko||'';img.dataset.luneaTimingId=c.id||'';img.dataset.luneaTimingFilename=c.filename||'';
    const inline=$('luneaTimingInline');if(inline){
      const ii=inline.querySelector('img');if(ii&&!String(ii.getAttribute('src')||'').includes(c.filename))ii.setAttribute('src',want);
      const b=inline.querySelector('.txt b,b');if(b)b.textContent=c.label_ko||'';
      const s=inline.querySelector('.txt span,span');if(s)s.textContent=c.meaning||'';
    }
    return true;
  }
  function scheduleTiming(){[0,80,180,360].forEach(ms=>setTimeout(syncTiming,ms))}

  function ensureThaiRange(){
    let b=$('luneaThaiTarotRangeBtn');if(b)return b;
    const bar=document.querySelector('#spreadOverlay .actionbar'),thai=$('luneaThaiTarotBridgeBtn');if(!bar||!thai)return null;
    b=document.createElement('button');b.type='button';b.id='luneaThaiTarotRangeBtn';b.className=thai.className||'mini';b.textContent='🇹🇭 Thai 기간';
    b.onclick=()=>{const api=W.LUNEA_THAI_RANGE_V33;if(typeof api?.openTarot==='function')api.openTarot();else alert('Thai 기간 기능을 불러오는 중이야. 잠시 후 다시 눌러줘.')};
    bar.appendChild(b);return b;
  }
  function reorderThai(){
    const bar=document.querySelector('#spreadOverlay .actionbar');if(!bar)return false;
    const thai=$('luneaThaiTarotBridgeBtn'),range=ensureThaiRange(),copy=$('luneaTopCopyPrompt');
    if(!thai||!range)return false;
    // Put Thai Taksa + Thai 기간 together at the very end. Keep copy immediately before them.
    if(copy)bar.appendChild(copy);bar.appendChild(thai);bar.appendChild(range);return true;
  }

  function ensureDraft(){
    try{
      const api=W.LUNEA_READING_DRAFT_V1;
      if(api?.snapshot){setTimeout(()=>{try{api.snapshot()}catch{}},120);return true}
    }catch{}
    return false;
  }

  function boot(){
    loadDeck().then(()=>scheduleTiming());reorderThai();ensureDraft();
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,[data-open="timing"]'))scheduleTiming();
      if(e.target?.closest?.('#spreadOverlay'))setTimeout(reorderThai,0);
      if(e.target?.closest?.('#flipAll,#retry,#extraCard,#aiRead,[data-clarify]'))setTimeout(ensureDraft,180);
    },true);
    const labels=['timingLabelKo','timingLabelEn'];for(const id of labels){const el=$(id);if(el&&!el.__v63){el.__v63=true;new MutationObserver(()=>queueMicrotask(syncTiming)).observe(el,{childList:true,subtree:true,characterData:true})}}
    W.addEventListener('pageshow',()=>{reorderThai();scheduleTiming();ensureDraft()},{passive:true});
    W.LUNEA_RECOVERY_UI_V63=Object.freeze({version:63,syncTiming,reorderThai,ensureDraft});
    console.info('✅ LUNEA Recovery UI V63 loaded');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();