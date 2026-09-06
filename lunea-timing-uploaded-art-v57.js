'use strict';

/* LUNEA TIMING SEMANTIC ART V57.2
   The semantic PNG files are authoritative. Never downgrade them to timing_###.jpg/PNG. */
(() => {
  const W=window;
  if(W.__LUNEA_TIMING_UPLOADED_ART_V57__)return;
  W.__LUNEA_TIMING_UPLOADED_ART_V57__=true;
  const VERSION='20260906-semantic-v572';
  const FILES=[
    'timing_001_near_now.png','timing_002_within_hours.png','timing_003_within_today.png','timing_004_tonight.png','timing_005_around_24h.png','timing_006_2_3_days.png','timing_007_4_5_days.png','timing_008_this_week.png','timing_009_7_10_days.png','timing_010_around_2_weeks.png',
    'timing_011_around_3_weeks.png','timing_012_around_1_month.png','timing_013_4_6_weeks.png','timing_014_early_next_week.png','timing_015_late_next_week.png','timing_016_weekend_window.png','timing_017_dawn.png','timing_018_early_morning.png','timing_019_morning.png','timing_020_noon.png',
    'timing_021_afternoon.png','timing_022_late_afternoon.png','timing_023_dusk.png','timing_024_evening.png','timing_025_late_night.png','timing_026_after_midnight.png','timing_027_early_spring.png','timing_028_late_spring.png','timing_029_early_summer.png','timing_030_late_summer.png',
    'timing_031_early_autumn.png','timing_032_late_autumn.png','timing_033_early_winter.png','timing_034_late_winter.png','timing_035_month_start.png','timing_036_month_middle.png','timing_037_month_end.png','timing_038_season_turn.png','timing_039_1_2_months.png','timing_040_2_3_months.png',
    'timing_041_3_4_months.png','timing_042_4_5_months.png','timing_043_5_6_months.png','timing_044_6_8_months.png','timing_045_8_10_months.png','timing_046_10_12_months.png','timing_047_within_a_year.png','timing_048_around_one_year.png','timing_049_12_18_months.png','timing_050_1_5_2_years.png',
    'timing_051_2_3_years.png','timing_052_3_5_years.png','timing_053_distant_future.png','timing_054_not_yet.png','timing_055_conditions_first.png','timing_056_later_than_expected.png','timing_057_outside_window.png','timing_058_weak_event_signal.png','timing_059_timing_unclear.png','timing_060_window_passed.png'
  ];
  const semanticPath=n=>Number.isInteger(n)&&n>=1&&n<=60?`./${FILES[n-1]}?v=${VERSION}`:'';
  function indexFrom(img){
    if(!(img instanceof HTMLImageElement))return null;
    const raw=`${img.getAttribute('src')||''} ${img.currentSrc||''} ${img.dataset?.luneaTimingAsset||''} ${img.dataset?.luneaTimingAssetV16||''}`;
    const m=raw.match(/timing_(\d{3})/i);if(m){const n=Number(m[1]);if(Number.isInteger(n)&&n>=1&&n<=60)return n}
    const d=Number(img.dataset?.luneaTimingAsset||img.dataset?.luneaTimingAssetV16||0);return Number.isInteger(d)&&d>=1&&d<=60?d:null;
  }
  function isCorrect(raw,n){try{return new URL(raw,document.baseURI).pathname.toLowerCase().endsWith('/'+FILES[n-1].toLowerCase())}catch{return false}}
  function upgrade(img){
    const n=indexFrom(img);if(!n)return false;
    img.dataset.luneaTimingAsset=String(n);img.dataset.luneaTimingAssetV57=String(n);
    const raw=img.getAttribute('src')||'';if(!isCorrect(raw,n))img.setAttribute('src',semanticPath(n));return true;
  }
  function upgradeNode(node){if(!(node instanceof Element))return;if(node instanceof HTMLImageElement)upgrade(node);node.querySelectorAll?.('#timingOverlay img[src*="timing_" i],#luneaTimingABPanel img[src*="timing_" i],.timing-inline img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(upgrade)}
  function upgradeAll(){document.querySelectorAll('#timingOverlay img[src*="timing_" i],#luneaTimingABPanel img[src*="timing_" i],.timing-inline img[src*="timing_" i],img[data-lunea-timing-asset]').forEach(upgrade)}
  function addStyle(){if(document.getElementById('luneaTimingUploadedArtV57Style'))return;const s=document.createElement('style');s.id='luneaTimingUploadedArtV57Style';s.textContent=`
    #timingOverlay .timing-front{overflow:hidden!important;background:#090b18!important}
    #timingOverlay .timing-front>img,#luneaTimingABPanel .tab-card>img,.timing-inline img,img[data-lunea-timing-asset-v57]{display:block!important;opacity:1!important;visibility:visible!important;object-fit:cover!important;object-position:center!important;filter:none!important}
    #timingOverlay .timing-front>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:9!important;border:0!important}
    #timingOverlay .lunea-v7-time-art,#timingOverlay .lunea-v15-time-art,#luneaTimingABPanel .lunea-v7-time-art,#luneaTimingABPanel .lunea-v15-time-art{display:none!important}
    #timingOverlay .timing-card-label{display:none!important}`;(document.head||document.documentElement).appendChild(s)}
  function boot(){
    addStyle();upgradeAll();const root=document.documentElement;
    if(root&&!root.__luneaTimingSemanticV572Observed){root.__luneaTimingSemanticV572Observed=true;let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;upgradeAll()})};new MutationObserver(records=>{for(const r of records){if(r.type==='childList')for(const n of r.addedNodes||[])upgradeNode(n);if(r.type==='attributes'&&r.target instanceof HTMLImageElement)upgrade(r.target)}schedule()}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src']})}
    document.addEventListener('click',e=>{if(e.target?.closest?.('#timingDraw,#timingRefine,#timingSupportBtn,#luneaTimingABPanel')){setTimeout(upgradeAll,20);setTimeout(upgradeAll,140)}},{passive:true});
    W.LUNEA_TIMING_UPLOADED_ART_V57=Object.freeze({version:'57.2',semanticPath,upgradeAll});console.info('🕰 LUNEA Timing semantic artwork V57.2 active');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();