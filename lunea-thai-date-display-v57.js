'use strict';

/* LUNEA THAI DATE DISPLAY V57
   Native iOS date controls do not honor text-align consistently. Keep the
   native input as the actual picker, but make every native text layer
   transparent and render exactly one centered value layer.
*/
(() => {
  const W = window;
  if (W.__LUNEA_THAI_DATE_DISPLAY_V57__) return;
  W.__LUNEA_THAI_DATE_DISPLAY_V57__ = true;

  const STYLE_ID = 'luneaThaiDateDisplayV57Style';
  const SHELL = 'thai-v57-date-shell';
  const VISIBLE = 'thai-v57-date-visible';
  const INPUT_SELECTOR = '.thai-v33-field input[type="date"]';

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
        position:relative!important;display:block!important;width:100%!important;max-width:100%!important;
        min-width:0!important;height:38px!important;box-sizing:border-box!important;
        margin-top:5px!important;border-radius:10px!important;overflow:hidden!important;
      }
      .${SHELL}::after{
        content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-52%);
        z-index:1;color:#777482;font-size:10px;pointer-events:none
      }
      .${VISIBLE}{
        position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;
        width:100%;min-width:0;box-sizing:border-box;padding:6px 27px 6px 12px;border-radius:10px;
        border:1px solid rgba(220,215,199,.12);background:rgba(7,9,17,.70);
        color:#ded9e4;font-size:11px;font-weight:550;line-height:1;text-align:center;white-space:nowrap;
        font-variant-numeric:tabular-nums;pointer-events:none
      }
      .${SHELL}>input[type="date"]{
        position:absolute!important;inset:0!important;z-index:2!important;display:block!important;
        width:100%!important;max-width:100%!important;min-width:0!important;height:100%!important;
        min-height:0!important;box-sizing:border-box!important;margin:0!important;padding:0!important;
        border:0!important;border-radius:10px!important;opacity:0!important;background:transparent!important;
        color:transparent!important;-webkit-text-fill-color:transparent!important;font-size:0!important;
        line-height:0!important;text-shadow:none!important;caret-color:transparent!important;
        -webkit-appearance:none!important;appearance:none!important;cursor:pointer!important;pointer-events:auto!important
      }
      .${SHELL}>input[type="date"]::-webkit-date-and-time-value,
      .${SHELL}>input[type="date"]::-webkit-datetime-edit,
      .${SHELL}>input[type="date"]::-webkit-datetime-edit-fields-wrapper,
      .${SHELL}>input[type="date"]::-webkit-datetime-edit-year-field,
      .${SHELL}>input[type="date"]::-webkit-datetime-edit-month-field,
      .${SHELL}>input[type="date"]::-webkit-datetime-edit-day-field{
        opacity:0!important;visibility:hidden!important;color:transparent!important;
        -webkit-text-fill-color:transparent!important;font-size:0!important;line-height:0!important;
        text-shadow:none!important
      }
      .${SHELL}>input[type="date"]::-webkit-calendar-picker-indicator{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
        opacity:0!important;cursor:pointer!important
      }
      @media(max-width:380px){
        .thai-v33-dates{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important}
        .${VISIBLE}{font-size:10.5px!important;padding-left:6px!important;padding-right:22px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function isOwned(node, className) {
    return !!node?.matches?.(`.${className}`);
  }

  function removeNode(node) {
    if (!node) return;
    if (typeof node.remove === 'function') node.remove();
    else node.parentNode?.removeChild?.(node);
  }

  function directOwnedChildren(node, className) {
    return Array.from(node?.children || []).filter(child => isOwned(child, className));
  }

  function normalizeShell(input) {
    const field = input.closest('.thai-v33-field');
    if (!field) return null;

    const shells = Array.from(field.querySelectorAll(`.${SHELL}`));
    const mirrors = Array.from(field.querySelectorAll(`.${VISIBLE}`));
    const shell = isOwned(input.parentNode, SHELL) ? input.parentNode : null;
    const directMirrors = directOwnedChildren(shell, VISIBLE);
    const canonical = shell && shells.length === 1 && mirrors.length === 1
      && directMirrors.length === 1 && shell.children?.[shell.children.length - 1] === input;
    if (canonical) return shell;

    /* V57 owns only these shells/mirrors. Extract the native picker first,
       then discard malformed nested/orphan presentation nodes and rebuild one
       canonical mirror + picker pair. */
    let anchor = input;
    let parent = input.parentNode;
    while (parent && parent !== field) {
      if (isOwned(parent, SHELL)) anchor = parent;
      parent = parent.parentNode;
    }
    const holder = anchor.parentNode || field;
    if (anchor !== input) holder.insertBefore(input, anchor);

    Array.from(field.querySelectorAll(`.${VISIBLE}`)).forEach(removeNode);
    Array.from(field.querySelectorAll(`.${SHELL}`)).forEach(removeNode);

    const nextShell = document.createElement('span');
    nextShell.className = SHELL;
    const visible = document.createElement('span');
    visible.className = VISIBLE;
    visible.setAttribute?.('aria-hidden', 'true');
    input.parentNode.insertBefore(nextShell, input);
    nextShell.appendChild(visible);
    nextShell.appendChild(input);
    return nextShell;
  }

  function updateVisible(input) {
    const shell = isOwned(input?.parentNode, SHELL) ? input.parentNode : null;
    const visible = directOwnedChildren(shell, VISIBLE)[0];
    const next = formatDate(input?.value);
    if (visible && visible.textContent !== next) visible.textContent = next;
  }

  function enhance(input) {
    if (!(input instanceof HTMLInputElement) || input.type !== 'date') return false;
    if (!input.closest('.thai-v33-field')) return false;
    if (!normalizeShell(input)) return false;

    input.dataset.luneaThaiDateV57 = '1';
    if (input.dataset.luneaThaiDateV57Bound !== '1') {
      input.dataset.luneaThaiDateV57Bound = '1';
      input.addEventListener('input', () => updateVisible(input));
      input.addEventListener('change', () => updateVisible(input));
    }
    updateVisible(input);
    return true;
  }

  function sync(input) {
    return enhance(input);
  }

  function syncAll() {
    document.querySelectorAll(INPUT_SELECTOR).forEach(sync);
  }

  function boot() {
    addStyle();
    syncAll();
  }

  /* V33 owns every panel insertion and programmatic range assignment. Its
     explicit calls keep these mirrors current without observers or polling. */
  W.LUNEA_THAI_DATE_DISPLAY_V57 = Object.freeze({version:57,sync,syncAll,enhanceAll:syncAll});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
