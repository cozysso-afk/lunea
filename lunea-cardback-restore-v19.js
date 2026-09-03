'use strict';

/*
  LUNEA CARD BACK RESTORE V19.2
  =============================
  Keeps category-specific tarot backs visible on dynamically created/restored
  cards, especially on iOS/PWA where an image request can fail transiently.

  V19.2 adds INTIMACY to the canonical category map. This is important because
  the generic repair observer runs after dynamic card insertion: without a
  canonical INTIMACY entry it treated INTIMACY as GENERAL and could overwrite
  the dedicated burgundy card back after the INTIMACY layer had repaired it.

  This patch changes only card-back presentation. It does not touch tarot RNG,
  card selection, reversals, meanings, spreads, archive, journal, or learning.
*/
(() => {
  const W = window;
  if (W.__LUNEA_CARD_BACK_RESTORE_V19_2__) return;
  W.__LUNEA_CARD_BACK_RESTORE_V19_2__ = true;
  W.__LUNEA_CARD_BACK_RESTORE_V19_1__ = true;
  W.__LUNEA_CARD_BACK_RESTORE_V19__ = true;

  const RELEASE = '19.2';
  const ASSET_KEY = '1920';
  const FILES = {
    DAILY: 'back_daily.PNG',
    LOVE: 'back_love.PNG',
    STOCK: 'back_stock.PNG',
    CAREER: 'back_career.PNG',
    GENERAL: 'back_general.PNG',
    INTIMACY: 'assets/intimacy-oracle/back_intimacy.PNG'
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
    url.searchParams.set('lunea_cardback', fresh ? `${ASSET_KEY}-${Date.now()}` : ASSET_KEY);
    return url.href;
  }

  function markLoaded(back, img) {
    back.classList.add('lunea-cardback-loaded');
    back.classList.remove('lunea-cardback-failed');
    img.style.removeProperty('display');
    img.style.removeProperty('opacity');
  }

  function makeManagedImage(back) {
    const prior = back.querySelector(':scope > img');
    if (prior?.dataset?.luneaCardbackManaged === ASSET_KEY) return prior;

    const img = document.createElement('img');
    img.dataset.luneaCardbackManaged = ASSET_KEY;
    img.alt = '';
    img.decoding = 'async';
    try { img.loading = 'eager'; } catch {}
    try { img.draggable = false; } catch {}

    if (prior) prior.replaceWith(img);
    else back.prepend(img);
    return img;
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

    const img = makeManagedImage(back);
    img.removeAttribute('onerror');
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
      if (attempts <= 2) {
        setTimeout(() => {
          img.style.removeProperty('display');
          img.src = assetUrl(file, true);
        }, attempts === 1 ? 60 : 180);
        return;
      }
      back.classList.add('lunea-cardback-failed');
    };

    const currentSrc = String(img.getAttribute('src') || '');
    const wrongAsset = !currentSrc.includes(file);
    const failedComplete = !!img.complete && Number(img.naturalWidth || 0) === 0;
    if (wrongAsset || failedComplete || !currentSrc) {
      img.dataset.luneaCardbackAttempts = '0';
      attempts = 0;
      img.src = assetUrl(file, failedComplete);
    } else if (img.complete && img.naturalWidth > 0) {
      markLoaded(back, img);
    }
  }

  function isInsideCards(el) {
    try { return !!el?.closest?.('#cards'); }
    catch { return false; }
  }

  function repairRoot(root = document) {
    let backs = [];
    if (root === document) {
      backs = Array.from(document.querySelectorAll('#cards .tarot-card .back'));
    } else if (root instanceof HTMLElement) {
      if (root.matches?.('.tarot-card .back') && isInsideCards(root)) backs.push(root);
      if (root.matches?.('#cards') || isInsideCards(root)) {
        backs.push(...Array.from(root.querySelectorAll?.('.tarot-card .back') || []));
      }
    }
    [...new Set(backs)].forEach(repairBack);
  }

  function installStyles() {
    let style = document.getElementById('luneaCardBackRestoreV19Style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'luneaCardBackRestoreV19Style';
      document.head.appendChild(style);
    }
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
  }

  function installObservers() {
    const cards = document.getElementById('cards');
    if (cards && !cards.__luneaCardBackRestoreV192Observed) {
      cards.__luneaCardBackRestoreV192Observed = true;
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes || []) {
            if (node?.nodeType === 1) repairRoot(node);
          }
        }
        repairRoot(cards);
      });
      observer.observe(cards, {childList:true, subtree:true});
    }

    const overlay = document.getElementById('spreadOverlay');
    if (overlay && !overlay.__luneaCardBackRestoreV192Observed) {
      overlay.__luneaCardBackRestoreV192Observed = true;
      new MutationObserver(() => {
        if (!overlay.classList.contains('show')) return;
        requestAnimationFrame(() => repairRoot(document));
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
    }
  }

  function repairVisibleReading() {
    repairRoot(document);
    setTimeout(() => repairRoot(document), 120);
  }

  function boot() {
    installStyles();
    installObservers();
    repairVisibleReading();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) repairVisibleReading();
    });
    W.addEventListener?.('pageshow', repairVisibleReading);
    W.LUNEA_CARD_BACK_RESTORE_V19 = {
      version: RELEASE,
      assetKey: ASSET_KEY,
      repairRoot,
      repairBack,
      repairVisibleReading,
      files: {...FILES}
    };
    console.info('🌙 LUNEA category card backs restored (V19.2)');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
