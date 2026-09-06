'use strict';
(()=>{
  if(window.__LUNEA_BOOT_REVEAL_V29__)return;
  window.__LUNEA_BOOT_REVEAL_V29__=true;
  const root=document.documentElement;
  let done=false;

  /* The base HTML's 3.5s failsafe can expose DAILY ORBIT 4 before V57 finishes. */
  try{clearTimeout(window.__LUNEA_BOOT_FAILSAFE__)}catch{}

  const reveal=()=>{
    if(done)return;done=true;
    try{clearTimeout(window.__LUNEA_BOOT_FAILSAFE__)}catch{}
    const started=Number(window.__LUNEA_BOOT_STARTED__||performance.now());
    const wait=Math.max(0,160-(performance.now()-started));
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      root.classList.remove('lunea-booting');
      root.classList.add('lunea-ui-ready');
    })),wait);
  };

  const homeReady=()=>!!(
    document.querySelector('#luneaHomePortalV8 .lunea-v8-tile')||
    document.querySelector('.lunea-v8-grid .lunea-v8-tile')
  );
  const dailyReady=()=>!!(
    document.querySelector('.daily.lunea-daily-orbit6')&&
    document.querySelector('.daily .lunea-daily-six-grid')&&
    /DAILY ORBIT 6/i.test(document.querySelector('.daily h3')?.textContent||'')
  );

  const afterDom=()=>{
    const started=performance.now();
    const probe=()=>{
      if(homeReady()&&dailyReady())return reveal();
      /* Safety: never strand the app behind the curtain if an optional visual fails. */
      if(performance.now()-started>4200)return reveal();
      requestAnimationFrame(probe);
    };
    probe();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterDom,{once:true});else afterDom();
  window.LUNEA_BOOT_REVEAL_V29=reveal;
})();
