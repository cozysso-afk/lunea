'use strict';
/* LUNEA V57 critical-home bootstrap.
   Single purpose: make the known-good current home + DAILY ORBIT 6 deterministic.
   Loads only the required home dependencies, waits for each readiness condition,
   then allows non-home feature layers to continue. No service worker/storage purge. */
(()=>{
  const W=window;
  if(W.__LUNEA_CRITICAL_HOME_V57__)return;
  W.__LUNEA_CRITICAL_HOME_V57__=true;

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const q=s=>document.querySelector(s);

  async function waitFor(test,timeout=5000,step=50){
    const start=Date.now();
    while(Date.now()-start<timeout){
      try{if(test())return true}catch{}
      await sleep(step);
    }
    return false;
  }

  function load(src){
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src=src+(src.includes('?')?'&':'?')+'stable='+Date.now();
      s.async=false;
      s.onload=()=>resolve(true);
      s.onerror=()=>resolve(false);
      (document.head||document.documentElement).appendChild(s);
    });
  }

  async function run(){
    await waitFor(()=>document.readyState==='complete',7000,40);

    // Structural V4 functionality first, after the base app has fully defined its globals.
    if(!W.__LUNEA_STRUCTURAL_ROUTING_V4__){
      await load('./lunea-structural-routing-v4-base.js?v=412');
      await waitFor(()=>!!W.__LUNEA_STRUCTURAL_ROUTING_V4__,2500,50);
    }

    // Daily lock must be installed before Orbit 6. Evaluate only after load is complete.
    if(!W.LUNEA_DAILY_ORBIT_V1){
      try{W.__LUNEA_DAILY_LOCK_V1__=false}catch{}
      await load('./lunea-daily-lock-v1.js?v=101-stable');
      await waitFor(()=>!!W.LUNEA_DAILY_ORBIT_V1,3500,50);
    }

    // Current cabinet.
    if(!q('#luneaHomePortalV8')){
      try{W.__LUNEA_HOME_PORTAL_V8__=false}catch{}
      await load('./lunea-home-portal-v8.js?v=801-stable');
      await waitFor(()=>q('#luneaHomePortalV8 .lunea-v8-grid'),3000,50);
    }

    // Visual cabinet layers; failure here must not block Daily 6.
    await load('./lunea-home-timing-polish-v9.js?v=901-stable');
    await load('./lunea-category-art-v10.js?v=1001-stable');

    // DAILY ORBIT 6: reload only when the actual 6-axis DOM/API is absent.
    if(!(W.LUNEA_DAILY_ORBIT6_V21&&q('.daily.lunea-daily-orbit6 .lunea-daily-six-grid'))){
      try{W.__LUNEA_DAILY_ORBIT6_V21__=false}catch{}
      await load('./lunea-daily-orbit6-v21.js?v=2101-stable');
      await waitFor(()=>!!(W.LUNEA_DAILY_ORBIT6_V21&&q('.daily.lunea-daily-orbit6 .lunea-daily-six-grid')),4500,50);
    }

    // Daily approved celestial visual companion.
    if(!q('.daily .lunea-v22-sky')){
      try{W.__LUNEA_DAILY_CELESTIAL_V22__=false}catch{}
      await load('./lunea-daily-celestial-v22.js?v=2201-stable');
      await waitFor(()=>q('.daily .lunea-v22-sky'),2500,50);
    }

    document.documentElement.dataset.luneaCriticalHome='ready';
    W.dispatchEvent(new CustomEvent('lunea:critical-home-ready'));
  }

  run().catch(err=>console.error('[LUNEA V57 critical home]',err));
})();
