'use strict';

/* LUNEA INTIMACY burgundy cabinet + tarot skin V40.5 */
(() => {
  const W = window;
  const RELEASE = '40.5';
  const KEY = '__LUNEA_INTIMACY_BURGUNDY_V40__';
  W[KEY] = RELEASE;

  const SELF_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '4020';
    } catch {
      return '4020';
    }
  })();
  const HOME_ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
  const CATEGORY_ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v37.svg?v=${encodeURIComponent(SELF_VERSION)}`;
  const TAROT_BACK_SRC = `./assets/intimacy-oracle/tarot_back_intimacy_final.png?v=${encodeURIComponent(SELF_VERSION)}`;
  const STYLE_ID = 'luneaIntimacyBurgundyV40Style';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function isIntimacyActive() {
    try { return String(state?.category || '').toUpperCase() === 'INTIMACY' || !!W.__LUNEA_INTIMACY_ACTIVE__ || document.body?.classList?.contains('lunea-intimacy-reading'); }
    catch { return !!W.__LUNEA_INTIMACY_ACTIVE__; }
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
        background:#310b20!important;border-color:rgba(250,176,202,.38)!important;overflow:hidden!important;
        box-shadow:0 7px 20px rgba(80,9,45,.30),inset 0 1px 0 rgba(255,255,255,.10)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;
        transform:scale(1.20)!important;transform-origin:center!important;
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
        background:#310b20!important;overflow:hidden!important;
        border-color:rgba(247,170,199,.34)!important;
        box-shadow:0 7px 19px rgba(78,8,43,.27),inset 0 1px 0 rgba(255,255,255,.09)!important
      }
      .lunea-intimacy-category .cat-icon img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;
        transform:none!important;transform-origin:center!important;
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

      body.lunea-intimacy-reading #sheet[data-lunea-sector="intimacy"]{
        border-top-color:rgba(225,117,160,.34)!important;
        background:radial-gradient(circle at 8% 0%,rgba(176,45,94,.20),transparent 31%),radial-gradient(circle at 100% 10%,rgba(116,36,84,.13),transparent 34%),linear-gradient(176deg,#1b0d19 0%,#0c0912 74%)!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .modal{
        border-color:rgba(224,120,162,.25)!important;
        background:radial-gradient(circle at 13% 0%,rgba(173,43,91,.16),transparent 29%),radial-gradient(circle at 96% 23%,rgba(120,42,87,.11),transparent 32%),linear-gradient(168deg,rgba(25,12,24,.99),rgba(7,7,14,.995))!important;
      }
      body.lunea-intimacy-reading #spreadOverlay #cards{
        border-color:rgba(222,126,164,.16)!important;
        background:radial-gradient(ellipse at 50% 12%,rgba(137,31,74,.13),transparent 38%),linear-gradient(180deg,rgba(64,14,38,.16),rgba(11,8,16,.32))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 16px 34px rgba(0,0,0,.24)!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .actionbar{
        border-color:rgba(224,126,164,.20)!important;
        background:radial-gradient(circle at 10% -12%,rgba(181,56,106,.15),transparent 34%),radial-gradient(circle at 94% 110%,rgba(111,39,82,.12),transparent 38%),linear-gradient(150deg,rgba(46,17,35,.96),rgba(11,9,18,.98))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 16px 34px rgba(0,0,0,.34),0 0 24px rgba(151,42,87,.07)!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .actionbar .mini,
      body.lunea-intimacy-reading #spreadOverlay .actionbar #aiRead,
      body.lunea-intimacy-reading #spreadOverlay .actionbar #extraCard{
        color:#f8edf2!important;border-color:rgba(225,132,168,.22)!important;
        background:linear-gradient(145deg,rgba(112,34,69,.16),rgba(67,22,55,.09))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 3px 10px rgba(0,0,0,.12)!important;
      }

      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .tarot-card{
        box-shadow:0 7px 18px rgba(15,2,10,.58),0 0 0 1px rgba(205,111,148,.10)!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back{
        border:1px solid rgba(235,151,183,.45)!important;
        background:#19070f!important;
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

  function forceIcon(root, src) {
    if (!root) return false;
    let img = root.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      root.replaceChildren(img);
    }
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
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

    const back = $('.back', wrapper);
    if (back) {
      let backImg = $('img', back);
      if (!backImg) {
        backImg = document.createElement('img');
        backImg.alt = '';
        back.appendChild(backImg);
      }
      if (backImg.getAttribute('src') !== TAROT_BACK_SRC) backImg.setAttribute('src', TAROT_BACK_SRC);
      backImg.dataset.luneaIntimacyTarotBack = RELEASE;
      try { backImg.decoding = 'async'; backImg.loading = 'eager'; } catch {}
    }

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
    /* INTIMACY is already owned by the shared V19 category map. Do not run an
       intermediate restore paint here; repair only the final wrappers. */
    wrappers.forEach(repairTarotWrapper);
    return wrappers.length > 0;
  }

  function wrapCardFactory() {
    const current = W.makeCardWrapper;
    if (typeof current !== 'function') return false;
    if (current.__luneaIntimacyV404Wrapped) return true;
    const wrapped = function(...args) {
      const wrapper = current.apply(this, args);
      if (isIntimacyActive()) repairTarotWrapper(wrapper);
      return wrapper;
    };
    wrapped.__luneaIntimacyV404Wrapped = true;
    wrapped.__luneaPriorMakeCardWrapper = current;
    W.makeCardWrapper = wrapped;
    try { makeCardWrapper = wrapped; } catch {}
    return true;
  }

  function observeCards() {
    const cards = document.getElementById('cards');
    if (!cards || cards.__luneaIntimacyV404Observed) return;
    cards.__luneaIntimacyV404Observed = true;
    new MutationObserver(() => requestAnimationFrame(repairTarotCards)).observe(cards, {childList:true, subtree:true});
  }

  function apply() {
    ensureStyle();
    wrapCardFactory();
    observeCards();

    const category = $('.lunea-intimacy-category');
    if (category) {
      category.dataset.luneaIntimacyBurgundyRelease = RELEASE;
      forceIcon($('.cat-icon', category), CATEGORY_ICON_SRC);
    }

    const tile = $('#luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]');
    if (tile) {
      tile.dataset.luneaIntimacyBurgundyRelease = RELEASE;
      forceIcon($('.lunea-v8-object', tile), HOME_ICON_SRC);
    }

    repairTarotCards();
    return !!(category || tile || document.querySelector('#cards .tarot-card-wrapper'));
  }

  function observeUi() {
    if (document.body?.__luneaIntimacyV404UiObserved) return;
    document.body.__luneaIntimacyV404UiObserved = true;
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; apply(); });
    }).observe(document.body, {childList:true,subtree:true});
    document.addEventListener('click', event => {
      if (event.target?.closest?.('[data-key="intimacy"],.lunea-intimacy-category')) [0,80,240].forEach(ms => setTimeout(apply,ms));
    }, true);
  }

  function boot() {
    apply();
    observeUi();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      apply();
      if (tries >= 48) clearInterval(timer);
    }, 250);
  }

  W.addEventListener('pageshow', () => setTimeout(apply, 80));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(apply, 80);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  W.LUNEA_INTIMACY_BURGUNDY_V40 = {
    version:RELEASE,
    icon:HOME_ICON_SRC,
    categoryIcon:CATEGORY_ICON_SRC,
    cardBack:TAROT_BACK_SRC,
    apply,
    repairTarotCards,
    repairTarotWrapper,
  };
  console.info(`🍷 LUNEA INTIMACY burgundy V${RELEASE} ready`);
})();
