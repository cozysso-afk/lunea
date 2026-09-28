'use strict';

/* LUNEA HORARY AI GUARD V49
   ---------------------------------------------------------------
   Owns the Horary AI interpretation request lifecycle on desktop and iOS/PWA.

   - binds one AI response to the exact currently rendered Horary reading
   - discards a late response if question/result/Prashna context changed
   - delegates Gemini payload validation to LUNEA AI Response Guard V1
   - keeps the existing V44 prompt/copy/archive contract untouched
*/
(() => {
  const W = window;
  if (W.__LUNEA_HORARY_AI_GUARD_V49__) return;
  W.__LUNEA_HORARY_AI_GUARD_V49__ = true;

  const SCOPE = 'horary-ai-interpretation';
  const $ = id => document.getElementById(id);
  const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  let observer = null;

  function hash(value) {
    const text = String(value || '');
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function resultText() {
    const node = $('astroHoraryResult');
    if (!node?.classList?.contains('show')) return '';
    return String(node.innerText || node.textContent || '').trim();
  }

  function crossContext() {
    const cross = String(W.LUNEA_HORARY_PRASHNA_CROSS_V2?.promptBlock?.() || '').trim();
    if (cross) return cross;
    const prashna = String(W.LUNEA_PRASHNA_V1?.promptBlock?.() || '').trim();
    if (prashna) return prashna;
    const node = $('luneaPrashnaV1Result');
    return String(node?.innerText || node?.textContent || '').trim();
  }

  function readingSignature() {
    const result = resultText();
    if (!result) return '';
    const source = [
      clean($('astroHoraryQuestion')?.value || ''),
      String($('astroHoraryMoment')?.value || '').trim(),
      clean($('astroHoraryPlace')?.value || ''),
      String($('astroHoraryTopic')?.value || '').trim(),
      result,
      crossContext()
    ].join('\n⟡\n');
    return `h49-${hash(source)}`;
  }

  function guardApi() {
    return W.LUNEA_AI_RESPONSE_GUARD_V1 || null;
  }

  function prompt() {
    return String(W.LUNEA_HORARY_POST_ACTIONS_V44?.aiPrompt?.() || '');
  }

  function outputNode() {
    return $('astroHoraryAIText');
  }

  function staleMessage(output) {
    if (!output) return;
    output.classList?.add?.('show');
    output.textContent = '호라리 결과가 바뀌어서 이전 AI 응답은 버렸어. 현재 결과에서 다시 해석해줘.';
  }

  async function runAI(button=$('astroHoraryAI')) {
    const guard = guardApi();
    const aiPrompt = prompt();
    const signature = readingSignature();
    if (!guard || !aiPrompt || !signature) {
      if (!aiPrompt || !signature) alert('먼저 호라리 차트를 계산해줘.');
      else alert('AI 응답 보호 모듈을 불러오지 못했어. 화면을 다시 열어줘.');
      return;
    }

    const key = localStorage.getItem('LUNEA_API_KEY');
    const model = localStorage.getItem('LUNEA_MODEL') || 'gemini-2.5-flash';
    if (!key) {
      alert('LUNEA API 설정을 먼저 해줘.');
      return;
    }

    const output = outputNode();
    const old = button?.textContent || '🔮 호라리 AI 해석';
    const token = guard.begin(SCOPE, signature);
    if (button) {
      button.disabled = true;
      button.textContent = '🔮 해석 중…';
      button.dataset.luneaHoraryAiRequest = String(token.id);
    }
    if (output) {
      output.classList.add('show');
      output.textContent = '계산 근거를 질문 원문에 맞춰 판정하는 중…';
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts:[{text:aiPrompt}]}],
          generationConfig:{temperature:.35, topP:.86}
        }),
        ...(token.signal ? {signal:token.signal} : {})
      });
      const parsed = await guard.parseResponse(response);
      guard.assertCurrent(token, readingSignature);
      if (output) output.textContent = parsed.text;
    } catch (error) {
      const latest = guard.isLatest(token);
      const signatureStillMatches = readingSignature() === token.signature;
      if (!latest) {
        return;
      }
      if (!signatureStillMatches || guard.isStaleError(error)) {
        staleMessage(output);
      } else if (token.signal?.aborted) {
        if (output) output.textContent = 'AI 해석 요청이 취소됐어. 다시 눌러줘.';
      } else if (output) {
        output.textContent = `AI 해석 실패: ${error?.message || error}`;
      }
    } finally {
      if (guard.isLatest(token)) {
        guard.finish(token);
        if (button) {
          button.disabled = false;
          button.textContent = old;
          delete button.dataset.luneaHoraryAiRequest;
        }
      }
    }
  }

  function installButton() {
    const guard = guardApi();
    const v44 = W.LUNEA_HORARY_POST_ACTIONS_V44;
    const button = $('astroHoraryAI');
    if (!guard || !v44?.aiPrompt || !button) return false;
    if (button.dataset.luneaHoraryAiGuardV49 === '1' && button.onclick?.__luneaHoraryAiGuardV49) return true;

    const handler = function(event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return runAI(button);
    };
    handler.__luneaHoraryAiGuardV49 = true;
    button.onclick = handler;
    button.dataset.luneaHoraryAiGuardV49 = '1';
    return true;
  }

  function install() {
    installButton();

    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(() => installButton());
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }

    document.addEventListener('pointerdown', event => {
      if (event.target?.closest?.('#astroHoraryAI')) installButton();
    }, true);
    document.addEventListener('touchstart', event => {
      if (event.target?.closest?.('#astroHoraryAI')) installButton();
    }, {capture:true,passive:true});

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installButton() || tries >= 80) clearInterval(timer);
    },100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  W.LUNEA_HORARY_AI_GUARD_V49 = Object.freeze({
    version:'49.0',
    runAI,
    readingSignature,
    installButton
  });
  console.info('✦ LUNEA Horary AI Guard V49 active · stale-response protection ON');
})();
