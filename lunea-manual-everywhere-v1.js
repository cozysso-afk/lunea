'use strict';

/*
  LUNEA MANUAL SPREAD EVERYWHERE V1
  =================================
  Additive UI layer loaded after lunea-manual-structure-v1.js.

  - Adds the existing user-authored manual spread entry to every tarot category.
  - Preserves the selected category (CAREER / LOVE / STOCK / future categories)
    so existing category-aware reading directives still apply.
  - Reuses the single manual spread panel and draw pipeline from Manual Structure V1.
  - Does not alter fixed spreads, RNG/card draw logic, or Horary.
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
      [0,80,250].forEach(ms => setTimeout(() => W.LUNEA_INTIMACY_ORACLE_UI_V36?.prepareSheetTools?.(), ms));
    }
    const label = document.getElementById('drawLabel');
    if (label) label.textContent = '직접 배열로 카드 펼치기';
    setTimeout(() => document.getElementById('luneaManualPositions')?.focus(), 0);
  }

  function makeManualItem(category) {
    const item = document.createElement('div');
    item.className = 'reading-item lunea-manual-anywhere-item';
    item.dataset.cat = category;
    item.dataset.manualSpread = '1';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `
      <div><h4>직접 입력 배열</h4><p>이 파트에서도 포지션을 직접 고정 · 필요하면 A/B 대칭 복제.</p></div>
      <div class="count">직접</div>`;

    const open = () => openManualForCategory(category);
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
    return item;
  }

  function scanCategories() {
    if (!W.LUNEA_MANUAL_SPREAD_V1 || !document.getElementById('luneaManualPanel')) return false;
    document.querySelectorAll('.category-content').forEach(content => {
      const firstReading = content.querySelector('.reading-item[data-cat]');
      if (!firstReading) return;

      const category = (String(firstReading.dataset.cat || 'GENERAL').trim() || 'GENERAL').toUpperCase();

      // GENERAL already receives its manual entry from Manual Structure V1.
      if (category === 'GENERAL' && content.querySelector('#luneaManualReadingItem')) return;
      if (content.querySelector('.lunea-manual-anywhere-item')) return;

      const item = makeManualItem(category);
      firstReading.insertAdjacentElement('beforebegin', item);
    });
    return true;
  }

  function install() {
    if (!scanCategories()) {
      setTimeout(install, 40);
      return;
    }

    // INTIMACY and future late feature cabinets can be injected after this module's
    // first DOMContentLoaded pass. Re-scan mutations briefly instead of silently
    // falling back to the GENERAL manual entry.
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      setTimeout(() => { queued = false; scanCategories(); }, 0);
    });
    if (document.body) observer.observe(document.body, {childList:true,subtree:true});
    [80, 250, 800, 2000].forEach(ms => setTimeout(scanCategories, ms));
    setTimeout(() => observer.disconnect(), 5000);

    console.info('🌙 LUNEA Manual Spread Everywhere V1 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(install, 0), {once:true});
  } else {
    setTimeout(install, 0);
  }
})();
