'use strict';

/*
  LUNEA Cache Refresh V1
  Build-scoped hotfix loader + stale-build refresh.
*/
(() => {
  if (window.__LUNEA_CACHE_REFRESH_V1__) return;
  window.__LUNEA_CACHE_REFRESH_V1__ = true;

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

  function loadJournalHeaderFix() {
    loadBuildScopedScript('luneaJournalHeaderFixLoader', './lunea-journal-header-fix-v1.js', 'journal header fix');
  }
  function loadSectorCardBacks() {
    loadBuildScopedScript('luneaSectorCardBacksV20Loader', './lunea-cardback-sector-v20.js', 'uploaded sector card backs V20');
  }
  function loadTimingUploadedArt() {
    loadBuildScopedScript('luneaTimingUploadedArtV16Loader', './lunea-timing-image-assets-v16.js', 'Timing uploaded artwork V16');
  }
  function loadHoraryQuestionModes() {
    loadBuildScopedScript('luneaHoraryQuestionModesV37Loader', './lunea-horary-question-modes-v37.js', 'Horary question modes V37');
  }
  function loadHoraryHardening() {
    loadBuildScopedScript('luneaHoraryHardeningV38Loader', './lunea-horary-hardening-v38.js', 'Horary hardening V38');
  }
  function loadHoraryLocationButton() {
    loadBuildScopedScript('luneaHoraryLocationButtonV39Loader', './lunea-horary-location-button-v39.js', 'Horary location button V39');
  }
  function loadHoraryTraditionalCore() {
    loadBuildScopedScript('luneaHoraryTraditionalCoreV40Loader', './lunea-horary-traditional-core-v40.js', 'Horary Traditional Core V40');
  }
  function loadHoraryBalanceGuard() {
    loadBuildScopedScript('luneaHoraryBalanceGuardV41Loader', './lunea-horary-balance-guard-v41.js', 'Horary Balance Guard V41');
  }
  function loadHoraryMobileStability() {
    loadBuildScopedScript('luneaHoraryMobileStabilityV42Loader', './lunea-horary-mobile-stability-v42.js', 'Horary mobile stability V42');
  }

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
      const res = await fetch(`${BUILD_FILE}?t=${Date.now()}`, {
        cache: 'no-store', headers: {'cache-control':'no-cache'}
      });
      if (!res.ok) return;
      const data = await res.json();
      const remote = String(data?.version || '').trim();
      if (!remote) return;
      const embedded = currentPageBuild();
      if (embedded && embedded !== remote) refreshTo(remote);
    } catch (err) {
      console.info('[LUNEA cache refresh] skipped', err?.message || err);
    }
  }

  function boot() {
    loadJournalHeaderFix();
    loadSectorCardBacks();
    loadTimingUploadedArt();
    loadHoraryQuestionModes();
    loadHoraryHardening();
    loadHoraryLocationButton();
    loadHoraryTraditionalCore();
    loadHoraryBalanceGuard();
    loadHoraryMobileStability();
    checkBuild();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
