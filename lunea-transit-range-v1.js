'use strict';

/*
  LUNEA TRANSIT RANGE V1
  ======================
  UI extension for Transit Scanner.
  Loaded before astro-transit-v1.js and waits for its modal to exist.

  - Adds 180 / 270 / 365 day choices.
  - Adds 6개월 / 9개월 / 1년 quick chips.
  - Keeps the existing Transit Scanner calculation / rendering code intact.
  - If the question explicitly says 6개월, 9개월, 1년/12개월,
    selects the matching longer range after the modal opens.
*/
(() => {
  const W = window;
  if (W.__LUNEA_TRANSIT_RANGE_V1__) return;
  W.__LUNEA_TRANSIT_RANGE_V1__ = true;

  const $ = id => document.getElementById(id);
  const LONG = [
    [180, '180일 · 약 6개월', '6개월'],
    [270, '270일 · 약 9개월', '9개월'],
    [365, '365일 · 1년', '1년']
  ];

  function inferLongDays(question) {
    const q = String(question || '').normalize('NFKC').replace(/\s+/g, ' ');
    if (/(?:1\s*년|일\s*년|한\s*해|12\s*(?:개월|달))/.test(q)) return 365;
    if (/(?:9\s*(?:개월|달)|아홉\s*(?:개월|달))/.test(q)) return 270;
    if (/(?:반\s*년|6\s*(?:개월|달)|여섯\s*(?:개월|달))/.test(q)) return 180;
    return 0;
  }

  function ensureLongOptions() {
    const select = $('astroTransitDays');
    if (!select) return false;
    LONG.forEach(([days, label]) => {
      if (select.querySelector(`option[value="${days}"]`)) return;
      const option = document.createElement('option');
      option.value = String(days);
      option.textContent = label;
      select.appendChild(option);
    });
    return true;
  }

  function ensureLongChips() {
    const wrap = document.querySelector('#astroTransitOverlay .astro-range-chips');
    const select = $('astroTransitDays');
    if (!wrap || !select) return false;
    LONG.forEach(([days, , chipLabel]) => {
      if (wrap.querySelector(`[data-lunea-long-days="${days}"]`)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'astro-range-chip';
      button.dataset.luneaLongDays = String(days);
      button.dataset.days = String(days);
      button.textContent = chipLabel;
      button.addEventListener('click', () => {
        select.value = String(days);
        select.dispatchEvent(new Event('change', {bubbles:true}));
      });
      wrap.appendChild(button);
    });
    return true;
  }

  function selectFromQuestion() {
    const select = $('astroTransitDays');
    if (!select) return;
    const days = inferLongDays($('astroTransitQuestion')?.value || '');
    if (!days) return;
    select.value = String(days);
    select.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function updateLongChipState() {
    const select = $('astroTransitDays');
    if (!select) return;
    const current = Number(select.value || 0);
    document.querySelectorAll('[data-lunea-long-days]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.luneaLongDays) === current);
    });
  }

  function install() {
    if (!ensureLongOptions()) return false;
    ensureLongChips();
    const select = $('astroTransitDays');
    if (select && !select.__luneaLongRangeBound) {
      select.addEventListener('change', () => setTimeout(updateLongChipState, 0));
      select.__luneaLongRangeBound = true;
    }

    const overlay = $('astroTransitOverlay');
    if (overlay && !overlay.__luneaLongRangeObserved) {
      new MutationObserver(() => {
        if (!overlay.classList.contains('show')) return;
        setTimeout(() => {
          ensureLongOptions();
          ensureLongChips();
          selectFromQuestion();
          updateLongChipState();
        }, 0);
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
      overlay.__luneaLongRangeObserved = true;
    }
    updateLongChipState();
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 200) clearInterval(timer);
    }, 100);

    const bodyObserver = new MutationObserver(() => {
      if (install()) bodyObserver.disconnect();
    });
    if (document.body) bodyObserver.observe(document.body, {childList:true, subtree:true});
    else document.addEventListener('DOMContentLoaded', () => bodyObserver.observe(document.body, {childList:true, subtree:true}), {once:true});

    install();
    W.LUNEA_TRANSIT_RANGE_V1 = {inferLongDays};
    console.info('🌌 LUNEA Transit Range V1 loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
