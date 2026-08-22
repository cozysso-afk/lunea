'use strict';

/*
  LUNEA iOS Performance / Flip Fix V2

  Purpose
  - Reduce iPhone/iPad Safari card decode/compositor pressure.
  - Render Wikimedia tarot fronts as ~320px thumbnails instead of original-size files.
  - Remove 3D / opacity / spawn-animation compositor work while the spread is open.
  - Use direct display swap for back/front on iOS.

  Does NOT touch
  - RNG / secureShuffle / secureRandomInt / card selection
  - fixed spreads
  - archive
  - astrology calculations
  - AI prompts / interpretation
*/
(() => {
  if (window.__LUNEA_IOS_PERFORMANCE_FIX_V2__) return;
  window.__LUNEA_IOS_PERFORMANCE_FIX_V2__ = true;

  const W = window;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isiOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isiOS) {
    console.info('✦ LUNEA iOS Performance Fix V2 skipped (non-iOS)');
    return;
  }

  document.documentElement.classList.add('lunea-ios-performance-v2');

  const style = document.createElement('style');
  style.id = 'luneaIOSPerformanceFixV2Style';
  style.textContent = `
    html.lunea-ios-performance-v2 body{
      background-attachment:scroll!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay,
    html.lunea-ios-performance-v2 #astroTransitOverlay,
    html.lunea-ios-performance-v2 #astroReturnOverlay,
    html.lunea-ios-performance-v2 #thaiTaksaOverlay{
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay{
      background:rgba(5,3,10,.99)!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .modal{
      -webkit-transform:none!important;
      transform:none!important;
      box-shadow:none!important;
      contain:none!important;
      isolation:auto!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .cards{
      perspective:none!important;
      -webkit-perspective:none!important;
      contain:none!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card-wrapper{
      opacity:1!important;
      transform:none!important;
      -webkit-transform:none!important;
      animation:none!important;
      -webkit-animation:none!important;
      transition:none!important;
      -webkit-transition:none!important;
      contain:none!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card{
      -webkit-transform:none!important;
      transform:none!important;
      -webkit-transform-style:flat!important;
      transform-style:flat!important;
      -webkit-backface-visibility:visible!important;
      backface-visibility:visible!important;
      transition:none!important;
      -webkit-transition:none!important;
      will-change:auto!important;
      box-shadow:none!important;
      contain:none!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card .back,
    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card .front{
      -webkit-transform:none!important;
      transform:none!important;
      -webkit-backface-visibility:visible!important;
      backface-visibility:visible!important;
      transition:none!important;
      -webkit-transition:none!important;
      opacity:1!important;
      contain:none!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card .back{
      display:grid!important;
      visibility:visible!important;
      z-index:2!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card .front{
      display:none!important;
      visibility:hidden!important;
      z-index:1!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card.flipped .back{
      display:none!important;
      visibility:hidden!important;
      z-index:1!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card.flipped .front{
      display:block!important;
      visibility:visible!important;
      z-index:2!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card.reversed .front img{
      -webkit-transform:rotate(180deg)!important;
      transform:rotate(180deg)!important;
    }

    html.lunea-ios-performance-v2 #spreadOverlay .tarot-card-wrapper img{
      -webkit-transform:translateZ(0);
      image-rendering:auto;
    }
  `;
  document.head.appendChild(style);

  function thumbURL(url, width = 320) {
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
    Critical V2 change:
    Replace LUNEA's global makeCardWrapper before the next spread is created.
    The original implementation injects card.img directly, which can request
    full-resolution Wikimedia files for all face-down cards.
  */
  const oldMakeCardWrapper = W.makeCardWrapper;

  if (typeof oldMakeCardWrapper === 'function') {
    W.makeCardWrapper = function(i, card, isReversed) {
      const wrapper = document.createElement('div');
      wrapper.className = 'tarot-card-wrapper';
      wrapper.dataset.index = String(i);
      wrapper.style.animationDelay = '0s';

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
      frontImg.src = thumbURL(card?.img, 320);
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
  } else {
    console.warn('[LUNEA iOS Performance V2] makeCardWrapper not found');
  }

  function syncCard(card) {
    if (!(card instanceof HTMLElement)) return;

    const front = card.querySelector('.front');
    const back = card.querySelector('.back');
    const flipped = card.classList.contains('flipped');

    if (front) {
      front.style.display = flipped ? 'block' : 'none';
      front.style.visibility = flipped ? 'visible' : 'hidden';
      front.style.opacity = '1';
    }
    if (back) {
      back.style.display = flipped ? 'none' : 'grid';
      back.style.visibility = flipped ? 'hidden' : 'visible';
      back.style.opacity = '1';
    }
  }

  /*
    Keep the original flip logic/renderInfo, then force a plain display swap.
    This avoids relying on Safari committing a 3D/opacity compositor layer.
  */
  const oldFlipAt = W.flipAt;
  if (typeof oldFlipAt === 'function') {
    W.flipAt = function(i) {
      oldFlipAt.call(this, i);
      const card = document.getElementById('card-' + i);
      if (card) {
        syncCard(card);
        void card.offsetHeight;
      }
    };
  }

  const cards = document.getElementById('cards');
  if (cards) {
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;

          if (node.matches?.('img')) tuneImg(node);
          node.querySelectorAll?.('img').forEach(tuneImg);

          if (node.matches?.('.tarot-card')) syncCard(node);
          node.querySelectorAll?.('.tarot-card').forEach(syncCard);
        }

        if (
          record.type === 'attributes' &&
          record.target instanceof HTMLElement &&
          record.target.classList.contains('tarot-card')
        ) {
          syncCard(record.target);
        }
      }
    });

    observer.observe(cards, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class']
    });
  }

  function resyncAll() {
    document.querySelectorAll('#cards .tarot-card').forEach(card => {
      syncCard(card);
      void card.offsetHeight;
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resyncAll();
  });

  window.addEventListener('pageshow', resyncAll);

  console.info('✦ LUNEA iOS Performance / Flip Fix V2 loaded');
})();
