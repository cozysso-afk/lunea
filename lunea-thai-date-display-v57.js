'use strict';

/* LUNEA THAI DATE DISPLAY V57
   Native iOS date controls do not honor text-align consistently. Keep the
   native input as the actual picker, but make it transparent and render a
   separate centered value layer. This guarantees the visible dates are centered.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_DATE_DISPLAY_V57__) return;
  W.__LUNEA_THAI_DATE_DISPLAY_V57__ = true;

  const STYLE_ID = 'luneaThaiDateDisplayV57Style';
  const SHELL = 'thai-v57-date-shell';

  function formatDate(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return value || '날짜 선택';
    return `${Number(m[1])}. ${Number(m[2])}. ${Number(m[3])}.`;
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .thai-v33-dates{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:10px!important;
        align-items:end!important;
      }
      .thai-v33-field{min-width:0!important;text-align:center!important}
      .${SHELL}{
        position:relative!important;width:100%!important;min-width:0!important;height:38px!important;
        margin-top:5px!important;border-radius:10px!important;overflow:hidden!important;
      }
      .${SHELL}::after{
        content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-52%);
        z-index:1;color:#777482;font-size:10px;pointer-events:none
      }
      .thai-v57-date-visible{
        position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;
        box-sizing:border-box;padding:6px 27px 6px 12px;border-radius:10px;
        border:1px solid rgba(220,215,199,.12);background:rgba(7,9,17,.70);
        color:#ded9e4;font-size:11px;font-weight:550;line-height:1;text-align:center;white-space:nowrap;
        font-variant-numeric:tabular-nums;pointer-events:none
      }
      .${SHELL}>input[type="date"]{
        position:absolute!important;inset:0!important;z-index:2!important;width:100%!important;height:100%!important;
        min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:10px!important;
        opacity:.001!important;background:transparent!important;color:transparent!important;-webkit-appearance:none!important;
        appearance:none!important;cursor:pointer!important
      }
      .${SHELL}>input[type="date"]::-webkit-calendar-picker-indicator{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;cursor:pointer!important
      }
      @media(max-width:380px){
        .thai-v33-dates{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important}
        .thai-v57-date-visible{font-size:10.5px!important;padding-left:6px!important;padding-right:22px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function sync(input) {
    const shell = input?.closest?.(`.${SHELL}`);
    const visible = shell?.querySelector?.('.thai-v57-date-visible');
    if (visible) visible.textContent = formatDate(input.value);
  }

  function enhance(input) {
    if (!(input instanceof HTMLInputElement) || input.type !== 'date') return false;
    if (!input.closest('.thai-v33-field')) return false;
    if (input.dataset.luneaThaiDateV57 === '1') { sync(input); return true; }

    input.dataset.luneaThaiDateV57 = '1';
    const shell = document.createElement('span');
    shell.className = SHELL;
    const visible = document.createElement('span');
    visible.className = 'thai-v57-date-visible';

    input.parentNode.insertBefore(shell, input);
    shell.appendChild(visible);
    shell.appendChild(input);
    input.addEventListener('input', () => sync(input));
    input.addEventListener('change', () => sync(input));
    sync(input);
    return true;
  }

  function enhanceAll() {
    document.querySelectorAll('.thai-v33-field input[type="date"]').forEach(enhance);
  }

  function boot() {
    addStyle();
    enhanceAll();

    new MutationObserver(records => {
      let needed = false;
      for (const record of records) {
        if (record.addedNodes?.length) { needed = true; break; }
      }
      if (needed) queueMicrotask(enhanceAll);
    }).observe(document.documentElement,{childList:true,subtree:true});

    document.addEventListener('click', event => {
      if (event.target?.closest?.('.thai-v33-chip,#luneaThaiTarotRangeBtn,.thai-v33-range-panel')) {
        requestAnimationFrame(enhanceAll);
        setTimeout(enhanceAll,50);
        setTimeout(enhanceAll,180);
      }
    },true);

    /* Programmatic .value assignments do not emit input/change. Keep the tiny
       visible mirrors synced while a Thai panel exists. */
    setInterval(() => {
      if (document.querySelector('.thai-v33-dates')) enhanceAll();
    },350);

    W.LUNEA_THAI_DATE_DISPLAY_V57 = Object.freeze({version:57,enhanceAll});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();