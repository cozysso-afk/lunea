'use strict';
/* LUNEA V57 stable host loader.
   Critical home is isolated from the rest of the feature stack.
   No document.write, no service worker, no all-or-nothing chain. */
(()=>{
  const W=window;
  if(W.__LUNEA_STABLE_HOST_LOADER_V57__)return;
  W.__LUNEA_STABLE_HOST_LOADER_V57__=true;

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function load(src){
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src=src+(src.includes('?')?'&':'?')+'host='+Date.now();
      s.async=false;
      s.onload=()=>resolve(true);
      s.onerror=()=>{console.warn('[LUNEA V57 host] skipped',src);resolve(false)};
      (document.head||document.documentElement).appendChild(s);
    });
  }

  async function waitCritical(timeout=10000){
    const start=Date.now();
    while(Date.now()-start<timeout){
      if(document.documentElement.dataset.luneaCriticalHome==='ready')return true;
      await sleep(60);
    }
    return false;
  }

  const REST=[
    './lunea-astro-origin-failover-v57.js?v=5701',
    './lunea-card-motion-timing-v7.js?v=701',
    './lunea-sector-color-system-v28.js?v=2801',
    './lunea-gemini-model-picker-v1.js?v=101',
    './lunea-manual-structure-v1.js?v=105',
    './lunea-manual-everywhere-v1.js?v=103',
    './lunea-manual-library-v1.js?v=101',
    './lunea-reading-draft-v1.js?v=101',
    './lunea-reading-journal-v2.js?v=201',
    './lunea-archive-search-v1.js?v=101',
    './lunea-flip-all-fix-v1.js?v=102',
    './lunea-question-casebook-v1.js?v=101',
    './lunea-question-casebook-web-v1.js?v=101',
    './lunea-question-casebook-ranker-v1.js?v=101',
    './lunea-user-spread-learning-v1.js?v=108',
    './lunea-learning-cloud-sync-v1.js?v=104',
    './lunea-ai-spread-preflight-v2.js?v=105',
    './lunea-reading-flow-v5.js?v=501',
    './lunea-transit-range-v1.js?v=103',
    './lunea-transit-long-run-v1.js?v=102',
    './lunea-astro-job-queue-v56.js?v=5601',
    './lunea-sheet-scroll-fix-v1.js?v=106',
    './lunea-horary-ab-v1.js?v=104',
    './lunea-timing-ab-v1.js?v=102',
    './lunea-timing-prompt-repair-v1.js?v=101',
    './lunea-timing-result-copy-v35.js?v=3501',
    './lunea-thai-tarot-bridge-v32.js?v=d2198d8c5779',
    './lunea-thai-range-v33.js?v=d2198d8c5779',
    './lunea-thai-date-display-v57.js?v=5701',
    './lunea-final-prompt-priority-v1.js?v=d2198d8c5779',
    './lunea-mobile-reading-controls-v12.js?v=1201',
    './lunea-opal-light-polish-v13.js?v=1301',
    './lunea-reading-polish-v14.js?v=1401',
    './lunea-timing-moondial-sync-v15.js?v=1502',
    './lunea-timing-ab-inline-v16.js?v=1601',
    './lunea-timing-uploaded-art-v57.js?v=5701',
    './lunea-manual-limit20-v17.js?v=1705',
    './lunea-horary-balance-v19-5.js?v=1905',
    './lunea-cardback-restore-v19.js?v=d2198d8c5779',
    './lunea-universal-ai-opal-v20.js?v=2003',
    './lunea-intimacy-v34.js?v=d2198d8c5779',
    './lunea-intimacy-ai-bridge-v34.js?v=d2198d8c5779',
    './lunea-intimacy-legacy-v35.js?v=d2198d8c5779',
    './lunea-intimacy-readability-v36.js?v=d2198d8c5779',
    './lunea-learning-success-gate-v1.js?v=101',
    './lunea-astro-resume-v23.js?v=2301',
    './lunea-thai-standalone-v24.js?v=2401',
    './lunea-thai-art-v25.js?v=2501',
    './lunea-thai-art-polish-v26.js?v=2601',
    './lunea-mobile-journal-polish-v27.js?v=2701',
    './lunea-fixed-spread-depth-v30.js?v=3003',
    './lunea-general-order-v30-5.js?v=3005',
    './lunea-reading-boundary-reset-v31.js?v=3102',
    './lunea-reading-action-order-v33.js?v=d2198d8c5779'
  ];

  async function boot(){
    if(document.readyState!=='complete'){
      await new Promise(resolve=>W.addEventListener('load',resolve,{once:true}));
    }

    await load('./lunea-critical-home-v57.js?v=5701');
    const ready=await waitCritical();
    if(!ready)console.warn('[LUNEA V57 host] critical home readiness timeout');

    // Non-home feature failures cannot roll the home back anymore.
    for(const src of REST)await load(src);
  }

  boot().catch(err=>console.error('[LUNEA V57 host]',err));
})();
