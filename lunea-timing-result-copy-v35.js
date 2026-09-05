'use strict';

/* LUNEA TIMING ORACLE result copy V35.1 */
(() => {
  const W = window;
  if (W.__LUNEA_TIMING_COPY_V35__) return;
  W.__LUNEA_TIMING_COPY_V35__ = true;

  const COPY_ID = 'timingCopy';
  const RELEASE = '35.1';
  let snapshots = [];
  let questionKey = '';

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

  function currentQuestion() {
    return clean(document.getElementById('timingQuestion')?.value || document.getElementById('spreadQuestion')?.textContent || '');
  }

  function resetSnapshots() {
    snapshots = [];
    questionKey = currentQuestion();
  }

  function captureVisibleResult() {
    const result = document.getElementById('timingResult');
    if (!result?.classList?.contains('show')) return false;
    const text = clean(result.innerText || result.textContent);
    if (!text) return false;

    const q = currentQuestion();
    if (q !== questionKey) {
      snapshots = [];
      questionKey = q;
    }
    if (snapshots[snapshots.length - 1] !== text) snapshots.push(text);
    return true;
  }

  function buildCopyText() {
    captureVisibleResult();
    if (!snapshots.length) return '';

    const q = currentQuestion();
    const out = ['[LUNEA · TIMING ORACLE 결과]'];
    if (q) out.push(`\n[질문]\n${q}`);

    if (snapshots.length === 1) {
      out.push(`\n[시기 결과]\n${snapshots[0]}`);
    } else {
      snapshots.forEach((text, index) => {
        out.push(`\n[${index === 0 ? '1차 시기 카드' : `정밀화 카드 ${index}`}]\n${text}`);
      });
    }

    const ai = document.getElementById('timingAIText');
    const aiText = clean(ai?.innerText || ai?.textContent || '');
    if (ai?.classList?.contains('show') && aiText && !/^시기 신호와 질문 범위를 맞춰보는 중/.test(aiText) && !/^\[API 오류\]/.test(aiText)) {
      out.push(`\n[AI 시기 해석]\n${aiText}`);
    }
    return out.join('\n');
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  async function copyTimingResult() {
    const text = buildCopyText();
    if (!text) return alert('먼저 시기 카드를 뽑아줘.');
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else if (!fallbackCopy(text)) throw new Error('clipboard unavailable');
      alert('시기 오라클 결과를 복사했어.');
    } catch {
      if (fallbackCopy(text)) alert('시기 오라클 결과를 복사했어.');
      else alert('복사 권한을 확인해줘.');
    }
  }

  function ensureCopyButton() {
    const actions = document.getElementById('timingActions');
    if (!actions) return false;
    if (document.getElementById(COPY_ID)) return true;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mini';
    button.id = COPY_ID;
    button.textContent = '📋 결과 복사';
    button.title = '질문 · 시기 카드 · 정밀화 카드 · AI 시기 해석을 복사';
    button.addEventListener('click', copyTimingResult);

    const save = document.getElementById('timingSave');
    if (save?.parentNode === actions) actions.insertBefore(button, save);
    else actions.appendChild(button);
    return true;
  }

  function boot() {
    ensureCopyButton();
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#timingDraw')) resetSnapshots();
      if (event.target?.closest?.('#timingRefine')) setTimeout(captureVisibleResult, 30);
    }, true);

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      const run = () => {
        queued = false;
        ensureCopyButton();
        captureVisibleResult();
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else setTimeout(run, 16);
    });
    observer.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class']});

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (ensureCopyButton() || tries > 80) clearInterval(timer);
    }, 250);
  }

  W.LUNEA_TIMING_COPY_V35 = Object.freeze({version:RELEASE, ensureCopyButton, buildCopyText, resetSnapshots});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
