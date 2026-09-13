'use strict';

/*
  LUNEA MANUAL SPREAD EVERYWHERE V1.1
  ===================================
  Hydration-only layer for category-scoped Manual Spread entries.

  The visible rows are created deterministically by the parser-time reading
  lifecycle/category factory. This module must NOT insert menu rows later,
  poll for them, or observe the body to make them appear after the cabinet is
  already interactive.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MANUAL_EVERYWHERE_V1__) return;
  W.__LUNEA_MANUAL_EVERYWHERE_V1__ = true;

  function openManualForCategory(category) {
    const cat = (String(category || 'GENERAL').trim() || 'GENERAL').toUpperCase();
    const opener = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof opener !== 'function') return;

    try {
      state.__luneaManualOriginCategory = cat;
      state.category = cat;
      state.__luneaIntimacyReading = cat === 'INTIMACY';
    } catch {}

    opener(
      cat,
      '직접 입력 배열',
      '이 파트의 질문에 맞춰 카드 포지션을 직접 고정합니다. AI가 배열을 다시 설계하지 않습니다.',
      1
    );

    try {
      state.__luneaManualMode = true;
      state.__luneaManualReading = false;
      state.isAi = false;
      state.__luneaManualOriginCategory = cat;
      state.category = cat;
      state.__luneaIntimacyReading = cat === 'INTIMACY';
    } catch {}

    document.getElementById('luneaManualPanel')?.classList.add('show');
    if (cat === 'INTIMACY') {
      W.__LUNEA_INTIMACY_ACTIVE__ = true;
      document.body?.classList?.add('lunea-intimacy-reading');
      W.LUNEA_INTIMACY_ORACLE_UI_V36?.prepareSheetTools?.();
    }

    const label = document.getElementById('drawLabel');
    if (label) label.textContent = '직접 배열로 카드 펼치기';
    document.getElementById('luneaManualPositions')?.focus?.({preventScroll:true});
  }

  function bindManualItem(item, category) {
    if (!item || item.dataset.luneaManualHydrated === '1') return false;
    item.dataset.luneaManualHydrated = '1';
    const open = () => openManualForCategory(category);
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open();
    });
    return true;
  }

  function hydrateCategories() {
    let found = 0;
    document.querySelectorAll('.category-content').forEach(content => {
      const firstReading = content.querySelector('.reading-item[data-cat]');
      if (!firstReading) return;
      const category = (String(firstReading.dataset.cat || 'GENERAL').trim() || 'GENERAL').toUpperCase();
      const item = content.querySelector('[data-manual-spread="1"],.lunea-manual-anywhere-item,#luneaManualReadingItem');
      if (!item) return;
      item.dataset.cat = category;
      bindManualItem(item, category);
      found += 1;
    });
    document.documentElement.dataset.luneaManualHydrated = String(found);
    return found;
  }

  function boot() {
    const found = hydrateCategories();
    if (!found) console.warn('[LUNEA Manual Everywhere] deterministic manual rows were not present at boot');
    console.info(`🌙 LUNEA Manual Spread Everywhere V1.1 hydrated · ${found} categories`);
  }

  W.LUNEA_MANUAL_EVERYWHERE_V1 = Object.freeze({
    version: 1.1,
    hydrateCategories,
    openManualForCategory
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
