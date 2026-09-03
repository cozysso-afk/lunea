'use strict';

/* LUNEA INTIMACY unified burgundy reading + Oracle art V42 */
(() => {
  const W = window;
  const RELEASE = '42.0';
  W.__LUNEA_INTIMACY_BURGUNDY_V40__ = RELEASE;

  const SELF_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '4200';
    } catch {
      return '4200';
    }
  })();

  const ICON_SRC = `./assets/intimacy-oracle/intimacy_sector_v40.png?v=${encodeURIComponent(SELF_VERSION)}`;
  const CARD_BACK_SRC = `./assets/intimacy-oracle/back_intimacy.PNG?v=${encodeURIComponent(SELF_VERSION)}`;
  const ORACLE_ATLAS_SRC = `./assets/intimacy-oracle/oracle_atlas_v36.jpg?v=${encodeURIComponent(SELF_VERSION)}`;
  const STYLE_ID = 'luneaIntimacyBurgundyV40Style';
  const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
  const $$ = (selector, root = document) => [...(root?.querySelectorAll?.(selector) || [])];

  function isIntimacyActive() {
    try {
      return String(state?.category || '').toUpperCase() === 'INTIMACY'
        || !!W.__LUNEA_INTIMACY_ACTIVE__
        || !!document.body?.classList?.contains('lunea-intimacy-reading');
    } catch {
      return !!W.__LUNEA_INTIMACY_ACTIVE__
        || !!document.body?.classList?.contains('lunea-intimacy-reading');
    }
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
        border-color:rgba(235,132,169,.44)!important;
        background:
          radial-gradient(circle at 10% 17%,rgba(232,92,145,.25),transparent 31%),
          radial-gradient(circle at 91% 4%,rgba(158,54,112,.20),transparent 36%),
          linear-gradient(145deg,rgba(91,19,50,.98),rgba(54,13,40,.98) 48%,rgba(25,10,29,.99))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 30px rgba(70,8,39,.28)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"]::before{
        content:''!important;position:absolute!important;inset:0!important;border-radius:inherit!important;
        pointer-events:none!important;background:linear-gradient(105deg,rgba(255,192,214,.065),transparent 34%,rgba(138,53,108,.055))!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object{
        background:#310b20!important;border-color:rgba(250,176,202,.42)!important;
        box-shadow:0 7px 20px rgba(80,9,45,.32),inset 0 1px 0 rgba(255,255,255,.11)!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-object img{
        width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:inherit!important;pointer-events:none!important;
      }
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-label{color:#fff4f7!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-sub{color:rgba(235,205,216,.78)!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v8-open{color:#efb3c9!important}
      #luneaHomePortalV8 .lunea-v8-tile[data-key="intimacy"] .lunea-v39-adult-badge{
        border-color:rgba(243,139,178,.50)!important;background:rgba(130,28,70,.30)!important;color:#f7b4cc!important;
      }

      .lunea-intimacy-category{
        border-color:rgba(222,126,164,.34)!important;
        background:linear-gradient(155deg,rgba(69,16,40,.78),rgba(29,12,31,.96) 50%,rgba(13,10,23,.99))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 12px 30px rgba(47,7,29,.20)!important;
      }
      .lunea-intimacy-category .category-header{background:radial-gradient(circle at 9% 22%,rgba(187,61,110,.16),transparent 34%)!important}
      .lunea-intimacy-category .cat-icon{
        background:#310b20 url('${ICON_SRC}') center/cover no-repeat!important;border-color:rgba(247,170,199,.38)!important;
        box-shadow:0 7px 19px rgba(78,8,43,.30),inset 0 1px 0 rgba(255,255,255,.10)!important;
      }
      .lunea-intimacy-category .cat-icon img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:inherit!important;pointer-events:none!important}
      .lunea-intimacy-category .cat-text h3{color:#fff2f6!important}
      .lunea-intimacy-category .cat-text p{color:rgba(226,200,210,.76)!important}
      .lunea-intimacy-category .category-content{background:linear-gradient(180deg,rgba(79,17,44,.10),transparent 18%)!important}
      .lunea-intimacy-category .reading-item{border-top-color:rgba(238,169,196,.11)!important}
      .lunea-intimacy-category .reading-item h4{color:#f8eef2!important}
      .lunea-intimacy-category .reading-item p{color:rgba(216,198,206,.76)!important}
      .lunea-intimacy-category .reading-item .count{border-color:rgba(231,143,178,.32)!important;background:rgba(130,39,77,.22)!important;color:#f2c1d2!important}

      /* One visual language from question sheet through the full reading overlay. */
      body.lunea-intimacy-reading #spreadOverlay{
        background:
          radial-gradient(circle at 50% 4%,rgba(113,24,61,.28),transparent 35%),
          linear-gradient(180deg,rgba(16,5,13,.985),rgba(7,5,12,.995))!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .modal{
        border-color:rgba(224,125,164,.38)!important;
        background:
          radial-gradient(circle at 10% 0%,rgba(124,29,68,.24),transparent 31%),
          linear-gradient(165deg,#27101f 0%,#170b18 34%,#0c0912 100%)!important;
        box-shadow:0 24px 70px rgba(0,0,0,.72),0 0 0 1px rgba(112,31,64,.16)!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .modal-h,
      body.lunea-intimacy-reading #spreadOverlay #spreadQuestion{color:#fff5f7!important}
      body.lunea-intimacy-reading #spreadOverlay .sub,
      body.lunea-intimacy-reading #spreadOverlay #spreadRationale{color:rgba(235,183,204,.78)!important}
      body.lunea-intimacy-reading #spreadOverlay .close{color:#efb5ca!important}
      body.lunea-intimacy-reading #spreadOverlay .actionbar{
        border:1px solid rgba(226,137,171,.19)!important;border-radius:18px!important;padding:10px!important;
        background:linear-gradient(145deg,rgba(92,22,54,.25),rgba(19,12,25,.50))!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .actionbar .mini,
      body.lunea-intimacy-reading #spreadOverlay #luneaBottomReadingActions button{
        border-color:rgba(224,139,172,.28)!important;background:linear-gradient(145deg,rgba(117,35,70,.34),rgba(46,25,49,.42))!important;
        color:#f7e9ef!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .info,
      body.lunea-intimacy-reading #spreadOverlay .copybox,
      body.lunea-intimacy-reading #spreadOverlay #results > *{
        border-color:rgba(218,132,166,.16)!important;background:rgba(70,20,45,.14)!important;
      }
      body.lunea-intimacy-reading #spreadOverlay .info .pos{color:#e8a7bf!important}
      body.lunea-intimacy-reading #spreadOverlay .info p{color:rgba(224,207,215,.76)!important}
      body.lunea-intimacy-reading #spreadOverlay #cards{
        border-color:rgba(221,130,165,.17)!important;background:linear-gradient(180deg,rgba(75,20,46,.13),rgba(8,7,13,.24))!important;
      }

      body.lunea-intimacy-reading .lio-tools,
      body.lunea-intimacy-reading #spreadOverlay .lio-panel{
        border-color:rgba(224,129,166,.27)!important;background:linear-gradient(145deg,rgba(91,21,52,.24),rgba(20,11,21,.54))!important;
      }
      body.lunea-intimacy-reading .lio-mode button{
        border-color:rgba(219,130,165,.26)!important;background:rgba(31,11,23,.70)!important;color:#e7cbd5!important;
      }
      body.lunea-intimacy-reading .lio-mode button.on{
        border-color:rgba(239,151,184,.70)!important;background:linear-gradient(145deg,rgba(145,45,83,.54),rgba(91,27,65,.48))!important;
        color:#fff7fa!important;box-shadow:inset 0 0 0 1px rgba(255,205,224,.05),0 5px 16px rgba(64,5,32,.20)!important;
      }
      .lio-mode-help{margin:7px 1px 0;color:rgba(227,198,210,.76);font-size:10px;line-height:1.5}
      body.lunea-intimacy-reading .lio-suggestions button{border-color:rgba(221,131,166,.20)!important;background:rgba(52,15,34,.36)!important;color:#f0dfe6!important}
      body.lunea-intimacy-reading .lio-head{color:#f0abc5!important}
      body.lunea-intimacy-reading .lio-card{background:#17070e!important;box-shadow:0 7px 21px rgba(0,0,0,.55),0 0 0 1px rgba(220,127,162,.16)!important}
      body.lunea-intimacy-reading .lio-card span{background:rgba(22,5,13,.88)!important;border:1px solid rgba(232,151,181,.16)!important}

      /* Generated burgundy INTIMACY tarot back + uncropped face. */
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .tarot-card{box-shadow:0 7px 18px rgba(15,2,10,.62),0 0 0 1px rgba(205,111,148,.13)!important}
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back{
        background:#250915 url('${CARD_BACK_SRC}') center/cover no-repeat!important;border:1px solid rgba(235,151,183,.48)!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back::after{display:none!important}
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back>img{
        display:block!important;width:100%!important;height:100%!important;opacity:1!important;object-fit:cover!important;object-position:center!important;border-radius:inherit!important;
      }
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .front{background:#f3eee5!important;border:1px solid rgba(203,119,151,.62)!important}
      #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .front>img{
        display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;
        background:#f3eee5!important;opacity:1!important;border-radius:8px!important;
      }
    `;
  }

  function forceIcon(root) {
    if (!root) return false;
    let img = $('img', root);
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

    const back = $('.back', wrapper);
    if (back) {
      back.style.setProperty('background-image', `url("${CARD_BACK_SRC}")`, 'important');
      back.style.setProperty('background-size', 'cover', 'important');
      back.style.setProperty('background-position', 'center', 'important');
      let img = $(':scope > img', back);
      if (!img) {
        img = document.createElement('img');
        img.alt = '';
        back.prepend(img);
      }
      img.removeAttribute('onerror');
      img.style.removeProperty('display');
      img.style.removeProperty('opacity');
      img.dataset.luneaIntimacyCardback = RELEASE;
      if (img.getAttribute('src') !== CARD_BACK_SRC) img.setAttribute('src', CARD_BACK_SRC);
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
    wrappers.forEach(repairTarotWrapper);
    return wrappers.length > 0;
  }

  function wrapCardFactory() {
    const current = W.makeCardWrapper;
    if (typeof current !== 'function') return false;
    if (current.__luneaIntimacyV42Wrapped) return true;
    const wrapped = function(...args) {
      const wrapper = current.apply(this, args);
      if (isIntimacyActive()) repairTarotWrapper(wrapper);
      return wrapper;
    };
    wrapped.__luneaIntimacyV42Wrapped = true;
    wrapped.__luneaPriorMakeCardWrapper = current;
    W.makeCardWrapper = wrapped;
    return true;
  }

  function observeCards() {
    const cards = document.getElementById('cards');
    if (!cards || cards.__luneaIntimacyV42Observed) return;
    cards.__luneaIntimacyV42Observed = true;
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; repairTarotCards(); });
    }).observe(cards, {childList:true, subtree:true});
  }

  function polishOracleTools() {
    const tools = document.getElementById('luneaIntimacyOracleTools');
    if (!tools) return false;
    const labels = {
      0: '타로만',
      1: '오라클 1장 보조',
      3: '오라클 3장 심층'
    };
    $$('[data-lio-mode]', tools).forEach(button => {
      const mode = Number(button.dataset.lioMode);
      if (labels[mode]) button.textContent = labels[mode];
      button.setAttribute('aria-label', labels[mode] || button.textContent);
      button.setAttribute('aria-pressed', button.classList.contains('on') ? 'true' : 'false');
    });

    let help = document.getElementById('luneaIntimacyOracleModeHelp');
    if (!help) {
      help = document.createElement('div');
      help.id = 'luneaIntimacyOracleModeHelp';
      help.className = 'lio-mode-help';
      $('.lio-mode', tools)?.insertAdjacentElement('afterend', help);
    }
    help.textContent = '1장 보조 · 전체 친밀감 흐름에 오라클 한 장을 더해 해석해요.  3장 심층 · 끌림·욕구 / 리듬·경계 / 유대·여운을 나눠 더 깊게 봐요.';
    return true;
  }

  function polishOracleLensLabels() {
    $$('#luneaIntimacyOraclePanel .lio-card span em').forEach(em => {
      const text = String(em.textContent || '').trim();
      if (text === '전체 리딩 렌즈') em.textContent = '전체 흐름 보조';
      else if (/렌즈$/.test(text)) em.textContent = text.replace(/\s*렌즈$/, '');
    });
  }

  function repairOraclePanel() {
    const panel = document.getElementById('luneaIntimacyOraclePanel');
    if (!panel) return false;
    $$('.lio-card', panel).forEach(card => {
      const face = $('.lio-card-face', card);
      if (!face) return;
      if (card.classList.contains('revealed')) {
        face.style.setProperty('background-image', `url("${ORACLE_ATLAS_SRC}")`, 'important');
      } else {
        face.style.setProperty('background-image', `url("${CARD_BACK_SRC}")`, 'important');
        face.style.setProperty('background-size', 'cover', 'important');
        face.style.setProperty('background-position', 'center', 'important');
      }
    });
    polishOracleLensLabels();
    return true;
  }

  function observeOraclePanel() {
    const panel = document.getElementById('luneaIntimacyOraclePanel');
    if (!panel || panel.__luneaIntimacyOracleV42Observed) return false;
    panel.__luneaIntimacyOracleV42Observed = true;
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        repairOraclePanel();
        polishOracleTools();
      });
    }).observe(panel, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
    return true;
  }

  function apply() {
    ensureStyle();
    wrapCardFactory();
    observeCards();
    polishOracleTools();
    repairOraclePanel();
    observeOraclePanel();

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
    if (!document.hidden) setTimeout(apply, 80);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  W.LUNEA_INTIMACY_BURGUNDY_V40 = {
    version: RELEASE,
    icon: ICON_SRC,
    cardBack: CARD_BACK_SRC,
    oracleAtlas: ORACLE_ATLAS_SRC,
    apply,
    repairTarotCards,
    repairTarotWrapper,
    repairOraclePanel,
    polishOracleTools,
  };
  console.info(`🍷 LUNEA INTIMACY unified V${RELEASE} ready`);
})();
