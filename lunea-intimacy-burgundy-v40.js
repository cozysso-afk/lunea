'use strict';

/* LUNEA INTIMACY burgundy cabinet + tarot skin V40.2 */
(() => {
  const W = window;
  const RELEASE = '40.2';
  const KEY = '__LUNEA_INTIMACY_BURGUNDY_V40__';
  W[KEY] = RELEASE;

  const SELF_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '4020';
    } catch {
      return '4020';
    }
  })();
  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
  const STYLE_ID = 'luneaIntimacyBurgundyV40Style';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function isIntimacyActive() {
    try { return String(state?.category || '').toUpperCase() === 'INTIMACY'; }
    catch { return false; }
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]{
        position:relative!important;overflow:hidden!important;
        border-color:rgba(235,132,169,.40)!important;
        background:
          radial-gradient(circle at 10% 17%,rgba(232,92,145,.23),transparent 31%),
          radial-gradient(circle at 91% 4%,rgba(158,54,112,.18),transparent 36%),
          linear-gradient(145deg,rgba(91,19,50,.96),rgba(54,13,40,.97) 48%,rgba(25,10,29,.99))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 12px 30px rgba(70,8,39,.24)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]::before{
        content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;
        pointer-events:none!important;
        background:linear-gradient(105deg,rgba(255,192,214,.055),transparent 34%,rgba(138,53,108,.045))!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{
        background:#310b20!important;border-color:rgba(250,176,202,.38)!important;
        box-shadow:0 7px 20px rgba(80,9,45,.30),inset 0 1px 0 rgba(255,255,255,.10)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;
        border-radius:inherit!important;pointer-events:none!important
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-label{color:#fff4f7!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-sub{color:rgba(229,199,210,.76)!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-open{color:#efb3c9!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v39-adult-badge{
        border-color:rgba(243,139,178,.46)!important;background:rgba(130,28,70,.27)!important;color:#f5b0c9!important
      }

      .lunea-intimacy-category{
        border-color:rgba(222,126,164,.30)!important;
        background:linear-gradient(155deg,rgba(69,16,40,.72),rgba(29,12,31,.94) 50%,rgba(13,10,23,.99))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 12px 30px rgba(47,7,29,.17)!important
      }
      .lunea-intimacy-category .category-header{background:radial-gradient(circle at 9% 22%,rgba(187,61,110,.14),transparent 34%)!important}
      .lunea-intimacy-category .cat-icon{
        background:#310b20 url('${ICON_SRC}') center/cover no-repeat!important;
        border-color:rgba(247,170,199,.34)!important;
        box-shadow:0 7px 19px rgba(78,8,43,.27),inset 0 1px 0 rgba(255,255,255,.09)!important
      }
      .lunea-intimacy-category .cat-icon img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;
        border-radius:inherit!important;pointer-events:none!important
      }
      .lunea-intimacy-category .cat-text h3{color:#fff2f6!important}
      .lunea-intimacy-category .cat-text p{color:rgba(222,197,207,.73)!important}
      .lunea-intimacy-category .category-content{background:linear-gradient(180deg,rgba(79,17,44,.085),transparent 18%)!important}
      .lunea-intimacy-category .reading-item{border-top-color:rgba(238,169,196,.095)!important}
      .lunea-intimacy-category .reading-item h4{color:#f6edf1!important}
      .lunea-intimacy-category .reading-item p{color:rgba(211,194,202,.73)!important}
      .lunea-intimacy-category .reading-item .count{
        border-color:rgba(231,143,178,.28)!important;background:rgba(130,39,77,.19)!important;color:#f0bfd0!important
      }
      .lunea-intimacy-category .reading-item[data-intimacy-ai="1"]{
        border-color:rgba(237,148,184,.18)!important;background:linear-gradient(145deg,rgba(128,31,73,.17),rgba(77,37,77,.08))!important
      }

      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .tarot-card{
        box-shadow:0 7px 18px rgba(15,2,10,.58),0 0 0 1px rgba(205,111,148,.10)!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back{
        border:1px solid rgba(235,151,183,.45)!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back::after{display:none!important}
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back>img{
        display:block!important;width:100%!important;height:100%!important;opacity:1!important;
        object-fit:cover!important;object-position:center!important;border-radius:inherit!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .front{
        background:#f3eee5!important;border:1px solid rgba(203,119,151,.62)!important;
        box-shadow:inset 0 0 0 1px rgba(83,19,46,.10)!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .front>img{
        display:block!important;width:100%!important;height:100%!important;
        object-fit:contain!important;object-position:center!important;
        background:#f3eee5!important;opacity:1!important;border-radius:8px!important;
      }
    `;
  }

  function forceIcon(root) {
    if (!root) return false;
    let img = root.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      root.replaceChildren(img);
    }
    if (img.getAttribute('src') !== ICON_SRC) img.setAttribute('src', ICON_SRC);
    return true;
  }

  function repairTarotWrapper(wrapper) {
    if (!wrapper) return false;
    if (!isIntimacyActive()) {
      wrapper.classList?.remove('lunea-intimacy-tarot-card');
      return false;
    }
    wrapper.classList.add('lunea-intimacy-tarot-card');
    wrapper.dataset.luneaIntimacyTarotRelease = RELEASE;

    /* Tarot back ownership deliberately stays with the core/category back system.
       INTIMACY Oracle assets must never be injected into Tarot backs here. */

    const frontImg = $('.front > img', wrapper);
    if (frontImg) {
      frontImg.style.removeProperty('opacity');
      frontImg.style.removeProperty('display');
      frontImg.dataset.luneaIntimacyCardface = RELEASE;
      try { frontImg.decoding = 'async'; frontImg.loading = 'eager'; } catch {}
    }
    return true;
  }

  function repairTarotCards() {
    const wrappers = $$('#cards .tarot-card-wrapper');
    if (!isIntimacyActive()) {
      wrappers.forEach(wrapper => wrapper.classList.remove('lunea-intimacy-tarot-card'));
      return false;
    }
    wrappers.forEach(repairTarotWrapper);
    W.LUNEA_CARD_BACK_RESTORE_V19?.repairVisibleReading?.();
    return wrappers.length > 0;
  }

  function wrapCardFactory() {
    const current = W.makeCardWrapper;
    if (typeof current !== 'function') return false;
    if (current.__luneaIntimacyV401Wrapped) return true;
    const wrapped = function(...args) {
      const wrapper = current.apply(this, args);
      if (isIntimacyActive()) repairTarotWrapper(wrapper);
      return wrapper;
    };
    wrapped.__luneaIntimacyV401Wrapped = true;
    wrapped.__luneaPriorMakeCardWrapper = current;
    W.makeCardWrapper = wrapped;
    return true;
  }

  function observeCards() {
    const cards = document.getElementById('cards');
    if (!cards || cards.__luneaIntimacyV401Observed) return;
    cards.__luneaIntimacyV401Observed = true;
    new MutationObserver(() => requestAnimationFrame(repairTarotCards)).observe(cards, {childList:true, subtree:true});
  }

  function apply() {
    ensureStyle();
    wrapCardFactory();
    observeCards();

    const category = $('.lunea-intimacy-category');
    if (category) {
      category.dataset.luneaIntimacyBurgundyRelease = RELEASE;
      forceIcon($('.cat-icon', category));
    }

    const tile = $('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
    if (tile) {
      tile.dataset.luneaIntimacyBurgundyRelease = RELEASE;
      forceIcon($('.lunea-v8-object', tile));
    }

    repairTarotCards();
    return !!(category || tile || document.querySelector('#cards .tarot-card-wrapper'));
  }

  function boot() {
    apply();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      apply();
      if (tries >= 48) clearInterval(timer);
    }, 250);
  }

  W.addEventListener('pageshow', () => setTimeout(apply, 80));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(apply, 80));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  W.LUNEA_INTIMACY_BURGUNDY_V40 = {
    version:RELEASE,
    icon:ICON_SRC,
    cardBack:null,
    apply,
    repairTarotCards,
    repairTarotWrapper,
  };
  console.info(`🍷 LUNEA INTIMACY burgundy V${RELEASE} ready`);
})();
