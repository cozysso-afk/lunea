'use strict';

/*
  LUNEA GENERAL 5 / 6 CARD PATCH V1
  - Existing GENERAL presets untouched
  - Adds two fixed presets only
  - Reuses existing openSheet(), state, draw engine, archive, AI interpretation
  - Existing RWS / Spread V7.4 / Timing Oracle untouched
*/
(() => {
  if (window.__LUNEA_GENERAL_5_6_V1__) return;
  window.__LUNEA_GENERAL_5_6_V1__ = true;

  const FIVE_TITLE = '5 CARD · CORE FLOW';
  const SIX_TITLE  = '6 CARD · FULL VIEW';

  const FIVE_POSITIONS = [
    '현재 상황의 핵심',
    '지금까지 이어진 원인과 배경',
    '겉으로 드러나지 않은 숨은 변수',
    '가까운 흐름에서 바뀌는 지점',
    '종합 결론과 가장 필요한 조언'
  ];

  const SIX_POSITIONS = [
    '현재 상황의 핵심',
    '과거에서 이어진 영향',
    '내면·보이지 않는 요인',
    '외부 환경·상대방의 변수',
    '질문자가 선택하거나 행동할 포인트',
    '향후 전개와 종합 결과'
  ];

  function patchFixedPositions() {
    if (typeof fixedPositions !== 'function') {
      console.warn('[LUNEA 5/6] fixedPositions() not found');
      return;
    }
    if (window.__LUNEA_GENERAL_5_6_FIXED_WRAPPED__) return;
    window.__LUNEA_GENERAL_5_6_FIXED_WRAPPED__ = true;

    const original = fixedPositions;
    fixedPositions = function(title, count) {
      if (title === FIVE_TITLE) return FIVE_POSITIONS.slice();
      if (title === SIX_TITLE) return SIX_POSITIONS.slice();
      return original.apply(this, arguments);
    };
  }

  function makeItem({title, desc, count, subtitle}) {
    const el = document.createElement('div');
    el.className = 'reading-item';
    el.dataset.cat = 'GENERAL';
    el.dataset.title = title;
    el.dataset.desc = desc;
    el.dataset.count = String(count);
    el.innerHTML = `
      <div>
        <h4>${title}</h4>
        <p>${subtitle}</p>
      </div>
      <div class="count">${count}</div>
    `;
    el.addEventListener('click', () => {
      if (typeof openSheet !== 'function') return;
      openSheet('GENERAL', title, desc, count);
    });
    return el;
  }

  function injectMenu() {
    const generalCategory = [...document.querySelectorAll('.category')].find(cat => {
      const h3 = cat.querySelector('.cat-text h3');
      return h3 && /GENERAL\s*&\s*AI\s*CUSTOM/i.test(h3.textContent || '');
    });

    if (!generalCategory) {
      console.warn('[LUNEA 5/6] GENERAL category not found');
      return;
    }

    const content = generalCategory.querySelector('.category-content');
    if (!content) return;

    if (content.querySelector('[data-lunea-general56="5"]') ||
        content.querySelector('[data-lunea-general56="6"]')) return;

    const five = makeItem({
      title: FIVE_TITLE,
      count: 5,
      desc: '범용 5카드 배열. 현재 상황, 원인, 숨은 변수, 전환점, 종합 결론을 한 번에 봅니다.',
      subtitle: '현재 · 원인 · 숨은 변수 · 전환점 · 결론'
    });
    five.dataset.luneaGeneral56 = '5';

    const six = makeItem({
      title: SIX_TITLE,
      count: 6,
      desc: '범용 6카드 배열. 현재·과거·내면·외부 변수·행동 포인트·향후 결과를 다층적으로 봅니다.',
      subtitle: '현재 · 과거 영향 · 내면 · 외부 · 행동 · 결과'
    });
    six.dataset.luneaGeneral56 = '6';

    // Put them after TIMELINE and before the deeper 7/10-card spreads.
    const timeline = [...content.querySelectorAll('.reading-item')].find(
      x => x.dataset.title === 'TIMELINE'
    );

    if (timeline) {
      timeline.insertAdjacentElement('afterend', six);
      timeline.insertAdjacentElement('afterend', five);
    } else {
      content.appendChild(five);
      content.appendChild(six);
    }
  }

  function boot() {
    patchFixedPositions();
    injectMenu();
    console.info('✦ LUNEA GENERAL 5/6 CARD PATCH V1 loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
