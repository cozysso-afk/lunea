'use strict';

/* LUNEA Structural V4 — V57 deterministic host order
   One current-home chain first, then feature layers. No service worker. */
(() => {
  if (window.__LUNEA_STRUCTURAL_V4_LOADER__) return;
  window.__LUNEA_STRUCTURAL_V4_LOADER__ = true;

  const CURRENT_HOME = [
    './lunea-luminous-theme-v1.js?v=101',
    './lunea-luminous-layout-v2.js?v=201',
    './lunea-luminous-polish-v3.js?v=301',
    './lunea-top-spacing-v4.js?v=401',
    './lunea-astro-origin-failover-v57.js?v=5701',
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-daily-lock-v1.js?v=101',
    './lunea-card-motion-timing-v7.js?v=701',
    './lunea-home-portal-v8.js?v=801',
    './lunea-home-portal-minfix-v57.js?v=5701',
    './lunea-home-timing-polish-v9.js?v=901',
    './lunea-category-art-v10.js?v=1001',
    './lunea-daily-orbit6-v21.js?v=2101',
    './lunea-daily-orbit6-bootfix-v57.js?v=5701',
    './lunea-daily-orbit6-fix-v57.js?v=5701',
    './lunea-daily-celestial-v22.js?v=2201',
    './lunea-sector-color-system-v28.js?v=2801',
    './lunea-boot-reveal-v29.js?v=2903'
  ];

  const REST = [
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

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function loadOne(src) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const ok = await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = src + (src.includes('?') ? '&' : '?') + 'boot=' + Date.now() + '-' + attempt;
        script.async = false;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        (document.head || document.documentElement).appendChild(script);
      });
      if (ok) return true;
      if (attempt < 2) await sleep(120);
    }
    console.warn('[LUNEA Structural V4] skipped after retry', src);
    return false;
  }

  async function loadSequential(sources) {
    for (const src of sources) await loadOne(src);
  }

  function boot() {
    loadSequential([...CURRENT_HOME, ...REST]).catch(err => console.error('[LUNEA Structural V4 loader]', err));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
