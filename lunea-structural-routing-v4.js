'use strict';

/* Loader shim: Structural V4 + Manual Spread + reusable library + iOS sheet scroll fix + all-category manual entry + Horary multi-target guard + A/B Timing Oracle. */
(() => {
  const loadSequential = (sources) => sources.reduce((p, src) => p.then(() => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  })), Promise.resolve());

  if (document.readyState === 'loading') {
    document.write('<script src="./lunea-structural-routing-v4-base.js?v=412"><\/script>');
    document.write('<script src="./lunea-manual-structure-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-manual-everywhere-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-manual-library-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-sheet-scroll-fix-v1.js?v=101"><\/script>');
    document.write('<script src="./lunea-horary-ab-v1.js?v=103"><\/script>');
    document.write('<script src="./lunea-timing-ab-v1.js?v=101"><\/script>');
    return;
  }

  loadSequential([
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-manual-structure-v1.js?v=101',
    './lunea-manual-everywhere-v1.js?v=101',
    './lunea-manual-library-v1.js?v=101',
    './lunea-sheet-scroll-fix-v1.js?v=101',
    './lunea-horary-ab-v1.js?v=103',
    './lunea-timing-ab-v1.js?v=101'
  ]).catch(err => console.error('[LUNEA Structural V4 loader]', err));
})();
