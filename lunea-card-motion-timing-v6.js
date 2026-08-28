'use strict';

/*
  LUNEA CARD MOTION + TIMING ORACLE VISUAL V6
  ============================================
  Visual / interaction polish only.

  RWS tarot
  - Slower, weightier 3D reveal (0.95s instead of the old ~0.68s)
  - subtle lift + silver/lavender edge gleam after reveal

  Timing Oracle
  - Keeps the existing 60-card timing data, filters, RNG and prompt logic untouched
  - Replaces the cream/gold image-led presentation with a LUNEA Moon Dial face
  - Midnight navy / silver / opal lavender visual system
  - Dynamic dial motif inferred from the rendered timing label
  - Existing image assets remain available underneath but are not the visual focal point
*/
(() => {
  const W = window;
  if (W.__LUNEA_CARD_MOTION_TIMING_V6__) return;
  W.__LUNEA_CARD_MOTION_TIMING_V6__ = true;

  const $ = id => document.getElementById(id);
  let styleInstalled = false;
  let timingObserver = null;
  let tarotObserver = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function addStyles(){
    if(styleInstalled || $('luneaCardMotionTimingV6Style')) return;
    styleInstalled = true;
    const style = document.createElement('style');
    style.id = 'luneaCardMotionTimingV6Style';
    style.textContent = `
      /* =======================================================
         RWS TAROT · slower tactile flip
         ======================================================= */
      .tarot-card{
        transition:transform .95s cubic-bezier(.18,.70,.18,1)!important;
        will-change:transform;
      }
      .tarot-card-wrapper{
        transition:transform .24s ease,filter .32s ease!important;
      }
      .tarot-card-wrapper.lunea-flip-reveal{
        transform:translateY(-3px) scale(1.012)!important;
        filter:drop-shadow(0 13px 18px rgba(0,0,0,.34)) drop-shadow(0 0 9px rgba(192,169,255,.14));
        z-index:3!important;
      }
      .tarot-card-wrapper::after{
        content:'';
        position:absolute;
        inset:-3px;
        border-radius:13px;
        pointer-events:none;
        opacity:0;
        z-index:6;
        background:linear-gradient(112deg,transparent 18%,rgba(255,255,255,.68) 43%,rgba(198,183,245,.38) 49%,rgba(151,199,232,.25) 55%,transparent 77%);
        background-size:240% 100%;
        mix-blend-mode:screen;
      }
      .tarot-card-wrapper.lunea-flip-reveal::after{
        animation:luneaCardGleam 1.05s cubic-bezier(.19,.75,.24,1) both;
      }
      .tarot-card-wrapper.lunea-flip-reveal .tarot-card{
        box-shadow:0 12px 26px rgba(0,0,0,.52),0 0 0 1px rgba(236,237,247,.11),0 0 23px rgba(166,137,229,.12)!important;
      }
      @keyframes luneaCardGleam{
        0%{opacity:0;background-position:120% 0}
        22%{opacity:.18}
        56%{opacity:.72}
        100%{opacity:0;background-position:-80% 0}
      }

      /* =======================================================
         TIMING CATEGORY · align to LUNEA visual language
         ======================================================= */
      .lunea-timing-category{
        border-color:rgba(215,220,238,.14)!important;
        background:linear-gradient(145deg,rgba(22,24,44,.73),rgba(10,12,27,.80))!important;
      }
      .lunea-timing-category .cat-icon{
        color:#e8e9f3!important;
        border-color:rgba(223,226,241,.18)!important;
        background:
          radial-gradient(circle at 34% 27%,rgba(255,255,255,.25),transparent 24%),
          conic-gradient(from 210deg,rgba(142,121,210,.18),rgba(214,220,235,.15),rgba(109,157,199,.12),rgba(142,121,210,.18))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 0 18px rgba(159,132,221,.08)!important;
      }

      /* =======================================================
         TIMING MODAL · dark moonlit glass, not parchment
         ======================================================= */
      #timingOverlay{
        background:rgba(3,4,12,.91)!important;
        backdrop-filter:blur(22px)!important;
        -webkit-backdrop-filter:blur(22px)!important;
      }
      #timingOverlay .timing-modal{
        color:#f4f4fa!important;
        border:1px solid rgba(220,224,241,.19)!important;
        background:
          radial-gradient(circle at 18% 0%,rgba(144,111,218,.19),transparent 28%),
          radial-gradient(circle at 88% 18%,rgba(105,163,207,.12),transparent 27%),
          linear-gradient(162deg,rgba(18,20,39,.985),rgba(7,9,21,.995) 70%)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 28px 74px rgba(0,0,0,.72),0 0 42px rgba(137,105,211,.08)!important;
        overflow-x:hidden;
      }
      #timingOverlay .timing-modal::before{
        content:'';
        position:absolute;
        inset:0;
        pointer-events:none;
        border-radius:inherit;
        background-image:
          radial-gradient(circle at 14% 17%,rgba(255,255,255,.48) 0 1px,transparent 1.4px),
          radial-gradient(circle at 82% 12%,rgba(221,225,247,.38) 0 1px,transparent 1.3px),
          radial-gradient(circle at 72% 31%,rgba(196,181,239,.38) 0 1px,transparent 1.4px),
          radial-gradient(circle at 25% 42%,rgba(199,216,242,.30) 0 1px,transparent 1.3px);
        opacity:.55;
      }
      .timing-modal .sub{
        color:#c8b9f0!important;
        letter-spacing:1.7px!important;
      }
      .timing-modal .modal-h{
        color:#f6f5fb!important;
        font-size:19px!important;
        letter-spacing:.15px;
      }
      .timing-modal .close{color:#aaaabd!important}
      .timing-modal .field label{color:#e4e4ef!important}
      .timing-modal textarea{
        background:linear-gradient(145deg,rgba(255,255,255,.052),rgba(160,141,218,.026))!important;
        color:#f7f7fc!important;
        border-color:rgba(221,224,239,.14)!important;
      }
      .timing-modal textarea:focus{
        border-color:rgba(196,179,246,.50)!important;
        box-shadow:0 0 0 3px rgba(152,127,222,.08),0 0 20px rgba(145,116,218,.06)!important;
      }
      .timing-help{color:#9e9daf!important;line-height:1.65!important}
      #timingDraw{
        background:linear-gradient(112deg,rgba(178,158,233,.96),rgba(120,107,194,.96) 52%,rgba(94,141,188,.94))!important;
        border-color:rgba(241,243,252,.31)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 11px 28px rgba(99,82,165,.26)!important;
      }

      /* =======================================================
         TIMING CARD · Moon Dial
         ======================================================= */
      .timing-stage{
        min-height:330px!important;
        gap:13px!important;
        padding-top:4px;
      }
      .timing-flip{
        width:186px!important;
        height:310px!important;
        perspective:1250px!important;
        filter:drop-shadow(0 17px 28px rgba(0,0,0,.34));
      }
      .timing-inner{
        transition:transform .98s cubic-bezier(.18,.70,.18,1)!important;
      }
      .timing-face{
        border-radius:21px!important;
        box-shadow:0 17px 36px rgba(0,0,0,.42),0 0 0 1px rgba(236,239,249,.05)!important;
      }
      .timing-back{
        border:1px solid rgba(224,227,241,.27)!important;
        background:
          radial-gradient(circle at 50% 38%,rgba(160,133,224,.19),transparent 32%),
          radial-gradient(circle at 77% 17%,rgba(100,160,203,.12),transparent 25%),
          linear-gradient(152deg,#171a35 0%,#0b0e20 58%,#070916 100%)!important;
        overflow:hidden;
      }
      .timing-back::before{
        content:''!important;
        width:108px;
        height:108px;
        border-radius:50%;
        position:absolute;
        inset:50% auto auto 50%;
        transform:translate(-50%,-50%);
        border:1px solid rgba(223,226,241,.32);
        box-shadow:0 0 0 14px rgba(205,194,239,.035),0 0 0 29px rgba(169,151,221,.028),0 0 30px rgba(175,149,235,.13);
        background:
          radial-gradient(circle at 37% 31%,rgba(255,255,255,.94) 0 2px,transparent 2.6px),
          radial-gradient(circle at 63% 59%,rgba(255,255,255,.43) 0 1px,transparent 1.6px),
          linear-gradient(145deg,rgba(232,233,244,.94),rgba(163,157,194,.83) 43%,rgba(96,90,133,.92));
      }
      .timing-back::after{
        content:'LUNEA  ·  TIME ORACLE'!important;
        position:absolute;
        left:0;right:0;bottom:28px;
        color:rgba(231,233,244,.75)!important;
        font:700 8px 'Cinzel',serif!important;
        letter-spacing:2.1px!important;
        text-align:center;
        text-shadow:0 0 14px rgba(199,183,243,.22)!important;
      }
      .timing-front{
        border:1px solid rgba(229,231,244,.30)!important;
        background:
          radial-gradient(circle at 50% 24%,rgba(139,112,210,.20),transparent 34%),
          radial-gradient(circle at 78% 72%,rgba(91,149,195,.12),transparent 31%),
          linear-gradient(155deg,#15182f 0%,#0b0e20 58%,#070916 100%)!important;
        overflow:hidden!important;
      }
      .timing-front::after{
        content:'';
        position:absolute;
        inset:0;
        pointer-events:none;
        z-index:7;
        opacity:.24;
        background:linear-gradient(115deg,transparent 15%,rgba(255,255,255,.17) 33%,rgba(200,185,244,.10) 39%,transparent 57%);
        transform:translateX(-120%);
      }
      .timing-inner.lunea-time-reveal .timing-front::after{
        animation:luneaTimingSweep 1.18s .34s cubic-bezier(.18,.72,.18,1) both;
      }
      @keyframes luneaTimingSweep{
        0%{transform:translateX(-125%);opacity:0}
        28%{opacity:.23}
        65%{opacity:.42}
        100%{transform:translateX(125%);opacity:0}
      }
      .timing-front > img{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        opacity:0!important;
        pointer-events:none!important;
      }
      .lunea-time-card-art{
        position:absolute;
        inset:0;
        z-index:2;
        display:flex;
        flex-direction:column;
        align-items:center;
        padding:18px 15px 17px;
        color:#f4f4fa;
        text-align:center;
        overflow:hidden;
      }
      .lunea-time-card-art::before{
        content:'';
        position:absolute;
        inset:0;
        pointer-events:none;
        opacity:.52;
        background-image:
          radial-gradient(circle at 18% 16%,rgba(255,255,255,.66) 0 1px,transparent 1.3px),
          radial-gradient(circle at 80% 12%,rgba(208,218,244,.54) 0 1px,transparent 1.3px),
          radial-gradient(circle at 74% 45%,rgba(198,181,241,.48) 0 1px,transparent 1.3px),
          radial-gradient(circle at 24% 61%,rgba(255,255,255,.34) 0 1px,transparent 1.2px),
          radial-gradient(circle at 86% 72%,rgba(180,208,235,.35) 0 1px,transparent 1.2px);
      }
      .lunea-time-kicker{
        position:relative;
        z-index:2;
        width:100%;
        display:flex;
        align-items:center;
        justify-content:space-between;
        color:rgba(226,229,242,.70);
        font:700 7.2px 'Cinzel',serif;
        letter-spacing:1.45px;
      }
      .lunea-time-kicker::before,
      .lunea-time-kicker::after{
        content:'';
        height:1px;
        width:25px;
        background:linear-gradient(90deg,transparent,rgba(223,226,242,.42));
      }
      .lunea-time-kicker::after{transform:scaleX(-1)}
      .lunea-time-dial{
        position:relative;
        width:132px;
        height:132px;
        margin:25px auto 16px;
        border-radius:50%;
        display:grid;
        place-items:center;
        border:1px solid rgba(224,227,241,.24);
        box-shadow:0 0 0 10px rgba(210,201,240,.025),0 0 0 22px rgba(151,134,207,.020),0 0 29px rgba(160,132,222,.10);
      }
      .lunea-time-dial::before,
      .lunea-time-dial::after{
        content:'';
        position:absolute;
        border-radius:50%;
        border:1px solid rgba(210,214,233,.13);
      }
      .lunea-time-dial::before{inset:10px}
      .lunea-time-dial::after{inset:29px;border-style:dashed;opacity:.75}
      .lunea-orbit-dot{
        position:absolute;
        width:5px;height:5px;border-radius:50%;
        background:#eff1f8;
        box-shadow:0 0 9px rgba(222,211,255,.72);
      }
      .lunea-orbit-dot.d1{left:12px;top:62px}
      .lunea-orbit-dot.d2{right:16px;top:25px;width:3px;height:3px}
      .lunea-orbit-dot.d3{right:8px;bottom:43px;width:4px;height:4px;background:#b9d3eb}
      .lunea-time-moon{
        width:57px;
        height:57px;
        border-radius:50%;
        position:relative;
        z-index:2;
        background:linear-gradient(145deg,#f4f5fa 0%,#c9ccda 39%,#8c89a8 100%);
        box-shadow:inset -8px -9px 13px rgba(74,69,99,.22),inset 5px 5px 10px rgba(255,255,255,.48),0 0 21px rgba(221,213,247,.22);
      }
      .lunea-time-moon::before{
        content:'';
        position:absolute;
        width:50px;height:50px;
        border-radius:50%;
        background:#0d1022;
        top:1px;
        left:17px;
        transition:transform .25s ease,left .25s ease,opacity .25s ease;
        box-shadow:-2px 0 4px rgba(17,19,39,.2);
      }
      .lunea-time-card-art[data-phase="full"] .lunea-time-moon::before{opacity:0}
      .lunea-time-card-art[data-phase="half"] .lunea-time-moon::before{left:29px}
      .lunea-time-card-art[data-phase="waning"] .lunea-time-moon::before{left:-10px}
      .lunea-time-card-art[data-phase="eclipse"] .lunea-time-moon{
        background:linear-gradient(145deg,#9581ca,#4e466f 58%,#24243c);
        box-shadow:0 0 0 1px rgba(211,200,241,.25),0 0 24px rgba(127,99,193,.32);
      }
      .lunea-time-card-art[data-phase="eclipse"] .lunea-time-moon::before{left:5px;top:5px;width:47px;height:47px;background:#090b18;opacity:.86}
      .lunea-time-hand{
        position:absolute;
        z-index:3;
        left:50%;top:50%;
        width:1px;height:48px;
        transform-origin:50% 100%;
        transform:translate(-50%,-100%) rotate(var(--dial-angle,34deg));
        background:linear-gradient(180deg,rgba(240,242,249,.92),rgba(190,175,232,.10));
        box-shadow:0 0 7px rgba(225,215,251,.32);
      }
      .lunea-time-hand::after{
        content:'';
        position:absolute;
        top:-2px;left:-2px;
        width:5px;height:5px;border-radius:50%;
        background:#eef0f7;
        box-shadow:0 0 8px rgba(230,220,255,.6);
      }
      .lunea-season-orbit{
        display:none;
        position:absolute;
        inset:25px;
        border-radius:50%;
      }
      .lunea-time-card-art[data-kind="season"] .lunea-season-orbit{display:block}
      .lunea-season-orbit i{
        position:absolute;width:8px;height:8px;border-radius:50%;
        border:1px solid rgba(235,237,247,.54);
        background:rgba(201,190,233,.18);
        box-shadow:0 0 10px rgba(191,172,235,.13);
      }
      .lunea-season-orbit i:nth-child(1){left:50%;top:-4px;transform:translateX(-50%)}
      .lunea-season-orbit i:nth-child(2){right:-4px;top:50%;transform:translateY(-50%)}
      .lunea-season-orbit i:nth-child(3){left:50%;bottom:-4px;transform:translateX(-50%)}
      .lunea-season-orbit i:nth-child(4){left:-4px;top:50%;transform:translateY(-50%)}
      .lunea-time-kind{
        position:relative;
        z-index:2;
        margin-top:auto;
        color:#a8a6b9;
        font:700 7.4px 'Cinzel',serif;
        letter-spacing:1.8px;
        text-transform:uppercase;
      }
      .timing-card-label{
        z-index:5!important;
        left:12px!important;
        right:12px!important;
        bottom:13px!important;
        padding:11px 9px 10px!important;
        border-radius:15px!important;
        color:#f4f4fa!important;
        background:linear-gradient(145deg,rgba(18,20,39,.79),rgba(9,11,25,.86))!important;
        backdrop-filter:blur(13px)!important;
        -webkit-backdrop-filter:blur(13px)!important;
        border:1px solid rgba(222,225,240,.17)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 7px 20px rgba(0,0,0,.19)!important;
      }
      .timing-card-label span{
        display:block!important;
        color:#c3b5e8!important;
        font:700 7.6px 'Cinzel',serif!important;
        letter-spacing:1.35px!important;
        text-transform:uppercase;
        margin-bottom:4px;
      }
      .timing-card-label b{
        display:block!important;
        color:#f7f7fb!important;
        font:600 15px 'Noto Serif KR',serif!important;
        letter-spacing:-.15px;
      }
      .timing-inner.lunea-time-reveal{
        filter:drop-shadow(0 0 9px rgba(182,155,240,.10));
      }

      /* result / actions */
      .timing-result{
        color:#d9d9e5!important;
        background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(154,134,210,.025))!important;
        border:1px solid rgba(220,223,239,.12)!important;
        border-radius:15px!important;
        padding:11px 12px!important;
        line-height:1.65!important;
      }
      .timing-result b{color:#ded2ff!important}
      .timing-actions .mini{
        color:#e0dfeb!important;
        background:linear-gradient(145deg,rgba(183,163,229,.10),rgba(105,137,182,.05))!important;
        border-color:rgba(217,220,235,.14)!important;
      }
      .timing-ai{
        color:#ecebf3!important;
        background:linear-gradient(145deg,rgba(29,28,53,.72),rgba(11,13,28,.84))!important;
        border-color:rgba(203,190,237,.18)!important;
      }

      /* inline timing support inside an RWS reading */
      .timing-inline{
        position:relative;
        overflow:hidden;
        margin:11px auto 14px!important;
        padding:11px 12px!important;
        border-radius:16px!important;
        max-width:365px!important;
        background:
          radial-gradient(circle at 10% 20%,rgba(151,124,218,.12),transparent 32%),
          linear-gradient(145deg,rgba(24,25,47,.70),rgba(10,12,27,.78))!important;
        border:1px solid rgba(216,220,238,.15)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 10px 24px rgba(0,0,0,.13)!important;
      }
      .timing-inline > img{display:none!important}
      .lunea-inline-orb{
        width:47px;height:47px;flex:0 0 47px;border-radius:50%;
        display:grid;place-items:center;
        border:1px solid rgba(224,227,241,.22);
        background:
          radial-gradient(circle at 37% 31%,rgba(255,255,255,.82) 0 1px,transparent 1.5px),
          linear-gradient(145deg,rgba(187,172,229,.22),rgba(82,121,170,.13));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 0 17px rgba(163,134,222,.08);
        color:#f0eff7;
        font-size:20px;
      }
      .timing-inline .txt small{color:#bfaee9!important;letter-spacing:1.1px!important}
      .timing-inline .txt b{color:#f4f3f8!important;font-size:12.5px!important}
      .timing-inline .txt span{color:#aaa9bb!important}

      @media(max-width:390px){
        .timing-flip{width:170px!important;height:284px!important}
        .lunea-time-dial{width:119px;height:119px;margin-top:22px}
        .lunea-time-moon{width:52px;height:52px}
        .lunea-time-moon::before{width:45px;height:45px}
      }

      @media(prefers-reduced-motion:reduce){
        .tarot-card,.timing-inner{transition-duration:.01ms!important}
        .tarot-card-wrapper.lunea-flip-reveal::after,
        .timing-inner.lunea-time-reveal .timing-front::after{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function classifyTiming(labelKo, labelEn){
    const k = `${labelKo} ${labelEn}`.toLowerCase();
    let kind = 'window';
    let phase = 'crescent';
    let angle = 34;
    let kindLabel = 'TIME WINDOW';

    if(/새벽|아침|오전|정오|오후|해질|저녁|밤|자정|dawn|morning|noon|afternoon|dusk|evening|night|midnight/.test(k)){
      kind = 'daypart'; kindLabel = 'CELESTIAL CLOCK'; phase = 'half';
      if(/새벽|dawn/.test(k)) angle = -72;
      else if(/이른 아침|early morning/.test(k)) angle = -48;
      else if(/오전|morning/.test(k)) angle = -20;
      else if(/정오|noon/.test(k)) angle = 0;
      else if(/늦은 오후|late afternoon/.test(k)) angle = 54;
      else if(/오후|afternoon/.test(k)) angle = 35;
      else if(/해질|dusk/.test(k)) angle = 72;
      else if(/저녁|evening/.test(k)) angle = 105;
      else if(/늦은 밤|late night/.test(k)) angle = 145;
      else if(/자정|midnight/.test(k)) angle = 180;
    } else if(/봄|여름|가을|겨울|계절|월초|월중|월말|분기|spring|summer|autumn|winter|season|month/.test(k)){
      kind = 'season'; kindLabel = 'SEASONAL ORBIT'; phase = 'full'; angle = 18;
    } else if(/지연|늦어|보류|불발|미정|아직|기다|정체|조건|흐림|delay|pending|unclear|wait|later|blocked|condition/.test(k)){
      kind = 'delay'; kindLabel = 'ECLIPSE SIGNAL'; phase = 'eclipse'; angle = 128;
    } else if(/몇 시간|오늘|24시간|2~3일|4~5일|this week|hours|today|24/.test(k)){
      kind = 'near'; kindLabel = 'NEAR ORBIT'; phase = 'crescent'; angle = 22;
    } else if(/주|week|한 달|month|개월/.test(k)){
      kind = 'cycle'; kindLabel = 'LUNAR CYCLE'; phase = 'half'; angle = 67;
    } else if(/장기|오래|long/.test(k)){
      kind = 'long'; kindLabel = 'DISTANT ORBIT'; phase = 'waning'; angle = 112;
    }

    return {kind,phase,angle,kindLabel};
  }

  function ensureTimingArt(){
    const front = document.querySelector('#timingOverlay .timing-front');
    if(!front) return null;
    let art = front.querySelector('.lunea-time-card-art');
    if(!art){
      art = document.createElement('div');
      art.className = 'lunea-time-card-art';
      art.innerHTML = `
        <div class="lunea-time-kicker">LUNEA</div>
        <div class="lunea-time-dial">
          <span class="lunea-orbit-dot d1"></span>
          <span class="lunea-orbit-dot d2"></span>
          <span class="lunea-orbit-dot d3"></span>
          <div class="lunea-season-orbit"><i></i><i></i><i></i><i></i></div>
          <div class="lunea-time-moon"></div>
          <div class="lunea-time-hand"></div>
        </div>
        <div class="lunea-time-kind">TIME WINDOW</div>`;
      const label = front.querySelector('.timing-card-label');
      if(label) front.insertBefore(art,label);
      else front.appendChild(art);
    }
    return art;
  }

  function updateTimingArt(){
    const art = ensureTimingArt();
    if(!art) return;
    const ko = $('timingLabelKo')?.textContent?.trim() || '';
    const en = $('timingLabelEn')?.textContent?.trim() || '';
    const meta = classifyTiming(ko,en);
    art.dataset.kind = meta.kind;
    art.dataset.phase = meta.phase;
    art.style.setProperty('--dial-angle', `${meta.angle}deg`);
    const kind = art.querySelector('.lunea-time-kind');
    if(kind) kind.textContent = meta.kindLabel;
  }

  function pulseTimingReveal(){
    const inner = $('timingInner');
    if(!inner) return;
    inner.classList.remove('lunea-time-reveal');
    void inner.offsetWidth;
    inner.classList.add('lunea-time-reveal');
    setTimeout(()=>inner.classList.remove('lunea-time-reveal'),1500);
  }

  function upgradeTimingInline(){
    const inline = $('luneaTimingInline');
    if(!inline) return;
    if(!inline.querySelector('.lunea-inline-orb')){
      const orb = document.createElement('div');
      orb.className = 'lunea-inline-orb';
      orb.setAttribute('aria-hidden','true');
      orb.textContent = '◐';
      const img = inline.querySelector('img');
      if(img) img.insertAdjacentElement('afterend',orb);
      else inline.prepend(orb);
    }
  }

  function upgradeTimingLabels(){
    const cat = $('luneaTimingCategory');
    const icon = cat?.querySelector('.cat-icon');
    if(icon && icon.dataset.luneaTimingV6 !== '1'){
      icon.textContent = '◐';
      icon.dataset.luneaTimingV6 = '1';
    }
    const support = $('timingSupportBtn');
    if(support && support.dataset.luneaTimingV6 !== '1'){
      support.textContent = '◐ 시기 오라클';
      support.dataset.luneaTimingV6 = '1';
    }
    const draw = $('timingDraw');
    if(draw && draw.dataset.luneaTimingV6 !== '1'){
      draw.textContent = '✦ 시기 신호 한 장 열기';
      draw.dataset.luneaTimingV6 = '1';
    }
    const sub = document.querySelector('#timingOverlay .sub');
    if(sub) sub.textContent = 'LUNEA · CELESTIAL TIME ORACLE';
    const title = document.querySelector('#timingOverlay .modal-h');
    if(title) title.textContent = 'Moon Dial';
  }

  function installTimingObserver(){
    const overlay = $('timingOverlay');
    if(!overlay || timingObserver) return !!overlay;
    upgradeTimingLabels();
    ensureTimingArt();
    updateTimingArt();
    upgradeTimingInline();

    timingObserver = new MutationObserver(mutations=>{
      let labelChanged = false;
      for(const m of mutations){
        const target = m.target?.nodeType === 1 ? m.target : m.target?.parentElement;
        if(target?.id === 'timingLabelKo' || target?.id === 'timingLabelEn' || target?.closest?.('#timingLabelKo,#timingLabelEn')) labelChanged = true;
      }
      upgradeTimingLabels();
      upgradeTimingInline();
      if(labelChanged) updateTimingArt();
    });
    timingObserver.observe(document.body,{childList:true,subtree:true,characterData:true});

    overlay.addEventListener('click',event=>{
      if(event.target?.closest?.('#timingFlip')) pulseTimingReveal();
    },true);

    const inner = $('timingInner');
    if(inner){
      new MutationObserver(()=>{
        if(inner.classList.contains('flipped')) pulseTimingReveal();
      }).observe(inner,{attributes:true,attributeFilter:['class']});
    }
    return true;
  }

  function revealTarotWrapper(card){
    const wrapper = card?.closest?.('.tarot-card-wrapper');
    if(!wrapper) return;
    wrapper.classList.remove('lunea-flip-reveal');
    void wrapper.offsetWidth;
    wrapper.classList.add('lunea-flip-reveal');
    setTimeout(()=>wrapper.classList.remove('lunea-flip-reveal'),1120);
  }

  function installTarotObserver(){
    const cards = $('cards');
    if(!cards || tarotObserver) return !!cards;
    const last = new WeakMap();
    cards.querySelectorAll('.tarot-card').forEach(card=>last.set(card,card.classList.contains('flipped')));
    tarotObserver = new MutationObserver(mutations=>{
      for(const m of mutations){
        if(m.type === 'childList'){
          m.addedNodes.forEach(node=>{
            if(node.nodeType!==1) return;
            node.querySelectorAll?.('.tarot-card').forEach(card=>last.set(card,card.classList.contains('flipped')));
            if(node.matches?.('.tarot-card')) last.set(node,node.classList.contains('flipped'));
          });
          continue;
        }
        const card = m.target;
        if(!card?.classList?.contains('tarot-card')) continue;
        const now = card.classList.contains('flipped');
        const prev = last.get(card);
        last.set(card,now);
        if(prev !== now) revealTarotWrapper(card);
      }
    });
    tarotObserver.observe(cards,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    return true;
  }

  function boot(){
    // Important: this script is loaded before timing-oracle-v1.js in the page,
    // so styles/DOM upgrades are intentionally installed at window load.
    addStyles();
    let tries = 0;
    const timer = setInterval(()=>{
      tries += 1;
      const timing = installTimingObserver();
      const tarot = installTarotObserver();
      upgradeTimingLabels();
      upgradeTimingInline();
      if((timing && tarot) || tries > 140) clearInterval(timer);
    },80);
    installTarotObserver();
  }

  if(document.readyState === 'complete') setTimeout(boot,0);
  else W.addEventListener('load',boot,{once:true});
})();
