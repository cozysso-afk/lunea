'use strict';

/*
  LUNEA iOS Performance V3
  Goal
  - Keep the original 3D tarot flip animation alive.
  - Reduce iPhone/iPad Safari lag by lowering image decode / paint cost.
  - Do NOT replace flip logic with display swap.
  - Do NOT disable preserve-3d / rotateY / transition.

  Safe scope
  - iOS only
  - RWS RNG / secure shuffle / spread logic untouched
  - astrology / archive / prompts untouched
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

  // ------------------------------------------------------------------
  // 1) Light CSS tuning only
  //    Keep 3D. Reduce expensive iOS paint/compositing pressure.
  // ------------------------------------------------------------------
  const style = document.createElement('style');
  style.id = 'luneaIOSPerformanceV3Style';
  style.textContent = `
    html.lunea-ios-performance-v3 body{
      background-attachment: scroll !important;
    }

    /* Keep the spread modal mood, but lower blur cost a bit on iOS */
    html.lunea-ios-performance-v3 #spreadOverlay{
      background: rgba(5,3,10,.92) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      backdrop-filter: blur(8px) !important;
    }

    /* Preserve original 3D behavior */
    html.lunea-ios-performance-v3 #spreadOverlay .cards{
      perspective: 1000px !important;
      -webkit-perspective: 1000px !important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card{
      transform-style: preserve-3d !important;
      -webkit-transform-style: preserve-3d !important;
      -webkit-backface-visibility: hidden !important;
      backface-visibility: hidden !important;
      transition: transform .68s cubic-bezier(.3,.8,.2,1) !important;
      will-change: transform;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .back,
    html.lunea-ios-performance-v3 #spreadOverlay .front{
      -webkit-backface-visibility: hidden !important;
      backface-visibility: hidden !important;
    }

    /* Make card paint regions a bit cheaper without killing animation */
    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
      contain: layout paint;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .front img,
    html.lunea-ios-performance-v3 #spreadOverlay .back img{
      image-rendering: auto;
      -webkit-user-drag: none;
    }

    /* Respect reduced motion if user/device asks for it */
    @media (prefers-reduced-motion: reduce){
      html.lunea-ios-performance-v3 #spreadOverlay .tarot-card{
        transition-duration: .01ms !important;
      }
      html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
        animation-duration: .01ms !important;
      }
    }
  `;
  document.head.appendChild(style);

  // ------------------------------------------------------------------
  // 2) Thumbnail URL conversion
  //    Main performance win: do NOT decode giant Wikimedia images on iPhone
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 3) Patch only makeCardWrapper
  //    Important: keep original flipAt() and original 3D class toggling.
  // ------------------------------------------------------------------
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
      }, { once: true });
      back.appendChild(backImg);

      const front = document.createElement('div');
      front.className = 'front';

      const frontImg = document.createElement('img');
      frontImg.src = thumbURL(card?.img, 360);
      frontImg.alt = String(card?.name || '');
      tuneImg(frontImg);
      frontImg.addEventListener('error', () => {
        frontImg.style.opacity = '.15';
      }, { once: true });
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

  // ------------------------------------------------------------------
  // 4) Small resilience fix on pageshow
  // ------------------------------------------------------------------
  window.addEventListener('pageshow', () => {
    const cards = document.querySelectorAll('#cards .tarot-card img');
    cards.forEach(tuneImg);
  });

  console.info('✦ LUNEA iOS Performance V3 loaded');
})();
