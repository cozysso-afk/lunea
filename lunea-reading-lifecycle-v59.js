'use strict';

/*
  LUNEA READING LIFECYCLE V59.3
  =============================
  One non-wrapping session boundary for long-lived iPhone/PWA reading sessions.

  This module intentionally DOES NOT wrap or replace startSpread.

  Responsibilities:
  - Create the four core AI + Manual rows synchronously before normal interaction.
  - Keep those rows category-scoped and ordered AI -> Manual -> fixed spreads.
  - Own a monotonic readingSessionId used by delayed callbacks in other modules.
  - Normalize stale auxiliary UI exactly once when a new reading action begins.
  - Provide guard/schedule helpers so reading N callbacks cannot mutate reading N+1.

  It does not draw cards, choose RNG, interpret cards, or pre-open spreadOverlay.
*/
(() => {
  const W = window;
  if (W.__LUNEA_READING_LIFECYCLE_V59__) return;
  W.__LUNEA_READING_LIFECYCLE_V59__ = true;

  W.__LUNEA_AI_REPEAT_FLOW_V58__ = true;

  const RELEASE = '59.3';
  const $ = id => document.getElementById(id);
  let pendingManualMeta = null;
  let readingSessionId = 0;
  let sessionMeta = Object.freeze({id:0, reason:'boot', question:'', startedAt:0});

  const CORE = [
    {key:'GENERAL', aiTitle:'질문 맞춤 AI 배열', aiDesc:'질문 구조를 분석해 필요한 카드 수와 포지션을 자동 설계'},
    {key:'CAREER', aiTitle:'진로·시험 AI 맞춤 배열', aiDesc:'시험·직장·진로·금전 질문에 맞춰 필요한 축을 자동 설계'},
    {key:'LOVE', aiTitle:'연애·관계 AI 맞춤 배열', aiDesc:'속마음·연락·재회·관계 질문을 분석해 필요한 축을 자동 설계'},
    {key:'STOCK', aiTitle:'투자 AI 맞춤 배열', aiDesc:'매수·보유·익절·매도 질문의 근거·반증·리스크 축을 자동 설계'}
  ];

  function clean(value) { return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim(); }
  function getState() { try { return state; } catch { return W.state || null; } }
  function liveQuestion() { return clean($('question')?.value || getState()?.question || $('spreadQuestion')?.textContent || ''); }

  function categoryContent(key) {
    const anchor = document.querySelector(`.category-content .reading-item[data-cat="${key}"]`);
    return anchor?.closest?.('.category-content') || null;
  }

  function existingAi(content) {
    return [...content.querySelectorAll('.reading-item')].find(item =>
      item.dataset.luneaUniversalAi === '1' || item.dataset.count === '0' || /AI.*(?:맞춤|배열)|맞춤.*AI/i.test(item.textContent || '')
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
    if (typeof opener === 'function') opener(meta.key, meta.aiTitle, meta.aiDesc, 0);
  }

  function openManual(meta) {
    if (!$('luneaManualPanel')) {
      pendingManualMeta = meta;
      return;
    }
    const opener = W.openSheet || (typeof openSheet === 'function' ? openSheet : null);
    if (typeof opener !== 'function') return;

    const s = getState();
    if (s) {
      s.__luneaManualOriginCategory = meta.key;
      s.category = meta.key;
      s.__luneaIntimacyReading = meta.key === 'INTIMACY';
    }

    opener(meta.key, '직접 입력 배열', '이 파트의 질문에 맞춰 카드 포지션을 직접 고정합니다. AI가 배열을 다시 설계하지 않습니다.', 1);

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

  function flushPendingManual() {
    if (!pendingManualMeta || !$('luneaManualPanel')) return;
    const meta = pendingManualMeta;
    pendingManualMeta = null;
    openManual(meta);
  }

  function bindCreatedEntry(item, meta, mode) {
    if (!item || item.dataset.luneaLifecycleBound === '1') return;
    if (item.dataset.luneaLifecycleCreated !== mode) return;
    item.dataset.luneaLifecycleBound = '1';
    const open = event => {
      event?.preventDefault?.();
      if (mode === 'ai') openAi(meta); else openManual(meta);
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

      if (content.firstElementChild !== ai || ai.nextElementSibling !== manual) {
        content.insertBefore(manual, content.firstElementChild || null);
        content.insertBefore(ai, manual);
      }

      bindCreatedEntry(ai, meta, 'ai');
      bindCreatedEntry(manual, meta, 'manual');
      ready += 1;
    });

    document.documentElement.dataset.luneaCoreSpreadEntries = ready === CORE.length ? 'ready' : `partial-${ready}`;
    return ready;
  }

  function syncModalLock() {
    const anyVisible = document.querySelector('.overlay.show');
    if (anyVisible) {
      document.body?.classList?.add('modal-open');
      return;
    }
    document.body?.classList?.remove('modal-open');
    document.body?.style?.removeProperty('pointer-events');
    document.body?.style?.removeProperty('touch-action');
    document.body?.style?.removeProperty('overflow');
    document.documentElement?.style?.removeProperty('overflow');
  }

  function closeAuxOverlays() {
    ['timingOverlay','astroTransitOverlay','astroReturnOverlay','thaiTaksaOverlay','astroHoraryOverlay'].forEach(id => {
      const overlay = $(id);
      if (!overlay) return;
      overlay.classList.remove('show');
      overlay.setAttribute?.('aria-hidden', 'true');
    });
  }

  function beginSession(reason = 'reading-start', question = liveQuestion()) {
    readingSessionId += 1;
    const id = readingSessionId;
    const normalizedReason = clean(reason) || 'reading-start';
    sessionMeta = Object.freeze({id, reason:normalizedReason, question:clean(question), startedAt:Date.now()});
    document.documentElement.dataset.luneaReadingSession = String(id);
    document.documentElement.dataset.luneaReadingReason = normalizedReason;

    closeAuxOverlays();
    try { W.LUNEA_READING_BOUNDARY_V31?.resetTimingBoundary?.(`session-${id}:${normalizedReason}`); } catch {}
    try { W.LUNEA_V27?.resetTimingDOM?.(); } catch {}
    try { W.LUNEA_RUNTIME_STATE_V56?.clear?.(`session-${id}:${normalizedReason}`); } catch {}
    if (normalizedReason !== 'luneaDraftRestore') {
      try { W.LUNEA_MOBILE_RUNTIME_FIXES_V57?.clearAux?.(); } catch {}
    }
    syncModalLock();

    const s = getState();
    if (s) {
      s.__luneaReadingSessionId = id;
      s.__luneaManualReading = false;
    }
    return id;
  }

  function currentSessionId() { return readingSessionId; }
  function currentSession() { return sessionMeta; }
  function isCurrent(id) { return Number(id) === readingSessionId; }

  function guard(id, fn) {
    return function(...args) {
      if (!isCurrent(id)) return undefined;
      return fn.apply(this, args);
    };
  }

  function timeout(fn, delay = 0, id = readingSessionId) { return setTimeout(guard(id, fn), delay); }
  function frame(fn, id = readingSessionId) {
    const raf = W.requestAnimationFrame || (cb => setTimeout(cb, 16));
    return raf(guard(id, fn));
  }
  function microtask(fn, id = readingSessionId) { queueMicrotask(guard(id, fn)); }

  function isReadingBoundaryTarget(target) {
    const button = target?.closest?.('button');
    if (!button) return null;
    if (['drawBtn','dailyBtn','retry','luneaDraftRestore'].includes(button.id)) return button.id;
    const text = clean(button.textContent);
    if (/다시\s*뽑기|새\s*리딩|새\s*질문/.test(text)) return 'reading-restart';
    return null;
  }

  function installBoundaryCapture() {
    if (document.documentElement.dataset.luneaReadingSessionCapture === '1') return;
    document.documentElement.dataset.luneaReadingSessionCapture = '1';
    document.addEventListener('click', event => {
      const reason = isReadingBoundaryTarget(event.target);
      if (!reason) return;
      beginSession(reason, liveQuestion());
    }, true);
  }

  const initialReady = ensureCoreEntries();
  installBoundaryCapture();

  function finalizeDom() {
    if (document.documentElement.dataset.luneaCoreSpreadEntries !== 'ready') ensureCoreEntries();
    flushPendingManual();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finalizeDom, {once:true});
  else finalizeDom();

  W.LUNEA_READING_LIFECYCLE_V59 = Object.freeze({
    version:RELEASE,
    ensureCoreEntries,
    beginSession,
    currentSessionId,
    currentSession,
    isCurrent,
    guard,
    timeout,
    frame,
    microtask,
    syncModalLock,
    initialReady
  });

  console.info(`✦ LUNEA Reading Lifecycle V59.3 loaded · core entries ${initialReady}/${CORE.length} · session boundary ready`);
})();