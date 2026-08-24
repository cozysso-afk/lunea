'use strict';

/*
  LUNEA iOS Performance V3 — re-entry + repaint recovery
  ------------------------------------------------------
  Fixes:
  - iOS Safari card flip repaint delay
  - CELESTIAL PROFILE second-open / stale modal lock
  - hidden overlay pointer-event residue

  Preserves:
  - original 3D rotateY flip
  - RNG / card draw
  - spread routing
  - Timing / Natal / Transit / Return calculations
  - archive / prompts
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

    /* Critical: nested 3D must not sit inside paint containment on iOS. */
    html.lunea-ios-performance-v3 #spreadOverlay .tarot-card-wrapper{
      contain:none!important;
    }

    html.lunea-ios-performance-v3 #spreadOverlay .front img,
    html.lunea-ios-performance-v3 #spreadOverlay .back img{
      image-rendering:auto;
      -webkit-user-drag:none;
    }

    /* Keep profile hit targets explicit, but do not alter its scroll/compositor layout. */
    html.lunea-ios-performance-v3 #profileBtn,
    html.lunea-ios-performance-v3 #profileStrip,
    html.lunea-ios-performance-v3 #profileOverlay button{
      touch-action:manipulation!important;
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
    Keep the original flipAt(). Only replace card construction so iPhone
    decodes smaller Wikimedia images.
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
  }

  /*
    Generic stale-lock repair.
    The base app's hideOverlay removes modal-open, but iOS resume/re-entry can
    leave inline pointer state or a body lock out of sync with .show.
  */
  function repairOverlayState() {
    const overlays = [...document.querySelectorAll('.overlay')];
    let anyShown = false;

    overlays.forEach(overlay => {
      const shown = overlay.classList.contains('show');
      anyShown ||= shown;

      overlay.setAttribute('aria-hidden', shown ? 'false' : 'true');
      overlay.style.pointerEvents = shown ? 'auto' : 'none';
    });

    if (anyShown) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('touch-action');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
    }
  }

  /*
    IMPORTANT re-entry fix:
    Main index originally does:
      loadProfileForm(); showOverlay('profileOverlay')
    If any profile wrapper throws on a later open, showOverlay is never reached.
    On iOS we reverse that order: make the modal interactive first, then refresh
    its form inside try/catch. A profile refresh error can no longer freeze
    access to the modal.
  */
  let openingProfile = false;

  function openProfileSafely() {
    if (openingProfile) return;
    openingProfile = true;

    const overlay = document.getElementById('profileOverlay');
    if (!overlay) {
      openingProfile = false;
      return;
    }

    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.pointerEvents = 'auto';
    document.body.classList.add('modal-open');

    const modal = overlay.querySelector('.modal');
    if (modal) modal.scrollTop = 0;

    requestAnimationFrame(() => {
      try {
        if (typeof W.loadProfileForm === 'function') W.loadProfileForm();
      } catch (err) {
        console.error('[LUNEA Profile re-entry] loadProfileForm failed but modal kept open', err);
      } finally {
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.style.pointerEvents = 'auto';
        document.body.classList.add('modal-open');
        openingProfile = false;
      }
    });
  }

  const profileBtn = document.getElementById('profileBtn');
  const profileStrip = document.getElementById('profileStrip');

  if (profileBtn) profileBtn.onclick = openProfileSafely;
  if (profileStrip) profileStrip.onclick = openProfileSafely;

  /*
    After the existing close handler runs, normalize body/overlay locks.
    We don't replace the close handler.
  */
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('[data-close="profile"]')) return;
    requestAnimationFrame(repairOverlayState);
  }, {passive:true});

  /*
    If the user taps the dimmed profile backdrop to close, base index closes
    it on pointerup. Normalize locks one frame later.
  */
  const profileOverlay = document.getElementById('profileOverlay');
  profileOverlay?.addEventListener('pointerup', event => {
    if (event.target !== profileOverlay) return;
    requestAnimationFrame(repairOverlayState);
  }, {passive:true});

  window.addEventListener('pageshow', () => {
    document.querySelectorAll('#cards .tarot-card img').forEach(tuneImg);
    repairOverlayState();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestAnimationFrame(repairOverlayState);
  });

  repairOverlayState();
  console.info('✦ LUNEA iOS Performance V3 loaded · re-entry repair active');
})();
