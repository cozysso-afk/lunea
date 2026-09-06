'use strict';

/* One-shot V58 retirement executed INSIDE the installed Home Screen web app.
   Cache Storage only; localStorage and IndexedDB are intentionally untouched. */
(() => {
  if (window.__LUNEA_V58_RETIRE_ONCE__) return;
  window.__LUNEA_V58_RETIRE_ONCE__ = true;
  (async () => {
    let hadLuneaCache = false;
    try {
      const keys = await caches.keys();
      const stale = keys.filter(k => k.startsWith('lunea-'));
      hadLuneaCache = stale.length > 0;
      await Promise.all(stale.map(k => caches.delete(k)));
    } catch {}
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          try { await reg.unregister(); } catch {}
        }
      }
    } catch {}
    if (hadLuneaCache && !/[?&]sw_retired=1(?:&|$)/.test(location.search)) {
      const u = new URL(location.href);
      u.searchParams.set('sw_retired','1');
      u.searchParams.set('t',String(Date.now()));
      location.replace(u.toString());
    }
  })();
})();

/*
  LUNEA Cache Refresh V1
  Build-scoped hotfix loader + stale-build refresh.
*/
(() => {
  if (window.__LUNEA_CACHE_REFRESH_V1__) return;
  window.__LUNEA_CACHE_REFRESH_V1__ = true;

  const W = window;
  const BUILD_FILE = './lunea-build.json';
  const SELF_BUILD = (() => {
    try {
      const src = document.currentScript?.src || '';
      return src ? (new URL(src, location.href).searchParams.get('v') || '') : '';
    } catch { return ''; }
  })();

  function currentPageBuild() {
    try {
      const script = [...document.scripts].find(s => /lunea-structural-routing-v4\.js/i.test(s.src || ''));
      if (!script?.src) return '';
      return new URL(script.src, location.href).searchParams.get('v') || '';
    } catch { return ''; }
  }

  function loadBuildScopedScript(id, src, label) {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = `${src}?v=${encodeURIComponent(SELF_BUILD || Date.now())}`;
    script.async = false;
    script.onerror = () => console.info(`[LUNEA cache refresh] ${label} skipped`);
    (document.head || document.documentElement).appendChild(script);
  }

  function loadRuntimeStateV55() { loadBuildScopedScript('luneaRuntimeStateV55Loader', './lunea-runtime-state-v55.js', 'runtime stale-state guard V55'); }
  function loadJournalHeaderFix() { loadBuildScopedScript('luneaJournalHeaderFixLoader', './lunea-journal-header-fix-v1.js', 'journal header fix'); }
  function loadJournalDetailV51() { loadBuildScopedScript('luneaJournalDetailV51Loader', './lunea-journal-detail-v51.js', 'Journal full-detail + toolbar V51'); }
  function loadSectorCardBacks() { loadBuildScopedScript('luneaSectorCardBacksV20Loader', './lunea-cardback-sector-v20.js', 'uploaded sector card backs V20.1'); }
  function loadTimingUploadedArt() { loadBuildScopedScript('luneaTimingUploadedArtV16Loader', './lunea-timing-image-assets-v16.js', 'Timing uploaded artwork V16'); }
  function loadDailyTimingPersistence() { loadBuildScopedScript('luneaDailyTimingV49Loader', './lunea-daily-timing-v49.js', 'Daily Timing persistence V49'); }
  function loadDraftTimingPersistence() { loadBuildScopedScript('luneaDraftTimingV50Loader', './lunea-draft-timing-v50.js', 'All-reading draft Timing persistence V50'); }
  function loadAstroRealWarmV53() { loadBuildScopedScript('luneaAstroRealWarmV53Loader', './lunea-astro-warm-v53.js', 'Astro real backend warm V53'); }
  function loadThaiDateCenterV54() { loadBuildScopedScript('luneaThaiDateCenterV54Loader', './lunea-thai-date-center-v54.js', 'Thai period date centering V54'); }
  function loadHoraryQuestionModes() { loadBuildScopedScript('luneaHoraryQuestionModesV37Loader', './lunea-horary-question-modes-v37.js', 'Horary question modes V37'); }
  function loadHoraryHardening() { loadBuildScopedScript('luneaHoraryHardeningV38Loader', './lunea-horary-hardening-v38.js', 'Horary hardening V38'); }
  function loadHoraryLocationButton() { loadBuildScopedScript('luneaHoraryLocationButtonV39Loader', './lunea-horary-location-button-v39.js', 'Horary location button V39'); }
  function loadHoraryTraditionalCore() { loadBuildScopedScript('luneaHoraryTraditionalCoreV40Loader', './lunea-horary-traditional-core-v40.js', 'Horary Traditional Core V40'); }
  function loadHoraryBalanceGuard() { loadBuildScopedScript('luneaHoraryBalanceGuardV41Loader', './lunea-horary-balance-guard-v41.js', 'Horary Balance Guard V41'); }
  function loadHoraryMobileStability() { loadBuildScopedScript('luneaHoraryMobileStabilityV42Loader', './lunea-horary-mobile-stability-v42.js', 'Horary mobile stability V42'); }

  function refreshTo(build) {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('lunea_v') === build) return;
      url.searchParams.set('lunea_v', build);
      url.searchParams.set('fresh', String(Date.now()));
      location.replace(url.toString());
    } catch { location.reload(); }
  }

  async function checkBuild() {
    try {
      const res = await fetch(`${BUILD_FILE}?t=${Date.now()}`, { cache:'no-store', headers:{'cache-control':'no-cache'} });
      if (!res.ok) return;
      const data = await res.json();
      const remote = String(data?.version || '').trim();
      if (!remote) return;
      const embedded = currentPageBuild();
      if (embedded && embedded !== remote) refreshTo(remote);
    } catch (err) { console.info('[LUNEA cache refresh] skipped', err?.message || err); }
  }

  function boot() {
    loadRuntimeStateV55(); loadJournalHeaderFix(); loadJournalDetailV51(); loadSectorCardBacks(); loadTimingUploadedArt();
    loadDailyTimingPersistence(); loadDraftTimingPersistence(); loadThaiDateCenterV54(); loadAstroRealWarmV53(); loadHoraryQuestionModes();
    loadHoraryHardening(); loadHoraryLocationButton(); loadHoraryTraditionalCore(); loadHoraryBalanceGuard(); loadHoraryMobileStability();
    if (W.__LUNEA_RENDER_CANONICAL__) {
      W.__LUNEA_BUILD_CHECK_DONE__ = true;
      console.info('[LUNEA cache refresh] canonical Render · runtime V55 watches future builds');
    } else checkBuild();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
