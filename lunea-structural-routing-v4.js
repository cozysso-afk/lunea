'use strict';

/* Loader shim: luminous silver-lavender UI theme + screenshot-refined mobile layout + final opal polish + top spacing polish + shared dynamic Gemini model picker + full reading-flow redesign + one-draw-per-day DAILY ORBIT lock + safe slower tarot flip / Moon Dial timing redesign + celestial-object home portal + final home/timing polish + category artwork thumbnails + mobile reading action/timing-card usability + opal moonlight reading polish + reading readability/A-B symmetry repair + unified Timing Moon Dial visuals + persistent A/B Timing inline results + static PNG Home Screen icon + sequential whole-reading reveal + Structural V4 + Manual Spread + reusable library + last-reading recovery + reading journal/verification + question casebook/web patterns/ranker + local user-correction learning + optional private cloud learning sync + AI question preflight/preview + extended Transit range + resumable long Transit runner + Astro calculation queue + iOS sheet scroll fix + all-category manual entry + Horary multi-target guard + A/B Timing Oracle + final Timing prompt repair + final evidence/Saju prompt priority + manual spreads up to 20 cards + single Horary Balance V3 bridge V19.4 + category tarot card-back restore V19 + universal category AI spread studio / opal light V20 + post-draw learning success gate + six-axis DAILY ORBIT / weekday trading V21 + cinematic celestial Daily home V22 + persistent Transit/Return auto-resume V23 + standalone Thai Maha Taksa home V24 + generated Thai celestial artwork V25 + small-tile Thai artwork polish V26 + mobile long-question / journal visual repair V27 + subtle sector color identity V28 + flicker-free boot reveal V29 + fixed-spread depth V30.3 + final GENERAL priority order V30.5. */
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
    document.write('<script src="./lunea-top-spacing-v4.js?v=401"><\/script>');
    document.write('<script src="./lunea-gemini-model-picker-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-structural-routing-v4-base.js?v=412"><\/script>');
    document.write('<script src="./lunea-manual-structure-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-manual-everywhere-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-manual-library-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-reading-draft-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-reading-journal-v2.js?v=201"><\/script>');
    document.write('<script src="./lunea-flip-all-fix-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-question-casebook-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-question-casebook-web-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-question-casebook-ranker-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-user-spread-learning-v1.js?v=106"><\/script>');
    document.write('<script src="./lunea-learning-cloud-sync-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-ai-spread-preflight-v2.js?v=103"><\/script>');
    document.write('<script src="./lunea-reading-flow-v5.js?v=501"><\/script>');
    document.write('<script src="./lunea-transit-range-v1.js?v=103"><\/script>');
    document.write('<script src="./lunea-transit-long-run-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-astro-job-queue-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-sheet-scroll-fix-v1.js?v=106"><\/script>');
    document.write('<script src="./lunea-horary-ab-v1.js?v=104"><\/script>');
    document.write('<script src="./lunea-timing-ab-v1.js?v=102"><\/script>');
    document.write('<script src="./lunea-timing-prompt-repair-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-final-prompt-priority-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-daily-lock-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-card-motion-timing-v7.js?v=701"><\/script>');
    document.write('<script src="./lunea-home-portal-v8.js?v=801"><\/script>');
    document.write('<script src="./lunea-home-timing-polish-v9.js?v=901"><\/script>');
    document.write('<script src="./lunea-category-art-v10.js?v=1001"><\/script>');
    document.write('<script src="./lunea-mobile-reading-controls-v12.js?v=1201"><\/script>');
    document.write('<script src="./lunea-opal-light-polish-v13.js?v=1301"><\/script>');
    document.write('<script src="./lunea-reading-polish-v14.js?v=1401"><\/script>');
    document.write('<script src="./lunea-timing-moondial-sync-v15.js?v=1501"><\/script>');
    document.write('<script src="./lunea-timing-ab-inline-v16.js?v=1601"><\/script>');
    document.write('<script src="./lunea-manual-limit20-v17.js?v=1702"><\/script>');
    document.write('<script src="./lunea-horary-balance-v19-4.js?v=1904"><\/script>');
    document.write('<script src="./lunea-cardback-restore-v19.js?v=1901"><\/script>');
    document.write('<script src="./lunea-universal-ai-opal-v20.js?v=2002"><\/script>');
    document.write('<script src="./lunea-learning-success-gate-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-daily-orbit6-v21.js?v=2101"><\/script>');
    document.write('<script src="./lunea-daily-celestial-v22.js?v=2201"><\/script>');
    document.write('<script src="./lunea-astro-resume-v23.js?v=2301"><\/script>');
    document.write('<script src="./lunea-thai-standalone-v24.js?v=2401"><\/script>');
    document.write('<script src="./lunea-thai-art-v25.js?v=2501"><\/script>');
    document.write('<script src="./lunea-thai-art-polish-v26.js?v=2601"><\/script>');
    document.write('<script src="./lunea-mobile-journal-polish-v27.js?v=2701"><\/script>');
    document.write('<script src="./lunea-sector-color-system-v28.js?v=2801"><\/script>');
    document.write('<script src="./lunea-fixed-spread-depth-v30.js?v=3003"><\/script>');
    document.write('<script src="./lunea-general-order-v30-5.js?v=3005"><\/script>');
    document.write('<script src="./lunea-boot-reveal-v29.js?v=2902"><\/script>');
    return;
  }

  loadSequential([
    './lunea-luminous-theme-v1.js?v=101',
    './lunea-luminous-layout-v2.js?v=201',
    './lunea-luminous-polish-v3.js?v=301',
    './lunea-top-spacing-v4.js?v=401',
    './lunea-gemini-model-picker-v1.js?v=101',
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-manual-structure-v1.js?v=102',
    './lunea-manual-everywhere-v1.js?v=101',
    './lunea-manual-library-v1.js?v=101',
    './lunea-reading-draft-v1.js?v=101',
    './lunea-reading-journal-v2.js?v=201',
    './lunea-flip-all-fix-v1.js?v=102',
    './lunea-question-casebook-v1.js?v=101',
    './lunea-question-casebook-web-v1.js?v=101',
    './lunea-question-casebook-ranker-v1.js?v=101',
    './lunea-user-spread-learning-v1.js?v=106',
    './lunea-learning-cloud-sync-v1.js?v=102',
    './lunea-ai-spread-preflight-v2.js?v=103',
    './lunea-reading-flow-v5.js?v=501',
    './lunea-transit-range-v1.js?v=103',
    './lunea-transit-long-run-v1.js?v=102',
    './lunea-astro-job-queue-v1.js?v=101',
    './lunea-sheet-scroll-fix-v1.js?v=106',
    './lunea-horary-ab-v1.js?v=104',
    './lunea-timing-ab-v1.js?v=102',
    './lunea-timing-prompt-repair-v1.js?v=101',
    './lunea-final-prompt-priority-v1.js?v=101',
    './lunea-daily-lock-v1.js?v=101',
    './lunea-card-motion-timing-v7.js?v=701',
    './lunea-home-portal-v8.js?v=801',
    './lunea-home-timing-polish-v9.js?v=901',
    './lunea-category-art-v10.js?v=1001',
    './lunea-mobile-reading-controls-v12.js?v=1201',
    './lunea-opal-light-polish-v13.js?v=1301',
    './lunea-reading-polish-v14.js?v=1401',
    './lunea-timing-moondial-sync-v15.js?v=1501',
    './lunea-timing-ab-inline-v16.js?v=1601',
    './lunea-manual-limit20-v17.js?v=1702',
    './lunea-horary-balance-v19-4.js?v=1904',
    './lunea-cardback-restore-v19.js?v=1901',
    './lunea-universal-ai-opal-v20.js?v=2002',
    './lunea-learning-success-gate-v1.js?v=101',
    './lunea-daily-orbit6-v21.js?v=2101',
    './lunea-daily-celestial-v22.js?v=2201',
    './lunea-astro-resume-v23.js?v=2301',
    './lunea-thai-standalone-v24.js?v=2401',
    './lunea-thai-art-v25.js?v=2501',
    './lunea-thai-art-polish-v26.js?v=2601',
    './lunea-mobile-journal-polish-v27.js?v=2701',
    './lunea-sector-color-system-v28.js?v=2801',
    './lunea-fixed-spread-depth-v30.js?v=3003',
    './lunea-general-order-v30-5.js?v=3005',
    './lunea-boot-reveal-v29.js?v=2902'
  ]).catch(err => console.error('[LUNEA Structural V4 loader]', err));
})();
