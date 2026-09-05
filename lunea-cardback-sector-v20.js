'use strict';

/*
  LUNEA SECTOR CARD BACKS V20.1
  =============================
  Authoritative visual bridge for the uploaded sector backs.
  Daily now has its own pearl/opal celestial artwork (chosen concept 1).
*/
(() => {
  const W = window;
  if (W.__LUNEA_SECTOR_CARD_BACKS_V20__) return;
  W.__LUNEA_SECTOR_CARD_BACKS_V20__ = true;

  const RELEASE = '20.1';
  const ASSET_VERSION = '20260906-0650-daily-v1';
  const FILES = Object.freeze({
    DAILY: 'tarot_back_daily.jpeg',
    GENERAL: 'tarot_back_general.jpeg',
    LOVE: 'tarot_back_love.jpeg',
    STOCK: 'tarot_back_stock.jpeg',
    CAREER: 'tarot_back_career_study.jpeg',
    STUDY: 'tarot_back_career_study.jpeg',
    CAREER_STUDY: 'tarot_back_career_study.jpeg',
    INTIMACY: 'assets/intimacy-oracle/tarot_back_intimacy_final.png'
  });

  function categoryNow() {
    try {
      if (W.__LUNEA_INTIMACY_ACTIVE__ || document.body?.classList?.contains('lunea-intimacy-reading')) return 'INTIMACY';
      const raw = typeof state !== 'undefined' ? state?.category : null;
      const key = String(raw || 'GENERAL').toUpperCase();
      if (key === 'CAREER&STUDY' || key === 'CAREER-STUDY') return 'CAREER_STUDY';
      return FILES[key] ? key : 'GENERAL';
    } catch {
      return W.__LUNEA_INTIMACY_ACTIVE__ ? 'INTIMACY' : 'GENERAL';
    }
  }

  function assetUrl(file, fresh = false) {
    const url = new URL(`./${file}`, document.baseURI);
    url.searchParams.set('lunea_sector_back', fresh ? `${ASSET_VERSION}-${Date.now()}` : ASSET_VERSION);
    return url.href;
  }

  function ensureImage(back, file) {
    let img = back.querySelector(':scope > img');
    if (!img) {
      img = document.createElement('img');
      back.prepend(img);
    }
    img.dataset.luneaSectorCardbackV20 = '1';
    img.classList.add('lunea-sector-cardback-v20');
    img.alt = '';
    img.decoding = 'async';
    try { img.loading = 'eager'; img.draggable = false; } catch {}
    img.removeAttribute('onerror');
    img.style.removeProperty('display');
    img.style.removeProperty('opacity');

    const expected = assetUrl(file);
    const current = String(img.getAttribute('src') || '');
    if (!current.includes(file) || !current.includes(ASSET_VERSION)) img.src = expected;

    img.onload = () => {
      back.classList.add('lunea-sector-cardback-loaded-v20');
      back.classList.remove('lunea-sector-cardback-failed-v20');
      img.style.removeProperty('display');
      img.style.removeProperty('opacity');
    };
    img.onerror = () => {
      if (img.dataset.luneaSectorRetryV20 === '1') {
        back.classList.add('lunea-sector-cardback-failed-v20');
        return;
      }
      img.dataset.luneaSectorRetryV20 = '1';
      setTimeout(() => { img.src = assetUrl(file, true); }, 80);
    };
    if (img.complete && Number(img.naturalWidth || 0) > 0) img.onload();
    return img;
  }

  function repairBack(back) {
    if (!(back instanceof HTMLElement)) return;
    const category = categoryNow();
    const file = FILES[category] || FILES.GENERAL;
    const url = assetUrl(file);
    back.dataset.luneaSectorCardbackV20Category = category;
    back.style.setProperty('background-image', `url("${url}")`, 'important');
    back.style.setProperty('background-size', 'cover', 'important');
    back.style.setProperty('background-position', 'center', 'important');
    back.style.setProperty('background-repeat', 'no-repeat', 'important');
    ensureImage(back, file);
  }

  function repairRoot(root = document) {
    const backs = [];
    if (root === document) {
      backs.push(...document.querySelectorAll('#cards .tarot-card .back'));
    } else if (root instanceof HTMLElement) {
      if (root.matches?.('.tarot-card .back') && root.closest?.('#cards')) backs.push(root);
      if (root.id === 'cards' || root.closest?.('#cards')) backs.push(...(root.querySelectorAll?.('.tarot-card .back') || []));
    }
    [...new Set(backs)].forEach(repairBack);
  }

  function addStyle() {
    if (document.getElementById('luneaSectorCardBacksV20Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaSectorCardBacksV20Style';
    style.textContent = `
      #cards .tarot-card .back{position:absolute!important;isolation:isolate!important}
      #cards .tarot-card .back>.lunea-sector-cardback-v20{
        position:absolute!important;inset:0!important;z-index:8!important;
        display:block!important;width:100%!important;height:100%!important;
        max-width:none!important;max-height:none!important;margin:0!important;
        object-fit:cover!important;object-position:center!important;
        opacity:1!important;visibility:visible!important;border-radius:inherit!important;
        pointer-events:none!important;-webkit-user-drag:none!important;
      }
      #cards .tarot-card .back.lunea-sector-cardback-loaded-v20::after{opacity:0!important}
    `;
    document.head.appendChild(style);
  }

  function installObserver() {
    const cards = document.getElementById('cards');
    if (!cards || cards.__luneaSectorBackV20Observed) return;
    cards.__luneaSectorBackV20Observed = true;
    new MutationObserver(records => {
      let needsFull = false;
      for (const record of records) {
        if (record.type === 'childList') {
          for (const node of record.addedNodes || []) if (node?.nodeType === 1) repairRoot(node);
          needsFull = true;
        } else if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
          const back = record.target.closest?.('.back');
          if (back?.closest?.('#cards')) repairBack(back);
        }
      }
      if (needsFull) repairRoot(cards);
    }).observe(cards, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});

    const overlay = document.getElementById('spreadOverlay');
    if (overlay && !overlay.__luneaSectorBackV20Observed) {
      overlay.__luneaSectorBackV20Observed = true;
      new MutationObserver(() => {
        if (overlay.classList.contains('show')) requestAnimationFrame(() => repairRoot(document));
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
    }
  }

  function repairAll() {
    repairRoot(document);
    setTimeout(() => repairRoot(document), 80);
    setTimeout(() => repairRoot(document), 240);
  }

  function boot() {
    addStyle();
    installObserver();
    repairAll();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) repairAll(); });
    W.addEventListener?.('pageshow', repairAll, {passive:true});
    W.LUNEA_SECTOR_CARD_BACKS_V20 = Object.freeze({version:RELEASE, files:FILES, repairBack, repairAll});
    console.info('🃏 LUNEA uploaded sector card backs V20.1 loaded · Daily dedicated back');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
