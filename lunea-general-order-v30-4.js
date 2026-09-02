'use strict';

/* LUNEA GENERAL ORDER V30.4 · keeps all fixed GENERAL spreads in depth order. */
(() => {
  const W = window;
  if (W.__LUNEA_GENERAL_ORDER_V304__) return;
  W.__LUNEA_GENERAL_ORDER_V304__ = true;

  const ORDER = [
    'ONE CARD',
    'YES / NO',
    'TIMELINE',
    '5 CARD · CORE FLOW',
    '6 CARD · FULL VIEW',
    'DEEP FLOW',
    'CELTIC CROSS'
  ];

  function reorder() {
    const items = [...document.querySelectorAll('.reading-item[data-cat="GENERAL"]')];
    if (items.length < 2) return false;
    const parent = items[0].parentElement;
    if (!parent || items.some(el => el.parentElement !== parent)) return false;

    const current = items.map(el => el.dataset.title || '');
    const known = ORDER.filter(title => current.includes(title));
    const extras = current.filter(title => !ORDER.includes(title));
    const desired = [...known, ...extras];
    if (desired.join('\u0000') === current.join('\u0000')) return true;

    const buckets = new Map();
    items.forEach(el => {
      const title = el.dataset.title || '';
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
    [80, 250, 600, 1200].forEach(ms => setTimeout(reorder, ms));
    W.LUNEA_GENERAL_ORDER = {version:30.4, order:ORDER.slice(), reorder};
    console.info('✦ LUNEA GENERAL ORDER V30.4 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
