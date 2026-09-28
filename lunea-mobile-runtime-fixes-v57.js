'use strict';

/* LUNEA MOBILE RUNTIME FIXES V57.1
   ==================================
   iPhone/PWA auxiliary reliability without owning startSpread.

   - AI confirmation paint yielding is now local to Universal AI V20.
   - No startSpread wrapper, no sync→Promise contract mutation, no installer poll.
   - Keeps Transit long ranges, Horary first-touch close, deferred learning I/O,
     and LAST READING Timing/Thai companion autosave.
   - Delayed UI callbacks use Reading Lifecycle V59 session guards when present.
*/
(() => {
  const W = window;
  if (W.__LUNEA_MOBILE_RUNTIME_FIXES_V57__) return;
  W.__LUNEA_MOBILE_RUNTIME_FIXES_V57__ = true;

  const RELEASE = '57.1';
  const AUX_KEY = 'LUNEA_LAST_READING_AUX_V57';
  const $ = id => document.getElementById(id);
  const LONG = [
    [180, '180일 · 약 6개월', '6개월'],
    [270, '270일 · 약 9개월', '9개월'],
    [365, '365일 · 1년', '1년']
  ];

  let deferLearningUntil = 0;
  let restoredAux = null;
  let auxSaveTimer = 0;
  let promptWrapped = false;

  const clean = value => String(value || '')
    .normalize('NFKC')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const blockText = value => String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'
  }[ch]));

  function lifecycle() {
    return W.LUNEA_READING_LIFECYCLE_V59 || null;
  }

  function sessionId() {
    return lifecycle()?.currentSessionId?.() || 0;
  }

  function sessionTimeout(fn, delay, id = sessionId()) {
    const life = lifecycle();
    if (life?.timeout) return life.timeout(fn, delay, id);
    return setTimeout(fn, delay);
  }

  function sessionFrame(fn, id = sessionId()) {
    const life = lifecycle();
    if (life?.frame) return life.frame(fn, id);
    return (W.requestAnimationFrame || (cb => setTimeout(cb, 16)))(fn);
  }

  function currentQuestion() {
    let q = '';
    try { q = clean(W.state?.question || state?.question || ''); } catch {}
    if (!q) q = clean($('spreadQuestion')?.textContent || '');
    return q.replace(/^["']+|["']+$/g, '').trim();
  }

  function idle(fn) {
    if (typeof W.requestIdleCallback === 'function') W.requestIdleCallback(fn, {timeout:1400});
    else setTimeout(fn, 220);
  }

  function noteV20Confirm(event) {
    if (!event.target?.closest?.('#luneaV20PreviewConfirm')) return;
    deferLearningUntil = performance.now() + 6500;
  }

  function installLearningIdleCommit() {
    const api = W.LUNEA_SPREAD_LEARNING_V1;
    if (!api || typeof api.record !== 'function') return false;
    if (api.record.__luneaMobileV57Idle) return true;

    const prior = api.record.bind(api);
    const wrapped = function(payload) {
      const previewOpen = !!$('luneaV20PreviewOverlay')?.classList?.contains('show');
      if (previewOpen || performance.now() >= deferLearningUntil) return prior(payload);

      idle(() => {
        try { prior(payload); }
        catch (error) { console.warn('[LUNEA V57] deferred learning save failed', error); }
      });
      return {saved:false, reason:'deferred_mobile_idle', row:null};
    };
    wrapped.__luneaMobileV57Idle = true;
    wrapped.__luneaMobileV57Prior = prior;
    api.record = wrapped;
    return true;
  }

  function inferLongDays(question) {
    const q = clean(question);
    if (/(?:1\s*년|일\s*년|한\s*해|12\s*(?:개월|달))/.test(q)) return 365;
    if (/(?:9\s*(?:개월|달)|아홉\s*(?:개월|달))/.test(q)) return 270;
    if (/(?:반\s*년|6\s*(?:개월|달)|여섯\s*(?:개월|달))/.test(q)) return 180;
    return 0;
  }

  function ensureTransitLongRange() {
    const select = $('astroTransitDays');
    if (!select) return false;

    LONG.forEach(([days, label, chipLabel]) => {
      if (!select.querySelector(`option[value="${days}"]`)) {
        const option = document.createElement('option');
        option.value = String(days);
        option.textContent = label;
        select.appendChild(option);
      }

      const wrap = document.querySelector('#astroTransitOverlay .astro-range-chips');
      if (wrap && !wrap.querySelector(`[data-lunea-v57-days="${days}"]`)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'astro-range-chip';
        button.dataset.days = String(days);
        button.dataset.luneaV57Days = String(days);
        button.textContent = chipLabel;
        button.addEventListener('click', () => {
          select.value = String(days);
          select.dispatchEvent(new Event('change', {bubbles:true}));
          syncTransitChips();
        });
        wrap.appendChild(button);
      }
    });
    return true;
  }

  function syncTransitChips() {
    const select = $('astroTransitDays');
    if (!select) return;
    const current = Number(select.value || 0);
    document.querySelectorAll('#astroTransitOverlay .astro-range-chip').forEach(button => {
      button.classList.toggle('active', Number(button.dataset.days || 0) === current);
    });
  }

  function applyTransitQuestionRange() {
    if (!ensureTransitLongRange()) return false;
    const overlay = $('astroTransitOverlay');
    if (overlay && !overlay.classList.contains('show')) return true;
    const select = $('astroTransitDays');
    const days = inferLongDays($('astroTransitQuestion')?.value || currentQuestion());
    if (!days) { syncTransitChips(); return true; }

    if (select.value !== String(days)) {
      select.value = String(days);
      select.dispatchEvent(new Event('change', {bubbles:true}));
    }
    syncTransitChips();
    const status = $('astroTransitStatus');
    if (status && !/계산|완료|실패|구간|복구|대기/.test(status.textContent || '')) {
      status.textContent = `질문에서 ${days}일 범위를 우선 감지했어. 필요하면 바꿔도 돼.`;
    }
    return true;
  }

  function installTransitFirstOpen() {
    ensureTransitLongRange();
    const overlay = $('astroTransitOverlay');
    if (overlay && !overlay.__luneaV57Observed) {
      overlay.__luneaV57Observed = true;
      new MutationObserver(() => {
        if (!overlay.classList.contains('show')) return;
        const id = sessionId();
        sessionFrame(applyTransitQuestionRange, id);
      }).observe(overlay, {attributes:true, attributeFilter:['class']});
    }
    return !!$('astroTransitDays');
  }

  function forceCloseHorary() {
    const overlay = $('astroHoraryOverlay');
    if (!overlay) return;
    try { document.activeElement?.blur?.(); } catch {}
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    try { W.LUNEA_HORARY_MOBILE_STABILITY_V42?.unlockPage?.(); } catch {}
    if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
    else document.body.classList.add('modal-open');
  }

  function onFastHoraryClose(event) {
    if (!event.target?.closest?.('#astroHoraryClose')) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    forceCloseHorary();
  }

  function readAux() {
    try {
      const row = JSON.parse(localStorage.getItem(AUX_KEY) || 'null');
      return row && row.question ? row : null;
    } catch { return null; }
  }

  function writeAux(row) {
    try {
      if (!row) localStorage.removeItem(AUX_KEY);
      else localStorage.setItem(AUX_KEY, JSON.stringify(row));
    } catch (error) {
      console.warn('[LUNEA V57] auxiliary draft save skipped', error);
    }
  }

  function clearAux(removeUi = true) {
    writeAux(null);
    restoredAux = null;
    if (removeUi) $('luneaDraftAuxV57')?.remove();
  }

  function timingSupportText() {
    if (!$('luneaTimingInline')) return '';
    try {
      const text = W.LUNEA_TIMING_COPY_V35?.buildCopyText?.();
      if (text) return blockText(text);
    } catch {}
    return blockText($('luneaTimingInline')?.innerText || $('luneaTimingInline')?.textContent || '');
  }

  function thaiSupportText() {
    if (!$('luneaThaiInline') && !$('luneaThaiTarotBridgeInline')) return '';
    const result = blockText($('thaiTaksaResult')?.innerText || $('thaiTaksaResult')?.textContent || '');
    if (result) return `[LUNEA · THAI ASTROLOGY · MAHA TAKSA 결과]\n${result}`;
    return blockText(
      $('luneaThaiInline')?.innerText || $('luneaThaiInline')?.textContent ||
      $('luneaThaiTarotBridgeInline')?.innerText || $('luneaThaiTarotBridgeInline')?.textContent || ''
    );
  }

  function thaiRangeSupportText() {
    try {
      const text = W.LUNEA_TIMING_COPY_V35?.buildThaiTarotRangeText?.();
      if (text && blockText($('luneaThaiTarotRangeResult')?.innerText || '')) return blockText(text);
    } catch {}
    return '';
  }

  function captureAuxNow() {
    const question = currentQuestion();
    if (!question) return null;
    const previous = readAux();
    const same = previous && clean(previous.question) === question;
    const timing = timingSupportText() || (same ? previous.timing || '' : '');
    const thai = thaiSupportText() || (same ? previous.thai || '' : '');
    const thaiRange = thaiRangeSupportText() || (same ? previous.thaiRange || '' : '');
    if (!timing && !thai && !thaiRange) return null;

    const row = {version:57.1, question, timing, thai, thaiRange, savedAt:Date.now()};
    writeAux(row);
    return row;
  }

  function scheduleAuxSave(delay = 120) {
    clearTimeout(auxSaveTimer);
    const id = sessionId();
    auxSaveTimer = sessionTimeout(captureAuxNow, delay, id);
  }

  function renderRestoredAux(row) {
    if (!row) return;
    const question = currentQuestion();
    if (!question || clean(row.question) !== question) return;

    restoredAux = row;
    let box = $('luneaDraftAuxV57');
    if (!box) {
      box = document.createElement('details');
      box.id = 'luneaDraftAuxV57';
      box.className = 'lunea-draft-aux-v57';
      const anchor = $('cards');
      if (anchor) anchor.insertAdjacentElement('afterend', box);
    }

    const sections = [];
    if (row.timing) sections.push(`<section><b>⏳ 시기 오라클</b><pre>${esc(row.timing)}</pre></section>`);
    if (row.thai) sections.push(`<section><b>🇹🇭 태국점성술</b><pre>${esc(row.thai)}</pre></section>`);
    if (row.thaiRange) sections.push(`<section><b>🇹🇭 Thai 기간 흐름</b><pre>${esc(row.thaiRange)}</pre></section>`);
    box.innerHTML = `<summary>복원된 보조 결과 · ${sections.length}개</summary>${sections.join('')}`;
  }

  function installAuxStyles() {
    if ($('luneaDraftAuxV57Style')) return;
    const style = document.createElement('style');
    style.id = 'luneaDraftAuxV57Style';
    style.textContent = `
      #luneaDraftAuxV57{margin:8px auto 12px;max-width:390px;border:1px solid rgba(189,164,248,.16);border-radius:13px;background:rgba(255,255,255,.025);overflow:hidden;color:#dcd5e7}
      #luneaDraftAuxV57 summary{padding:9px 11px;cursor:pointer;color:#cfc3e9;font-size:9.8px;font-weight:700;list-style:none}
      #luneaDraftAuxV57 summary::-webkit-details-marker{display:none}
      #luneaDraftAuxV57 section{padding:9px 11px;border-top:1px solid rgba(255,255,255,.06)}
      #luneaDraftAuxV57 section b{display:block;margin-bottom:5px;font-size:9.5px;color:#e8e1f2}
      #luneaDraftAuxV57 pre{margin:0;white-space:pre-wrap;word-break:break-word;font:400 9px/1.5 Pretendard,-apple-system,BlinkMacSystemFont,sans-serif;color:#aaa2b6}
    `;
    document.head.appendChild(style);
  }

  function restoredPromptBlock(row) {
    if (!row) return '';
    const parts = [];
    if (row.timing) parts.push(`\n[RESTORED LAST READING · TIMING ORACLE]\n${row.timing}`);
    if (row.thai) parts.push(`\n[RESTORED LAST READING · THAI ASTROLOGY]\n${row.thai}`);
    if (row.thaiRange) parts.push(`\n[RESTORED LAST READING · THAI PERIOD]\n${row.thaiRange}`);
    if (!parts.length) return '';
    return `\n\n[임시저장에서 복원된 보조 근거]\n아래 내용은 같은 질문에서 실제로 계산/추출되어 임시저장된 결과다. 새 계산값을 지어내지 말고 저장된 내용만 근거로 사용한다.${parts.join('')}`;
  }

  function installPromptRestore() {
    let fn = null;
    try { fn = W.promptString || promptString; } catch { fn = W.promptString; }
    if (typeof fn !== 'function') return false;
    if (fn.__luneaMobileV57AuxPrompt) { promptWrapped = true; return true; }

    const wrapped = function(...args) {
      let prompt = fn.apply(this, args);
      const row = restoredAux;
      if (!row || clean(row.question) !== currentQuestion()) return prompt;

      const needTiming = row.timing && !String(prompt).includes('[LUNEA TIMING ORACLE');
      const needThai = (row.thai || row.thaiRange) && !String(prompt).includes('[THAI ASTROLOGY');
      if (!needTiming && !needThai) return prompt;

      const filtered = {
        ...row,
        timing:needTiming ? row.timing : '',
        thai:needThai ? row.thai : '',
        thaiRange:needThai ? row.thaiRange : ''
      };
      return String(prompt) + restoredPromptBlock(filtered);
    };
    wrapped.__luneaMobileV57AuxPrompt = true;
    wrapped.__luneaMobileV57Prior = fn;
    W.promptString = wrapped;
    try { promptString = wrapped; } catch {}
    promptWrapped = true;
    return true;
  }

  function installAuxObservers() {
    ['timingResult','thaiTaksaResult','luneaThaiTarotRangeResult'].forEach(id => {
      const node = $(id);
      if (!node || node.__luneaV57AuxObserved) return;
      node.__luneaV57AuxObserved = true;
      new MutationObserver(() => scheduleAuxSave(100)).observe(node, {
        childList:true, subtree:true, characterData:true, attributes:true,
        attributeFilter:['class']
      });
    });
  }

  function onDocumentClick(event) {
    const target = event.target;
    if (!target?.closest) return;
    const id = sessionId();

    if (target.closest('#astroTransitBtn,#luneaAstroTransitInline')) {
      sessionFrame(applyTransitQuestionRange, id);
    }

    if (target.closest('#timingDraw,#timingRefine,#thaiTaksaRun,#luneaThaiTarotBridgeBtn,#luneaThaiTarotRangeRun')) {
      restoredAux = null;
      $('luneaDraftAuxV57')?.remove();
      [140,700,1800,4000].forEach(ms => sessionTimeout(captureAuxNow, ms, id));
    }

    if (target.closest('#luneaDraftRestore')) {
      const saved = readAux();
      if (!saved) return;
      [120,320,700].forEach(ms => sessionTimeout(() => renderRestoredAux(saved), ms, id));
    }
  }

  function installDocumentGuards() {
    if (document.documentElement.dataset.luneaV57Guards === '1') return;
    document.documentElement.dataset.luneaV57Guards = '1';
    document.addEventListener('click', noteV20Confirm, true);
    document.addEventListener('click', onDocumentClick, true);

    if (W.PointerEvent) document.addEventListener('pointerdown', onFastHoraryClose, true);
    else {
      document.addEventListener('touchstart', onFastHoraryClose, {capture:true, passive:false});
      document.addEventListener('mousedown', onFastHoraryClose, true);
    }

    W.addEventListener('pagehide', captureAuxNow, {passive:true});
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) captureAuxNow();
    });
  }

  function installPass() {
    installAuxStyles();
    installDocumentGuards();
    installLearningIdleCommit();
    installTransitFirstOpen();
    installAuxObservers();
    installPromptRestore();
  }

  function boot() {
    installPass();
    // A single load-phase completion pass is enough for nodes created by static
    // scripts later in the document. Never poll or chase startSpread ownership.
    if (document.readyState !== 'complete') W.addEventListener('load', installPass, {once:true});
  }

  W.LUNEA_MOBILE_RUNTIME_FIXES_V57 = Object.freeze({
    version:RELEASE,
    applyTransitQuestionRange,
    forceCloseHorary,
    captureAux:captureAuxNow,
    readAux,
    clearAux:() => clearAux(true),
    deferLearningFor:ms => { deferLearningUntil = Math.max(deferLearningUntil, performance.now() + Math.max(0, Number(ms) || 0)); },
    install:installPass,
    promptWrapped:() => promptWrapped
  });

  if (document.readyState === 'complete') boot();
  else W.addEventListener('load', boot, {once:true});

  console.info('✦ LUNEA Mobile Runtime Fixes V57.1 loaded · no startSpread wrapper');
})();