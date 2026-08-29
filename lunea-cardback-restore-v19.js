'use strict';

/*
  LUNEA CARD BACK RESTORE V19
  ===========================
  Repairs category-specific tarot backs without touching RNG / card choice / meanings.

  Why this exists:
  - Core markup still points to back_daily / back_love / back_stock / back_career / back_general.
  - Legacy <img onerror="this.style.display='none'"> permanently hid the artwork after a
    transient image error, leaving only the star fallback visible.
  - This patch restores the correct category image, retries once with a fresh cache key,
    and keeps the star only as a true last-resort fallback.
*/
(() => {
  const W = window;
  if (W.__LUNEA_CARD_BACK_RESTORE_V19__) return;
  W.__LUNEA_CARD_BACK_RESTORE_V19__ = true;

  const FILES = {
    DAILY: 'back_daily.PNG',
    LOVE: 'back_love.PNG',
    STOCK: 'back_stock.PNG',
    CAREER: 'back_career.PNG',
    GENERAL: 'back_general.PNG'
  };

  function categoryNow() {
    try {
      const value = String(state?.category || 'GENERAL').toUpperCase();
      return FILES[value] ? value : 'GENERAL';
    } catch {
      return 'GENERAL';
    }
  }

  function assetUrl(file, fresh = false) {
    const url = new URL(`./${file}`, document.baseURI);
    if (fresh) url.searchParams.set('lunea_cardback', `19-${Date.now()}`);
    return url.href;
  }

  function markLoaded(back, img) {
    back.classList.add('lunea-cardback-loaded');
    back.classList.remove('lunea-cardback-failed');
    img.style.removeProperty('display');
    img.style.removeProperty('opacity');
  }

  function repairBack(back) {
    if (!(back instanceof HTMLElement)) return;
    const category = categoryNow();
    const file = FILES[category];
    if (!file) return;

    back.dataset.luneaCardbackCategory = category;
    back.style.setProperty('background-image', `url("${assetUrl(file)}")`, 'important');
    back.style.setProperty('background-size', 'cover', 'important');
    back.style.setProperty('background-position', 'center', 'important');
    back.style.setProperty('background-repeat', 'no-repeat', 'important');

    let img = back.querySelector(':scope > img');
    if (!img) {
      img = document.createElement('img');
      back.prepend(img);
    }

    // Remove the legacy inline handler that permanently hides the artwork.
    img.removeAttribute('onerror');
    img.alt = '';
    img.decoding = 'async';
    img.classList.add('lunea-category-cardback');
    img.style.removeProperty('display');
    img.style.removeProperty('opacity');

    let attempts = Number(img.dataset.luneaCardbackAttempts || 0);
    img.onload = () => {
      img.dataset.luneaCardbackAttempts = '0';
      markLoaded(back, img);
    };
    img.onerror = () => {
      attempts += 1;
      img.dataset.luneaCardbackAttempts = String(attempts);
      back.classList.remove('lunea-cardback-loaded');
      if (attempts <= 1) {
        // A stale/cache-level error should not turn the card into a permanent placeholder.
        setTimeout(() => {
          img.src = assetUrl(file, true);
        }, 80);
        return;
      }
      back.classList.add('lunea-cardback-failed');
    };

    const expectedTail = `/${file}`;
    const hiddenByLegacyError = img.style.display === 'none';
    const wrongAsset = !String(img.getAttribute('src') || '').includes(file);
    const failedComplete = img.complete && img.naturalWidth === 0;

    if (hiddenByLegacyError || wrongAsset || failedComplete || !img.getAttribute('src')) {
      img.dataset.luneaCardbackAttempts = '0';
      attempts = 0;
      img.src = assetUrl(file, failedComplete || hiddenByLegacyError);
    } else if (img.complete && img.naturalWidth > 0) {
      markLoaded(back, img);
    }
  }

  function repairRoot(root = document) {
    const backs = root.matches?.('#cards .tarot-card .back')
      ? [root]
      : Array.from(root.querySelectorAll?.('#cards .tarot-card .back') || []);
    backs.forEach(repairBack);
  }

  function installStyles() {
    if (document.getElementById('luneaCardBackRestoreV19Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaCardBackRestoreV19Style';
    style.textContent = `
      #cards .tarot-card .back{position:absolute!important;isolation:isolate}
      #cards .tarot-card .back>.lunea-category-cardback{
        position:absolute!important;inset:0!important;z-index:2!important;
        display:block!important;width:100%!important;height:100%!important;
        max-width:none!important;max-height:none!important;margin:0!important;
        object-fit:cover!important;object-position:center!important;
        opacity:1!important;border-radius:inherit!important;
        pointer-events:none!important;-webkit-user-drag:none!important;
      }
      #cards .tarot-card .back::after{z-index:3!important;transition:opacity .18s ease!important}
      #cards .tarot-card .back.lunea-cardback-loaded::after{opacity:0!important}
      #cards .tarot-card .back.lunea-cardback-failed::after{opacity:1!important}
    `;
    document.head.appendChild(style);
  }

  function boot() {
    installStyles();
    repairRoot(document);

    const cards = document.getElementById('cards');
    if (cards) {
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType === 1) repairRoot(node);
          }
        }
        // Covers innerHTML replacement and restored/draft readings.
        repairRoot(cards);
      });
      observer.observe(cards, {childList:true, subtree:true});
    }

    // Draft restore / delayed spread render safety without a body-wide observer.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) repairRoot(document);
    });

    console.info('🌙 LUNEA category card backs restored (V19)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
