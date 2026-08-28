'use strict';

/*
  LUNEA CARD MOTION + TIMING VISUAL V7
  Safe replacement for V6.
  - NO document.body-wide MutationObserver
  - Slower RWS flip with CSS-only gleam
  - Moon Dial timing card visual
  - Existing timing data / RNG / filters / prompt logic untouched
*/
(() => {
  if (window.__LUNEA_CARD_MOTION_TIMING_V7__) return;
  window.__LUNEA_CARD_MOTION_TIMING_V7__ = true;
  const $ = id => document.getElementById(id);

  function addStyles(){
    if ($('luneaCardMotionTimingV7Style')) return;
    const s = document.createElement('style');
    s.id = 'luneaCardMotionTimingV7Style';
    s.textContent = `
      /* RWS tarot: slower, weightier reveal */
      .tarot-card{transition:transform .96s cubic-bezier(.18,.72,.18,1)!important;will-change:transform}
      .tarot-card-wrapper{transition:transform .28s ease,filter .34s ease!important}
      .tarot-card-wrapper:has(.tarot-card.flipped){transform:translateY(-2px) scale(1.008);filter:drop-shadow(0 12px 18px rgba(0,0,0,.28))}
      .front::after{content:'';position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;opacity:0;background:linear-gradient(112deg,transparent 20%,rgba(255,255,255,.72) 43%,rgba(199,183,245,.36) 50%,rgba(145,194,229,.22) 57%,transparent 78%);background-size:230% 100%;mix-blend-mode:screen}
      .tarot-card.flipped .front::after{animation:luneaV7TarotGleam 1.15s .18s cubic-bezier(.19,.72,.22,1) both}
      @keyframes luneaV7TarotGleam{0%{opacity:0;background-position:120% 0}28%{opacity:.16}58%{opacity:.66}100%{opacity:0;background-position:-80% 0}}

      /* Timing category */
      .lunea-timing-category{border-color:rgba(216,220,238,.15)!important;background:linear-gradient(145deg,rgba(22,24,44,.74),rgba(9,11,25,.82))!important}
      .lunea-timing-category .cat-icon{color:#ececf5!important;border-color:rgba(225,228,241,.19)!important;background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.26),transparent 24%),conic-gradient(from 210deg,rgba(143,122,211,.18),rgba(213,219,236,.14),rgba(104,154,198,.12),rgba(143,122,211,.18))!important}

      /* Timing modal */
      #timingOverlay{background:rgba(3,4,12,.92)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important}
      #timingOverlay .timing-modal{color:#f5f4fa!important;border:1px solid rgba(222,225,241,.18)!important;background:radial-gradient(circle at 17% 0%,rgba(143,111,216,.18),transparent 30%),radial-gradient(circle at 88% 18%,rgba(96,153,200,.11),transparent 28%),linear-gradient(162deg,rgba(18,20,39,.99),rgba(7,9,21,.995) 70%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 28px 74px rgba(0,0,0,.72)!important;overflow-x:hidden}
      .timing-modal .sub{color:#c9baf0!important;letter-spacing:1.7px!important}.timing-modal .modal-h{color:#f6f5fb!important;font-size:19px!important}.timing-modal .close{color:#aaaabd!important}.timing-modal .field label{color:#e4e4ef!important}.timing-modal textarea{background:rgba(255,255,255,.045)!important;color:#f7f7fc!important;border-color:rgba(221,224,239,.14)!important}.timing-help{color:#9f9eaf!important}
      #timingDraw{background:linear-gradient(112deg,rgba(181,160,235,.96),rgba(120,106,194,.96) 52%,rgba(92,139,187,.94))!important;border-color:rgba(241,243,252,.31)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.23),0 11px 28px rgba(99,82,165,.25)!important}

      /* Moon Dial card */
      .timing-stage{min-height:326px!important;gap:13px!important;padding-top:4px}.timing-flip{width:184px!important;height:307px!important;perspective:1250px!important;filter:drop-shadow(0 17px 28px rgba(0,0,0,.34))}.timing-inner{transition:transform .99s cubic-bezier(.18,.72,.18,1)!important}.timing-face{border-radius:21px!important;box-shadow:0 17px 36px rgba(0,0,0,.42),0 0 0 1px rgba(236,239,249,.05)!important}.timing-back{border:1px solid rgba(224,227,241,.27)!important;background:radial-gradient(circle at 50% 38%,rgba(160,133,224,.18),transparent 32%),linear-gradient(152deg,#171a35 0%,#0b0e20 58%,#070916 100%)!important}.timing-back::before{content:''!important;width:106px;height:106px;border-radius:50%;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:1px solid rgba(223,226,241,.31);box-shadow:0 0 0 14px rgba(205,194,239,.035),0 0 0 29px rgba(169,151,221,.027),0 0 30px rgba(175,149,235,.13);background:linear-gradient(145deg,rgba(236,237,246,.96),rgba(165,159,196,.84) 43%,rgba(91,86,129,.94))}.timing-back::after{content:'LUNEA  ·  TIME ORACLE'!important;position:absolute;left:0;right:0;bottom:28px;color:rgba(232,234,244,.75)!important;font:700 8px 'Cinzel',serif!important;letter-spacing:2.1px!important;text-align:center}
      .timing-front{border:1px solid rgba(229,231,244,.30)!important;background:radial-gradient(circle at 50% 24%,rgba(139,112,210,.20),transparent 34%),radial-gradient(circle at 78% 72%,rgba(91,149,195,.12),transparent 31%),linear-gradient(155deg,#15182f 0%,#0b0e20 58%,#070916 100%)!important;overflow:hidden!important}.timing-front>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;pointer-events:none!important}
      .lunea-v7-time-art{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;padding:18px 15px 78px;color:#f4f4fa;text-align:center;pointer-events:none!important}.lunea-v7-time-art::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 18% 16%,rgba(255,255,255,.62) 0 1px,transparent 1.4px),radial-gradient(circle at 80% 12%,rgba(208,218,244,.52) 0 1px,transparent 1.4px),radial-gradient(circle at 74% 45%,rgba(198,181,241,.44) 0 1px,transparent 1.4px),radial-gradient(circle at 24% 61%,rgba(255,255,255,.32) 0 1px,transparent 1.3px)}
      .lunea-v7-kicker{position:relative;z-index:2;color:rgba(228,230,242,.69);font:700 7.2px 'Cinzel',serif;letter-spacing:2px}.lunea-v7-dial{position:relative;width:130px;height:130px;margin:26px auto 12px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(224,227,241,.24);box-shadow:0 0 0 10px rgba(210,201,240,.025),0 0 0 22px rgba(151,134,207,.020),0 0 29px rgba(160,132,222,.10)}.lunea-v7-dial::before,.lunea-v7-dial::after{content:'';position:absolute;border-radius:50%;border:1px solid rgba(210,214,233,.13)}.lunea-v7-dial::before{inset:10px}.lunea-v7-dial::after{inset:29px;border-style:dashed}.lunea-v7-moon{width:56px;height:56px;border-radius:50%;position:relative;z-index:2;background:linear-gradient(145deg,#f4f5fa 0%,#c9ccda 39%,#8c89a8 100%);box-shadow:inset -8px -9px 13px rgba(74,69,99,.22),inset 5px 5px 10px rgba(255,255,255,.48),0 0 21px rgba(221,213,247,.22)}.lunea-v7-moon::before{content:'';position:absolute;width:49px;height:49px;border-radius:50%;background:#0d1022;top:1px;left:17px}.lunea-v7-time-art[data-phase='full'] .lunea-v7-moon::before{opacity:0}.lunea-v7-time-art[data-phase='half'] .lunea-v7-moon::before{left:29px}.lunea-v7-time-art[data-phase='waning'] .lunea-v7-moon::before{left:-10px}.lunea-v7-time-art[data-phase='eclipse'] .lunea-v7-moon{background:linear-gradient(145deg,#9581ca,#4e466f 58%,#24243c);box-shadow:0 0 0 1px rgba(211,200,241,.25),0 0 24px rgba(127,99,193,.32)}.lunea-v7-time-art[data-phase='eclipse'] .lunea-v7-moon::before{left:5px;top:5px;width:46px;height:46px;background:#090b18;opacity:.86}.lunea-v7-hand{position:absolute;z-index:3;left:50%;top:50%;width:1px;height:47px;transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(var(--dial-angle,34deg));background:linear-gradient(180deg,rgba(240,242,249,.92),rgba(190,175,232,.10));box-shadow:0 0 7px rgba(225,215,251,.32)}.lunea-v7-kind{position:relative;z-index:2;color:#a8a6b9;font:700 7.3px 'Cinzel',serif;letter-spacing:1.7px}
      .timing-card-label{z-index:5!important;left:12px!important;right:12px!important;bottom:13px!important;padding:11px 9px 10px!important;border-radius:15px!important;color:#f4f4fa!important;background:linear-gradient(145deg,rgba(18,20,39,.80),rgba(9,11,25,.88))!important;backdrop-filter:blur(13px)!important;-webkit-backdrop-filter:blur(13px)!important;border:1px solid rgba(222,225,240,.17)!important;pointer-events:none!important}.timing-card-label span{display:block!important;color:#c3b5e8!important;font:700 7.6px 'Cinzel',serif!important;letter-spacing:1.35px!important;margin-bottom:4px}.timing-card-label b{display:block!important;color:#f7f7fb!important;font:600 15px 'Noto Serif KR',serif!important}
      .timing-inner.flipped .timing-front::after{content:'';position:absolute;inset:0;z-index:7;pointer-events:none;background:linear-gradient(115deg,transparent 15%,rgba(255,255,255,.17) 33%,rgba(200,185,244,.10) 39%,transparent 57%);animation:luneaV7TimingSweep 1.22s .34s cubic-bezier(.18,.72,.18,1) both}@keyframes luneaV7TimingSweep{0%{transform:translateX(-125%);opacity:0}28%{opacity:.22}65%{opacity:.40}100%{transform:translateX(125%);opacity:0}}
      .timing-result{color:#d9d9e5!important;background:rgba(255,255,255,.04)!important;border:1px solid rgba(220,223,239,.12)!important;border-radius:15px!important}.timing-result b{color:#ded2ff!important}.timing-actions .mini{color:#e0dfeb!important;background:rgba(183,163,229,.08)!important;border-color:rgba(217,220,235,.14)!important}.timing-ai{color:#ecebf3!important;background:linear-gradient(145deg,rgba(29,28,53,.72),rgba(11,13,28,.84))!important;border-color:rgba(203,190,237,.18)!important}
      .timing-inline{background:linear-gradient(145deg,rgba(24,25,47,.70),rgba(10,12,27,.78))!important;border-color:rgba(216,220,238,.15)!important}.timing-inline img{filter:saturate(.55) brightness(.72);border-color:rgba(220,224,240,.20)!important}.timing-inline .txt small{color:#bfaee9!important}.timing-inline .txt b{color:#f4f3f8!important}.timing-inline .txt span{color:#aaa9bb!important}
      @media(max-width:390px){.timing-flip{width:169px!important;height:282px!important}.lunea-v7-dial{width:118px;height:118px;margin-top:22px}.lunea-v7-moon{width:51px;height:51px}.lunea-v7-moon::before{width:44px;height:44px}}
      @media(prefers-reduced-motion:reduce){.tarot-card,.timing-inner{transition-duration:.01ms!important}.tarot-card.flipped .front::after,.timing-inner.flipped .timing-front::after{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  function classify(ko,en){
    const t = `${ko||''} ${en||''}`.toLowerCase();
    if(/지연|보류|불발|미정|기다|정체|delay|pending|unclear|blocked|wait/.test(t)) return {phase:'eclipse',angle:128,label:'ECLIPSE SIGNAL'};
    if(/봄|여름|가을|겨울|계절|월초|월중|월말|spring|summer|autumn|winter|season/.test(t)) return {phase:'full',angle:18,label:'SEASONAL ORBIT'};
    if(/새벽|아침|오전|정오|오후|해질|저녁|밤|자정|dawn|morning|noon|afternoon|dusk|evening|night|midnight/.test(t)) return {phase:'half',angle:74,label:'CELESTIAL CLOCK'};
    if(/장기|오래|long/.test(t)) return {phase:'waning',angle:112,label:'DISTANT ORBIT'};
    if(/주|week|달|month|개월/.test(t)) return {phase:'half',angle:62,label:'LUNAR CYCLE'};
    return {phase:'crescent',angle:28,label:'NEAR ORBIT'};
  }

  function ensureArt(){
    const front = document.querySelector('#timingOverlay .timing-front');
    if(!front) return null;
    let art = front.querySelector('.lunea-v7-time-art');
    if(!art){
      art = document.createElement('div');
      art.className = 'lunea-v7-time-art';
      art.innerHTML = '<div class="lunea-v7-kicker">LUNEA · MOON DIAL</div><div class="lunea-v7-dial"><div class="lunea-v7-moon"></div><div class="lunea-v7-hand"></div></div><div class="lunea-v7-kind">TIME WINDOW</div>';
      const label = front.querySelector('.timing-card-label');
      label ? front.insertBefore(art,label) : front.appendChild(art);
    }
    return art;
  }

  function syncArt(){
    const art = ensureArt(); if(!art) return;
    const m = classify($('timingLabelKo')?.textContent,$('timingLabelEn')?.textContent);
    art.dataset.phase = m.phase;
    art.style.setProperty('--dial-angle',m.angle+'deg');
    const kind = art.querySelector('.lunea-v7-kind'); if(kind) kind.textContent = m.label;
  }

  function polishCopy(){
    const cat = $('luneaTimingCategory')?.querySelector('.cat-icon'); if(cat && cat.textContent !== '◐') cat.textContent='◐';
    const support = $('timingSupportBtn'); if(support && support.textContent !== '◐ 시기 오라클') support.textContent='◐ 시기 오라클';
    const draw = $('timingDraw'); if(draw && draw.textContent !== '✦ 시기 신호 한 장 열기') draw.textContent='✦ 시기 신호 한 장 열기';
    const sub = document.querySelector('#timingOverlay .sub'); if(sub && sub.textContent !== 'LUNEA · CELESTIAL TIME ORACLE') sub.textContent='LUNEA · CELESTIAL TIME ORACLE';
    const title = document.querySelector('#timingOverlay .modal-h'); if(title && title.textContent !== 'Moon Dial') title.textContent='Moon Dial';
  }

  function boot(){
    addStyles();
    polishCopy();
    ensureArt();
    syncArt();
    const ko=$('timingLabelKo'), en=$('timingLabelEn');
    const obs = new MutationObserver(syncArt);
    if(ko) obs.observe(ko,{childList:true,subtree:true,characterData:true});
    if(en) obs.observe(en,{childList:true,subtree:true,characterData:true});
    // One tiny observer only on the timing overlay itself to catch its initial injected controls.
    const overlay=$('timingOverlay');
    if(overlay){
      const o=new MutationObserver(()=>{polishCopy();ensureArt()});
      o.observe(overlay,{childList:true,subtree:true});
      setTimeout(()=>o.disconnect(),2500);
    }
  }

  if(document.readyState==='complete') setTimeout(boot,0);
  else window.addEventListener('load',boot,{once:true});
})();
