'use strict';

/* LUNEA HORARY MOBILE STABILITY V42 — iOS modal position + scroll lock */
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_MOBILE_STABILITY_V42__) return;
  W.__LUNEA_HORARY_MOBILE_STABILITY_V42__ = true;
  const RELEASE = '42.0';
  const MOMENT_SHELL = 'horary-v42-moment-shell';
  const MOMENT_VISIBLE = 'horary-v42-moment-visible';
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
      #astroHoraryOverlay .${MOMENT_SHELL}{display:contents}
      #astroHoraryOverlay .${MOMENT_VISIBLE}{display:none}
      /* Final Horary presentation owner: midnight celestial, scoped to this sheet. */
      #astroHoraryOverlay,#astroHoraryOverlay *{box-sizing:border-box}
      #astroHoraryOverlay{
        --dim:#a7b8cb;--text:#e6eff8;--gold:#cfe5f6;--gold2:#9fc8e8;
        background:rgba(4,9,18,.94)!important;color:#e6eff8;
      }
      #astroHoraryOverlay .horary-modal{
        background:radial-gradient(ellipse at 85% 0%,rgba(117,169,210,.10),transparent 42%),linear-gradient(160deg,#0c1427,#09111f)!important;
        border-color:rgba(117,169,210,.28)!important;
        box-shadow:inset 0 1px 0 rgba(207,229,246,.07),0 24px 64px rgba(0,0,0,.55)!important;
      }
      #astroHoraryOverlay :is(.sub,.modal-h,h4,h5,b,strong,label,summary){color:#cfe5f6!important}
      #astroHoraryOverlay .modal-h{padding-right:28px;overflow-wrap:anywhere}
      #astroHoraryOverlay :is(.horary-help,.horary-status,.v38-help,.horary-mode-v37 span){color:#a7b8cb!important}
      #astroHoraryOverlay :is(.horary-summary,.horary-card,.horary-ai,.horary-mode-v37,#luneaHoraryModeEvidenceV37,#luneaHoraryManualEvidenceV38,#luneaHoraryConditionEvidenceV38,#luneaHoraryAdvancedLocationV38){
        background:linear-gradient(145deg,rgba(117,169,210,.08),rgba(50,64,104,.09))!important;
        border-color:rgba(117,169,210,.24)!important;color:#b5c7d9!important;
      }
      #astroHoraryOverlay :is(input,select,textarea){
        width:100%!important;max-width:100%!important;min-width:0!important;
        background:#09111f!important;border-color:rgba(117,169,210,.28)!important;color:#e6eff8!important;color-scheme:dark;
      }
      #astroHoraryOverlay :is(input,select,textarea):focus{border-color:#9fc8e8!important;outline-color:#9fc8e8;box-shadow:0 0 0 2px rgba(117,169,210,.14)!important}
      #astroHoraryOverlay :is(button,.mini){
        max-width:100%;min-width:0;white-space:normal;overflow-wrap:anywhere;
        background:linear-gradient(145deg,#1b2b42,#111d30)!important;border-color:rgba(117,169,210,.30)!important;color:#cfe5f6!important;
        box-shadow:inset 0 1px 0 rgba(207,229,246,.06)!important;
      }
      #astroHoraryOverlay #astroHoraryRun{background:linear-gradient(120deg,#cfe5f6,#9fc8e8)!important;color:#09111f!important}
      #astroHoraryOverlay :is(.horary-grid,.v38-grid)>*,#astroHoraryOverlay .horary-modal>*{min-width:0;max-width:100%;overflow-wrap:anywhere}
      #astroHoraryOverlay .horary-actions{flex-wrap:wrap}
      #astroHoraryOverlay .horary-actions button{flex:1 1 125px}
      @media(max-width:420px){#astroHoraryOverlay :is(.horary-grid,.v38-grid){grid-template-columns:minmax(0,1fr)!important}}
      @media(max-width:430px){
        @supports (-webkit-touch-callout:none){
          #astroHoraryOverlay .horary-v42-moment-field{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
          #astroHoraryOverlay .${MOMENT_SHELL}{
            position:relative!important;display:block!important;width:100%!important;max-width:100%!important;
            min-width:0!important;min-height:46px!important;margin-top:0!important;box-sizing:border-box!important;
            overflow:hidden!important;border-radius:10px!important
          }
          #astroHoraryOverlay .${MOMENT_VISIBLE}{
            position:absolute!important;inset:0!important;z-index:1!important;display:flex!important;
            align-items:center!important;justify-content:center!important;box-sizing:border-box!important;
            padding:10px 12px!important;border:1px solid rgba(117,169,210,.28)!important;
            border-radius:10px!important;background:#09111f!important;color:#e6eff8!important;
            font-size:12px!important;font-weight:550!important;line-height:1.25!important;text-align:center!important;
            white-space:nowrap!important;font-variant-numeric:tabular-nums!important;pointer-events:none!important
          }
          #astroHoraryOverlay .${MOMENT_SHELL}:focus-within .${MOMENT_VISIBLE}{border-color:#9fc8e8!important;box-shadow:0 0 0 2px rgba(117,169,210,.14)!important}
          #astroHoraryOverlay .${MOMENT_SHELL}>#astroHoraryMoment{
            position:absolute!important;inset:0!important;z-index:2!important;display:block!important;
            inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important;
            -webkit-min-logical-width:0!important;width:100%!important;height:100%!important;min-height:0!important;
            margin:0!important;padding:0!important;border:0!important;border-radius:10px!important;
            opacity:.001!important;background:transparent!important;color:transparent!important;
            -webkit-text-fill-color:transparent!important;caret-color:transparent!important;
            -webkit-appearance:none!important;appearance:none!important;cursor:pointer!important
          }
          #astroHoraryOverlay .${MOMENT_SHELL}>#astroHoraryMoment::-webkit-calendar-picker-indicator{
            position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
            margin:0!important;padding:0!important;opacity:0!important;cursor:pointer!important
          }
        }
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

  function formatMoment(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return '날짜와 시각 선택';
    const hour = Number(match[4]);
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour % 12 || 12;
    return `${Number(match[1])}. ${Number(match[2])}. ${Number(match[3])}. ${period} ${displayHour}:${match[5]}`;
  }

  function syncMoment() {
    const input = document.getElementById('astroHoraryMoment');
    const visible = input?.closest?.(`.${MOMENT_SHELL}`)?.querySelector?.(`.${MOMENT_VISIBLE}`);
    if (!visible) return false;
    const next = formatMoment(input.value);
    if (visible.textContent !== next) visible.textContent = next;
    return true;
  }

  function enhanceMoment() {
    const input = document.getElementById('astroHoraryMoment');
    if (!input || input.type !== 'datetime-local') return false;
    if (input.closest?.(`.${MOMENT_SHELL}`)) return syncMoment();
    const field = input.closest?.('.field');
    if (!field || !input.parentNode) return false;
    field.classList.add('horary-v42-moment-field');
    const shell = document.createElement('span');
    shell.className = MOMENT_SHELL;
    const visible = document.createElement('span');
    visible.className = MOMENT_VISIBLE;
    visible.setAttribute('aria-hidden', 'true');
    input.parentNode.insertBefore(shell, input);
    shell.append(visible, input);
    input.addEventListener('input', syncMoment);
    input.addEventListener('change', syncMoment);
    const now = document.getElementById('astroHoraryNow');
    if (now && !now.dataset.luneaHoraryMomentSyncV42) {
      now.dataset.luneaHoraryMomentSyncV42 = '1';
      now.addEventListener('click', () => queueMicrotask(syncMoment));
    }
    return syncMoment();
  }

  function sync(overlay) {
    if (!overlay) return;
    enhanceMoment();
    syncMoment();
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
    W.addEventListener?.('pageshow', () => { enhanceMoment(); syncMoment(); }, {passive:true});
    W.LUNEA_HORARY_MOBILE_STABILITY_V42 = Object.freeze({
      version:RELEASE, lockPage, unlockPage, enhanceMoment, syncMoment, formatMoment
    });
    console.info('☿ LUNEA Horary mobile stability V42 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
