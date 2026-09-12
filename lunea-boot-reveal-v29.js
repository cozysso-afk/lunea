'use strict';
(()=>{
  if(window.__LUNEA_BOOT_REVEAL_V29__)return;
  window.__LUNEA_BOOT_REVEAL_V29__=true;

  const W=window;
  const root=document.documentElement;
  let done=false;

  const reveal=()=>{
    if(done)return;
    done=true;
    clearTimeout(W.__LUNEA_BOOT_FAILSAFE__);
    const started=Number(W.__LUNEA_BOOT_STARTED__||performance.now());
    const wait=Math.max(0,140-(performance.now()-started));
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      root.classList.remove('lunea-booting');
      root.classList.add('lunea-ui-ready');
    })),wait);
  };

  const titleOf=el=>String(el?.dataset?.title||el?.querySelector?.('h4')?.textContent||'').trim();

  function hasPortal(){
    return !!(
      document.querySelector('#luneaHomePortalV8 .lunea-v8-tile') ||
      document.querySelector('.lunea-v8-grid .lunea-v8-tile')
    );
  }

  function hasFinalGeneralSpreads(){
    const titles=new Set([...document.querySelectorAll('.reading-item')].map(titleOf));
    return titles.has('5 CARD · CORE FLOW') && titles.has('6 CARD · FULL VIEW');
  }

  function hasFinalSpreadPatches(){
    return !!(
      W.LUNEA_FIXED_SPREAD_DEPTH_V30 &&
      W.LUNEA_GENERAL_ORDER &&
      hasFinalGeneralSpreads() &&
      document.querySelectorAll('[data-lunea-universal-ai="1"]').length>=4
    );
  }

  function hasFinalTransitRange(){
    const select=document.getElementById('astroTransitDays');
    if(!select)return false;
    return !!(
      select.querySelector('option[value="365"]') &&
      document.querySelector('[data-lunea-long-days="365"]')
    );
  }

  const readyEnough=()=>hasPortal() && hasFinalSpreadPatches() && hasFinalTransitRange();

  const afterDom=()=>{
    const start=performance.now();
    const probe=()=>{
      if(readyEnough() || performance.now()-start>2600)return reveal();
      requestAnimationFrame(probe);
    };
    probe();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterDom,{once:true});
  else afterDom();

  reveal.readyEnough=readyEnough;
  W.LUNEA_BOOT_REVEAL_V29=reveal;
})();
