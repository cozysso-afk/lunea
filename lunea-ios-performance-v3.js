'use strict';

/*
  LUNEA iOS Performance V3 — repaint/hit-test recovery
  ----------------------------------------------------
  Keeps the original 3D tarot flip.
  Removes the iOS paint-containment combination that can leave a card's
  flipped class updated without repainting until pageshow/visibilitychange.
  Also avoids sticky+backdrop-filter hit-testing glitches in CELESTIAL PROFILE.

  Does NOT touch:
  - RNG / secure shuffle / card selection
  - Spread routing / question analysis
  - Timing Oracle / astrology calculations
  - archive / interpretation prompts
*/
(() => {
  if (window.__LUNEA_IOS_PERFORMANCE_V3__) return;
  window.__LUNEA_IOS_PERFORMANCE_V3__ = true;

  const W = window;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  const isiOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isiOS) {
    console.info('✦ LUNEA iOS Performance V3 skipped (non-iOS)');
    return;
  }

  document.documentElement.classList.add('lunea-ios-performance-v3');

  const style = document.createElement('style');
  style.id = 'luneaIOSPerformanceV3Style';
  style.textContent = `
    html.lunea-ios-performance-v3 body{
      background-attachment:scroll!important;
    }

    /* Spread: keep 3D, drop expensive full-screen blur. */
    html.lunea-ios-performance-v3 #spreadOverlay{
      background:rgba(5,3,10,.96)!important;
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .cards{
      perspective:1000px!important;
      -webkit-perspective:1000px!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card{
      transform-style:preserve-3d!important;
      -webkit-transform-style:preserve-3d!important;
      -webkit-backface-visibility:hidden!important;
      backface-visibility:hidden!important;
      transition:transform .68s cubic-bezier(.3,.8,.2,1)!important;
      will-change:transform;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .back,
    html.lunea-ios-performance-v3 #spreadOverlay .front{
      -webkit-backface-visibility:hidden!important;
      backface-visibility:hidden!important;
    }

    /*
      Critical fix:
      do NOT paint-contain the wrapper around a nested preserve-3d transform.
      On iOS Safari this can defer the visible repaint until app resume.
    */
    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
      contain:none!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .front img,
    html.lunea-ios-performance-v3 #spreadOverlay .back img{
      image-rendering:auto;
      -webkit-user-drag:none;
    }

    /*
      CELESTIAL PROFILE:
      sticky + backdrop-filter inside the scrolling modal can create delayed
      hit-testing and awkward tab transitions on iOS Safari.
    */
    html.lunea-ios-performance-v3 #profileOverlay{
      background:rgba(5,3,10,.97)!important;
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
    }

    html.lunea-ios-performance-v3 #profileOverlay .cpv3-tabs{
      position:relative!important;
      top:auto!important;
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
      -webkit-transform:none!important;
      transform:none!important;
    }

    html.lunea-ios-performance-v3 #profileOverlay .cpv3-tab{
      pointer-events:auto!important;
      touch-action:manipulation!important;
    }

    /*
      Use the normal overflow scroller rather than forcing the legacy
      momentum-scrolling compositor inside this already complex modal.
    */
    html.lunea-ios-performance-v3 #profileOverlay .modal{
      -webkit-overflow-scrolling:auto!important;
    }

    @media (prefers-reduced-motion:reduce){
      html.lunea-ios-performance-v3 #spreadOverlay .tarot-card{
        transition-duration:.01ms!important;
      }
      html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
        animation-duration:.01ms!important;
      }
    }
  `;
  document.head.appendChild(style);

  function thumbURL(url, width = 360) {
    const raw = String(url || '');
    if (!raw) return raw;

    if (
      /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:(?:FilePath|Redirect\/file)\//i.test(raw)
    ) {
      try {
        const u = new URL(raw);
        u.searchParams.set('width', String(width));
        return u.toString();
      } catch {
        return raw + (raw.includes('?') ? '&' : '?') + 'width=' + width;
      }
    }

    return raw;
  }

  function tuneImg(img) {
    if (!img) return;
    try {
      img.decoding = 'async';
      img.draggable = false;
      img.loading = 'eager';
      if ('fetchPriority' in img) img.fetchPriority = 'low';
    } catch {}
  }

  /*
    Keep original flipAt(). Only retain the existing thumbnail optimization
    in makeCardWrapper.
  */
  const oldMakeCardWrapper = W.makeCardWrapper;

  if (typeof oldMakeCardWrapper === 'function') {
    W.makeCardWrapper = function(i, card, isReversed) {
      const wrapper = document.createElement('div');
      wrapper.className = 'tarot-card-wrapper';
      wrapper.dataset.index = String(i);
      wrapper.style.animationDelay = (i * 0.07) + 's';

      let prefix = 'back_general';
      try {
        if (typeof W.deckBackPrefix === 'function') prefix = W.deckBackPrefix();
      } catch {}

      const tarot = document.createElement('div');
      tarot.className = 'tarot-card' + (isReversed ? ' reversed' : '');
      tarot.id = 'card-' + i;

      const back = document.createElement('div');
      back.className = 'back';

      const backImg = document.createElement('img');
      backImg.src = prefix + '.PNG';
      backImg.alt = '';
      tuneImg(backImg);
      backImg.addEventListener('error', () => {
        backImg.style.display = 'none';
      }, {once:true});
      back.appendChild(backImg);

      const front = document.createElement('div');
      front.className = 'front';

      const frontImg = document.createElement('img');
      frontImg.src = thumbURL(card?.img, 360);
      frontImg.alt = String(card?.name || '');
      tuneImg(frontImg);
      frontImg.addEventListener('error', () => {
        frontImg.style.opacity = '.15';
      }, {once:true});
      front.appendChild(frontImg);

      tarot.appendChild(back);
      tarot.appendChild(front);
      wrapper.appendChild(tarot);

      return wrapper;
    };

    console.info('✦ LUNEA iOS Performance V3 patched makeCardWrapper');
  } else {
    console.warn('[LUNEA iOS Performance V3] makeCardWrapper not found');
  }

  /*
    After CELESTIAL PROFILE changes tabs, reset that modal to the top.
    This avoids inheriting Western's deep scroll offset when opening Saju/Thai.
    No click is cancelled and no existing tab handler is replaced.
  */
  document.addEventListener('click', event => {
    const tab = event.target?.closest?.('#profileOverlay [data-cpv3-tab]');
    if (!tab) return;

    requestAnimationFrame(() => {
      const modal = document.querySelector('#profileOverlay .modal');
      if (modal) {
        try {
          modal.scrollTo({top:0, left:0, behavior:'auto'});
        } catch {
          modal.scrollTop = 0;
        }
      }
    });
  }, {passive:true});

  /* Resume resilience: image attributes only; never force flip/display state. */
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('#cards .tarot-card img').forEach(tuneImg);
  });

  console.info('✦ LUNEA iOS Performance V3 loaded');
})();
