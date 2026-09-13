'use strict';

/* LUNEA LEARNING SUCCESS GATE V2
   ------------------------------------------------------------
   Universal AI V20.2 now carries the correction payload through preview and
   commits it only after the confirmed reading start resolves successfully.

   Therefore this module no longer wraps either learning.record() or startSpread.
   It exposes one small commit helper for callers that want the same semantics.
*/
(() => {
  const W = window;
  if (W.__LUNEA_LEARNING_SUCCESS_GATE_V1__) return;
  W.__LUNEA_LEARNING_SUCCESS_GATE_V1__ = true;

  function commit(payload) {
    if (!payload) return {saved:false, reason:'empty_payload', row:null};
    const api = W.LUNEA_SPREAD_LEARNING_V1;
    if (!api || typeof api.record !== 'function') return {saved:false, reason:'learning_unavailable', row:null};
    try {
      const result = api.record(payload);
      if (result?.saved) console.info('✅ LUNEA correction learned after successful draw');
      return result;
    } catch (error) {
      console.warn('[LUNEA Learning Success Gate] post-draw learning failed', error);
      return {saved:false, reason:'commit_failed', row:null};
    }
  }

  W.LUNEA_LEARNING_SUCCESS_GATE_V1 = Object.freeze({version:2, commit});
  console.info('🛡️ LUNEA Learning Success Gate V2 loaded · no startSpread wrapper');
})();