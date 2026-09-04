'use strict';

/*
  LUNEA READING ACTION ORDER V33.4
  ================================
  Keeps the reading action grid in a stable, task-oriented order even though
  several buttons are injected by independent feature modules.

  Row intent (3-column mobile grid):
  1) 전체 뒤집기 · AI 해석 · 저장
  2) 다시 뽑기 · 추가 카드 · 시기 오라클
  3) Astro Timing · Thai 보조 · Thai 기간
  4) Returns · Horary · 마스터 리딩 프롬프트 복사

  The master prompt-copy shortcut occupies the final action-grid cell for every
  sector/spread/question, while keeping the existing bottom copy control.

  Small AI 해석 / 저장 shortcuts remain directly below the bottom prompt-copy
  control for long spreads. These shortcuts delegate to the existing source
  buttons; they never duplicate interpretation or persistence logic.

  V33.2 also hardens the Thai period date grid on iOS so native date inputs do
  not overflow their grid tracks or collide in the middle of the modal.

  V33.3 loads the isolated INTIMACY V43 repair layer after the existing clean
  and burgundy layers. V33.4 keeps the control-order behavior stable and also
  applies the screenshot-marked INTIMACY presentation corrections without
  changing RNG, AI interpretation, prompt generation, or storage.

  Unknown/future buttons are preserved after the known controls.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_ACTION_ORDER_V33__) return;
  W.__LUNEA_READING_ACTION_ORDER_V33__ = true;

  const SELF_VERSION = (() => {
    try {
      return new URL(document.currentScript?.src || location.href, location.href).searchParams.get('v') || '3303';
    } catch {
      return '3303';
    }
  })();

  const ORDER = [
    'flipAll',
    'aiRead',
    'saveReading',
    'retry',
    'extraCard',
    'timingSupportBtn',
    'astroTransitBtn',
    'luneaThaiTarotBridgeBtn',
    'luneaThaiTarotRangeBtn',
    'astroReturnBtn',
    'astroHoraryBtn',
    'luneaTopCopyPrompt',
  ];

  const TOP_COPYBOX_ID = 'luneaTopPromptCopyBox';
  const TOP_COPY_ID = 'luneaTopCopyPrompt';
  const BOTTOM_ID = 'luneaBottomReadingActions';
  const BOTTOM_AI_ID = 'luneaBottomAiRead';
  const BOTTOM_SAVE_ID = 'luneaBottomSaveReading';
  const BOTTOM_STYLE_ID = 'luneaBottomReadingActionsStyle';
  const INTIMACY_CLEAN_LOADER_ID = 'luneaIntimacyCleanV39Loader';
  const INTIMACY_BURGUNDY_LOADER_ID = 'luneaIntimacyBurgundyV40Loader';
  const INTIMACY_REPAIR_LOADER_ID = 'luneaIntimacyRepairV43Loader';

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

    desired.forEach(node => bar.appendChild(node));
    return true;
  }

  function ensureBottomStyle() {
    if (document.getElementById(BOTTOM_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = BOTTOM_STYLE_ID;
    style.textContent = `
      #${TOP_COPYBOX_ID}{
        display:none!important;margin:0!important;padding:0!important;
      }
      #spreadOverlay .actionbar #${TOP_COPY_ID}{
        width:100%!important;min-height:43px!important;margin:0!important;padding:10px 9px!important;
        grid-column:auto!important;border-radius:13px!important;border:1px solid rgba(215,218,233,.13)!important;
        background:linear-gradient(145deg,rgba(167,145,217,.10),rgba(91,125,168,.06))!important;
        color:#e9e3ef!important;font:650 11.5px/1.22 system-ui,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif!important;
        white-space:normal!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
        -webkit-tap-highlight-color:transparent;
      }
      #${TOP_COPY_ID}:active{transform:translateY(1px);opacity:.84}
      #${TOP_COPY_ID}:disabled{opacity:.42;pointer-events:none}
      body.lunea-intimacy-reading #${TOP_COPY_ID}{
        color:#f8edf2!important;border-color:rgba(225,132,168,.22)!important;
        background:linear-gradient(145deg,rgba(112,34,69,.16),rgba(67,22,55,.09))!important;
      }

      /* Screenshot-marked INTIMACY list correction: keep the expanded cabinet
         on the same square artwork as the Home tile. V40 may still maintain its
         legacy img node for compatibility, but the final visual is the square
         final PNG through this higher-specificity presentation rule. */
      html body .lunea-intimacy-category .cat-icon{
        background:#310b20 url('./assets/intimacy-oracle/intimacy_sector_final.png?v=${encodeURIComponent(SELF_VERSION)}') center/cover no-repeat!important;
      }
      html body .lunea-intimacy-category .cat-icon img{
        display:none!important;visibility:hidden!important;opacity:0!important;
      }

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

  function syncTopPromptCopy() {
    const top = document.getElementById(TOP_COPY_ID);
    const source = document.getElementById('copyPrompt');
    if (top) top.disabled = !source || !!source.disabled;
  }

  function ensureTopPromptCopy() {
    ensureBottomStyle();
    const source = document.getElementById('copyPrompt');
    const bar = actionBar();
    if (!source || !bar || !bar.parentNode) return false;

    let box = document.getElementById(TOP_COPYBOX_ID);
    let top = document.getElementById(TOP_COPY_ID);
    if (!box || !top) {
      box = document.createElement('div');
      box.id = TOP_COPYBOX_ID;
      box.className = 'copybox lunea-top-prompt-copybox';
      box.setAttribute('aria-label', '상단 마스터 리딩 프롬프트 복사');

      top = document.createElement('button');
      top.id = TOP_COPY_ID;
      top.type = 'button';
      top.className = 'primary full-btn';
      top.textContent = '📋 마스터 리딩 프롬프트 복사';
      top.title = '아래 프롬프트 복사와 같은 내용';
      top.addEventListener('click', () => {
        const live = document.getElementById('copyPrompt');
        if (!live || live.disabled) return;
        live.click();
      });
      box.appendChild(top);
    }

    if (box.parentNode !== bar.parentNode || box.nextElementSibling !== bar) {
      bar.parentNode.insertBefore(box, bar);
    }

    /* Keep the legacy wrapper in place (hidden) so long-lived pages and the
       existing sync path remain stable, but put the actual shortcut in the
       action grid's final open cell. */
    box.hidden = true;
    box.setAttribute('aria-hidden', 'true');
    top.classList.remove('primary', 'full-btn');
    top.classList.add('mini');
    if (top.parentNode !== bar) bar.appendChild(top);
    reorder();
    syncTopPromptCopy();
    return true;
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

  function ensureScript(id, src, label) {
    if (document.getElementById(id)) return true;
    const script = document.createElement('script');
    script.id = id;
    script.src = `${src}?v=${encodeURIComponent(SELF_VERSION)}`;
    script.async = false;
    script.onerror = () => console.error(`[LUNEA] Failed to load ${label}`);
    document.head.appendChild(script);
    return true;
  }

  function ensureIntimacyCleanUi() {
    return ensureScript(INTIMACY_CLEAN_LOADER_ID, './lunea-intimacy-clean-v39.js', 'INTIMACY clean UI V39');
  }

  function ensureIntimacyBurgundyUi() {
    return ensureScript(INTIMACY_BURGUNDY_LOADER_ID, './lunea-intimacy-burgundy-v40.js', 'INTIMACY burgundy UI V40');
  }

  function ensureIntimacyRepairUi() {
    return ensureScript(INTIMACY_REPAIR_LOADER_ID, './lunea-intimacy-repair-v43.js', 'INTIMACY repair UI V43');
  }

  function boot() {
    reorder();
    ensureTopPromptCopy();
    ensureBottomActions();
    ensureIntimacyCleanUi();
    ensureIntimacyBurgundyUi();
    ensureIntimacyRepairUi();

    let queued = false;
    const bar = actionBar();
    if (bar) {
      const observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        const run = () => {
          queued = false;
          reorder();
          syncTopPromptCopy();
          syncBottomButtons();
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else setTimeout(run, 16);
      });
      observer.observe(bar, {childList:true,attributes:true,attributeFilter:['disabled']});
    }

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      reorder();
      ensureTopPromptCopy();
      ensureBottomActions();
      ensureIntimacyCleanUi();
      ensureIntimacyBurgundyUi();
      ensureIntimacyRepairUi();
      const ready = ORDER.slice(0,9).every(id => !!document.getElementById(id));
      if ((ready && document.getElementById(TOP_COPY_ID) && document.getElementById(BOTTOM_ID)) || tries > 80) clearInterval(timer);
    }, 250);
  }

  W.LUNEA_READING_ACTION_ORDER_V33 = {
    version:'33.4',
    order:[...ORDER],
    reorder,
    ensureTopPromptCopy,
    syncTopPromptCopy,
    ensureBottomActions,
    syncBottomButtons,
    ensureIntimacyCleanUi,
    ensureIntimacyBurgundyUi,
    ensureIntimacyRepairUi,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
