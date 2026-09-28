'use strict';

/* LUNEA HORARY AI EXPLANATION V2
   ---------------------------------------------------------------
   Presentation-only companion for Horary AI prose.

   Contract:
   - never recalculates Horary / Prashna / Cross facts
   - never changes Gemini text, archive data, grades, scores, timing or routing
   - only marks whether the returned prose visibly links conclusions to evidence,
     separates counter-evidence, and states uncertainty
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_AI_EXPLANATION_V2__) return;
  W.__LUNEA_HORARY_AI_EXPLANATION_V2__ = true;

  const STYLE_ID = 'luneaHoraryAiExplanationV2Style';
  const META_ID = 'luneaHoraryAiExplanationV2Meta';
  const OUTPUT_ID = 'astroHoraryAIText';
  const $ = id => document.getElementById(id);
  let outputObserver = null;
  let rootObserver = null;
  let boundOutput = null;
  let queued = false;

  function clean(value) {
    return String(value ?? '').replace(/\r/g, '').trim();
  }

  function isTransient(text) {
    const value = clean(text);
    if (!value) return true;
    return /(?:판정하는 중|해석 중|AI 해석 실패|이전 AI 응답은 버렸어|AI 해석 요청이 취소됐어|먼저 호라리 차트를 계산)/i.test(value);
  }

  function assessText(text) {
    const value = clean(text);
    const evidenceLinked = /(?:^|\n)\s*(?:[-*]\s*)?근거\s*:/m.test(value);
    const counterEvidence = /(?:^|\n)\s*(?:[-*]\s*)?(?:반증|제한)\s*:/m.test(value) || /###\s*(?:반증|제한|반증·제한|제한·방해 요소)/i.test(value);
    const uncertainty = /(?:^|\n)\s*(?:[-*]\s*)?불확실성\s*:/m.test(value) || /###\s*신뢰도와 불확실성/i.test(value);
    const prashnaSeparated = !/Prashna/i.test(value) || /###\s*Horary\s*↔\s*Prashna|체계\s*간\s*충돌|독립/i.test(value);
    return Object.freeze({
      final: !!value && !isTransient(value),
      evidenceLinked,
      counterEvidence,
      uncertainty,
      prashnaSeparated
    });
  }

  function addStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${META_ID}{display:none;margin:5px 0 7px;padding:7px 8px;border:1px solid rgba(162,198,229,.13);border-radius:11px;background:linear-gradient(145deg,rgba(76,139,177,.045),rgba(116,88,158,.04));gap:5px;flex-wrap:wrap;align-items:center}
      #${META_ID}.show{display:flex}
      #${META_ID} .ai-v2-label{margin-right:2px;color:#a9d7ef;font:760 7.4px/1.25 'Cinzel',serif;letter-spacing:.85px}
      #${META_ID} .ai-v2-chip{display:inline-flex;align-items:center;min-height:22px;padding:0 7px;border:1px solid rgba(220,214,235,.105);border-radius:999px;background:rgba(255,255,255,.025);color:#a8a3b1;font-size:7.9px;line-height:1.2}
      #${META_ID} .ai-v2-chip.ok{color:#bfe5d2;border-color:rgba(157,228,193,.16)}
      #${META_ID} .ai-v2-chip.warn{color:#d6bd8d;border-color:rgba(221,185,112,.17)}
      #${OUTPUT_ID}.ai-explanation-v2-ready{overflow-wrap:anywhere;word-break:keep-all;line-height:1.68!important}
      @media(max-width:520px){#${META_ID}{padding:7px;gap:4px}#${META_ID} .ai-v2-label{width:100%;margin-bottom:1px}#${META_ID} .ai-v2-chip{font-size:8px}}
      @media(prefers-reduced-motion:reduce){#${META_ID},#${OUTPUT_ID}.ai-explanation-v2-ready{transition:none!important}}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function makeChip(label, ok, warningLabel='확인 필요') {
    const span = document.createElement('span');
    span.className = `ai-v2-chip ${ok ? 'ok' : 'warn'}`;
    span.textContent = ok ? `✓ ${label}` : `△ ${label} ${warningLabel}`;
    return span;
  }

  function ensureMeta(output) {
    if (!output) return null;
    let meta = $(META_ID);
    if (!meta) {
      meta = document.createElement('div');
      meta.id = META_ID;
      meta.setAttribute('role','note');
      meta.setAttribute('aria-label','AI 해설 근거 연결 상태');
    }
    const band = $('luneaResultV2AiBand');
    if (band) {
      if (band.nextElementSibling !== meta) band.insertAdjacentElement('afterend', meta);
    } else if (meta.nextElementSibling !== output) {
      output.insertAdjacentElement('beforebegin', meta);
    }
    return meta;
  }

  function sync() {
    queued = false;
    const output = $(OUTPUT_ID);
    if (!output) return false;
    addStyles();
    const text = clean(output.innerText || output.textContent || '');
    const state = assessText(text);
    const meta = ensureMeta(output);
    if (!meta) return false;

    output.classList.toggle('ai-explanation-v2-ready', state.final);
    output.dataset.aiExplanationV2 = state.final ? '1' : '0';
    meta.classList.toggle('show', state.final);
    meta.hidden = !state.final;
    if (!state.final) {
      meta.replaceChildren();
      return true;
    }

    const label = document.createElement('span');
    label.className = 'ai-v2-label';
    label.textContent = 'AI EXPLANATION V2 · ENGINE-BOUND';
    meta.replaceChildren(
      label,
      makeChip('근거 연결', state.evidenceLinked),
      makeChip('반증 분리', state.counterEvidence),
      makeChip('불확실성', state.uncertainty),
      makeChip('Prashna 독립', state.prashnaSeparated)
    );
    return true;
  }

  function scheduleSync() {
    if (queued) return;
    queued = true;
    const run = () => sync();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function bindOutput() {
    const output = $(OUTPUT_ID);
    if (!output) return false;
    if (boundOutput === output && outputObserver) {
      scheduleSync();
      return true;
    }
    outputObserver?.disconnect?.();
    boundOutput = output;
    if (typeof MutationObserver === 'function') {
      outputObserver = new MutationObserver(scheduleSync);
      outputObserver.observe(output,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    scheduleSync();
    return true;
  }

  function install() {
    addStyles();
    bindOutput();
    if (typeof MutationObserver === 'function') {
      rootObserver = new MutationObserver(() => {
        bindOutput();
        scheduleSync();
      });
      rootObserver.observe(document.documentElement,{childList:true,subtree:true});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();

  W.LUNEA_HORARY_AI_EXPLANATION_V2 = Object.freeze({
    version:'2.0',
    assessText,
    isTransient,
    sync,
    bindOutput
  });
  console.info('✦ LUNEA Horary AI Explanation V2 active · evidence-linked presentation ON');
})();
