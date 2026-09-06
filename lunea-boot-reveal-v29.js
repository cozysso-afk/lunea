'use strict';
(()=>{
  if(window.__LUNEA_BOOT_REVEAL_V29__)return;
  window.__LUNEA_BOOT_REVEAL_V29__=true;
  const root=document.documentElement;
  let done=false;

  /* V29 owns the reveal once loaded; cancel the legacy 3.5s reveal first. */
  try{clearTimeout(window.__LUNEA_BOOT_FAILSAFE__);}catch{}

  const reveal=()=>{
    if(done)return;done=true;
    clearTimeout(window.__LUNEA_BOOT_FAILSAFE__);
    const started=Number(window.__LUNEA_BOOT_STARTED__||performance.now());
    const wait=Math.max(0,180-(performance.now()-started));
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      root.classList.remove('lunea-booting');
      root.classList.add('lunea-ui-ready');
    })),wait);
  };

  /*
    V57: a home tile alone is NOT readiness. The base HTML contains the old
    DAILY ORBIT 4 card and V21/V22 replace/decorate it later. Revealing as soon
    as the portal tile existed caused the exact ORBIT 4 -> ORBIT 6 flash seen
    in the iPhone recording. Wait for both the current home portal and the
    celestial Daily Orbit 6 DOM before removing the curtain.
  */
  const homeReady=()=>!!(
    document.querySelector('#luneaHomePortalV8 .lunea-v8-tile') ||
    document.querySelector('.lunea-v8-grid .lunea-v8-tile')
  );
  const dailyReady=()=>!!(
    document.querySelector('.daily.lunea-daily-orbit6 .lunea-v22-sky') &&
    document.querySelector('.daily.lunea-daily-orbit6 .lunea-v22-title-panel')
  );
  const readyEnough=()=>homeReady() && dailyReady();

  const afterDom=()=>{
    const start=performance.now();
    const probe=()=>{
      if(readyEnough())return reveal();
      /* Safety only. Normal reveal should always happen through readyEnough. */
      if(performance.now()-start>5200)return reveal();
      requestAnimationFrame(probe);
    };
    probe();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterDom,{once:true});
  else afterDom();
  window.LUNEA_BOOT_REVEAL_V29=reveal;
})();
