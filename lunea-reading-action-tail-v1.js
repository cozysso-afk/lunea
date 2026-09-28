'use strict';

/*
  LUNEA Reading Action Tail V1
  ----------------------------
  Keeps the final reading actions on one row:
  [ Master reading prompt copy ] [ Share PNG ]
  Both are exactly half width. Existing 3-column controls stay 3-column.
*/
(() => {
  if (window.__LUNEA_READING_ACTION_TAIL_V1__) return;
  window.__LUNEA_READING_ACTION_TAIL_V1__ = true;

  const PROMPT_ID = 'luneaTopCopyPrompt';
  const SHARE_ID = 'luneaShareReadingPng';
  const STYLE_ID = 'luneaReadingActionTailV1Style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Six tracks let the existing controls remain visually 3-up (2 tracks each),
         while the final two actions can split the row 50:50 (3 tracks each). */
      body #spreadOverlay .actionbar.actionbar{
        grid-template-columns:repeat(6,minmax(0,1fr))!important;
      }
      body #spreadOverlay .actionbar.actionbar > button{
        grid-column:span 2!important;
      }
      body #spreadOverlay .actionbar.actionbar #${PROMPT_ID}{
        grid-column:span 3!important;
        order:9998!important;
        width:auto!important;
        min-width:0!important;
      }
      body #spreadOverlay .actionbar.actionbar #${SHARE_ID}{
        grid-column:span 3!important;
        order:9999!important;
        width:auto!important;
        min-width:0!important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function alignTail() {
    const bar = document.querySelector('#spreadOverlay .actionbar.actionbar');
    const prompt = document.getElementById(PROMPT_ID);
    const share = document.getElementById(SHARE_ID);
    if (!bar || !prompt || !share) return false;

    // Keep the requested visual order stable even when other helpers re-append buttons.
    if (prompt.parentElement !== bar) bar.appendChild(prompt);
    if (share.parentElement !== bar) bar.appendChild(share);
    bar.appendChild(prompt);
    bar.appendChild(share);
    return true;
  }

  function boot() {
    installStyle();
    alignTail();

    const spread = document.getElementById('spreadOverlay') || document.body;
    const observer = new MutationObserver(() => alignTail());
    observer.observe(spread, {childList:true, subtree:true});

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ok = alignTail();
      if ((ok && tries > 8) || tries > 80) clearInterval(timer);
    }, 150);

    window.LUNEA_READING_ACTION_TAIL_V1 = Object.freeze({alignTail});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
