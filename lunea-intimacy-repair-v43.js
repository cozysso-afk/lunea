'use strict';

/* LUNEA INTIMACY REPAIR V43.2
   Clean repair layer for the 2026-09-04 recovery branch.
   - Keeps INTIMACY state detection robust for manual spreads.
   - Restyles the shared manual spread editor in burgundy / rose-gold.
   - Routes visible INTIMACY ORACLE cards to their individual final PNG files.
   - Keeps the ORACLE back separate from the Tarot back asset.
   - Simplifies Oracle controls to Tarot / 1-card / 3-card choices only.
   This file does not call Gemini and does not change RNG. */
(() => {
  const W = window;
  if (W.__LUNEA_INTIMACY_REPAIR_V43__) return;
  W.__LUNEA_INTIMACY_REPAIR_V43__ = true;

  const RELEASE = '43.3';
  const STYLE_ID = 'luneaIntimacyRepairV43Style';
  const ORACLE_CARD_ROOT = './assets/intimacy-oracle/cards';
  const FINAL_ORACLE_BACK = './assets/intimacy-oracle/oracle_back_v2.png';
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

      /* Oracle imagery only. Never use this selector for Tarot backs. */
      body.lunea-intimacy-reading .lio-card:not(.revealed) .lio-card-face{
        background-image:url('${FINAL_ORACLE_BACK}')!important;
        background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;
      }
    `;
  }

  function oracleIndex(node) {
    const title = node.querySelector('span strong')?.textContent?.trim();
    const ko = node.querySelector('span small')?.textContent?.trim();
    const cards = Object.values(W.LUNEA_INTIMACY_ORACLE_V35?.cards || {});
    if (title) {
      const idx = cards.findIndex(card => String(card.enTitle || '').trim() === title);
      if (idx >= 0) return idx;
    }
    if (ko) return cards.findIndex(card => String(card.koTitle || '').trim() === ko);
    return -1;
  }

  function patchOracleCard(node) {
    const face = node?.querySelector?.('.lio-card-face');
    if (!face) return false;
    const idx = oracleIndex(node);
    if (idx < 0 || idx > 35) return false;
    face.dataset.luneaIntimacyOracleIndex = String(idx + 1).padStart(2, '0');
    if (!node.classList.contains('revealed')) {
      face.style.setProperty('background-image', `url("${FINAL_ORACLE_BACK}")`, 'important');
      face.style.setProperty('background-size', 'cover', 'important');
      face.style.setProperty('background-position', 'center', 'important');
      face.style.setProperty('background-repeat', 'no-repeat', 'important');
      face.dataset.luneaIntimacyOracleAsset = 'final-png-oracle-back-v43';
      return true;
    }
    const cardNo = String(idx + 1).padStart(2, '0');
    face.style.setProperty('background-image', `url("${ORACLE_CARD_ROOT}/oracle_${cardNo}.png")`, 'important');
    face.style.setProperty('background-size', 'cover', 'important');
    face.style.setProperty('background-position', 'center', 'important');
    face.style.setProperty('background-repeat', 'no-repeat', 'important');
    face.dataset.luneaIntimacyOracleAsset = 'individual-png-v43';
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
    intimacyActive,
    apply,
    patchOracleCards,
    simplifyOracleTools,
    markManualContext,
    clearManualContext,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  console.info(`🌹 LUNEA INTIMACY repair V${RELEASE} ready`);
})();
