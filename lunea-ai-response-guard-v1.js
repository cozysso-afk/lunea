'use strict';

/* LUNEA AI RESPONSE GUARD V1
   ---------------------------------------------------------------
   Shared request ownership + Gemini response validation.

   Goals:
   - one active request per logical AI scope
   - abort a superseded request instead of letting it finish invisibly
   - let callers verify that the reading/input signature still matches
   - concatenate multipart text instead of trusting parts[0] only
   - reject blocked, empty, malformed, or truncated Gemini responses
*/
(() => {
  const W = window;
  if (W.__LUNEA_AI_RESPONSE_GUARD_V1__) return;
  W.__LUNEA_AI_RESPONSE_GUARD_V1__ = true;

  const active = new Map();
  let sequence = 0;

  class StaleResponseError extends Error {
    constructor(message='이전 AI 응답이 현재 읽기와 달라서 버렸어.') {
      super(message);
      this.name = 'LuneaStaleAIResponseError';
      this.code = 'stale_response';
      this.luneaStale = true;
    }
  }

  function normalizeScope(scope) {
    const value = String(scope || '').trim();
    return value || 'default';
  }

  function normalizeSignature(signature) {
    return String(signature ?? '');
  }

  function abortToken(token, reason='lunea-ai-abort') {
    if (!token?.controller || token.controller.signal.aborted) return;
    try { token.controller.abort(reason); }
    catch { token.controller.abort(); }
  }

  function begin(scope, signature='') {
    const key = normalizeScope(scope);
    const previous = active.get(key);
    if (previous) abortToken(previous, 'lunea-ai-superseded');

    const controller = typeof AbortController === 'function'
      ? new AbortController()
      : null;
    const token = Object.freeze({
      id: ++sequence,
      scope: key,
      signature: normalizeSignature(signature),
      controller,
      signal: controller?.signal || null
    });
    active.set(key, token);
    return token;
  }

  function isLatest(token) {
    return !!token && active.get(token.scope) === token;
  }

  function resolveSignature(value) {
    try { return normalizeSignature(typeof value === 'function' ? value() : value); }
    catch { return ''; }
  }

  function isCurrent(token, currentSignature=token?.signature ?? '') {
    return isLatest(token) && resolveSignature(currentSignature) === normalizeSignature(token?.signature);
  }

  function assertCurrent(token, currentSignature=token?.signature ?? '') {
    if (!isCurrent(token, currentSignature)) throw new StaleResponseError();
    return true;
  }

  function finish(token) {
    if (!isLatest(token)) return false;
    active.delete(token.scope);
    return true;
  }

  function abort(scope, reason='lunea-ai-abort') {
    const key = normalizeScope(scope);
    const token = active.get(key);
    if (!token) return false;
    active.delete(key);
    abortToken(token, reason);
    return true;
  }

  function makeError(message, code='invalid_response') {
    const error = new Error(String(message || 'AI 응답을 확인하지 못했어.'));
    error.code = code;
    error.luneaAIResponseError = true;
    return error;
  }

  function finishReasonMessage(reason) {
    const value = String(reason || '').trim().toUpperCase();
    if (value === 'MAX_TOKENS') return 'AI 응답이 길이 제한에서 잘렸어. 다시 요청해줘.';
    if (value === 'SAFETY') return 'AI 응답이 안전 필터에서 중단됐어. 질문 표현을 조금 바꿔 다시 요청해줘.';
    if (value === 'RECITATION') return 'AI 응답이 인용 제한 때문에 중단됐어. 다시 요청해줘.';
    if (value === 'BLOCKLIST' || value === 'PROHIBITED_CONTENT' || value === 'SPII') return 'AI 응답이 정책 필터에서 중단됐어. 질문을 조정해 다시 요청해줘.';
    if (value === 'MALFORMED_FUNCTION_CALL') return 'AI 응답 형식이 깨졌어. 다시 요청해줘.';
    return `AI 응답이 정상 종료되지 않았어 (${value || 'UNKNOWN'}). 다시 요청해줘.`;
  }

  function extractText(data) {
    if (!data || typeof data !== 'object') throw makeError('AI 응답 형식이 비어 있어.', 'missing_payload');
    if (data.error) throw makeError(data.error?.message || 'AI 요청이 실패했어.', 'api_error');

    const blockReason = String(data?.promptFeedback?.blockReason || '').trim();
    if (blockReason) throw makeError(`AI 요청이 차단됐어 (${blockReason}). 질문을 조정해 다시 요청해줘.`, 'prompt_blocked');

    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    if (!candidates.length) throw makeError('AI 응답 후보가 없어. 다시 요청해줘.', 'missing_candidate');

    const candidate = candidates[0] || {};
    const finishReason = String(candidate.finishReason || '').trim().toUpperCase();
    if (finishReason && finishReason !== 'STOP') {
      throw makeError(finishReasonMessage(finishReason), `finish_${finishReason.toLowerCase()}`);
    }

    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map(part => typeof part?.text === 'string' ? part.text : '')
      .join('')
      .trim();
    if (!text) throw makeError('AI 응답 본문이 비어 있어. 다시 요청해줘.', 'empty_text');
    return text;
  }

  async function parseResponse(response) {
    let data;
    try { data = await response.json(); }
    catch { throw makeError('AI 응답 JSON을 읽지 못했어. 다시 요청해줘.', 'invalid_json'); }

    if (!response?.ok || data?.error) {
      throw makeError(data?.error?.message || `AI 요청 실패: HTTP ${response?.status || 0}`, 'http_error');
    }

    return {
      text: extractText(data),
      data,
      finishReason: String(data?.candidates?.[0]?.finishReason || '')
    };
  }

  function isStaleError(error) {
    return !!(error?.luneaStale || error?.code === 'stale_response' || error?.name === 'LuneaStaleAIResponseError');
  }

  W.LUNEA_AI_RESPONSE_GUARD_V1 = Object.freeze({
    version:'1.0',
    begin,
    isLatest,
    isCurrent,
    assertCurrent,
    finish,
    abort,
    extractText,
    parseResponse,
    isStaleError,
    StaleResponseError
  });
  console.info('✦ LUNEA AI Response Guard V1 active');
})();
