'use strict';

/* LUNEA DAILY ORBIT 6 BOOTFIX V57
   Host-only recovery for Vercel's post-document dynamic loader.
   V21 registers its boot on window.load when evaluated while readyState is
   interactive. If that load event already passed, DAILY stays on legacy 4.
   This file does not change draw/storage semantics; it only re-evaluates V21
   once after document.readyState becomes complete when its public API is absent. */
(()=>{
  const W=window;
  if(W.__LUNEA_DAILY_ORBIT6_BOOTFIX_V57__)return;
  W.__LUNEA_DAILY_ORBIT6_BOOTFIX_V57__=true;

  let retried=false;
  function ready(){
    return !!(W.LUNEA_DAILY_ORBIT6_V21 && document.querySelector('.daily.lunea-daily-orbit6'));
  }
  function retryOnce(){
    if(retried||ready())return;
    if(document.readyState!=='complete')return;
    retried=true;
    try{W.__LUNEA_DAILY_ORBIT6_V21__=false}catch{}
    const s=document.createElement('script');
    s.src='./lunea-daily-orbit6-v21.js?v=2101-bootfix57';
    s.async=false;
    s.onload=()=>setTimeout(()=>{
      if(!ready())console.warn('[LUNEA V57] DAILY ORBIT 6 boot retry completed but UI is not ready');
    },120);
    s.onerror=()=>console.warn('[LUNEA V57] DAILY ORBIT 6 boot retry failed to load');
    (document.head||document.documentElement).appendChild(s);
  }

  let n=0;
  const t=setInterval(()=>{
    n++;
    if(ready()){clearInterval(t);return;}
    retryOnce();
    if(retried||n>80)clearInterval(t);
  },100);
  retryOnce();
})();
