'use strict';

/*
  LUNEA BOTTOM READING ACTIONS V34
  =================================
  Adds small convenience shortcuts directly below the prompt-copy control so
  long spreads do not require scrolling back to the top action bar.

  Important: these are delegates only. The existing #aiRead / #saveReading
  buttons remain the single source of truth for interpretation and persistence.
*/
(() => {
  const W = window;
  if (W.__LUNEA_BOTTOM_READING_ACTIONS_V34__) return;
  W.__LUNEA_BOTTOM_READING_ACTIONS_V34__ = true;

  const ROOT_ID = 'luneaBottomReadingActions';
  const AI_ID = 'luneaBottomAiRead';
  const SAVE_ID = 'luneaBottomSaveReading';
  const STYLE_ID = 'luneaBottomReadingActionsStyle';

  const $ = id => document.getElementById(id);

  function addStyle() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{
        display:grid;grid-template-columns:1fr 1fr;gap:8px;
        margin:8px auto 2px;max-width:360px;padding:0 2px;
      }
      #${ROOT_ID} button{
        min-height:36px;padding:8px 11px;border-radius:12px;
        border:1px solid rgba(203,190,229,.16);
        background:linear-gradient(145deg,rgba(155,137,198,.075),rgba(93,126,151,.055));
        color:#e9e3f1;font:650 11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;
        letter-spacing:.01em;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
        -webkit-tap-highlight-color:transparent;
      }
      #${ROOT_ID} button:active{transform:translateY(1px);opacity:.82}
      #${ROOT_ID} button:disabled{opacity:.42;pointer-events:none}
      @media (max-width:380px){#${ROOT_ID}{gap:7px}#${ROOT_ID} button{font-size:10.5px}}
    `;
    document.head.appendChild(style);
  }

  function delegateClick(sourceId) {
    const source = $(sourceId);
    if (!source || source.disabled) return;
    source.click();
  }

  function syncDisabled() {
    const ai = $(AI_ID);
    const save = $(SAVE_ID);
    const sourceAi = $('aiRead');
    const sourceSave = $('saveReading');
    if (ai) ai.disabled = !sourceAi || !!sourceAi.disabled;
    if (save) save.disabled = !sourceSave || !!sourceSave.disabled;
  }

  function inject() {
    if ($(ROOT_ID)) {
      syncDisabled();
      return true;
    }

    const copyButton = $('copyPrompt');
    const copyBox = copyButton?.closest?.('.copybox') || copyButton?.parentElement;
    if (!copyButton || !copyBox || !copyBox.parentNode) return false;

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('aria-label', '리딩 하단 빠른 동작');

    const ai = document.createElement('button');
    ai.id = AI_ID;
    ai.type = 'button';
    ai.textContent = '🔮 AI 해석';
    ai.title = '위의 AI 해석과 같은 기능';
    ai.addEventListener('click', () => delegateClick('aiRead'));

    const save = document.createElement('button');
    save.id = SAVE_ID;
    save.type = 'button';
    save.textContent = '💾 저장';
    save.title = '위의 저장과 같은 기능';
    save.addEventListener('click', () => delegateClick('saveReading'));

    root.append(ai, save);
    copyBox.insertAdjacentElement('afterend', root);
    syncDisabled();
    return true;
  }

  function boot() {
    addStyle();
    if (inject()) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (inject() || tries >= 80) clearInterval(timer);
    }, 125);
  }

  W.LUNEA_BOTTOM_READING_ACTIONS_V34 = {
    version: '34.0',
    inject,
    sync: syncDisabled,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
