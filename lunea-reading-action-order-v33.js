'use strict';

/*
  LUNEA READING ACTION ORDER V33
  ==============================
  Keeps the reading action grid in a stable, task-oriented order even though
  several buttons are injected by independent feature modules.

  Row intent (3-column mobile grid):
  1) AI 해석 · 저장 · 다시 뽑기
  2) 전체 뒤집기 · 추가 카드 · 시기 오라클
  3) Astro Timing · Thai 보조 · Thai 기간
  4) Returns · Horary

  Unknown/future buttons are preserved after the known controls.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_ACTION_ORDER_V33__) return;
  W.__LUNEA_READING_ACTION_ORDER_V33__ = true;

  const ORDER = [
    'aiRead',
    'saveReading',
    'retry',
    'flipAll',
    'extraCard',
    'timingSupportBtn',
    'astroTransitBtn',
    'luneaThaiTarotBridgeBtn',
    'luneaThaiTarotRangeBtn',
    'astroReturnBtn',
    'astroHoraryBtn',
  ];

  function actionBar() {
    return document.querySelector('#spreadOverlay .actionbar');
  }

  function reorder() {
    const bar = actionBar();
    if (!bar) return false;
    const children = [...bar.children];
    if (!children.length) return true;

    const rank = new Map(ORDER.map((id, index) => [id, index]));
    const known = [];
    const unknown = [];
    children.forEach((node, index) => {
      if (rank.has(node.id)) known.push({node, rank:rank.get(node.id), index});
      else unknown.push({node, index});
    });
    known.sort((a,b) => a.rank - b.rank || a.index - b.index);
    unknown.sort((a,b) => a.index - b.index);
    const desired = [...known.map(x => x.node), ...unknown.map(x => x.node)];

    const already = desired.length === children.length && desired.every((node, index) => node === children[index]);
    if (already) return true;

    // appendChild only moves existing nodes; listeners and button state survive.
    desired.forEach(node => bar.appendChild(node));
    return true;
  }

  function boot() {
    reorder();
    let queued = false;
    const bar = actionBar();
    if (bar) {
      const observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        const run = () => { queued = false; reorder(); };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 16);
      });
      observer.observe(bar, {childList:true});
    }

    // Some feature buttons may arrive a little after the structural loader.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      reorder();
      const ready = ORDER.slice(0,9).every(id => !!document.getElementById(id));
      if (ready || tries > 80) clearInterval(timer);
    }, 250);
  }

  W.LUNEA_READING_ACTION_ORDER_V33 = {version:'33.0', order:[...ORDER], reorder};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
