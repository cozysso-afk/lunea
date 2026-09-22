'use strict';

/*
  LUNEA MANUAL SPREAD EVERYWHERE V1.3
  ===================================
  Hydrates category-scoped Manual Spread entries and repairs the dedicated
  INTIMACY cabinet when its direct-input row is missing.

  Parser-time rows created/bound by Reading Lifecycle V59 are left alone.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MANUAL_EVERYWHERE_V1__) return;
  W.__LUNEA_MANUAL_EVERYWHERE_V1__ = true;
  const INTIMACY_ACK_KEY = 'LUNEA_INTIMACY_ADULT_ACK_V1';

  function requestIntimacyAcknowledgement() {
    try { if (localStorage.getItem(INTIMACY_ACK_KEY) === '1') return true; } catch {}
    const ok = typeof confirm === 'function'
      ? confirm('INTIMACY 18+는 성인 사용자 전용 친밀감 리딩이야. 성인 간의 합의된 관계와 친밀감 질문에만 사용해줘. 계속할까?')
      : true;
    if (!ok) return false;
    try { localStorage.setItem(INTIMACY_ACK_KEY, '1'); } catch {}
    return true;
  }

  function openManualForCategory(category) {
    const cat = (String(category || 'GENERAL').trim() || 'GENERAL').toUpperCase();
    if (cat === 'INTIMACY' && !requestIntimacyAcknowledgement()) return;
    const opener = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof opener !== 'function') return;

    try {
      state.__luneaManualOriginCategory = cat;
      state.category = cat;
      state.__luneaIntimacyReading = cat === 'INTIMACY';
    } catch {}

    opener(cat, '직접 입력 배열', '이 파트의 질문에 맞춰 카드 포지션을 직접 고정합니다. AI가 배열을 다시 설계하지 않습니다.', 1);

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
      const sheetCat = document.getElementById('sheetCat');
      if (sheetCat) sheetCat.textContent = 'INTIMACY 18+';
    }

    const label = document.getElementById('drawLabel');
    if (label) label.textContent = '직접 배열로 카드 펼치기';
    document.getElementById('luneaManualPositions')?.focus?.({preventScroll:true});
  }

  function bindManualItem(item, category) {
    if (!item) return false;
    if (item.dataset.luneaLifecycleBound === '1') return true;
    if (item.dataset.luneaManualHydrated === '1') return true;

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

  function makeIntimacyManual(content) {
    if (!content) return null;
    const existing = content.querySelector('[data-manual-spread="1"],.lunea-manual-anywhere-item');
    if (existing) return existing;

    const item = document.createElement('div');
    item.className = 'reading-item lunea-manual-anywhere-item';
    item.dataset.cat = 'INTIMACY';
    item.dataset.manualSpread = '1';
    item.dataset.luneaIntimacyManual = '1';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = '<div><h4>직접 입력 배열</h4><p>포지션을 직접 고정 · 필요하면 A/B 대칭 복제.</p></div><div class="count">직접</div>';

    const ai = content.querySelector('[data-intimacy-ai="1"],.lunea-intimacy-ai-item');
    if (ai?.nextSibling) content.insertBefore(item, ai.nextSibling);
    else if (ai) content.appendChild(item);
    else content.prepend(item);
    return item;
  }

  function hydrateCategories() {
    let found = 0;
    document.querySelectorAll('.category-content').forEach(content => {
      const firstReading = content.querySelector('.reading-item[data-cat]');
      if (!firstReading) return;
      const category = (String(firstReading.dataset.cat || 'GENERAL').trim() || 'GENERAL').toUpperCase();
      let item = content.querySelector('[data-manual-spread="1"],.lunea-manual-anywhere-item,#luneaManualReadingItem');
      if (!item && category === 'INTIMACY') item = makeIntimacyManual(content);
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
    console.info(`🌙 LUNEA Manual Spread Everywhere V1.3 hydrated · ${found} categories`);
  }

  W.LUNEA_MANUAL_EVERYWHERE_V1 = Object.freeze({version:1.3,hydrateCategories,openManualForCategory,makeIntimacyManual});

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();