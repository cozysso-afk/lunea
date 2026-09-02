'use strict';

/*
  LUNEA GENERAL ORDER V30.5
  ========================
  Keeps GENERAL & AI CUSTOM in task-priority order:
  AI custom/manual authoring first, then fixed spreads from light to deep.
*/
(() => {
  const W = window;
  if (W.__LUNEA_GENERAL_ORDER_V305__) return;
  W.__LUNEA_GENERAL_ORDER_V305__ = true;

  const ORDER = [
    '질문 맞춤 AI 배열',
    '직접 입력 배열',
    'ONE CARD',
    'YES / NO',
    'TIMELINE',
    '5 CARD · CORE FLOW',
    '6 CARD · FULL VIEW',
    'DEEP FLOW',
    'CELTIC CROSS'
  ];

  function titleOf(el) {
    if (!el) return '';
    if (el.id === 'luneaManualReadingItem') return '직접 입력 배열';
    return String(el.dataset?.title || el.querySelector('h4')?.textContent || '').trim();
  }

  function reorder() {
    const aiItem = [...document.querySelectorAll('.reading-item')]
      .find(el => el.dataset?.title === '질문 맞춤 AI 배열');
    if (!aiItem) return false;

    const parent = aiItem.parentElement;
    if (!parent) return false;

    const manual = document.getElementById('luneaManualReadingItem');
    if (manual && manual.parentElement === parent) {
      manual.dataset.title = '직접 입력 배열';
      manual.dataset.cat = 'GENERAL';
    }

    const items = [...parent.children].filter(el => el.classList?.contains('reading-item'));
    if (items.length < 2) return false;

    const current = items.map(titleOf);
    const known = ORDER.filter(title => current.includes(title));
    const extras = current.filter(title => title && !ORDER.includes(title));
    const desired = [...known, ...extras];
    if (desired.join('\u0000') === current.join('\u0000')) return true;

    const buckets = new Map();
    items.forEach(el => {
      const title = titleOf(el);
      if (!buckets.has(title)) buckets.set(title, []);
      buckets.get(title).push(el);
    });

    const anchor = items[items.length - 1].nextSibling;
    const fragment = document.createDocumentFragment();
    desired.forEach(title => {
      const list = buckets.get(title) || [];
      const el = list.shift();
      if (el) fragment.appendChild(el);
    });
    parent.insertBefore(fragment, anchor);
    return true;
  }

  function boot() {
    reorder();
    [60, 180, 450, 900, 1600].forEach(ms => setTimeout(reorder, ms));
    W.LUNEA_GENERAL_ORDER = {version:30.5, order:ORDER.slice(), reorder};
    console.info('✦ LUNEA GENERAL ORDER V30.5 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
