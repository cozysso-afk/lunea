'use strict';

/* Loader shim: luminous silver-lavender UI theme + screenshot-refined mobile layout + final opal polish + Structural V4 + Manual Spread + reusable library + last-reading recovery + whole-reading flip fix + question casebook/web patterns/ranker + local user-correction learning + AI question preflight/preview + extended Transit range + resumable long Transit runner + Astro calculation queue + iOS sheet scroll fix + all-category manual entry + Horary multi-target guard + A/B Timing Oracle + final Timing prompt repair + final evidence/Saju prompt priority. */
(() => {
  const loadSequential = (sources) => sources.reduce((p, src) => p.then(() => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  })), Promise.resolve());

  if (document.readyState === 'loading') {
    document.write('<script src="./lunea-luminous-theme-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-luminous-layout-v2.js?v=201"><\/script>');
    document.write('<script src="./lunea-luminous-polish-v3.js?v=301"><\/script>');
    document.write('<script src="./lunea-structural-routing-v4-base.js?v=412"><\/script>');
    document.write('<script src="./lunea-manual-structure-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-manual-everywhere-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-manual-library-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-reading-draft-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-flip-all-fix-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-question-casebook-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-question-casebook-web-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-question-casebook-ranker-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-user-spread-learning-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-ai-spread-preflight-v2.js?v=101"><\/script>');
    document.write('<script src="./lunea-transit-range-v1.js?v=103"><\/script>');
    document.write('<script src="./lunea-transit-long-run-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-astro-job-queue-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-sheet-scroll-fix-v1.js?v=105"><\/script>');
    document.write('<script src="./lunea-horary-ab-v1.js?v=104"><\/script>');
    document.write('<script src="./lunea-timing-ab-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-timing-prompt-repair-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-final-prompt-priority-v1.js?v=101"><\/script>');
    return;
  }

  loadSequential([
    './lunea-luminous-theme-v1.js?v=101',
    './lunea-luminous-layout-v2.js?v=201',
    './lunea-luminous-polish-v3.js?v=301',
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-manual-structure-v1.js?v=101',
    './lunea-manual-everywhere-v1.js?v=101',
    './lunea-manual-library-v1.js?v=101',
    './lunea-reading-draft-v1.js?v=101',
    './lunea-flip-all-fix-v1.js?v=101',
    './lunea-question-casebook-v1.js?v=101',
    './lunea-question-casebook-web-v1.js?v=101',
    './lunea-question-casebook-ranker-v1.js?v=101',
    './lunea-user-spread-learning-v1.js?v=102',
    './lunea-ai-spread-preflight-v2.js?v=101',
    './lunea-transit-range-v1.js?v=103',
    './lunea-transit-long-run-v1.js?v=102',
    './lunea-astro-job-queue-v1.js?v=101',
    './lunea-sheet-scroll-fix-v1.js?v=105',
    './lunea-horary-ab-v1.js?v=104',
    './lunea-timing-ab-v1.js?v=102',
    './lunea-timing-prompt-repair-v1.js?v=101',
    './lunea-final-prompt-priority-v1.js?v=101'
  ]).catch(err => console.error('[LUNEA Structural V4 loader]', err));
})();
