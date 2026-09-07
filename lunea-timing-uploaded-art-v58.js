'use strict';
/* LUNEA TIMING UPLOADED ART V58
   Semantic label is authoritative. The uploaded numeric artwork is selected from
   the visible card label / deck id, never from a stale image src alone. */
(()=>{
  const W=window;
  if(W.__LUNEA_TIMING_UPLOADED_ART_V58__)return;
  W.__LUNEA_TIMING_UPLOADED_ART_V58__=true;
  const VERSION='20260907-semantic-v58';
  const norm=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
  let cards=[];
  let byLabel=new Map();

  function nFromId(id){const m=String(id||'').match(/(?:LT-|timing_)(\d{3})/i);const n=m?Number(m[1]):0;return n>=1&&n<=60?n:null;}
  function asset(n){const ext=n>=41&&n<=50?'PNG':'jpg';return `./timing_${String(n).padStart(3,'0')}.${ext}?v=${VERSION}`;}
  function buildMap(list){
    cards=Array.isArray(list)?list:[];byLabel=new Map();
    for(const c of cards){
      const n=nFromId(c.id||c.filename);if(!n)continue;
      for(const v of [c.label_ko,c.label_en,c.id,c.filename]){const k=norm(v);if(k)byLabel.set(k,n);}
    }
  }
  async function loadDeck(){
    try{const r=await fetch('./lunea_timing_oracle_v1.json?v=102',{cache:'no-cache'});if(!r.ok)throw new Error(String(r.status));const d=await r.json();buildMap(d?.cards||[]);}catch(e){console.warn('[Timing V58] deck map unavailable',e);}
  }
  function labelNumber(ko,en){return byLabel.get(norm(en))||byLabel.get(norm(ko))||null;}
  function srcNumber(img){
    const raw=`${img?.getAttribute?.('src')||''} ${img?.dataset?.luneaTimingCardId||''}`;
    const m=raw.match(/timing_(\d{3})|LT-(\d{3})/i);const n=Number(m?.[1]||m?.[2]||0);return n>=1&&n<=60?n:null;
  }
  function setImg(img,n){if(!img||!n)return false;const want=asset(n);img.dataset.luneaTimingSemantic=String(n);if(img.getAttribute('src')!==want)img.setAttribute('src',want);return true;}

  function syncSingle(){
    const img=document.getElementById('timingImage');if(!img)return false;
    const ko=document.getElementById('timingLabelKo')?.textContent;
    const en=document.getElementById('timingLabelEn')?.textContent;
    return setImg(img,labelNumber(ko,en)||srcNumber(img));
  }
  function syncAB(){
    let hit=false;
    document.querySelectorAll('#luneaTimingABCards .tab-card').forEach(card=>{
      const img=card.querySelector('img');const ko=card.querySelector('b')?.textContent;const en=card.querySelector('em')?.textContent;
      hit=setImg(img,labelNumber(ko,en)||srcNumber(img))||hit;
    });return hit;
  }
  function syncAll(){syncSingle();syncAB();}
  function style(){
    if(document.getElementById('luneaTimingUploadedArtV58Style'))return;
    const s=document.createElement('style');s.id='luneaTimingUploadedArtV58Style';s.textContent=`
      #timingOverlay .timing-front{overflow:hidden!important;background:#090b18!important}
      #timingOverlay .timing-front>img,#luneaTimingABPanel .tab-card>img{display:block!important;opacity:1!important;visibility:visible!important;object-fit:cover!important;object-position:center!important;filter:none!important}
      #timingOverlay .timing-front>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:9!important;border:0!important}
      #timingOverlay .lunea-v7-time-art,#timingOverlay .lunea-v15-time-art,#luneaTimingABPanel .lunea-v7-time-art,#luneaTimingABPanel .lunea-v15-time-art{display:none!important}
      #timingOverlay .timing-card-label{display:none!important}`;document.head.appendChild(s);
  }
  async function boot(){
    style();await loadDeck();syncAll();
    const targets=['timingLabelKo','timingLabelEn','luneaTimingABCards'];
    for(const id of targets){const el=document.getElementById(id);if(el&&!el.__luneaTimingV58Obs){el.__luneaTimingV58Obs=true;new MutationObserver(()=>queueMicrotask(syncAll)).observe(el,{childList:true,subtree:true,characterData:true});}}
    document.addEventListener('click',e=>{if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')){setTimeout(syncAll,0);setTimeout(syncAll,80);setTimeout(syncAll,220);}},true);
    W.LUNEA_TIMING_UPLOADED_ART_V58=Object.freeze({syncAll,version:58});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
