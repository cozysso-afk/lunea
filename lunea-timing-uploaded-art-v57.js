'use strict';

/* LUNEA TIMING UPLOADED ART V57
   Uses the uploaded numbered Timing Oracle deck from 2026-09-05 as the card
   artwork while keeping timing-oracle-v1.js as the semantic/RNG source.
   Each image is upgraded independently from its own card id; the large card
   never forces a different inline/A-B result to reuse its image. */
(() => {
  const W=window;
  if(W.__LUNEA_TIMING_UPLOADED_ART_V57__)return;
  W.__LUNEA_TIMING_UPLOADED_ART_V57__=true;
  const ASSET_VERSION='20260905-uploaded-v57';

  function indexFrom(img){
    if(!(img instanceof HTMLImageElement))return null;
    const raw=`${img.getAttribute('src')||''} ${img.currentSrc||''} ${img.dataset?.luneaTimingAsset||''} ${img.dataset?.luneaTimingAssetV16||''}`;
    const m=raw.match(/timing_(\d{3})/i);
    if(m){const n=Number(m[1]);if(Number.isInteger(n)&&n>=1&&n<=60)return n;}
    const d=Number(img.dataset?.luneaTimingAsset||img.dataset?.luneaTimingAssetV16||0);
    return Number.isInteger(d)&&d>=1&&d<=60?d:null;
  }
  function assetPath(n){
    n=Number(n);if(!Number.isInteger(n)||n<1||n>60)return null;
    const ext=n>=41&&n<=50?'PNG':'jpg';
    return `./timing_${String(n).padStart(3,'0')}.${ext}?v=${ASSET_VERSION}`;
  }
  function alreadyUploaded(raw,n){
    try{
      const u=new URL(raw,document.baseURI);
      const ext=n>=41&&n<=50?'png':'jpg';
      return u.pathname.toLowerCase().endsWith(`/timing_${String(n).padStart(3,'0')}.${ext}`);
    }catch{return false;}
  }
  function upgrade(img){
    const n=indexFrom(img);if(!n)return false;
    img.dataset.luneaTimingAsset=String(n);
    img.dataset.luneaTimingAssetV57=String(n);
    const raw=img.getAttribute('src')||'';
    if(!alreadyUploaded(raw,n))img.setAttribute('src',assetPath(n));
    return true;
  }
  function upgradeNode(node){
    if(!(node instanceof Element))return;
    if(node instanceof HTMLImageElement)upgrade(node);
    node.querySelectorAll?.('#timingOverlay img[src*="timing_" i],#luneaTimingABPanel img[src*="timing_" i],.timing-inline img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(upgrade);
  }
  function upgradeAll(){
    document.querySelectorAll('#timingOverlay img[src*="timing_" i],#luneaTimingABPanel img[src*="timing_" i],.timing-inline img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(upgrade);
  }
  function addStyle(){
    if(document.getElementById('luneaTimingUploadedArtV57Style'))return;
    const s=document.createElement('style');s.id='luneaTimingUploadedArtV57Style';s.textContent=`
      #timingOverlay .timing-front{overflow:hidden!important;background:#090b18!important}
      #timingOverlay .timing-front>img,
      #luneaTimingABPanel .tab-card>img,
      .timing-inline img,
      img[data-lunea-timing-asset-v57]{display:block!important;opacity:1!important;visibility:visible!important;object-fit:cover!important;object-position:center!important;filter:none!important}
      #timingOverlay .timing-front>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:9!important;border:0!important}
      #timingOverlay .lunea-v7-time-art,#timingOverlay .lunea-v15-time-art,
      #luneaTimingABPanel .lunea-v7-time-art,#luneaTimingABPanel .lunea-v15-time-art{display:none!important}
      #timingOverlay .timing-card-label{display:none!important}
    `;(document.head||document.documentElement).appendChild(s);
  }
  function boot(){
    addStyle();upgradeAll();
    const root=document.documentElement;
    if(root&&!root.__luneaTimingUploadedV57Observed){
      root.__luneaTimingUploadedV57Observed=true;
      let queued=false;
      const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;upgradeAll()})};
      new MutationObserver(records=>{
        for(const r of records){
          if(r.type==='childList')for(const n of r.addedNodes||[])upgradeNode(n);
          if(r.type==='attributes'&&r.target instanceof HTMLImageElement)upgrade(r.target);
        }
        schedule();
      }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
    }
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')){setTimeout(upgradeAll,20);setTimeout(upgradeAll,140);}
    },{passive:true});
    W.LUNEA_TIMING_UPLOADED_ART_V57=Object.freeze({version:57,assetPath,upgradeAll});
    console.info('🕰 LUNEA Timing uploaded artwork V57 active');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
