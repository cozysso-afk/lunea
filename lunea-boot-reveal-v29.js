'use strict';
(()=>{
  if(window.__LUNEA_BOOT_REVEAL_V29__)return;
  window.__LUNEA_BOOT_REVEAL_V29__=true;

  const W=window;
  const root=document.documentElement;
  const DRAW_GUARD_WAIT_MS=5000;
  let done=false;

  const coreRowsReady=()=>{
    const ai=document.querySelectorAll('[data-lunea-universal-ai="1"]');
    const manual=document.querySelectorAll('[data-manual-spread="1"]');
    return document.documentElement.dataset.luneaCoreSpreadEntries==='ready' && ai.length>=4 && manual.length>=4;
  };

  const reveal=()=>{
    if(done||!coreRowsReady())return false;
    done=true;
    clearTimeout(W.__LUNEA_BOOT_FAILSAFE__);
    const started=Number(W.__LUNEA_BOOT_STARTED__||performance.now());
    const wait=Math.max(0,140-(performance.now()-started));
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      root.classList.remove('lunea-booting');
      root.classList.add('lunea-ui-ready');
    })),wait);
    return true;
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
      coreRowsReady() &&
      W.LUNEA_FIXED_SPREAD_DEPTH_V30 &&
      W.LUNEA_GENERAL_ORDER &&
      hasFinalGeneralSpreads()
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

  function hasFinalDrawPipeline(){
    const btn=document.getElementById('drawBtn');
    return !!(
      btn &&
      typeof W.LUNEA_AI_SPREAD_PREFLIGHT?.design==='function' &&
      btn.onclick?.__luneaUniversalV20Wrapped
    );
  }

  function installDrawStartupGuard(){
    const btn=document.getElementById('drawBtn');
    if(!btn||btn.__luneaStartupDrawGuardInstalled)return false;
    btn.__luneaStartupDrawGuardInstalled=true;
    let queued=false;

    const guard=event=>{
      if(hasFinalDrawPipeline()){
        btn.removeEventListener('click',guard,true);
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if(queued)return;
      queued=true;

      const label=document.getElementById('drawLabel');
      const oldLabel=label?.textContent||'질문 분석 & 맞춤 배열 설계';
      if(label)label.textContent='카드 엔진 준비 중…';
      const started=performance.now();

      const retry=()=>{
        const ready=hasFinalDrawPipeline();
        const timedOut=performance.now()-started>DRAW_GUARD_WAIT_MS;
        if(!ready&&!timedOut){
          setTimeout(retry,80);
          return;
        }

        queued=false;
        btn.removeEventListener('click',guard,true);
        if(label&&label.textContent==='카드 엔진 준비 중…')label.textContent=oldLabel;
        if(!ready)console.warn('[LUNEA V29] draw pipeline startup guard timed out; using current handler');
        if(!btn.disabled)btn.click();
      };

      setTimeout(retry,0);
    };

    btn.addEventListener('click',guard,true);
    return true;
  }

  const readyEnough=()=>coreRowsReady() && hasPortal() && hasFinalSpreadPatches() && hasFinalTransitRange() && hasFinalDrawPipeline();

  const afterDom=()=>{
    installDrawStartupGuard();
    const start=performance.now();
    const probe=()=>{
      const elapsed=performance.now()-start;
      if(readyEnough())return reveal();

      // Auxiliary art/range modules are not allowed to keep the app hidden
      // forever, but the core reading rows and draw pipeline are non-negotiable.
      if(elapsed>2600 && coreRowsReady() && hasFinalDrawPipeline())return reveal();
      if(elapsed>8000 && coreRowsReady()){
        console.warn('[LUNEA V29] revealing with draw startup guard; auxiliary boot still incomplete');
        return reveal();
      }

      requestAnimationFrame(probe);
    };
    probe();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterDom,{once:true});
  else afterDom();

  reveal.readyEnough=readyEnough;
  reveal.coreRowsReady=coreRowsReady;
  reveal.drawPipelineReady=hasFinalDrawPipeline;
  W.LUNEA_BOOT_REVEAL_V29=reveal;
})();