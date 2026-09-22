'use strict';

/*
  LUNEA Cache Refresh V1 · Pages V59.6
  - Loads the mobile interaction hotfix synchronously before Structural Routing.
  - Loads V59 reading lifecycle synchronously while the page is still parsing.
  - Loads Timing WEEKDAY preload synchronously before the legacy Timing core.
  - Loads Pages-only Astro origin failover before user-triggered Thai/Astro work.
  - Loads question-boundary, iOS and auxiliary reliability modules.
  - Restores the active tarot reading after closing Horary support.
  - V58 repeated-AI wrapper is retired.
  - V57.1 no longer owns startSpread, so no compatibility marker suppression exists.
*/
(() => {
  if (window.__LUNEA_CACHE_REFRESH_V1__) return;
  window.__LUNEA_CACHE_REFRESH_V1__ = true;

  const W = window;
  const BUILD_FILE = './lunea-build.json';
  let pendingRefresh = null;
  let checkPromise = null;
  let lastCheckAt = 0;
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

  function loadMobileInteractionHotfixV1() {
    if (document.getElementById('luneaMobileInteractionHotfixV1Loader')) return;
    const src = `./lunea-mobile-interaction-hotfix-v1.js?v=${encodeURIComponent(SELF_BUILD || 'mih-v1')}`;
    if (document.readyState === 'loading') {
      document.write(`<script id="luneaMobileInteractionHotfixV1Loader" src="${src}"><\/script>`);
      return;
    }
    loadBuildScopedScript('luneaMobileInteractionHotfixV1Loader', './lunea-mobile-interaction-hotfix-v1.js', 'mobile interaction hotfix V1');
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

  function loadTimingWeekdayPreloadV1() {
    if (document.getElementById('luneaTimingWeekdayPreloadV1Loader')) return;
    const src = `./lunea-timing-weekday-preload-v1.js?v=${encodeURIComponent(SELF_BUILD || 'weekday-v1')}`;
    if (document.readyState === 'loading') {
      document.write(`<script id="luneaTimingWeekdayPreloadV1Loader" src="${src}"><\/script>`);
      return;
    }
    loadBuildScopedScript('luneaTimingWeekdayPreloadV1Loader', './lunea-timing-weekday-preload-v1.js', 'Timing WEEKDAY preload V1');
  }

  function loadAstroRequestV1() {
    loadBuildScopedScript('luneaAstroRequestV1Loader', './lunea-astro-request-v1.js', 'bounded Astro request owner V1');
  }
  function loadAstroOriginFailover() {
    loadBuildScopedScript('luneaAstroOriginFailoverV57Loader', './lunea-astro-origin-failover-v57.js', 'Pages Astro single-calculation failover V57');
  }
  function loadTransitRequestV1() {
    loadBuildScopedScript('luneaTransitRequestV1Loader', './lunea-transit-request-v1.js', 'bounded Transit request V1');
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
  function loadHoraryReturnStack() {
    loadBuildScopedScript('luneaHoraryReturnStackV1Loader', './lunea-horary-return-stack-v1.js', 'Horary return stack V1');
  }
  function loadLearningAuthRecovery() {
    loadBuildScopedScript('luneaLearningAuthRecoveryV2Loader', './lunea-learning-auth-recovery-v2.js', 'learning auth recovery V2');
  }
  function loadEmergencyRepair() {
    W.__LUNEA_ASTRO_RETRY_V43__ = true;
    loadBuildScopedScript('luneaEmergencyRepairV43Loader', './lunea-emergency-repair-v43.js', 'emergency repair V43');
  }
  function loadMobileRuntimeFixesV57() {
    loadBuildScopedScript('luneaMobileRuntimeFixesV57Loader', './lunea-mobile-runtime-fixes-v57.js', 'mobile runtime fixes V57.1');
  }
  function loadUiRegressionFinalV2() {
    loadBuildScopedScript('luneaUiRegressionFinalV2Loader', './lunea-ui-regression-final-v2.js', 'final mobile UI regression owner V2');
  }
  function loadMessageOracleHomeV1() {
    loadBuildScopedScript('luneaMessageOracleHomeV1Loader', './lunea-message-oracle-home-v1.js', 'Message Oracle standalone Home V1');
  }
  function loadReadingShareV1() {
    loadBuildScopedScript('luneaReadingShareV1Loader', './lunea-reading-share-v1.js', 'reading 4:5 PNG share V1');
  }

  function readingBusy(){return !!document.hidden||!!document.getElementById('spreadOverlay')?.classList.contains('show')||!!document.getElementById('sheet')?.classList.contains('open')}
  function refreshTo(build) {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('lunea_v') === build) return;
      url.searchParams.set('lunea_v', build);
      url.searchParams.set('fresh', String(Date.now()));
      location.replace(url.toString());
    } catch { location.reload(); }
  }

  function queueRefresh(build){if(!build)return false;if(readingBusy()){pendingRefresh={build};return false}pendingRefresh=null;refreshTo(build);return true}
  function flushPending(){if(!pendingRefresh||readingBusy())return false;const next=pendingRefresh;pendingRefresh=null;refreshTo(next.build);return true}

  function checkBuild(options={}) {
    const forceCheck=!!options.forceRefresh,now=Date.now();
    if(checkPromise)return checkPromise;
    if(!forceCheck&&now-lastCheckAt<1500)return Promise.resolve(false);
    lastCheckAt=now;
    checkPromise=(async()=>{try {
      const res = await fetch(`${BUILD_FILE}?t=${Date.now()}`, {
        cache:'no-store',
        headers:{'cache-control':'no-cache','accept':'application/json'}
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.error) return false;
      const remote = String(data?.version || '').trim();
      if (!remote) return false;
      const embedded = currentPageBuild();
      if (embedded && embedded !== remote) queueRefresh(remote);
      return true;
    } catch (err) {
      console.info('[LUNEA cache refresh] skipped', err?.message || err);
      return false;
    }finally{checkPromise=null}})();
    return checkPromise;
  }

  function installResumeBuildChecks(){window.addEventListener('pageshow',()=>{checkBuild();flushPending()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkBuild();flushPending()}});for(const id of ['spreadOverlay','sheet']){const el=document.getElementById(id);if(el)new MutationObserver(flushPending).observe(el,{attributes:true,attributeFilter:['class']})}}
  function requestFreshDocument(){return checkBuild({forceRefresh:true})}

  function boot() {
    loadAstroRequestV1();
    loadAstroOriginFailover();
    loadTransitRequestV1();
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
    loadHoraryReturnStack();
    loadLearningAuthRecovery();
    loadEmergencyRepair();
    loadMobileRuntimeFixesV57();
    loadUiRegressionFinalV2();
    loadMessageOracleHomeV1();
    loadReadingShareV1();
    installResumeBuildChecks();
    checkBuild();
    W.LUNEA_CACHE_REFRESH_V1=Object.freeze({checkNow:checkBuild,requestFreshDocument,flushPending});
  }

  // Parser-time owners must be in place before the structural/timing scripts
  // that follow this loader in index.html.
  loadMobileInteractionHotfixV1();
  loadReadingLifecycleV59();
  loadTimingWeekdayPreloadV1();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();