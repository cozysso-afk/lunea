'use strict';

/*
  LUNEA READING ACTION ORDER V33.2
  ================================
  Keeps the reading action grid in a stable, task-oriented order even though
  several buttons are injected by independent feature modules.

  Row intent (3-column mobile grid):
  1) AI 해석 · 저장 · 다시 뽑기
  2) 전체 뒤집기 · 추가 카드 · 시기 오라클
  3) Astro Timing · Thai 보조 · Thai 기간
  4) Returns · Horary

  Also adds small AI 해석 / 저장 shortcuts directly below the prompt-copy
  control for long spreads. These shortcuts delegate to the existing source
  buttons; they never duplicate interpretation or persistence logic.

  V33.2 also hardens the Thai period date grid on iOS so native date inputs do
  not overflow their grid tracks or collide in the middle of the modal.

  Unknown/future buttons are preserved after the known controls.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_ACTION_ORDER_V33__) return;
  W.__LUNEA_READING_ACTION_ORDER_V33__ = true;

  const SELF_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3302';
    } catch {
      return '3302';
    }
  })();

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

  const BOTTOM_ID = 'luneaBottomReadingActions';
  const BOTTOM_AI_ID = 'luneaBottomAiRead';
  const BOTTOM_SAVE_ID = 'luneaBottomSaveReading';
  const BOTTOM_STYLE_ID = 'luneaBottomReadingActionsStyle';
  const INTIMACY_CLEAN_LOADER_ID = 'luneaIntimacyCleanV39Loader';
  const INTIMACY_BURGUNDY_LOADER_ID = 'luneaIntimacyBurgundyV40Loader';

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

  function ensureBottomStyle() {
    if (document.getElementById(BOTTOM_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = BOTTOM_STYLE_ID;
    style.textContent = `
      #${BOTTOM_ID}{
        display:grid;grid-template-columns:1fr 1fr;gap:8px;
        max-width:360px;margin:8px auto 2px;padding:0 2px;
      }
      #${BOTTOM_ID} button{
        min-height:35px;padding:8px 10px;border-radius:12px;
        border:1px solid rgba(206,194,231,.16);
        background:linear-gradient(145deg,rgba(152,135,194,.075),rgba(86,121,149,.055));
        color:#ebe5f2;font:650 11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
        -webkit-tap-highlight-color:transparent;
      }
      #${BOTTOM_ID} button:active{transform:translateY(1px);opacity:.82}
      #${BOTTOM_ID} button:disabled{opacity:.42;pointer-events:none}

      /* iOS native date inputs can contribute a large min-content width inside
         CSS Grid. Force both Thai period columns and fields to shrink inside the
         modal instead of visually overlapping at the center seam. */
      .thai-v33-dates{
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:10px!important;
      }
      .thai-v33-field{min-width:0!important;overflow:hidden}
      .thai-v33-field input[type="date"]{
        display:block!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        padding-left:6px!important;
        padding-right:6px!important;
      }
      @media(max-width:360px){
        .thai-v33-dates{grid-template-columns:1fr!important;gap:8px!important}
        .thai-v33-field{overflow:visible}
      }
    `;
    document.head.appendChild(style);
  }

  function clickSource(id) {
    const source = document.getElementById(id);
    if (!source || source.disabled) return;
    source.click();
  }

  function syncBottomButtons() {
    const ai = document.getElementById(BOTTOM_AI_ID);
    const save = document.getElementById(BOTTOM_SAVE_ID);
    const sourceAi = document.getElementById('aiRead');
    const sourceSave = document.getElementById('saveReading');
    if (ai) ai.disabled = !sourceAi || !!sourceAi.disabled;
    if (save) save.disabled = !sourceSave || !!sourceSave.disabled;
  }

  function ensureBottomActions() {
    ensureBottomStyle();
    const existing = document.getElementById(BOTTOM_ID);
    if (existing) {
      syncBottomButtons();
      return true;
    }

    const copy = document.getElementById('copyPrompt');
    const copyBox = copy?.closest?.('.copybox') || copy?.parentElement;
    if (!copy || !copyBox || !copyBox.parentNode) return false;

    const root = document.createElement('div');
    root.id = BOTTOM_ID;
    root.setAttribute('aria-label', '리딩 하단 빠른 동작');

    const ai = document.createElement('button');
    ai.id = BOTTOM_AI_ID;
    ai.type = 'button';
    ai.textContent = '🔮 AI 해석';
    ai.title = '위의 AI 해석과 같은 기능';
    ai.addEventListener('click', () => clickSource('aiRead'));

    const save = document.createElement('button');
    save.id = BOTTOM_SAVE_ID;
    save.type = 'button';
    save.textContent = '💾 저장';
    save.title = '위의 저장과 같은 기능';
    save.addEventListener('click', () => clickSource('saveReading'));

    root.append(ai, save);
    copyBox.insertAdjacentElement('afterend', root);
    syncBottomButtons();
    return true;
  }

  function ensureIntimacyCleanUi() {
    if (document.getElementById(INTIMACY_CLEAN_LOADER_ID)) return true;
    const script = document.createElement('script');
    script.id = INTIMACY_CLEAN_LOADER_ID;
    script.src = `./lunea-intimacy-clean-v39.js?v=${encodeURIComponent(SELF_VERSION)}`;
    script.async = false;
    script.onerror = () => console.error('[LUNEA] Failed to load INTIMACY clean UI V39');
    document.head.appendChild(script);
    return true;
  }

  function ensureIntimacyBurgundyUi() {
    if (document.getElementById(INTIMACY_BURGUNDY_LOADER_ID)) return true;
    const script = document.createElement('script');
    script.id = INTIMACY_BURGUNDY_LOADER_ID;
    script.src = `./lunea-intimacy-burgundy-v40.js?v=${encodeURIComponent(SELF_VERSION)}`;
    script.async = false;
    script.onerror = () => console.error('[LUNEA] Failed to load INTIMACY burgundy UI V40');
    document.head.appendChild(script);
    return true;
  }

  function boot() {
    reorder();
    ensureBottomActions();
    ensureIntimacyCleanUi();
    ensureIntimacyBurgundyUi();

    let queued = false;
    const bar = actionBar();
    if (bar) {
      const observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        const run = () => {
          queued = false;
          reorder();
          syncBottomButtons();
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 16);
      });
      observer.observe(bar, {childList:true,attributes:true,attributeFilter:['disabled']});
    }

    // Some feature buttons may arrive a little after the structural loader.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      reorder();
      ensureBottomActions();
      ensureIntimacyCleanUi();
      ensureIntimacyBurgundyUi();
      const ready = ORDER.slice(0,9).every(id => !!document.getElementById(id));
      if ((ready && document.getElementById(BOTTOM_ID)) || tries > 80) clearInterval(timer);
    }, 250);
  }

  W.LUNEA_READING_ACTION_ORDER_V33 = {
    version:'33.2',
    order:[...ORDER],
    reorder,
    ensureBottomActions,
    syncBottomButtons,
    ensureIntimacyCleanUi,
    ensureIntimacyBurgundyUi,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
