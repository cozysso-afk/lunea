\'use strict\';
(()=>{
  if(window.__LUNEA_BOOT_REVEAL_V29__)return;
  window.__LUNEA_BOOT_REVEAL_V29__=true;
  const root=document.documentElement;
  let done=false;
  const reveal=()=>{
    if(done)return;done=true;
    clearTimeout(window.__LUNEA_BOOT_FAILSAFE__);
    const started=Number(window.__LUNEA_BOOT_STARTED__||performance.now());
    const wait=Math.max(0,140-(performance.now()-started));
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      root.classList.remove('lunea-booting');
      root.classList.add('lunea-ui-ready');
    })),wait);
  };
  const readyEnough=()=>!!(
    document.querySelector('#luneaHomePortalV8 .lunea-v8-tile') ||
    document.querySelector('.lunea-v8-grid .lunea-v8-tile')
  );
  const afterDom=()=>{
    const start=performance.now();
    const probe=()=>{
      if(readyEnough() || performance.now()-start>1200)return reveal();
      requestAnimationFrame(probe);
    };
    probe();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterDom,{once:true});
  else afterDom();
  window.LUNEA_BOOT_REVEAL_V29=reveal;
})();
