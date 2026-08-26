'use strict';

/* Loader shim: preserves original Structural V4 blob and adds Manual Structure V1. */
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
    return;
  }

  loadSequential([
    './lunea-structural-routing-v4-base.js?v=412',
    './lunea-manual-structure-v1.js?v=101'
  ]).catch(err => console.error('[LUNEA Structural V4 loader]', err));
})();
