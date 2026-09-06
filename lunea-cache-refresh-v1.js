'use strict';

/* LUNEA Cache Refresh V1 — stable-host V57 loader.
   Vercel/Netlify/Render canonical builds do not force a post-paint navigation. */
(() => {
  if(window.__LUNEA_CACHE_REFRESH_V1__)return;
  window.__LUNEA_CACHE_REFRESH_V1__=true;
  const W=window;
  const STABLE_HOST=/\.vercel\.app$/i.test(location.hostname)||/\.netlify\.app$/i.test(location.hostname)||!!W.__LUNEA_RENDER_CANONICAL__;
  const BUILD_FILE='./lunea-build.json';
  const SELF_BUILD=(()=>{try{const src=document.currentScript?.src||'';return src?(new URL(src,location.href).searchParams.get('v')||''):''}catch{return''}})();

  function currentPageBuild(){try{const s=[...document.scripts].find(x=>/lunea-structural-routing-v4\.js/i.test(x.src||''));return s?.src?(new URL(s.src,location.href).searchParams.get('v')||''):''}catch{return''}}
  function load(id,src,label){
    if(document.getElementById(id))return;
    const s=document.createElement('script');s.id=id;s.src=`${src}?v=${encodeURIComponent(SELF_BUILD||Date.now())}`;s.async=false;
    s.onerror=()=>console.info(`[LUNEA V57] ${label} skipped`);(document.head||document.documentElement).appendChild(s);
  }
  function refreshTo(build){try{const u=new URL(location.href);if(u.searchParams.get('lunea_v')===build)return;u.searchParams.set('lunea_v',build);u.searchParams.set('fresh',String(Date.now()));location.replace(u.toString())}catch{location.reload()}}
  async function checkBuild(){try{const r=await fetch(`${BUILD_FILE}?t=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache'}});if(!r.ok)return;const d=await r.json();const remote=String(d?.version||'').trim();const embedded=currentPageBuild();if(remote&&embedded&&embedded!==remote)refreshTo(remote)}catch(e){console.info('[LUNEA cache refresh] skipped',e?.message||e)}}

  function boot(){
    load('luneaAstroOriginFailoverV57Loader','./lunea-astro-origin-failover-v57.js','Astro origin failover V57');
    load('luneaRuntimeStateV55Loader','./lunea-runtime-state-v55.js','runtime stale-state guard V55');
    load('luneaJournalHeaderFixLoader','./lunea-journal-header-fix-v1.js','journal header fix');
    load('luneaJournalDetailV51Loader','./lunea-journal-detail-v51.js','Journal detail V51');
    load('luneaSectorCardBacksV20Loader','./lunea-cardback-sector-v20.js','sector card backs V20');
    load('luneaTimingUploadedArtV16Loader','./lunea-timing-image-assets-v16.js','Timing visual guard V16');
    load('luneaTimingUploadedArtV57Loader','./lunea-timing-uploaded-art-v57.js','Timing uploaded artwork V57');
    load('luneaDailyTimingV49Loader','./lunea-daily-timing-v49.js','Daily Timing persistence V49');
    load('luneaDraftTimingV50Loader','./lunea-draft-timing-v50.js','draft Timing persistence V50');
    load('luneaThaiDateDisplayV57Loader','./lunea-thai-date-display-v57.js','Thai centered date display V57');
    load('luneaAstroRealWarmV53Loader','./lunea-astro-warm-v53.js','Astro backend warm V53');
    load('luneaAstroJobQueueV56Loader','./lunea-astro-job-queue-v56.js','Astro Job Queue V56');
    load('luneaHoraryQuestionModesV37Loader','./lunea-horary-question-modes-v37.js','Horary modes V37');
    load('luneaHoraryHardeningV38Loader','./lunea-horary-hardening-v38.js','Horary hardening V38');
    load('luneaHoraryLocationButtonV39Loader','./lunea-horary-location-button-v39.js','Horary location V39');
    load('luneaHoraryTraditionalCoreV40Loader','./lunea-horary-traditional-core-v40.js','Horary core V40');
    load('luneaHoraryBalanceGuardV41Loader','./lunea-horary-balance-guard-v41.js','Horary balance V41');
    load('luneaHoraryMobileStabilityV42Loader','./lunea-horary-mobile-stability-v42.js','Horary mobile V42');
    if(STABLE_HOST){W.__LUNEA_BUILD_CHECK_DONE__=true;console.info('✦ LUNEA V57 stable host · no forced post-paint refresh')}else checkBuild();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
