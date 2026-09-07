'use strict';

/* LUNEA Timing Custom Safe V59
   Restores the uploaded Sep-05 artwork only for 001-040, where the uploaded
   files are unique JPGs. 041-060 stay on semantic PNGs until their historical
   mapping is repaired; this avoids the known mismatched/duplicate tail. */
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_CUSTOM_SAFE_V59__) return;
  W.__LUNEA_TIMING_CUSTOM_SAFE_V59__ = true;
  const VERSION = '20260907-v590';

  const indexFrom = img => {
    if (!(img instanceof HTMLImageElement)) return 0;
    const raw = `${img.getAttribute('src') || ''} ${img.currentSrc || ''} ${img.dataset?.luneaTimingAsset || ''} ${img.dataset?.luneaTimingAssetV16 || ''}`;
    const m = raw.match(/timing_(\d{3})/i);
    if (m) return Number(m[1]) || 0;
    const d = Number(img.dataset?.luneaTimingAsset || img.dataset?.luneaTimingAssetV16 || 0);
    return Number.isInteger(d) ? d : 0;
  };

  const customPath = n => `./timing_${String(n).padStart(3, '0')}.jpg?v=${VERSION}`;

  function upgrade(img) {
    const n = indexFrom(img);
    if (n < 1 || n > 40) return false;
    const wanted = customPath(n);
    const current = img.getAttribute('src') || '';
    if (!/timing_\d{3}\.jpg/i.test(current)) img.setAttribute('src', wanted);
    img.dataset.luneaTimingCustomSafeV59 = String(n);
    return true;
  }

  function upgradeAll(root = document) {
    const selector = '#timingOverlay img[src*="timing_" i],#luneaTimingABPanel img[src*="timing_" i],.timing-inline img[src*="timing_" i],img[data-lunea-timing-asset]';
    if (root instanceof HTMLImageElement) upgrade(root);
    root.querySelectorAll?.(selector).forEach(upgrade);
  }

  function addStyle() {
    if (document.getElementById('luneaTimingCustomSafeV59Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaTimingCustomSafeV59Style';
    s.textContent = `
      #timingOverlay img[data-lunea-timing-custom-safe-v59],
      #luneaTimingABPanel img[data-lunea-timing-custom-safe-v59],
      .timing-inline img[data-lunea-timing-custom-safe-v59]{
        display:block!important;opacity:1!important;visibility:visible!important;
        width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;
        filter:none!important
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function boot() {
    addStyle();
    upgradeAll();
    const root = document.documentElement;
    if (root && !root.__luneaTimingCustomSafeV59Observed) {
      root.__luneaTimingCustomSafeV59Observed = true;
      let queued = false;
      const schedule = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; upgradeAll(); });
      };
      new MutationObserver(records => {
        for (const record of records) {
          if (record.type === 'childList') for (const node of record.addedNodes || []) if (node?.nodeType === 1) upgradeAll(node);
          if (record.type === 'attributes' && record.target instanceof HTMLImageElement) upgrade(record.target);
        }
        schedule();
      }).observe(root, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
    }
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')) {
        setTimeout(upgradeAll, 20);
        setTimeout(upgradeAll, 160);
      }
    }, {passive:true});
    W.LUNEA_TIMING_CUSTOM_SAFE_V59 = Object.freeze({version:'59.0', upgradeAll});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
