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

  function ensureReadingContext(){
    if(W.LUNEA_READING_CONTEXT_V1||document.getElementById('luneaReadingContextV1Loader'))return true;
    const script=document.createElement('script');
    script.id='luneaReadingContextV1Loader';
    script.src='./lunea-reading-context-v1.js?v=20260922-1';
    script.async=false;
    script.onerror=()=>console.error('[LUNEA V29] reading context module failed to load');
    document.head.appendChild(script);
    return true;
  }

  function installJournalRuntimeFix(){
    if(W.__LUNEA_JOURNAL_RUNTIME_FIX_V2__)return true;
    W.__LUNEA_JOURNAL_RUNTIME_FIX_V2__=true;

    const $=id=>document.getElementById(id);
    const LEGACY_KEYS=new Set(['LUNEA_READING_JOURNAL_V1','LUNEA_ARCHIVE_V3']);
    let searchTimer=0;
    let filterFrame=0;
    let listObserver=null;

    const style=document.createElement('style');
    style.id='luneaJournalRuntimeFixV2Style';
    style.textContent=`
      #archiveOverlay #archiveSearchAdvanced{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;margin:7px 0 6px!important}
      #archiveOverlay #archiveSearchAdvanced>#archiveCategoryFilter,
      #archiveOverlay #archiveSearchAdvanced>#archiveStatusFilter{display:none!important}
      #archiveOverlay .lunea-date-filter-v2{min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:5px;padding:0 7px;border:1px solid rgba(130,234,220,.18);border-radius:12px;background:rgba(7,13,21,.62);min-height:39px}
      #archiveOverlay .lunea-date-filter-v2>span{color:#9fc8c4;font-size:9px;white-space:nowrap}
      #archiveOverlay .lunea-date-filter-v2>input{min-width:0!important;width:100%!important;border:0!important;background:transparent!important;box-shadow:none!important;padding:7px 0!important;min-height:37px!important;color:#eefafa!important;font-size:10px!important}
      #archiveOverlay .archive-search-foot{position:static!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin:0 0 9px!important}
      #archiveOverlay #archiveSearchReset{flex:0 0 auto!important}
      @media(max-width:430px){#archiveOverlay #archiveSearchAdvanced{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `;
    document.head.appendChild(style);

    function wrapDate(id,label){
      const input=$(id);
      if(!input||input.closest('.lunea-date-filter-v2'))return false;
      const oldWrap=input.closest('.lunea-date-filter-v1');
      if(oldWrap){
        const oldLabel=oldWrap.querySelector('span');
        oldWrap.classList.remove('lunea-date-filter-v1');
        oldWrap.classList.add('lunea-date-filter-v2');
        if(oldLabel)oldLabel.textContent=label;
        return true;
      }
      const wrap=document.createElement('label');
      wrap.className='lunea-date-filter-v2';
      const text=document.createElement('span');
      text.textContent=label;
      input.replaceWith(wrap);
      wrap.append(text,input);
      return true;
    }

    function polishControls(){
      wrapDate('archiveDateFrom','시작');
      wrapDate('archiveDateTo','종료');
    }

    function canonicalDate(value){
      const s=String(value||'');
      let m=s.match(/(20\d{2})[-\/.]\s*(\d{1,2})[-\/.]\s*(\d{1,2})/);
      if(!m)m=s.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
      if(!m)return'';
      return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    }

    function applyDateFilter(){
      filterFrame=0;
      const list=$('archiveList');
      if(!list)return;
      const from=$('archiveDateFrom')?.value||'';
      const to=$('archiveDateTo')?.value||'';
      const items=[...list.querySelectorAll('.archive-item')];
      let visible=0;
      items.forEach(item=>{
        const date=canonicalDate(item.querySelector('.archive-meta')?.textContent||item.textContent||'');
        const show=(!from||(date&&date>=from))&&(!to||(date&&date<=to));
        item.hidden=!show;
        item.style.display=show?'':'none';
        if(show)visible+=1;
      });
      const summary=$('archiveSearchSummary');
      if(summary)summary.textContent=items.length?`${visible}건 표시`:'검색 결과 없음';
    }

    function scheduleDateFilter(){
      if(filterFrame)cancelAnimationFrame(filterFrame);
      filterFrame=requestAnimationFrame(applyDateFilter);
    }

    function detachHeavyObserver(){
      const list=$('archiveList');
      if(!list)return null;
      if(list.dataset.luneaJournalRuntimeV2==='1')return list;
      const fresh=list.cloneNode(false);
      fresh.dataset.luneaJournalRuntimeV2='1';
      list.replaceWith(fresh);
      if(listObserver)listObserver.disconnect();
      listObserver=new MutationObserver(scheduleDateFilter);
      listObserver.observe(fresh,{childList:true});
      return fresh;
    }

    function withoutLegacyMigration(fn){
      const proto=W.Storage?.prototype;
      if(!proto||typeof proto.getItem!=='function')return Promise.resolve().then(fn);
      const original=proto.getItem;
      let remaining=2;
      let restored=false;
      const restore=()=>{
        if(restored)return;
        restored=true;
        if(proto.getItem===patched)proto.getItem=original;
      };
      function patched(key){
        if(this===W.localStorage&&LEGACY_KEYS.has(String(key))){
          remaining-=1;
          if(remaining<=0)restore();
          return'[]';
        }
        return original.call(this,key);
      }
      proto.getItem=patched;
      try{return Promise.resolve(fn()).finally(restore)}catch(error){restore();return Promise.reject(error)}
    }

    async function fastRender(){
      polishControls();
      detachHeavyObserver();
      const journal=W.LUNEA_READING_JOURNAL;
      if(!journal?.render)return;
      await withoutLegacyMigration(()=>journal.render());
      scheduleDateFilter();
    }

    async function openFast(){
      polishControls();
      detachHeavyObserver();
      const overlay=$('archiveOverlay');
      if(!overlay)return;
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
      document.body.classList.add('modal-open');
      const modal=overlay.querySelector('.modal');
      if(modal)modal.scrollTop=0;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      await fastRender();
    }

    function resetFilters(){
      const search=$('archiveSearch');
      if(search)search.value='';
      ['archiveDateFrom','archiveDateTo','ljStatus','ljCat','archiveCategoryFilter','archiveStatusFilter'].forEach(id=>{const el=$(id);if(el)el.value=''});
      fastRender();
    }

    W.addEventListener('click',event=>{
      if(event.target?.closest?.('#archiveBtn')){
        event.preventDefault();
        event.stopImmediatePropagation();
        openFast();
        return;
      }
      if(event.target?.closest?.('#archiveSearchReset')){
        event.preventDefault();
        event.stopImmediatePropagation();
        resetFilters();
      }
    },true);

    W.addEventListener('input',event=>{
      if(event.target?.id!=='archiveSearch')return;
      event.stopImmediatePropagation();
      clearTimeout(searchTimer);
      searchTimer=setTimeout(fastRender,180);
    },true);

    W.addEventListener('change',event=>{
      const id=event.target?.id||'';
      if(id==='archiveDateFrom'||id==='archiveDateTo'){
        event.stopImmediatePropagation();
        scheduleDateFilter();
        return;
      }
      if(id==='ljStatus'||id==='ljCat'){
        event.stopImmediatePropagation();
        fastRender();
      }
    },true);

    let tries=0;
    const settle=()=>{
      tries+=1;
      polishControls();
      if($('archiveSearchAdvanced')&&$('archiveList'))detachHeavyObserver();
      if(tries<20&&(!$('archiveSearchAdvanced')||!W.LUNEA_READING_JOURNAL))setTimeout(settle,100);
    };
    settle();
    console.info('✦ LUNEA Journal Runtime Fix V2 loaded');
    return true;
  }

  const readyEnough=()=>coreRowsReady() && hasPortal() && hasFinalSpreadPatches() && hasFinalTransitRange() && hasFinalDrawPipeline();

  const afterDom=()=>{
    installDrawStartupGuard();
    ensureReadingContext();
    installJournalRuntimeFix();
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