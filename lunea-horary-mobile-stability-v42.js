'use strict';

/* LUNEA HORARY MOBILE STABILITY V42 — iOS modal position + scroll lock */
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_MOBILE_STABILITY_V42__) return;
  W.__LUNEA_HORARY_MOBILE_STABILITY_V42__ = true;
  const RELEASE = '42.0';
  let locked = false;
  let savedY = 0;
  let saved = null;

  function addStyle() {
    if (document.getElementById('luneaHoraryMobileStabilityV42Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaHoraryMobileStabilityV42Style';
    style.textContent = `
      #astroHoraryOverlay.show{
        position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;
        align-items:flex-start!important;justify-content:center!important;
        overflow:hidden!important;overscroll-behavior:none!important;
        padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))!important;
      }
      #astroHoraryOverlay .horary-modal{
        position:relative!important;top:0!important;left:auto!important;right:auto!important;
        transform:none!important;margin:0 auto!important;width:100%!important;max-width:448px!important;
        max-height:calc(100dvh - max(24px,env(safe-area-inset-top)) - max(24px,env(safe-area-inset-bottom)))!important;
        overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;
        overscroll-behavior:contain!important;overflow-anchor:none!important;touch-action:pan-y!important;
        scroll-behavior:auto!important;
      }
      #astroHoraryOverlay .horary-modal textarea,#astroHoraryOverlay .horary-modal input,#astroHoraryOverlay .horary-modal select{
        scroll-margin-top:88px!important;
      }
      html.lunea-horary-v42-locked,html.lunea-horary-v42-locked body{overscroll-behavior:none!important}
    `;
    document.head.appendChild(style);
  }

  function lockPage() {
    if (locked) return;
    const body = document.body;
    if (!body) return;
    locked = true;
    savedY = Math.max(0, W.scrollY || W.pageYOffset || 0);
    saved = {
      position:body.style.position, top:body.style.top, left:body.style.left,
      right:body.style.right, width:body.style.width, overflow:body.style.overflow
    };
    document.documentElement.classList.add('lunea-horary-v42-locked');
    body.style.position = 'fixed';
    body.style.top = `-${savedY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  function unlockPage() {
    if (!locked) return;
    const body = document.body;
    locked = false;
    document.documentElement.classList.remove('lunea-horary-v42-locked');
    if (body && saved) {
      body.style.position = saved.position;
      body.style.top = saved.top;
      body.style.left = saved.left;
      body.style.right = saved.right;
      body.style.width = saved.width;
      body.style.overflow = saved.overflow;
    }
    const y = savedY;
    saved = null;
    requestAnimationFrame(() => W.scrollTo?.(0, y));
  }

  function sync(overlay) {
    if (!overlay) return;
    if (overlay.classList.contains('show')) lockPage();
    else unlockPage();
  }

  function bindOverlay() {
    const overlay = document.getElementById('astroHoraryOverlay');
    if (!overlay || overlay.__luneaHoraryV42Observed) return !!overlay;
    overlay.__luneaHoraryV42Observed = true;
    new MutationObserver(() => sync(overlay)).observe(overlay, {attributes:true, attributeFilter:['class']});
    sync(overlay);
    return true;
  }

  function boot() {
    addStyle();
    if (!bindOverlay()) {
      const observer = new MutationObserver(() => { if (bindOverlay()) observer.disconnect(); });
      observer.observe(document.documentElement, {childList:true, subtree:true});
    }
    W.addEventListener?.('pagehide', unlockPage, {passive:true});
    W.LUNEA_HORARY_MOBILE_STABILITY_V42 = Object.freeze({version:RELEASE, lockPage, unlockPage});
    console.info('☿ LUNEA Horary mobile stability V42 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

/* LUNEA UI regression recovery tail · Timing / Horary / INTIMACY */
(() => {
  const W=window;
  if(W.__LUNEA_UI_REGRESSION_RECOVERY_V1__)return;
  W.__LUNEA_UI_REGRESSION_RECOVERY_V1__=true;
  document.documentElement.classList.add('lunea-ui-regression-recovery-v1');
  const $=id=>document.getElementById(id);
  const BUILD=(()=>{try{const s=document.currentScript?.src||'';return s?(new URL(s,location.href).searchParams.get('v')||'v1'):'v1'}catch{return'v1'}})();

  function addRecoveryStyle(){
    if($('luneaUiRegressionRecoveryV1Style'))return;
    const s=document.createElement('style');s.id='luneaUiRegressionRecoveryV1Style';s.textContent=`
      html.lunea-ui-regression-recovery-v1 #timingOverlay{background:rgba(8,6,14,.82)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-modal{display:block!important;width:min(100%,448px)!important;max-width:448px!important;height:auto!important;min-height:0!important;max-height:calc(100dvh - max(24px,env(safe-area-inset-top)) - max(24px,env(safe-area-inset-bottom)))!important;margin:auto!important;padding:20px 18px calc(20px + env(safe-area-inset-bottom))!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;color:#3a3042!important;border:1px solid rgba(208,171,103,.45)!important;background:linear-gradient(rgba(255,252,248,.94),rgba(255,250,247,.96)),url('./bg.png') center top/cover no-repeat!important;box-shadow:0 24px 70px rgba(0,0,0,.55)!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-modal-header{display:block!important;min-height:0!important;flex:none!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-scroll-body{display:block!important;min-height:0!important;height:auto!important;max-height:none!important;flex:none!important;overflow:visible!important;overscroll-behavior:auto!important;touch-action:auto!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .sub{color:#9d7d4a!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .modal-h{color:#3c3344!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .close{color:#8e7f94!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .field label{color:#5b4d61!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay textarea{width:100%!important;max-width:100%!important;box-sizing:border-box!important;background:rgba(255,255,255,.76)!important;color:#3b3341!important;border-color:rgba(169,133,72,.25)!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-help{color:#7d7182!important}
      html.lunea-ui-regression-recovery-v1 #timingDraw{position:relative!important;z-index:3!important;min-height:50px!important;pointer-events:auto!important;touch-action:manipulation!important;color:#4a3b51!important;border:1px solid rgba(189,145,76,.36)!important;background:linear-gradient(112deg,#fff7ea,#eee4fb 52%,#e4f1f1)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 8px 22px rgba(87,61,88,.14)!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-stage{width:100%!important;min-height:0!important;gap:10px!important;padding-top:8px!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-flip{width:min(174px,52vw)!important;height:auto!important;aspect-ratio:3/5!important;filter:drop-shadow(0 13px 26px rgba(80,51,89,.22))!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-face{border-radius:18px!important;box-shadow:0 13px 30px rgba(80,51,89,.24)!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-back{border-color:rgba(199,158,84,.55)!important;background:linear-gradient(150deg,#fdf8f1,#e8dcfa 52%,#dceff0)!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-front{border-color:rgba(199,158,84,.55)!important;background:#fff!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result{color:#756a79!important;background:rgba(255,255,255,.70)!important;border-color:rgba(197,158,92,.24)!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result .group,html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result>div:first-child{color:#9e7d47!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result h4,html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result b,html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result strong{color:#403346!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-result p{color:#756a79!important}
      html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-actions .mini,html.lunea-ui-regression-recovery-v1 #timingOverlay .tab-actions .mini{color:#6d5679!important;background:rgba(255,255,255,.72)!important;border-color:rgba(165,130,190,.28)!important;touch-action:manipulation!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-ai{color:#493e50!important;background:rgba(255,255,255,.74)!important;border-color:rgba(157,126,180,.23)!important}
      html.lunea-ui-regression-recovery-v1 #luneaTimingABPanel .tab-card{color:#493e50!important;background:rgba(255,255,255,.76)!important;border-color:rgba(197,158,92,.25)!important}html.lunea-ui-regression-recovery-v1 #luneaTimingABPanel .tab-card small,html.lunea-ui-regression-recovery-v1 #luneaTimingABPanel .tab-card em{color:#9e7d47!important}html.lunea-ui-regression-recovery-v1 #luneaTimingABPanel .tab-card b{color:#403346!important}html.lunea-ui-regression-recovery-v1 #luneaTimingABPanel .tab-card p{color:#756a79!important}html.lunea-ui-regression-recovery-v1 #luneaTimingABPanel .tab-note,html.lunea-ui-regression-recovery-v1 #luneaTimingABAI{color:#756a79!important;background:rgba(255,252,247,.72)!important;border-color:rgba(165,130,190,.18)!important}
      html.lunea-ui-regression-recovery-v1 #luneaTimingInline.timing-inline,html.lunea-ui-regression-recovery-v1 .timing-inline{color:#493e50!important;background:linear-gradient(145deg,rgba(255,248,237,.96),rgba(238,231,250,.94))!important;border:1px solid rgba(199,158,84,.34)!important;box-shadow:0 8px 22px rgba(66,47,72,.12)!important}html.lunea-ui-regression-recovery-v1 .timing-inline .txt small{color:#9e7d47!important}html.lunea-ui-regression-recovery-v1 .timing-inline .txt b{color:#403346!important}html.lunea-ui-regression-recovery-v1 .timing-inline .txt span{color:#756a79!important}
      html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay .horary-modal{width:min(100%,448px)!important;max-width:448px!important;box-sizing:border-box!important;overflow-x:hidden!important}html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay .horary-grid,html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay .field{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay textarea,html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay input,html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay select,html.lunea-ui-regression-recovery-v1 #astroHoraryMomentDisplay,html.lunea-ui-regression-recovery-v1 #astroHoraryPlaceDisplay{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}html.lunea-ui-regression-recovery-v1 #astroHoraryMoment,html.lunea-ui-regression-recovery-v1 #astroHoraryPlace,html.lunea-ui-regression-recovery-v1 #astroHoraryMomentDisplay,html.lunea-ui-regression-recovery-v1 #astroHoraryPlaceDisplay{min-height:46px!important}html.lunea-ui-regression-recovery-v1 #astroHoraryNow{width:100%!important;min-height:44px!important;touch-action:manipulation!important}
      html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel.lio-panel{margin:12px 0 4px!important;padding:10px!important;border:1px solid rgba(221,126,164,.17)!important;border-radius:14px!important;background:linear-gradient(160deg,rgba(74,18,43,.22),rgba(24,9,20,.42))!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-items:start!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card{position:relative!important;min-width:0!important;padding:0!important;border:1px solid rgba(224,139,171,.30)!important;background:#28101b!important;border-radius:10px!important;overflow:hidden!important;aspect-ratio:3/5!important;box-shadow:0 5px 18px rgba(0,0,0,.52),0 0 16px rgba(154,50,91,.07)!important;perspective:900px!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card:only-child{grid-column:2!important;min-width:112px!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card-front{background-size:cover!important;background-position:center!important;filter:brightness(1.14) saturate(1.06) contrast(.99)!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card-back{background-image:url('./assets/intimacy-oracle/oracle_back_v2.png')!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card span{position:absolute!important;left:4px!important;right:4px!important;bottom:5px!important;min-height:26%!important;display:flex!important;flex-direction:column!important;justify-content:flex-end!important;padding:8px 5px 6px!important;background:linear-gradient(180deg,rgba(31,8,18,.12),rgba(31,8,18,.88) 44%,rgba(22,5,13,.96))!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important;border-radius:7px!important;color:#fff!important;line-height:1.14!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card span em{font-size:8.5px!important;opacity:.9!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card span strong{font-size:10.5px!important;letter-spacing:.025em!important;text-shadow:0 1px 5px rgba(0,0,0,.85)!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card span small{font-size:9px!important;opacity:.96!important}
      @media(max-width:520px){html.lunea-ui-regression-recovery-v1 #astroHoraryOverlay .horary-grid{grid-template-columns:minmax(0,1fr)!important;gap:10px!important}}@media(max-width:390px){html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-modal{padding-left:15px!important;padding-right:15px!important}html.lunea-ui-regression-recovery-v1 #timingOverlay .timing-flip{width:min(160px,50vw)!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-row{gap:6px!important}html.lunea-ui-regression-recovery-v1 #luneaIntimacyOraclePanel .lio-card span{left:3px!important;right:3px!important;bottom:4px!important;min-height:27%!important;padding:7px 4px 5px!important}}
    `;document.head.appendChild(s)
  }

  function intimacyAssets(){
    const fronts=document.querySelectorAll('#luneaIntimacyOraclePanel .lio-card-front');
    fronts.forEach(front=>{const raw=String(front.style.backgroundImage||getComputedStyle(front).backgroundImage||'');const m=raw.match(/oracle_(\d{2})\.png/i);if(!m)return;front.style.setProperty('background-image',`url("./assets/intimacy-oracle/cards/oracle_${m[1]}.png?v=v47-${encodeURIComponent(BUILD)}")`,'important');front.style.setProperty('background-size','cover','important');front.style.setProperty('background-position','center','important')});
    document.querySelectorAll('#luneaIntimacyOraclePanel .lio-card-back').forEach(back=>{back.style.setProperty('background-image',`url("./assets/intimacy-oracle/oracle_back_v2.png?v=v47-${encodeURIComponent(BUILD)}")`,'important');back.style.setProperty('background-size','cover','important')});
    return fronts.length>0
  }
  function timingTouch(){const b=$('timingDraw');if(!b||b.__luneaUiRecoveryTouch)return!!b;b.__luneaUiRecoveryTouch=true;b.style.touchAction='manipulation';b.addEventListener('pointerdown',()=>{const a=document.activeElement;if(a&&a!==b&&a.closest?.('#timingOverlay')&&/^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName))try{a.blur()}catch{}},{capture:true,passive:true});return true}
  function momentText(v){if(!v)return'';try{const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(d)}catch{return String(v)}}
  function syncMoment(){const i=$('astroHoraryMoment');if(!i)return false;i.style.width='100%';i.style.maxWidth='100%';i.style.boxSizing='border-box';const d=$('astroHoraryMomentDisplay');if(d)d.textContent=momentText(i.value);return true}
  function completeContract(){const c=W.LUNEA_HORARY_MOBILE_STABILITY_V42;if(!c||c.__luneaUiRecoveryV1)return!!c;W.LUNEA_HORARY_MOBILE_STABILITY_V42=Object.freeze({...c,enhanceMoment:typeof c.enhanceMoment==='function'?c.enhanceMoment:syncMoment,syncMoment:typeof c.syncMoment==='function'?c.syncMoment:syncMoment,__luneaUiRecoveryV1:true});return syncMoment()}
  function apply(){addRecoveryStyle();timingTouch();completeContract();syncMoment();intimacyAssets()}
  function observe(id){const n=$(id);if(!n||n.__luneaUiRecoveryObserved)return;n.__luneaUiRecoveryObserved=true;new MutationObserver(()=>requestAnimationFrame(apply)).observe(n,{attributes:true,attributeFilter:['class'],childList:true,subtree:true})}
  function boot(){apply();[80,260,800,1800].forEach(ms=>setTimeout(apply,ms));observe('timingOverlay');observe('astroHoraryOverlay');observe('luneaIntimacyOraclePanel');W.addEventListener('pageshow',()=>setTimeout(apply,40),{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(apply,40)})}
  W.LUNEA_UI_REGRESSION_RECOVERY_V1=Object.freeze({version:'1.0',apply,syncMoment,intimacyAssets});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})();
