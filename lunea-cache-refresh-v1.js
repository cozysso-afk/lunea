'use strict';

/*
  LUNEA Cache Refresh V1
  Build-scoped hotfix loader + stale-build refresh.
*/
(() => {
  if (window.__LUNEA_CACHE_REFRESH_V1__) return;
  window.__LUNEA_CACHE_REFRESH_V1__ = true;

  const W = window;
  const IS_NETLIFY = /\.netlify\.app$/i.test(location.hostname);
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

  function loadNetlifyAstroRouteV57() {
    if (IS_NETLIFY) loadBuildScopedScript('luneaNetlifyAstroRouteV57Loader', './lunea-netlify-astro-route-v57.js', 'Netlify Astro proxy route V57');
  }
  function loadBootRevealV29() {
    loadBuildScopedScript('luneaBootRevealV29Loader', './lunea-boot-reveal-v29.js', 'current UI boot reveal V29');
  }
  function loadRuntimeStateV55() {
    loadBuildScopedScript('luneaRuntimeStateV55Loader', './lunea-runtime-state-v55.js', 'runtime stale-state guard V55');
  }
  function loadJournalHeaderFix() {
    loadBuildScopedScript('luneaJournalHeaderFixLoader', './lunea-journal-header-fix-v1.js', 'journal header fix');
  }
  function loadJournalDetailV51() {
    loadBuildScopedScript('luneaJournalDetailV51Loader', './lunea-journal-detail-v51.js', 'Journal full-detail + toolbar V51');
  }
  function loadSectorCardBacks() {
    loadBuildScopedScript('luneaSectorCardBacksV20Loader', './lunea-cardback-sector-v20.js', 'uploaded sector card backs V20.1');
  }
  function loadTimingUploadedArt() {
    loadBuildScopedScript('luneaTimingUploadedArtV16Loader', './lunea-timing-image-assets-v16.js', 'Timing uploaded artwork V16');
  }
  function loadDailyTimingPersistence() {
    loadBuildScopedScript('luneaDailyTimingV49Loader', './lunea-daily-timing-v49.js', 'Daily Timing persistence V49');
  }
  function loadDraftTimingPersistence() {
    loadBuildScopedScript('luneaDraftTimingV50Loader', './lunea-draft-timing-v50.js', 'All-reading draft Timing persistence V50');
  }
  function loadAstroRealWarmV53() {
    loadBuildScopedScript('luneaAstroRealWarmV53Loader', './lunea-astro-warm-v53.js', 'Astro real backend warm V53');
  }
  function loadThaiDateDisplayV57() {
    loadBuildScopedScript('luneaThaiDateDisplayV57Loader', './lunea-thai-date-display-v57.js', 'Thai centered date display V57');
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
    loadNetlifyAstroRouteV57();
    loadBootRevealV29();
    loadRuntimeStateV55();
    loadJournalHeaderFix();
    loadJournalDetailV51();
    loadSectorCardBacks();
    loadTimingUploadedArt();
    loadDailyTimingPersistence();
    loadDraftTimingPersistence();
    loadThaiDateDisplayV57();
    loadAstroRealWarmV53();
    loadHoraryQuestionModes();
    loadHoraryHardening();
    loadHoraryLocationButton();
    loadHoraryTraditionalCore();
    loadHoraryBalanceGuard();
    loadHoraryMobileStability();

    if (W.__LUNEA_RENDER_CANONICAL__ || IS_NETLIFY) {
      W.__LUNEA_BUILD_CHECK_DONE__ = true;
      console.info(`[LUNEA cache refresh] ${IS_NETLIFY ? 'Netlify stable runtime' : 'canonical Render'} · no forced refresh`);
    } else {
      checkBuild();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
