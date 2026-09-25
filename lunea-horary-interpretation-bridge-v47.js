'use strict';

/* LUNEA HORARY INTERPRETATION BRIDGE V47
   Rewrites only Gemini requests that are already Horary interpretation calls.
   Tarot / Daily / other AI requests are untouched. */
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_INTERPRETATION_BRIDGE_V47__ || typeof W.fetch !== 'function') return;
  W.__LUNEA_HORARY_INTERPRETATION_BRIDGE_V47__ = true;

  const priorFetch = W.fetch.bind(W);
  const HORARY_MARKERS = [
    '[HORARY V1 · 질문시각 점성술 계산 결과]',
    '[HORARY V1 · 계산 결과]',
    '[HORARY ENGINE RESULT · AUTHORITATIVE]',
    'LUNEA의 전통 Horary',
    'LUNEA HORARY INTERPRETATION ENGINE V2'
  ];

  function isGeminiGenerate(url) {
    return /generativelanguage\.googleapis\.com\/.+:generateContent(?:\?|$)/i.test(String(url || ''));
  }

  function isHoraryPrompt(text) {
    const value = String(text || '');
    return HORARY_MARKERS.some(marker => value.includes(marker));
  }

  function rewrite(init = {}) {
    if (!init?.body || typeof init.body !== 'string') return init;
    try {
      const payload = JSON.parse(init.body);
      const part = payload?.contents?.[0]?.parts?.[0];
      const original = String(part?.text || '');
      if (!isHoraryPrompt(original)) return init;
      if (original.includes('LUNEA HORARY INTERPRETATION ENGINE V2')) return init;

      const prompt = String(W.LUNEA_HORARY_INTERPRETATION_V47?.aiPrompt?.() || '').trim();
      if (!prompt) return init;

      const next = typeof structuredClone === 'function'
        ? structuredClone(payload)
        : JSON.parse(JSON.stringify(payload));
      next.contents[0].parts[0].text = prompt;
      return {...init, body:JSON.stringify(next)};
    } catch {
      return init;
    }
  }

  W.fetch = function luneaHoraryInterpretationBridgeV47(input, init = {}) {
    let url = '';
    try {
      url = typeof input === 'string'
        ? input
        : (input instanceof URL ? input.href : String(input?.url || ''));
    } catch {}
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    const nextInit = method === 'POST' && isGeminiGenerate(url) ? rewrite(init) : init;
    return priorFetch(input, nextInit);
  };

  W.LUNEA_HORARY_INTERPRETATION_BRIDGE_V47 = Object.freeze({
    version:'47.0',
    rewrite,
    isHoraryPrompt,
    markers:HORARY_MARKERS.slice()
  });
  console.info('✦ LUNEA Horary Interpretation Bridge V47 active');
})();
