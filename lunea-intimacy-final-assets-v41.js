'use strict';

/*
  LUNEA INTIMACY FINAL ASSETS V41.1
  =================================
  Final-art integration layer.

  Final binary assets are deliberately separated by role:
  - assets/intimacy-oracle/tarot_back_final.png
  - assets/intimacy-oracle/oracle_back_final.png
  - assets/intimacy-oracle/oracle_atlas_final.png (6 x 6, O01..O36)

  If any final binary is missing, the existing production asset is used as a
  safe fallback. GENERAL/LOVE/etc. tarot visuals are never modified.
*/
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_FINAL_ASSETS_V41__) return;
  W.__LUNEA_INTIMACY_FINAL_ASSETS_V41__ = true;

  const RELEASE = '41.1';
  const FINAL_TAROT_BACK = './assets/intimacy-oracle/tarot_back_final.png';
  const FINAL_ORACLE_BACK = './assets/intimacy-oracle/oracle_back_final.png';
  const FINAL_ORACLE_ATLAS = './assets/intimacy-oracle/oracle_atlas_final.png';
  const FALLBACK_TAROT_BACK = './assets/intimacy-oracle/back_intimacy.svg';
  const FALLBACK_ORACLE_BACK = './assets/intimacy-oracle/back_intimacy.svg';
  const FALLBACK_ORACLE_ATLAS = './assets/intimacy-oracle/oracle_atlas_v36.jpg';
  const STYLE_ID = 'luneaIntimacyFinalAssetsV41Style';

  const state = {
    tarotBack: FALLBACK_TAROT_BACK,
    oracleBack: FALLBACK_ORACLE_BACK,
    oracleAtlas: FALLBACK_ORACLE_ATLAS,
    finalTarotReady: false,
    finalOracleBackReady: false,
    finalOracleReady: false,
  };

  function intimacyActive() {
    try {
      return String(window.state?.category || '').toUpperCase() === 'INTIMACY' ||
        !!W.__LUNEA_INTIMACY_ACTIVE__ ||
        document.body?.classList?.contains('lunea-intimacy-reading') ||
        !!W.LUNEA_INTIMACY_V34?.getSpread?.(window.state?.title);
    } catch {
      return !!W.__LUNEA_INTIMACY_ACTIVE__;
    }
  }

  function assetExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      let settled = false;
      const done = value => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      img.onload = () => done((img.naturalWidth || 0) > 10 && (img.naturalHeight || 0) > 10);
      img.onerror = () => done(false);
      img.src = `${src}?v=${encodeURIComponent(RELEASE)}`;
      setTimeout(() => done(false), 3500);
    });
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      body.lunea-intimacy-reading #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back,
      body.lunea-intimacy-reading #cards .tarot-card .back {
        background-image:url("${state.tarotBack}")!important;
        background-size:cover!important;
        background-position:center!important;
        background-repeat:no-repeat!important;
      }
      body.lunea-intimacy-reading #cards .tarot-card-wrapper.lunea-intimacy-tarot-card .back>img,
      body.lunea-intimacy-reading #cards .tarot-card .back>img {
        object-fit:cover!important;
        object-position:center!important;
      }
    `;
  }

  function patchTarotBacks() {
    if (!intimacyActive()) return false;
    ensureStyle();
    const backs = [...document.querySelectorAll('#cards .tarot-card .back')];
    backs.forEach(back => {
      back.style.setProperty('background-image', `url("${state.tarotBack}")`, 'important');
      back.style.setProperty('background-size', 'cover', 'important');
      back.style.setProperty('background-position', 'center', 'important');
      const img = back.querySelector(':scope > img');
      if (img) {
        if (img.getAttribute('src') !== state.tarotBack) img.setAttribute('src', state.tarotBack);
        img.style.setProperty('display', 'block', 'important');
        img.style.setProperty('opacity', '1', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.dataset.luneaIntimacyFinalBack = RELEASE;
      }
      back.dataset.luneaIntimacyFinalBack = RELEASE;
    });
    return backs.length > 0;
  }

  function oracleIndexFromNode(cardNode) {
    const title = cardNode.querySelector('span strong')?.textContent?.trim();
    const ko = cardNode.querySelector('span small')?.textContent?.trim();
    const cards = Object.values(W.LUNEA_INTIMACY_ORACLE_V35?.cards || {});
    if (title) {
      const byTitle = cards.findIndex(card => String(card.enTitle || '').trim() === title);
      if (byTitle >= 0) return byTitle;
    }
    if (ko) return cards.findIndex(card => String(card.koTitle || '').trim() === ko);
    return -1;
  }

  function paintOracleBack(face) {
    face.style.setProperty('background-image', `url("${state.oracleBack}")`, 'important');
    face.style.setProperty('background-size', 'cover', 'important');
    face.style.setProperty('background-position', 'center', 'important');
    face.style.setProperty('background-repeat', 'no-repeat', 'important');
    face.dataset.luneaIntimacyFinalOracleBack = state.finalOracleBackReady ? RELEASE : 'fallback';
    delete face.dataset.luneaIntimacyFinalAtlas;
  }

  function paintOracleFront(face, idx) {
    const col = idx % 6;
    const row = Math.floor(idx / 6);
    face.style.setProperty('background-image', `url("${state.oracleAtlas}")`, 'important');
    face.style.setProperty('background-size', '600% 600%', 'important');
    face.style.setProperty('background-position', `${col / 5 * 100}% ${row / 5 * 100}%`, 'important');
    face.style.setProperty('background-repeat', 'no-repeat', 'important');
    face.dataset.luneaIntimacyFinalAtlas = state.finalOracleReady ? RELEASE : 'fallback';
    delete face.dataset.luneaIntimacyFinalOracleBack;
  }

  function patchOracleFaces(root = document) {
    if (!intimacyActive()) return false;
    const nodes = [...root.querySelectorAll('.lio-card')];
    nodes.forEach(node => {
      const face = node.querySelector('.lio-card-face');
      if (!face) return;
      const idx = oracleIndexFromNode(node);
      if (idx < 0 || idx > 35) return;
      face.dataset.luneaIntimacyOracleIndex = String(idx + 1).padStart(2, '0');
      if (node.classList.contains('revealed')) paintOracleFront(face, idx);
      else paintOracleBack(face);
    });
    return nodes.length > 0;
  }

  function patchVisible() {
    patchTarotBacks();
    patchOracleFaces();
  }

  function observe() {
    const observer = new MutationObserver(() => {
      if (!intimacyActive()) return;
      requestAnimationFrame(patchVisible);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    return observer;
  }

  async function resolveFinalAssets() {
    const [tarot, oracleBack, oracle] = await Promise.all([
      assetExists(FINAL_TAROT_BACK),
      assetExists(FINAL_ORACLE_BACK),
      assetExists(FINAL_ORACLE_ATLAS),
    ]);
    state.finalTarotReady = tarot;
    state.finalOracleBackReady = oracleBack;
    state.finalOracleReady = oracle;
    state.tarotBack = tarot ? FINAL_TAROT_BACK : FALLBACK_TAROT_BACK;
    state.oracleBack = oracleBack ? FINAL_ORACLE_BACK : FALLBACK_ORACLE_BACK;
    state.oracleAtlas = oracle ? FINAL_ORACLE_ATLAS : FALLBACK_ORACLE_ATLAS;
    ensureStyle();
    patchVisible();
    document.documentElement.dataset.luneaIntimacyFinalTarot = tarot ? '1' : '0';
    document.documentElement.dataset.luneaIntimacyFinalOracleBack = oracleBack ? '1' : '0';
    document.documentElement.dataset.luneaIntimacyFinalOracle = oracle ? '1' : '0';
    return { ...state };
  }

  function boot() {
    ensureStyle();
    observe();
    resolveFinalAssets().catch(error => console.warn('[LUNEA INTIMACY] final asset probe failed', error));
    window.addEventListener('pageshow', () => setTimeout(patchVisible, 80));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(patchVisible, 80);
    });
  }

  W.LUNEA_INTIMACY_FINAL_ASSETS_V41 = Object.freeze({
    version: RELEASE,
    finalTarotBack: FINAL_TAROT_BACK,
    finalOracleBack: FINAL_ORACLE_BACK,
    finalOracleAtlas: FINAL_ORACLE_ATLAS,
    fallbackTarotBack: FALLBACK_TAROT_BACK,
    fallbackOracleBack: FALLBACK_ORACLE_BACK,
    fallbackOracleAtlas: FALLBACK_ORACLE_ATLAS,
    get status() { return { ...state }; },
    resolveFinalAssets,
    patchVisible,
    patchTarotBacks,
    patchOracleFaces,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
