'use strict';
/* LUNEA deterministic recovery loader.
   One pinned order, one execution path. No document.write, no cache-bump timestamps,
   no nested critical-home loader, no duplicate UI generations. */
(()=>{
  const W=window;
  if(W.__LUNEA_DETERMINISTIC_LOADER_V1__) return;
  W.__LUNEA_DETERMINISTIC_LOADER_V1__=true;

  const SOURCES=[
    './lunea-luminous-theme-v1.js?v=101',
    './lunea-luminous-layout-v2.js?v=201',
    './lunea-luminous-polish-v3.js?v=301',
    './lunea-top-spacing-v4.js?v=401',
    './lunea-gemini-model-picker-v1.js?v=101',
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-daily-lock-v1.js?v=101',
    './lunea-card-motion-timing-v7.js?v=701',
    './lunea-home-portal-v8.js?v=801',
    './lunea-home-timing-polish-v9.js?v=901',
    './lunea-category-art-v10.js?v=1001',
    './lunea-daily-orbit6-v21.js?v=2101',
    './lunea-daily-celestial-v22.js?v=2201',
    './lunea-sector-color-system-v28.js?v=2801',

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
    './lunea-mobile-reading-controls-v12.js?v=1201',
    './lunea-opal-light-polish-v13.js?v=1301',
    './lunea-reading-polish-v14.js?v=1401',
    './lunea-manual-limit20-v17.js?v=1705',
    './lunea-cardback-restore-v19.js?v=d2198d8c5779',
    './lunea-universal-ai-opal-v20.js?v=2003',
    './lunea-fixed-spread-depth-v30.js?v=3003',
    './lunea-general-order-v30-5.js?v=3005',
    './lunea-reading-boundary-reset-v31.js?v=3102',
    './lunea-reading-action-order-v33.js?v=d2198d8c5779',

    './lunea-intimacy-v34.js?v=d2198d8c5779',
    './lunea-intimacy-ai-bridge-v34.js?v=d2198d8c5779',
    './lunea-intimacy-legacy-v35.js?v=d2198d8c5779',
    './lunea-intimacy-oracle-v35.js?v=352',
    './lunea-intimacy-oracle-ui-v36.js?v=3614',
    './lunea-intimacy-readability-v36.js?v=d2198d8c5779',
    './lunea-intimacy-clean-v39.js?v=3901',
    './lunea-intimacy-burgundy-v40.js?v=4005',
    './lunea-intimacy-repair-v43.js?v=4301',

    './lunea-horary-ab-v1.js?v=104',
    './lunea-horary-balance-v19-5.js?v=1905',
    './lunea-timing-ab-v1.js?v=102',
    './lunea-timing-prompt-repair-v1.js?v=101',
    './lunea-timing-result-copy-v35.js?v=3501',
    './lunea-timing-moondial-sync-v15.js?v=1502',
    './lunea-timing-ab-inline-v16.js?v=1601',
    './lunea-timing-uploaded-art-v57.js?v=5701',

    './lunea-transit-range-v1.js?v=103',
    './lunea-transit-long-run-v1.js?v=102',
    './lunea-astro-job-queue-v56.js?v=5601',
    './lunea-astro-origin-failover-v57.js?v=5701',
    './lunea-astro-resume-v23.js?v=2301',
    './lunea-thai-tarot-bridge-v32.js?v=d2198d8c5779',
    './lunea-thai-range-v33.js?v=d2198d8c5779',
    './lunea-thai-date-display-v57.js?v=5701',
    './lunea-thai-standalone-v24.js?v=2401',
    './lunea-thai-art-v25.js?v=2501',
    './lunea-thai-art-polish-v26.js?v=2601',
    './lunea-final-prompt-priority-v1.js?v=d2198d8c5779',
    './lunea-sheet-scroll-fix-v1.js?v=106',
    './lunea-mobile-journal-polish-v27.js?v=2701',
    './lunea-learning-success-gate-v1.js?v=101',
    './lunea-boot-reveal-v29.js?v=2902'
  ];

  const loaded=new Set();
  function load(src){
    if(loaded.has(src)) return Promise.resolve(true);
    loaded.add(src);
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src=src;
      s.async=false;
      s.dataset.luneaDeterministic='1';
      s.onload=()=>resolve(true);
      s.onerror=()=>{console.error('[LUNEA deterministic] failed',src);resolve(false)};
      (document.head||document.documentElement).appendChild(s);
    });
  }

  async function boot(){
    if(document.readyState==='loading'){
      await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
    }
    for(const src of SOURCES) await load(src);
    document.documentElement.dataset.luneaDeterministicReady='1';
    document.documentElement.classList.remove('lunea-booting');
    document.documentElement.classList.add('lunea-ui-ready');
    try{clearTimeout(W.__LUNEA_BOOT_FAILSAFE__)}catch{}
    W.dispatchEvent(new CustomEvent('lunea:deterministic-ready'));
  }

  boot().catch(err=>{
    console.error('[LUNEA deterministic]',err);
    document.documentElement.classList.remove('lunea-booting');
    document.documentElement.classList.add('lunea-ui-ready');
  });
})();
