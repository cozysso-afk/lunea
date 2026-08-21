'use strict';

/*
  LUNEA iOS FLIP FIX V1
  Fixes iPhone/iPad Safari case where a card tap is accepted
  but the 3D flip is not painted until app background/foreground.

  Does NOT touch:
  - RNG / card selection
  - Spread V7.4
  - archive
  - astrology calculations
  - AI prompt
*/
(() => {
  if (window.__LUNEA_IOS_FLIP_FIX_V1__) return;
  window.__LUNEA_IOS_FLIP_FIX_V1__ = true;

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isiOS = /iPad|iPhone|iPod/.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isiOS) {
    console.info('✦ LUNEA iOS Flip Fix skipped (non-iOS)');
    return;
  }

  document.documentElement.classList.add('lunea-ios-flip-lite');

  const style = document.createElement('style');
  style.id = 'luneaIOSFlipFixStyle';
  style.textContent = `
    html.lunea-ios-flip-lite body{
      background-attachment:scroll!important;
    }

    html.lunea-ios-flip-lite #spreadOverlay{
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
      background:rgba(5,3,10,.985)!important;
    }

    html.lunea-ios-flip-lite #spreadOverlay .modal{
      -webkit-transform:none!important;
      transform:none!important;
      isolation:isolate;
    }

    html.lunea-ios-flip-lite #spreadOverlay .cards{
      perspective:none!important;
      -webkit-perspective:none!important;
      contain:layout paint style;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card-wrapper{
      contain:layout paint;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card{
      -webkit-transform:none!important;
      transform:none!important;
      -webkit-transform-style:flat!important;
      transform-style:flat!important;
      transition:none!important;
      -webkit-transition:none!important;
      will-change:auto!important;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card .back,
    html.lunea-ios-flip-lite #spreadOverlay .tarot-card .front{
      -webkit-backface-visibility:visible!important;
      backface-visibility:visible!important;
      -webkit-transform:none!important;
      transform:none!important;
      transition:opacity .12s ease-out!important;
      -webkit-transition:opacity .12s ease-out!important;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card .back{
      opacity:1;
      visibility:visible;
      z-index:2;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card .front{
      opacity:0;
      visibility:hidden;
      z-index:1;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card.flipped .back{
      opacity:0;
      visibility:hidden;
      z-index:1;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card.flipped .front{
      opacity:1;
      visibility:visible;
      z-index:2;
    }

    html.lunea-ios-flip-lite #spreadOverlay .tarot-card.reversed .front img{
      -webkit-transform:rotate(180deg)!important;
      transform:rotate(180deg)!important;
    }

    html.lunea-ios-flip-lite #astroTransitOverlay,
    html.lunea-ios-flip-lite #astroReturnOverlay,
    html.lunea-ios-flip-lite #thaiTaksaOverlay{
      -webkit-backdrop-filter:none!important;
      backdrop-filter:none!important;
    }
  `;
  document.head.appendChild(style);

  const cards = document.getElementById('cards');

  function tuneImg(img){
    try{
      img.decoding = 'async';
      img.draggable = false;
    }catch{}
  }

  document.querySelectorAll('#cards img').forEach(tuneImg);

  if (cards) {
    const imageObserver = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches?.('img')) tuneImg(node);
          node.querySelectorAll?.('img').forEach(tuneImg);
        }
      }
    });

    imageObserver.observe(cards, {childList:true, subtree:true});

    const flipObserver = new MutationObserver(records => {
      for (const record of records) {
        const card = record.target;
        if (!(card instanceof HTMLElement)) continue;
        if (!card.classList.contains('tarot-card')) continue;

        // The class is already flipped by LUNEA.
        // This only forces WebKit to commit the new paint immediately.
        void card.offsetWidth;

        const front = card.querySelector('.front');
        const back = card.querySelector('.back');
        if (card.classList.contains('flipped')) {
          if (front) {
            front.style.visibility = 'visible';
            front.style.opacity = '1';
          }
          if (back) {
            back.style.visibility = 'hidden';
            back.style.opacity = '0';
          }
        }
      }
    });

    flipObserver.observe(cards, {
      subtree:true,
      attributes:true,
      attributeFilter:['class']
    });
  }

  // When Safari resumes, repaint once without changing card state.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    document.querySelectorAll('#cards .tarot-card').forEach(card => {
      void card.offsetWidth;
    });
  });

  console.info('✦ LUNEA iOS FLIP FIX V1 loaded');
})();
