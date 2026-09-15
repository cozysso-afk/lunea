'use strict';

/* LUNEA INTIMACY REPAIR V43.4
   Clean repair layer for the 2026-09 recovery lineage.
   - Keeps INTIMACY state detection robust for manual spreads.
   - Restyles the shared manual spread editor in burgundy / rose-gold.
   - Routes visible INTIMACY ORACLE cards to the final iPhone-branch PNG files.
   - Restores the approved per-card aspect ratios and contain rendering.
   - Keeps the ORACLE back separate from the Tarot back asset.
   - Simplifies Oracle controls to Tarot / 1-card / 3-card choices only.
   This file does not call Gemini and does not change RNG or Oracle semantics. */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_REPAIR_V43__) return;
  W.__LUNEA_INTIMACY_REPAIR_V43__ = true;

  const RELEASE = '43.4';
  const STYLE_ID = 'luneaIntimacyRepairV43Style';
  const ORACLE_CARD_ROOT = './assets/intimacy-oracle/cards';
  const FINAL_ORACLE_BACK = './assets/intimacy-oracle/oracle_back_v2.png';
  const ASSET_VERSION = 'iphone-final36-20260916';
  const CARD_ASPECT_RATIOS = Object.freeze({
    O01:'1024/1536',O02:'1024/1536',O03:'1024/1536',O04:'1024/1536',O05:'1024/1536',O06:'1024/1536',
    O07:'1024/1536',O08:'1024/1536',O09:'1024/1536',O10:'1024/1536',O11:'1024/1536',O12:'1024/1536',
    O13:'1055/1491',O14:'1055/1491',O15:'1055/1491',O16:'1024/1536',O17:'1024/1536',O18:'1055/1491',
    O19:'1024/1536',O20:'1024/1536',O21:'1086/1448',O22:'1055/1491',O23:'1024/1536',O24:'1024/1536',
    O25:'1024/1536',O26:'1055/1491',O27:'1055/1491',O28:'1055/1491',O29:'1055/1491',O30:'1055/1491',
    O31:'1055/1491',O32:'1024/1536',O33:'1024/1536',O34:'1024/1536',O35:'1055/1491',O36:'1024/1536'
  });
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function currentState() {
    try { if (typeof state !== 'undefined') return state; } catch {}
    return W.state || null;
  }

  function intimacyActive() {
    try {
      const s = currentState();
      return String(s?.category || '').toUpperCase() === 'INTIMACY' ||
        !!W.__LUNEA_INTIMACY_ACTIVE__ ||
        document.body?.classList?.contains('lunea-intimacy-reading') ||
        !!W.LUNEA_INTIMACY_V34?.getSpread?.(s?.title);
    } catch {
      return !!W.__LUNEA_INTIMACY_ACTIVE__;
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
      #luneaManualPanel[data-lunea-intimacy-theme]{
        background:
          radial-gradient(circle at 12% 8%,rgba(196,68,113,.16),transparent 32%),
          linear-gradient(155deg,rgba(78,17,43,.76),rgba(31,10,28,.96) 52%,rgba(14,9,20,.99))!important;
        border:1px solid rgba(231,143,177,.30)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 12px 28px rgba(51,7,30,.18)!important;
      }
      #luneaManualPanel[data-lunea-intimacy-theme] label{color:#f4e9ee!important}
      #luneaManualPanel[data-lunea-intimacy-theme] input,
      #luneaManualPanel[data-lunea-intimacy-theme] textarea{
        background:rgba(19,8,17,.82)!important;
        border-color:rgba(230,145,179,.24)!important;
        color:#fff3f7!important;
        caret-color:#efafc7!important;
      }
      #luneaManualPanel[data-lunea-intimacy-theme] input:focus,
      #luneaManualPanel[data-lunea-intimacy-theme] textarea:focus{
        border-color:rgba(245,163,195,.56)!important;
        box-shadow:0 0 0 2px rgba(171,55,103,.13)!important;
      }
      #luneaManualPanel[data-lunea-intimacy-theme] .manual-check{
        background:linear-gradient(145deg,rgba(137,34,75,.22),rgba(83,27,70,.14))!important;
        border-color:rgba(229,133,171,.25)!important;
      }
      #luneaManualPanel[data-lunea-intimacy-theme] .manual-check input{accent-color:#bf557f!important}
      #luneaManualPanel[data-lunea-intimacy-theme] .manual-check b{color:#ffeef4!important}
      #luneaManualPanel[data-lunea-intimacy-theme] .manual-check span,
      #luneaManualPanel[data-lunea-intimacy-theme] .manual-help{color:rgba(232,202,214,.76)!important}
      #luneaManualPanel[data-lunea-intimacy-theme] #luneaManualCount{color:#efafc7!important}
      #luneaManualPanel[data-lunea-intimacy-theme] #luneaManualReadingItem .count{
        color:#f2b4ca!important;
        border-color:rgba(234,145,178,.34)!important;
        background:rgba(133,36,75,.20)!important;
      }
      #luneaIntimacyOracleTools[data-lunea-clean-oracle="1"] .lio-mode{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      #luneaIntimacyOracleTools .lunea-oracle-hint{
        margin:0 0 7px;color:rgba(232,202,214,.74);font-size:10px;line-height:1.35;text-align:left;
      }

      /* Final iPhone-branch Oracle presentation. Keep the entire uploaded PNG. */
      #luneaIntimacyOraclePanel .lio-card{
        display:flex!important;flex-direction:column!important;
        aspect-ratio:auto!important;overflow:visible!important;
      }
      #luneaIntimacyOraclePanel .lio-card:only-child{
        grid-column:1/-1!important;width:min(100%,180px)!important;min-width:0!important;justify-self:center!important;
      }
      #luneaIntimacyOraclePanel .lio-card-art{
        position:relative!important;width:100%!important;min-width:0!important;
        overflow:hidden!important;border-radius:9px!important;background:#14060d!important;perspective:900px!important;
      }
      #luneaIntimacyOraclePanel .lio-card-art > .lio-card-flip{position:absolute!important;inset:0!important}
      #luneaIntimacyOraclePanel .lio-card-front{
        background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;
        filter:none!important;
      }
      #luneaIntimacyOraclePanel .lio-card-back{
        background-image:url('${FINAL_ORACLE_BACK}?v=${ASSET_VERSION}')!important;
        background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;
      }
      #luneaIntimacyOraclePanel .lio-card > .lio-card-meta{
        position:static!important;left:auto!important;right:auto!important;bottom:auto!important;
        display:block!important;box-sizing:border-box!important;width:100%!important;min-height:0!important;
        padding:5px 4px!important;background:transparent!important;backdrop-filter:none!important;
        border-radius:0!important;color:#e7cbd5!important;line-height:1.4!important;overflow-wrap:anywhere!important;
      }
      #luneaIntimacyOraclePanel .lio-card > .lio-card-meta em{display:block!important;font-style:normal!important;font-size:10px!important}
      #luneaIntimacyOraclePanel .lio-card > .lio-card-meta strong,
      #luneaIntimacyOraclePanel .lio-card > .lio-card-meta small{display:none!important}

      /* Legacy Oracle imagery only. Never use this selector for Tarot backs. */
      body.lunea-intimacy-reading .lio-card:not(.revealed) .lio-card-face{
        background-image:url('${FINAL_ORACLE_BACK}?v=${ASSET_VERSION}')!important;
        background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;
      }
    `;
  }

  function oracleIndex(node) {
    const visual = node?.querySelector?.('.lio-card-front,.lio-card-face');
    const raw = `${visual?.style?.backgroundImage || ''} ${visual?.dataset?.luneaIntimacyOracleIndex || ''}`;
    const direct = raw.match(/oracle_(\d{2})\.png/i) || raw.match(/\b(\d{2})\b/);
    if (direct) {
      const n = Number(direct[1]);
      if (n >= 1 && n <= 36) return n - 1;
    }
    const title = node?.querySelector?.('span strong')?.textContent?.trim();
    const ko = node?.querySelector?.('span small')?.textContent?.trim();
    const cards = Object.values(W.LUNEA_INTIMACY_ORACLE_V35?.cards || {});
    if (title) {
      const idx = cards.findIndex(card => String(card.enTitle || '').trim() === title);
      if (idx >= 0) return idx;
    }
    if (ko) return cards.findIndex(card => String(card.koTitle || '').trim() === ko);
    return -1;
  }

  function ensureModernCardStructure(node, cardNo) {
    const flip = node?.querySelector?.(':scope > .lio-card-flip');
    const existingArt = node?.querySelector?.(':scope > .lio-card-art');
    let art = existingArt;
    if (!art && flip) {
      art = document.createElement('div');
      art.className = 'lio-card-art';
      flip.before(art);
      art.appendChild(flip);
    }
    if (art) art.style.aspectRatio = CARD_ASPECT_RATIOS[`O${cardNo}`] || '2/3';
    const meta = node?.querySelector?.(':scope > span');
    if (meta) {
      meta.classList.add('lio-card-meta');
      const strong = meta.querySelector('strong');
      const small = meta.querySelector('small');
      if (strong) strong.hidden = true;
      if (small) small.hidden = true;
    }
    return art;
  }

  function patchOracleCard(node) {
    if (!node) return false;
    const idx = oracleIndex(node);
    if (idx < 0 || idx > 35) return false;
    const cardNo = String(idx + 1).padStart(2, '0');
    node.dataset.luneaIntimacyOracleIndex = cardNo;

    const front = node.querySelector('.lio-card-front');
    if (front) {
      ensureModernCardStructure(node, cardNo);
      front.dataset.luneaIntimacyOracleIndex = cardNo;
      front.style.setProperty('background-image', `url("${ORACLE_CARD_ROOT}/oracle_${cardNo}.png?v=${ASSET_VERSION}")`, 'important');
      front.style.setProperty('background-size', 'contain', 'important');
      front.style.setProperty('background-position', 'center', 'important');
      front.style.setProperty('background-repeat', 'no-repeat', 'important');
      front.style.setProperty('filter', 'none', 'important');
      front.dataset.luneaIntimacyOracleAsset = 'iphone-final36-contain-v43';
      const back = node.querySelector('.lio-card-back');
      if (back) {
        back.style.setProperty('background-image', `url("${FINAL_ORACLE_BACK}?v=${ASSET_VERSION}")`, 'important');
        back.style.setProperty('background-size', 'cover', 'important');
        back.style.setProperty('background-position', 'center', 'important');
        back.style.setProperty('background-repeat', 'no-repeat', 'important');
      }
      return true;
    }

    const face = node.querySelector('.lio-card-face');
    if (!face) return false;
    face.dataset.luneaIntimacyOracleIndex = cardNo;
    if (!node.classList.contains('revealed')) {
      face.style.setProperty('background-image', `url("${FINAL_ORACLE_BACK}?v=${ASSET_VERSION}")`, 'important');
      face.style.setProperty('background-size', 'cover', 'important');
      face.style.setProperty('background-position', 'center', 'important');
      face.style.setProperty('background-repeat', 'no-repeat', 'important');
      face.dataset.luneaIntimacyOracleAsset = 'final-png-oracle-back-v43';
      return true;
    }
    face.style.setProperty('background-image', `url("${ORACLE_CARD_ROOT}/oracle_${cardNo}.png?v=${ASSET_VERSION}")`, 'important');
    face.style.setProperty('background-size', 'contain', 'important');
    face.style.setProperty('background-position', 'center', 'important');
    face.style.setProperty('background-repeat', 'no-repeat', 'important');
    face.style.setProperty('filter', 'none', 'important');
    face.dataset.luneaIntimacyOracleAsset = 'iphone-final36-contain-v43';
    return true;
  }

  function patchOracleCards(root = document) {
    if (!intimacyActive()) return false;
    const cards = $$('.lio-card', root);
    cards.forEach(patchOracleCard);
    return cards.length > 0;
  }

  function simplifyOracleTools() {
    const tools = document.getElementById('luneaIntimacyOracleTools');
    if (!tools) return false;
    tools.dataset.luneaCleanOracle = '1';
    tools.querySelector('.lio-qrow')?.remove();
    tools.querySelector('.lio-suggestions')?.remove();
    const labels = {0:'타로만',1:'오라클 1장',3:'오라클 3장'};
    tools.querySelectorAll('[data-lio-mode]').forEach(button => {
      const label = labels[Number(button.dataset.lioMode)];
      if (label) button.textContent = label;
    });
    if (!tools.querySelector('.lunea-oracle-hint')) {
      const hint = document.createElement('div');
      hint.className = 'lunea-oracle-hint';
      hint.textContent = 'INTIMACY 리딩에 함께 사용할 오라클 수';
      tools.prepend(hint);
    }
    return true;
  }

  function clearManualContext() {
    const panel = document.getElementById('luneaManualPanel');
    if (!panel) return false;
    delete panel.dataset.luneaIntimacyTheme;
    return true;
  }

  function markManualContext() {
    const panel = document.getElementById('luneaManualPanel');
    if (!panel) return false;
    if (!intimacyActive()) {
      clearManualContext();
      return false;
    }
    panel.dataset.luneaIntimacyTheme = RELEASE;
    document.body?.classList?.add('lunea-intimacy-reading');
    try {
      const s = currentState();
      if (s) {
        s.category = 'INTIMACY';
        s.__luneaIntimacyReading = true;
      }
    } catch {}
    return true;
  }

  function apply() {
    ensureStyle();
    if (!intimacyActive()) {
      clearManualContext();
      return false;
    }
    document.body?.classList?.add('lunea-intimacy-reading');
    markManualContext();
    simplifyOracleTools();
    patchOracleCards();
    return true;
  }

  function boot() {
    apply();
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; apply(); });
    });
    observer.observe(document.documentElement, {childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    [120, 450, 1200, 3000].forEach(ms => setTimeout(apply, ms));
    W.addEventListener('pageshow', () => setTimeout(apply, 80));
  }

  W.LUNEA_INTIMACY_REPAIR_V43 = Object.freeze({
    version: RELEASE,
    oracleCardRoot: ORACLE_CARD_ROOT,
    finalOracleBack: FINAL_ORACLE_BACK,
    assetVersion: ASSET_VERSION,
    cardAspectRatios: CARD_ASPECT_RATIOS,
    intimacyActive,
    apply,
    patchOracleCards,
    simplifyOracleTools,
    markManualContext,
    clearManualContext,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  console.info(`🌹 LUNEA INTIMACY repair V${RELEASE} ready · iPhone final Oracle artwork preserved`);
})();
