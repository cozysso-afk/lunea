'use strict';

/*
  LUNEA TIMING MOON DIAL SYNC V15
  -------------------------------
  Visual-only companion for Timing Oracle.
  - Keeps the single-card V7 Moon Dial dark/opalescent.
  - Replaces legacy pale A/B timing PNG presentation with matching mini Moon Dial art.
  - Targeted DOM observation only inside the A/B timing result container.
  - No timing RNG, candidate filtering, AI prompt, or archive changes.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_MOONDIAL_SYNC_V15__) return;
  W.__LUNEA_TIMING_MOONDIAL_SYNC_V15__ = true;
  document.documentElement.classList.add('lunea-timing-moondial-sync-v15');

  const $ = id => document.getElementById(id);

  function classify(ko, en) {
    const t = `${ko || ''} ${en || ''}`.toLowerCase();
    if (/지연|보류|불발|미정|기다|정체|delay|pending|unclear|blocked|wait/.test(t)) return {phase:'eclipse', angle:128, label:'ECLIPSE SIGNAL'};
    if (/봄|여름|가을|겨울|계절|월초|월중|월말|spring|summer|autumn|winter|season/.test(t)) return {phase:'full', angle:18, label:'SEASONAL ORBIT'};
    if (/새벽|아침|오전|정오|오후|해질|저녁|밤|자정|dawn|morning|noon|afternoon|dusk|evening|night|midnight/.test(t)) return {phase:'half', angle:74, label:'CELESTIAL CLOCK'};
    if (/장기|오래|long/.test(t)) return {phase:'waning', angle:112, label:'DISTANT ORBIT'};
    if (/주|week|달|month|개월/.test(t)) return {phase:'half', angle:62, label:'LUNAR CYCLE'};
    return {phase:'crescent', angle:28, label:'NEAR ORBIT'};
  }

  function addStyles() {
    if ($('luneaTimingMoonDialV15Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaTimingMoonDialV15Style';
    style.textContent = `
      /* Single Timing card stays on the intended dark Moon Dial language. */
      html.lunea-timing-moondial-sync-v15 #timingOverlay .timing-front{
        border:1px solid rgba(229,231,244,.30)!important;
        background:
          radial-gradient(circle at 50% 24%,rgba(139,112,210,.20),transparent 34%),
          radial-gradient(circle at 78% 72%,rgba(91,149,195,.12),transparent 31%),
          linear-gradient(155deg,#15182f 0%,#0b0e20 58%,#070916 100%)!important;
        overflow:hidden!important;
      }
      html.lunea-timing-moondial-sync-v15 #timingOverlay .timing-front>img{
        opacity:0!important;pointer-events:none!important;
      }
      html.lunea-timing-moondial-sync-v15 #timingOverlay .timing-card-label{
        color:#f4f4fa!important;
        background:linear-gradient(145deg,rgba(18,20,39,.82),rgba(9,11,25,.90))!important;
        border-color:rgba(222,225,240,.17)!important;
      }
      html.lunea-timing-moondial-sync-v15 #timingOverlay .timing-card-label span{color:#c3b5e8!important}
      html.lunea-timing-moondial-sync-v15 #timingOverlay .timing-card-label b{color:#f7f7fb!important}

      /* A/B legacy PNG is hidden; the same Moon Dial identity is rendered in CSS. */
      html.lunea-timing-moondial-sync-v15 #luneaTimingABPanel .tab-card>img{display:none!important}
      .lunea-v15-time-art{
        position:relative;z-index:1;width:min(128px,100%);height:202px;margin:2px auto 10px;
        border-radius:16px;overflow:hidden;display:flex;flex-direction:column;align-items:center;
        padding:13px 9px 12px;text-align:center;color:#f5f4fb;
        border:1px solid rgba(233,234,247,.24);
        background:
          radial-gradient(circle at 50% 40%,rgba(159,132,222,.17),transparent 32%),
          radial-gradient(circle at 82% 74%,rgba(94,155,199,.11),transparent 30%),
          linear-gradient(155deg,#171a36 0%,#0c1025 60%,#080a18 100%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 11px 25px rgba(0,0,0,.31),0 0 24px rgba(154,126,214,.09);
      }
      .lunea-v15-time-art::before{
        content:'';position:absolute;inset:0;pointer-events:none;opacity:.65;
        background-image:
          radial-gradient(circle at 18% 15%,rgba(255,255,255,.70) 0 1px,transparent 1.4px),
          radial-gradient(circle at 82% 12%,rgba(214,224,247,.55) 0 1px,transparent 1.4px),
          radial-gradient(circle at 75% 47%,rgba(203,184,242,.48) 0 1px,transparent 1.4px),
          radial-gradient(circle at 22% 66%,rgba(255,255,255,.38) 0 1px,transparent 1.3px),
          radial-gradient(circle at 66% 83%,rgba(151,204,225,.35) 0 1px,transparent 1.3px);
      }
      .lunea-v15-kicker{
        position:relative;z-index:2;color:rgba(229,231,243,.72);font:700 6.8px 'Cinzel',serif;letter-spacing:1.55px;
      }
      .lunea-v15-dial{
        position:relative;z-index:2;width:94px;height:94px;margin:18px auto 11px;border-radius:50%;display:grid;place-items:center;
        border:1px solid rgba(225,228,242,.25);
        box-shadow:0 0 0 8px rgba(211,203,240,.028),0 0 0 17px rgba(159,140,211,.020),0 0 25px rgba(163,135,220,.11);
      }
      .lunea-v15-dial::before,.lunea-v15-dial::after{
        content:'';position:absolute;border-radius:50%;border:1px solid rgba(212,216,234,.14);
      }
      .lunea-v15-dial::before{inset:9px}
      .lunea-v15-dial::after{inset:23px;border-style:dashed}
      .lunea-v15-moon{
        width:42px;height:42px;border-radius:50%;position:relative;z-index:2;
        background:linear-gradient(145deg,#f5f6fa 0%,#cbd0dd 40%,#8c8aa8 100%);
        box-shadow:inset -6px -7px 10px rgba(70,67,96,.22),inset 4px 4px 8px rgba(255,255,255,.50),0 0 18px rgba(221,214,247,.22);
      }
      .lunea-v15-moon::before{
        content:'';position:absolute;width:37px;height:37px;border-radius:50%;background:#0d1022;top:1px;left:13px;
      }
      .lunea-v15-time-art[data-phase='full'] .lunea-v15-moon::before{opacity:0}
      .lunea-v15-time-art[data-phase='half'] .lunea-v15-moon::before{left:22px}
      .lunea-v15-time-art[data-phase='waning'] .lunea-v15-moon::before{left:-7px}
      .lunea-v15-time-art[data-phase='eclipse'] .lunea-v15-moon{
        background:linear-gradient(145deg,#9581ca,#4e466f 58%,#24243c);box-shadow:0 0 0 1px rgba(211,200,241,.25),0 0 22px rgba(127,99,193,.32);
      }
      .lunea-v15-time-art[data-phase='eclipse'] .lunea-v15-moon::before{
        left:4px;top:4px;width:34px;height:34px;background:#090b18;opacity:.86;
      }
      .lunea-v15-hand{
        position:absolute;z-index:3;left:50%;top:50%;width:1px;height:34px;transform-origin:50% 100%;
        transform:translate(-50%,-100%) rotate(var(--dial-angle,34deg));
        background:linear-gradient(180deg,rgba(241,243,250,.93),rgba(190,175,232,.10));
        box-shadow:0 0 7px rgba(225,215,251,.32);
      }
      .lunea-v15-kind{
        position:relative;z-index:2;color:#b2aec2;font:700 7px 'Cinzel',serif;letter-spacing:1.35px;
      }
      .lunea-v15-orbit{
        position:relative;z-index:2;margin-top:7px;color:#ddd7ec;font-size:9px;line-height:1.35;font-weight:650;
      }

      @media(max-width:390px){
        .lunea-v15-time-art{width:min(112px,100%);height:178px;padding-top:11px}
        .lunea-v15-dial{width:82px;height:82px;margin-top:14px}
        .lunea-v15-moon{width:37px;height:37px}
        .lunea-v15-moon::before{width:33px;height:33px;left:11px}
        .lunea-v15-time-art[data-phase='half'] .lunea-v15-moon::before{left:19px}
        .lunea-v15-hand{height:30px}
        .lunea-v15-kind{font-size:6.5px}
        .lunea-v15-orbit{font-size:8.5px}
      }
    `;
    document.head.appendChild(style);
  }

  function upgradeABCards() {
    document.querySelectorAll('#luneaTimingABPanel .tab-card').forEach(card => {
      const ko = card.querySelector('b')?.textContent?.trim() || '';
      const en = card.querySelector('em')?.textContent?.trim() || '';
      if (!ko && !en) return;
      const cfg = classify(ko, en);
      let art = card.querySelector('.lunea-v15-time-art');
      if (!art) {
        art = document.createElement('div');
        art.className = 'lunea-v15-time-art';
        const img = card.querySelector('img');
        if (img) img.insertAdjacentElement('afterend', art);
        else card.querySelector('small')?.insertAdjacentElement('afterend', art);
      }
      art.dataset.phase = cfg.phase;
      art.style.setProperty('--dial-angle', `${cfg.angle}deg`);
      art.innerHTML = `<div class="lunea-v15-kicker">LUNEA · MOON DIAL</div><div class="lunea-v15-dial"><div class="lunea-v15-moon"></div><i class="lunea-v15-hand"></i></div><div class="lunea-v15-kind">${cfg.label}</div><div class="lunea-v15-orbit">${ko || en}</div>`;
    });
  }

  function installObserver() {
    const target = $('luneaTimingABCards');
    if (!target || target.__luneaV15Observed) return false;
    target.__luneaV15Observed = true;
    const observer = new MutationObserver(() => requestAnimationFrame(upgradeABCards));
    observer.observe(target, {childList:true, subtree:true});
    upgradeABCards();
    return true;
  }

  function boot() {
    addStyles();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installObserver() || tries > 80) clearInterval(timer);
    }, 100);
    installObserver();
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw,#luneaTimingABAIButton,#luneaTimingABPanel')) {
        setTimeout(upgradeABCards, 40);
        setTimeout(upgradeABCards, 220);
      }
    }, {passive:true});
    console.info('🌙 LUNEA Timing Moon Dial Sync V15 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
