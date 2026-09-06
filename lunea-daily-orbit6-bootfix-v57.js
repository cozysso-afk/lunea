'use strict';

/* LUNEA DAILY ORBIT 6 BOOTFIX V57.2
   Vercel injects the structural chain after document.write/document.close.
   Both Daily Lock V1 and Orbit 6 V21 can be evaluated after the original load
   event boundary. Recover the dependency first, then recover Orbit 6.
   No draw/storage semantics are changed here. */
(()=>{
  const W=window;
  if(W.__LUNEA_DAILY_ORBIT6_BOOTFIX_V572__)return;
  W.__LUNEA_DAILY_ORBIT6_BOOTFIX_V572__=true;

  const hasLock=()=>!!W.LUNEA_DAILY_ORBIT_V1;
  const hasOrbit=()=>!!(W.LUNEA_DAILY_ORBIT6_V21&&document.querySelector('.daily.lunea-daily-orbit6'));
  let lockReloading=false,orbitReloading=false;

  function loadScript(src,onload){
    const s=document.createElement('script');
    s.src=src;s.async=false;
    s.onload=onload||null;
    s.onerror=()=>console.warn('[LUNEA V57] failed:',src);
    (document.head||document.documentElement).appendChild(s);
  }

  function recoverLock(){
    if(hasLock()||lockReloading||document.readyState!=='complete')return;
    lockReloading=true;
    try{W.__LUNEA_DAILY_LOCK_V1__=false}catch{}
    loadScript('./lunea-daily-lock-v1.js?v=101-v572',()=>{
      lockReloading=false;
      setTimeout(recoverOrbit,80);
    });
  }

  function recoverOrbit(){
    if(hasOrbit()||orbitReloading||!hasLock()||document.readyState!=='complete')return;
    orbitReloading=true;
    try{W.__LUNEA_DAILY_ORBIT6_V21__=false}catch{}
    loadScript('./lunea-daily-orbit6-v21.js?v=2101-v572',()=>{
      orbitReloading=false;
      setTimeout(()=>{
        if(!hasOrbit())console.warn('[LUNEA V57] Orbit 6 reloaded but UI still not ready');
      },180);
    });
  }

  let n=0;
  const t=setInterval(()=>{
    n++;
    if(hasOrbit()){clearInterval(t);return;}
    if(!hasLock())recoverLock(); else recoverOrbit();
    if(n>180)clearInterval(t);
  },100);

  recoverLock();
  recoverOrbit();
})();
