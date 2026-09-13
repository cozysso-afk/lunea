'use strict';

/*
  LUNEA READING LIFECYCLE V59
  ===========================
  Central, non-wrapping lifecycle stabilizer for long-lived iPhone/PWA sessions.

  This module intentionally DOES NOT wrap startSpread.

  Responsibilities:
  - Make core AI + Manual spread entries deterministic before the category UI is used.
  - Keep those entries category-scoped and ordered AI -> Manual -> fixed spreads.
  - Prevent legacy V31/V57/V58 installers from repeatedly wrapping startSpread.
  - Suppress V57's global async startSpread yield; AI-specific paint yielding belongs
    in the AI caller, not in the global reading entrypoint.
  - Keep window.startSpread and the classic global binding aligned after bootstrap.

  It does not change Tarot RNG, card selection, interpretation prompts, Horary,
  Transit calculations, or archive data.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_LIFECYCLE_V59__) return;
  W.__LUNEA_READING_LIFECYCLE_V59__ = true;

  const RELEASE = '59.0';
  const $ = id => document.getElementById(id);

  const CORE = [
    {
      key:'GENERAL',
      aiTitle:'질문 맞춤 AI 배열',
      aiDesc:'질문 구조를 분석해 필요한 카드 수와 포지션을 자동 설계'
    },
    {
      key:'CAREER',
      aiTitle:'진로·시험 AI 맞춤 배열',
      aiDesc:'시험·직장·진로·금전 질문에 맞춰 필요한 축을 자동 설계'
    },
    {
      key:'LOVE',
      aiTitle:'연애·관계 AI 맞춤 배열',
      aiDesc:'속마음·연락·재회·관계 질문을 분석해 필요한 축을 자동 설계'
    },
    {
      key:'STOCK',
      aiTitle:'투자 AI 맞춤 배열',
      aiDesc:'매수·보유·익절·매도 질문의 근거·반증·리스크 축을 자동 설계'
    }
  ];

  function getState() {
    try { return state; } catch { return W.state || null; }
  }

  function categoryContent(key) {
    const anchor = document.querySelector(`.category-content .reading-item[data-cat="${key}"]`);
    return anchor?.closest?.('.category-content') || null;
  }

  function existingAi(content) {
    return [...content.querySelectorAll('.reading-item')].find(item =>
      item.dataset.luneaUniversalAi === '1' ||
      item.dataset.count === '0' ||
      /AI.*(?:맞춤|배열)|맞춤.*AI/i.test(item.textContent || '')
    ) || null;
  }

  function existingManual(content, key) {
    if (key === 'GENERAL') {
      const general = $('luneaManualReadingItem');
      if (general && general.closest('.category-content') === content) return general;
    }
    return content.querySelector('.lunea-manual-anywhere-item,[data-manual-spread="1"]');
  }

  function makeAi(meta) {
    const item = document.createElement('div');
    item.className = 'reading-item lunea-v20-ai-entry';
    item.dataset.cat = meta.key;
    item.dataset.title = meta.aiTitle;
    item.dataset.desc = meta.aiDesc;
    item.dataset.count = '0';
    item.dataset.luneaUniversalAi = '1';
    item.dataset.luneaLifecycleCreated = 'ai';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `<div><h4>✦ ${meta.aiTitle}</h4><p>${meta.aiDesc}</p></div><span class="count">AI · 2~12 → 20</span>`;
    return item;
  }

  function makeManual(meta) {
    const item = document.createElement('div');
    item.className = 'reading-item lunea-manual-anywhere-item';
    if (meta.key === 'GENERAL') item.id = 'luneaManualReadingItem';
    item.dataset.cat = meta.key;
    item.dataset.manualSpread = '1';
    item.dataset.luneaLifecycleCreated = 'manual';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = '<div><h4>직접 입력 배열</h4><p>포지션을 직접 고정 · 필요하면 A/B 대칭 복제.</p></div><div class="count">직접</div>';
    return item;
  }

  function openAi(meta) {
    const s = getState();
    if (s) {
      s.__luneaUniversalAI = true;
      s.__luneaManualMode = false;
      s.__luneaManualReading = false;
    }
    const opener = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof opener !== 'function') return;
    opener(meta.key, meta.aiTitle, meta.aiDesc, 0);
  }

  function openManual(meta) {
    const opener = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof opener !== 'function') return;

    const s = getState();
    if (s) {
      s.__luneaManualOriginCategory = meta.key;
      s.category = meta.key;
      s.__luneaIntimacyReading = meta.key === 'INTIMACY';
    }

    opener(
      meta.key,
      '직접 입력 배열',
      '이 파트의 질문에 맞춰 카드 포지션을 직접 고정합니다. AI가 배열을 다시 설계하지 않습니다.',
      1
    );

    if (s) {
      s.__luneaManualMode = true;
      s.__luneaManualReading = false;
      s.isAi = false;
      s.__luneaManualOriginCategory = meta.key;
      s.category = meta.key;
    }

    $('luneaManualPanel')?.classList.add('show');
    const label = $('drawLabel');
    if (label) label.textContent = '직접 배열로 카드 펼치기';
    $('luneaManualPositions')?.focus?.({preventScroll:true});
  }

  function bindCreatedEntry(item, meta, mode) {
    if (!item || item.dataset.luneaLifecycleBound === '1') return;
    if (item.dataset.luneaLifecycleCreated !== mode) return;
    item.dataset.luneaLifecycleBound = '1';
    const open = event => {
      event?.preventDefault?.();
      if (mode === 'ai') openAi(meta);
      else openManual(meta);
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open(event);
    });
  }

  function ensureCoreEntries() {
    let ready = 0;
    CORE.forEach(meta => {
      const content = categoryContent(meta.key);
      if (!content) return;

      let ai = existingAi(content);
      if (!ai) {
        ai = makeAi(meta);
        content.insertBefore(ai, content.firstElementChild || null);
      }
      ai.dataset.luneaUniversalAi = '1';
      ai.dataset.cat = meta.key;
      ai.classList.add('lunea-v20-ai-entry');

      let manual = existingManual(content, meta.key);
      if (!manual) {
        manual = makeManual(meta);
        content.insertBefore(manual, content.firstElementChild || null);
      }
      manual.dataset.cat = meta.key;
      manual.dataset.manualSpread = '1';
      manual.classList.add('lunea-manual-anywhere-item');
      if (meta.key === 'GENERAL' && !manual.id) manual.id = 'luneaManualReadingItem';

      // Deterministic visible order. This is synchronous DOM structure, not a
      // later cosmetic insertion: AI, Manual, then the predefined spreads.
      content.insertBefore(manual, content.firstElementChild || null);
      content.insertBefore(ai, manual);

      bindCreatedEntry(ai, meta, 'ai');
      bindCreatedEntry(manual, meta, 'manual');
      ready += 1;
    });

    document.documentElement.dataset.luneaCoreSpreadEntries = ready === CORE.length ? 'ready' : `partial-${ready}`;
    return ready;
  }

  function markStableStartSpread({includeBoundary = false} = {}) {
    const fn = W.startSpread;
    if (typeof fn !== 'function') return false;

    // V57 must not convert the global reading entrypoint from sync to deferred
    // Promise semantics. AI callers can yield locally without changing fixed /
    // manual / Daily reading behavior.
    fn.__luneaMobileV57Yield = true;

    // V58 is superseded by this global lifecycle fix. Mark the current entry so
    // a stale cached loader cannot add another repeated-AI wrapper.
    fn.__luneaAiRepeatFlowV58 = true;

    // By the deferred DOMContentLoaded phase V31 has already installed once.
    // Propagate its marker onto later wrappers (notably Lag Guard) so V31's old
    // retry loop sees the behavior as present instead of wrapping again.
    if (includeBoundary) fn.__luneaReadingBoundaryV31 = true;

    try { startSpread = fn; } catch {}
    document.documentElement.dataset.luneaStableStartSpread = includeBoundary ? 'finalized' : 'preflight';
    return true;
  }

  function finalizeAfterDomReady() {
    ensureCoreEntries();
    markStableStartSpread({includeBoundary:true});
  }

  function finalizeAfterLoad() {
    // Learning/Lag Guard load-time installers have now had their one legitimate
    // installation opportunity. Re-assert compatibility markers on the final
    // outer function without wrapping or replacing it.
    markStableStartSpread({includeBoundary:true});
    ensureCoreEntries();
  }

  // Visible core entries are created immediately. In the current page layout
  // all four cabinet DOMs already exist before lunea-cache-refresh-v1.js loads.
  // DOMContentLoaded is only a one-shot fallback for future markup relocation.
  const initialReady = ensureCoreEntries();
  markStableStartSpread({includeBoundary:false});

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(finalizeAfterDomReady, 0);
    }, {once:true});
    W.addEventListener('load', () => {
      setTimeout(finalizeAfterLoad, 0);
    }, {once:true});
  } else {
    setTimeout(finalizeAfterDomReady, 0);
    if (document.readyState === 'complete') setTimeout(finalizeAfterLoad, 0);
    else W.addEventListener('load', () => setTimeout(finalizeAfterLoad, 0), {once:true});
  }

  W.LUNEA_READING_LIFECYCLE_V59 = Object.freeze({
    version: RELEASE,
    ensureCoreEntries,
    markStableStartSpread,
    initialReady
  });

  console.info(`✦ LUNEA Reading Lifecycle V59 loaded · core entries ${initialReady}/${CORE.length} · no startSpread wrapper`);
})();
