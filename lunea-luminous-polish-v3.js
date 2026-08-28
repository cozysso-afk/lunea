'use strict';

/*
  LUNEA Luminous Polish V3
  Screenshot-driven final home polish.
  Visual-only: density, opal/silver surfaces, hierarchy, and iOS safe-area veil.
  No tarot draw, spread routing, Horary, astrology, archive, or profile logic changes.
*/
(() => {
  if (window.__LUNEA_LUMINOUS_POLISH_V3__) return;
  window.__LUNEA_LUMINOUS_POLISH_V3__ = true;
  document.documentElement.classList.add('lunea-luminous-polish-v3');

  const style = document.createElement('style');
  style.id = 'luneaLuminousPolishV3Style';
  style.textContent = `
    @keyframes luneaOpalDrift{
      0%,100%{background-position:0% 50%}
      50%{background-position:100% 50%}
    }
    @keyframes luneaIconGlow{
      0%,100%{filter:brightness(1) saturate(.92)}
      50%{filter:brightness(1.08) saturate(1.05)}
    }

    /* Keep scrolled content from visually colliding with iOS status icons. */
    #luneaSafeAreaVeil{
      position:fixed;
      top:0;left:0;right:0;
      height:max(env(safe-area-inset-top), 24px);
      z-index:9999;
      pointer-events:none;
      background:linear-gradient(180deg,#050713 0%,rgba(5,7,19,.97) 72%,rgba(5,7,19,.72) 88%,transparent 100%);
      display:none;
    }
    html.lunea-standalone #luneaSafeAreaVeil{display:block}

    /* Home rhythm: slightly tighter, not cramped. */
    html.lunea-luminous-polish-v3 .app{
      padding-left:15px!important;
      padding-right:15px!important;
    }

    html.lunea-luminous-polish-v3 .daily{
      margin-bottom:23px!important;
    }

    html.lunea-luminous-polish-v3 .eyebrow{
      margin-bottom:5px!important;
      opacity:.9;
    }

    html.lunea-luminous-polish-v3 .section-title{
      margin-bottom:15px!important;
      font-size:18.5px!important;
    }

    /* LAST READING is utility chrome, not a second hero. */
    html.lunea-luminous-polish-v3 #luneaReadingDraftResume{
      min-height:46px!important;
      margin-bottom:10px!important;
      padding:7px 9px!important;
      border-radius:14px!important;
      border-color:rgba(201,207,225,.085)!important;
      background:linear-gradient(145deg,rgba(15,20,34,.53),rgba(9,11,23,.58))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.022)!important;
      opacity:.94;
    }
    html.lunea-luminous-polish-v3 #luneaReadingDraftResume::before{
      content:'';
      position:absolute;
      left:9%;right:20%;top:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(220,226,244,.18),transparent);
    }
    html.lunea-luminous-polish-v3 .lrd-kicker{font-size:7.3px!important;letter-spacing:1.15px!important}
    html.lunea-luminous-polish-v3 .lrd-title{font-size:9.9px!important;margin:2px 0 1px!important}
    html.lunea-luminous-polish-v3 .lrd-q{font-size:8.2px!important;color:#7f8293!important}
    html.lunea-luminous-polish-v3 .lrd-actions{gap:4px!important}
    html.lunea-luminous-polish-v3 .lrd-actions button{
      min-height:29px!important;
      padding:5px 8px!important;
      border-radius:9px!important;
      font-size:8.8px!important;
      gap:4px;
      display:inline-flex;align-items:center;justify-content:center;
    }
    html.lunea-luminous-polish-v3 .lrd-actions svg{width:12px;height:12px}

    /* DAILY CTA: pearlescent silver-lavender rather than a generic purple button. */
    html.lunea-luminous-polish-v3 .daily .primary{
      color:#fff!important;
      border-color:rgba(245,247,255,.45)!important;
      background:
        linear-gradient(112deg,
          #d9d9fa 0%,
          #a994ea 19%,
          #8f83d5 36%,
          #99bde1 54%,
          #c5b7ef 72%,
          #8c7dd2 88%,
          #d9e4f2 100%)!important;
      background-size:220% 220%!important;
      animation:luneaOpalDrift 7.5s ease-in-out infinite;
      text-shadow:0 1px 9px rgba(57,46,100,.34);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.52),
        inset 0 -1px 0 rgba(90,82,146,.18),
        0 8px 22px rgba(83,72,151,.24),
        0 0 20px rgba(182,176,241,.12)!important;
    }

    /* Category stack: smaller, quieter, with top-edge moonlight instead of a full hard outline. */
    html.lunea-luminous-polish-v3 .category{
      position:relative!important;
      margin-bottom:10px!important;
      border-radius:23px!important;
      border-color:rgba(216,220,238,.085)!important;
      background:
        radial-gradient(circle at 7% 20%,rgba(170,147,229,.045),transparent 24%),
        linear-gradient(145deg,rgba(17,20,38,.66),rgba(8,10,22,.69))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.025),
        0 11px 25px rgba(0,0,0,.09)!important;
    }
    html.lunea-luminous-polish-v3 .category::before{
      content:'';
      position:absolute;
      z-index:1;
      left:9%;right:14%;top:0;height:1px;
      pointer-events:none;
      background:linear-gradient(90deg,transparent,rgba(235,238,250,.23) 45%,rgba(189,178,226,.09) 72%,transparent);
    }
    html.lunea-luminous-polish-v3 .category-header{
      min-height:68px!important;
      padding:12px 15px!important;
    }
    html.lunea-luminous-polish-v3 .cat-left{gap:12px!important}

    /* Opal / silver glass icon medallions. */
    html.lunea-luminous-polish-v3 .cat-icon{
      width:39px!important;height:39px!important;flex:0 0 39px!important;
      color:#f1f1fb!important;
      border-color:rgba(235,238,248,.19)!important;
      background:
        radial-gradient(circle at 29% 22%,rgba(255,255,255,.39),transparent 17%),
        radial-gradient(circle at 72% 74%,rgba(131,180,218,.14),transparent 35%),
        conic-gradient(from 225deg,
          rgba(123,109,181,.25),
          rgba(217,213,242,.20),
          rgba(116,159,198,.17),
          rgba(185,163,225,.24),
          rgba(123,109,181,.25))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.22),
        inset 0 0 14px rgba(218,209,250,.07),
        0 0 0 1px rgba(139,125,184,.07),
        0 0 17px rgba(146,126,207,.07)!important;
      animation:luneaIconGlow 6.8s ease-in-out infinite;
    }
    html.lunea-luminous-polish-v3 .cat-icon svg{width:19px!important;height:19px!important;stroke-width:1.55!important}

    html.lunea-luminous-polish-v3 .cat-text h3{
      font-size:14px!important;
      letter-spacing:.82px!important;
    }
    html.lunea-luminous-polish-v3 .cat-text p{
      margin-top:4px!important;
      font-size:9.5px!important;
      color:#85889b!important;
      max-width:270px!important;
    }
    html.lunea-luminous-polish-v3 .toggle{
      width:25px!important;height:25px!important;
      font-size:17px!important;
      color:#7e8294!important;
    }
    html.lunea-luminous-polish-v3 .category.active{
      border-color:rgba(205,195,232,.16)!important;
      background:
        radial-gradient(circle at 9% 10%,rgba(165,142,224,.075),transparent 26%),
        linear-gradient(145deg,rgba(22,24,45,.76),rgba(9,11,24,.78))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 14px 30px rgba(0,0,0,.12)!important;
    }

    /* Open category contents stay readable after the compact header treatment. */
    html.lunea-luminous-polish-v3 .category-content{padding:0 15px 7px!important}
    html.lunea-luminous-polish-v3 .reading-item{padding:11px 1px!important}

    /* Header icon surfaces: reduce outline, increase silver glass impression. */
    html.lunea-luminous-polish-v3 .head-actions .icon-btn{
      border-color:rgba(224,227,241,.10)!important;
      background:
        radial-gradient(circle at 31% 22%,rgba(255,255,255,.07),transparent 24%),
        linear-gradient(145deg,rgba(22,25,45,.67),rgba(9,11,24,.69))!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 7px 17px rgba(0,0,0,.12)!important;
    }

    /* Slightly soften metadata outlines too. */
    html.lunea-luminous-polish-v3 .profile-strip{
      border-color:rgba(216,220,237,.085)!important;
    }
    html.lunea-luminous-polish-v3 .engine-strip{
      border-color:rgba(177,210,202,.075)!important;
      opacity:.91;
    }

    @media(max-width:390px){
      html.lunea-luminous-polish-v3 .app{padding-left:12px!important;padding-right:12px!important}
      html.lunea-luminous-polish-v3 .daily{margin-bottom:21px!important}
      html.lunea-luminous-polish-v3 .section-title{margin-bottom:13px!important}
      html.lunea-luminous-polish-v3 .category{margin-bottom:9px!important;border-radius:21px!important}
      html.lunea-luminous-polish-v3 .category-header{min-height:64px!important;padding:11px 13px!important}
      html.lunea-luminous-polish-v3 .cat-icon{width:37px!important;height:37px!important;flex-basis:37px!important}
      html.lunea-luminous-polish-v3 .cat-text h3{font-size:13.2px!important}
      html.lunea-luminous-polish-v3 .cat-text p{font-size:9.1px!important;max-width:235px!important}
    }

    @media(prefers-reduced-motion:reduce){
      html.lunea-luminous-polish-v3 .daily .primary,
      html.lunea-luminous-polish-v3 .cat-icon{animation:none!important}
    }
  `;
  document.head.appendChild(style);

  const lineSvg = body => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const restoreIcon = lineSvg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>');
  const trashIcon = lineSvg('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 13h8l1-13"/>');

  function polishDynamicUI(){
    const restore = document.getElementById('luneaDraftRestore');
    const discard = document.getElementById('luneaDraftDiscard');
    if (restore && !restore.dataset.v3Polished) {
      restore.dataset.v3Polished = '1';
      restore.innerHTML = `${restoreIcon}<span>복원</span>`;
    }
    if (discard && !discard.dataset.v3Polished) {
      discard.dataset.v3Polished = '1';
      discard.innerHTML = `${trashIcon}<span>삭제</span>`;
    }
  }

  function installSafeAreaVeil(){
    const standalone = !!window.navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches;
    if (!standalone) return;
    document.documentElement.classList.add('lunea-standalone');
    if (document.getElementById('luneaSafeAreaVeil')) return;
    const veil = document.createElement('div');
    veil.id = 'luneaSafeAreaVeil';
    veil.setAttribute('aria-hidden','true');
    document.body.appendChild(veil);
  }

  const run = () => {
    polishDynamicUI();
    installSafeAreaVeil();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();

  const observer = new MutationObserver(() => requestAnimationFrame(polishDynamicUI));
  observer.observe(document.documentElement, {childList:true, subtree:true});

  console.info('✦ LUNEA Luminous Polish V3 active');
})();
