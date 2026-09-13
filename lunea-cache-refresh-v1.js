'use strict';

/*
  LUNEA Cache Refresh V1 · Pages V59
  - Build-scoped hotfix loader + stale-build refresh.
  - Loads V59 reading lifecycle synchronously while the page is still parsing.
  - Loads Pages-only Astro origin failover before the user can trigger Thai/Astro.
  - Loads hard reading-question state boundaries so old calculations cannot leak.
  - Loads the iOS Thai period date centering repair.
  - Loads V57 Transit / Horary / draft auxiliary reliability fixes without allowing
    its legacy global startSpread yield to become the reading entrypoint.
  - V58 repeated-AI wrapper is retired; V59 stabilizes the global lifecycle instead.
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

  function loadReadingLifecycleV59() {
    if (document.getElementById('luneaReadingLifecycleV59Loader')) return;
    const src = `./lunea-reading-lifecycle-v59.js?v=${encodeURIComponent(SELF_BUILD || '59')}`;
    if (document.readyState === 'loading') {
      document.write(`<script id="luneaReadingLifecycleV59Loader" src="${src}"><\/script>`);
      return;
    }
    loadBuildScopedScript('luneaReadingLifecycleV59Loader', './lunea-reading-lifecycle-v59.js', 'reading lifecycle V59');
  }

  function loadAstroOriginFailover() {
    loadBuildScopedScript('luneaAstroOriginFailoverV56Loader', './lunea-astro-origin-failover-v56.js', 'Pages Astro v2/legacy failover V56');
  }
  function loadRuntimeStateV56() {
    loadBuildScopedScript('luneaRuntimeStateV56Loader', './lunea-runtime-state-v56.js', 'reading/Astro stale-state boundary V56');
  }
  function loadThaiDateCenterV54() {
    loadBuildScopedScript('luneaThaiDateCenterV54Loader', './lunea-thai-date-center-v54.js', 'iOS Thai period date centering V54');
  }
  function loadHorizontalTouchStability() {
    loadBuildScopedScript('luneaHorizontalTouchStabilityV1Loader', './lunea-horizontal-touch-stability-v1.js', 'horizontal touch stability V1');
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
  function loadLearningAuthRecovery() {
    loadBuildScopedScript('luneaLearningAuthRecoveryV2Loader', './lunea-learning-auth-recovery-v2.js', 'learning auth recovery V2');
  }
  function loadEmergencyRepair() {
    // V56 already retries once against the alternate official Astro origin.
    // Pre-claim V43's older 3-attempt retry wrapper so one calculation cannot
    // fan out into up to six serial HTTP attempts on a transient Render error.
    W.__LUNEA_ASTRO_RETRY_V43__ = true;
    loadBuildScopedScript('luneaEmergencyRepairV43Loader', './lunea-emergency-repair-v43.js', 'emergency repair V43');
  }
  function loadMobileRuntimeFixesV57() {
    loadBuildScopedScript('luneaMobileRuntimeFixesV57Loader', './lunea-mobile-runtime-fixes-v57.js', 'mobile runtime fixes V57');
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
        cache:'no-store',
        headers:{'cache-control':'no-cache','accept':'application/json'}
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
    // Order matters: failover wraps fetch first; runtime boundary starts watching
    // the live reading before any user-triggered auxiliary calculation.
    loadAstroOriginFailover();
    loadRuntimeStateV56();
    loadThaiDateCenterV54();
    loadHorizontalTouchStability();

    loadJournalHeaderFix();
    loadSectorCardBacks();
    loadTimingUploadedArt();
    loadHoraryQuestionModes();
    loadHoraryHardening();
    loadHoraryLocationButton();
    loadHoraryTraditionalCore();
    loadHoraryBalanceGuard();
    loadHoraryMobileStability();
    loadLearningAuthRecovery();
    loadEmergencyRepair();
    loadMobileRuntimeFixesV57();
    checkBuild();
  }

  // Core reading entries and lifecycle stabilization are parser-time work. Do not
  // wait for DOMContentLoaded or a polling loop before the user can see them.
  loadReadingLifecycleV59();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
