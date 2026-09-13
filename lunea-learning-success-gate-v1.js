'use strict';

/* LUNEA LEARNING SUCCESS GATE V1
   ------------------------------------------------------------
   The universal V20 AI preview historically called learning.record()
   when the user pressed Confirm, before startSpread() had actually
   succeeded. 8/31 learning semantics require the opposite:

   - preview edits are staged while the preview is open
   - the staged correction is saved only after the matching spread
     actually starts successfully
   - a failed / rejected start never becomes a learned correction

   Base AI preflight already performs its own post-start commit. This
   gate targets only the V20 universal preview and otherwise stays out
   of the learning path.

   V59 lifecycle note:
   - installation is one-shot at load; no polling/re-wrapping loop
   - compatibility markers already present on the prior reading entrypoint
     are propagated onto this wrapper so later legacy installers do not
     mistake the outer function for an unwrapped entrypoint.
*/
(() => {
  const W=window;
  if(W.__LUNEA_LEARNING_SUCCESS_GATE_V1__)return;
  W.__LUNEA_LEARNING_SUCCESS_GATE_V1__=true;

  const clean=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim();
  let pending=null;
  let pendingTimer=0;
  let recordInstalled=false;
  let startInstalled=false;

  const START_MARKERS=[
    '__luneaMobileV57Yield',
    '__luneaAiRepeatFlowV58',
    '__luneaReadingBoundaryV31',
    '__luneaV14Wrapped',
    '__luneaV27Wrapped',
    '__luneaManualWrapped'
  ];

  function previewOpen(){
    return !!document.getElementById('luneaV20PreviewOverlay')?.classList?.contains('show');
  }
  function clearPending(){
    pending=null;
    if(pendingTimer){clearTimeout(pendingTimer);pendingTimer=0;}
  }
  function stage(payload){
    clearPending();
    pending={payload,question:clean(payload?.question),stagedAt:Date.now()};
    pendingTimer=setTimeout(()=>clearPending(),60000);
    return {saved:false,reason:'deferred_until_draw',row:null};
  }
  function takeFor(question){
    if(!pending)return null;
    const q=clean(question);
    const same=!pending.question||!q||pending.question===q;
    const hit=same?pending:null;
    clearPending();
    return hit;
  }

  function installRecordGate(){
    const api=W.LUNEA_SPREAD_LEARNING_V1;
    if(!api||typeof api.record!=='function')return false;
    if(api.record.__luneaSuccessGate){recordInstalled=true;return true;}
    const prior=api.record.bind(api);
    const gated=function(payload){
      if(previewOpen())return stage(payload);
      return prior(payload);
    };
    gated.__luneaSuccessGate=true;
    gated.__luneaPriorRecord=prior;
    api.record=gated;
    recordInstalled=true;
    return true;
  }

  function commit(hit){
    if(!hit?.payload)return;
    const api=W.LUNEA_SPREAD_LEARNING_V1;
    if(typeof api?.record!=='function')return;
    try{
      const result=api.record(hit.payload);
      if(result?.saved)console.info('✅ LUNEA V20 correction learned after successful draw');
    }catch(error){
      console.warn('[LUNEA Learning Success Gate] post-draw learning failed',error);
    }
  }

  function installStartGate(){
    const start=W.startSpread;
    if(typeof start!=='function')return false;
    if(start.__luneaLearningSuccessGate){startInstalled=true;return true;}
    const prior=start;
    const wrapped=function(...args){
      const hit=takeFor(args[0]);
      let result;
      try{result=prior.apply(this,args)}
      catch(error){throw error}
      if(result&&typeof result.then==='function'){
        return result.then(value=>{commit(hit);return value},error=>{throw error});
      }
      commit(hit);
      return result;
    };
    wrapped.__luneaLearningSuccessGate=true;
    wrapped.__luneaPriorStart=prior;
    START_MARKERS.forEach(marker=>{
      if(prior?.[marker])wrapped[marker]=true;
    });
    W.startSpread=wrapped;
    try{startSpread=wrapped}catch{}
    startInstalled=true;
    return true;
  }

  function boot(){
    installRecordGate();
    installStartGate();
    if(!recordInstalled||!startInstalled){
      console.warn('[LUNEA Learning Success Gate] one-shot install incomplete; lifecycle left unchanged');
    }
  }

  W.LUNEA_LEARNING_SUCCESS_GATE_V1={
    version:1.1,
    installRecordGate,
    installStartGate,
    pending:()=>pending?{question:pending.question,stagedAt:pending.stagedAt}:null,
    clear:clearPending
  };

  if(document.readyState==='complete')setTimeout(boot,0);
  else W.addEventListener('load',boot,{once:true});
  console.info('🛡️ LUNEA Learning Success Gate V1.1 loaded · one-shot install · lifecycle markers preserved');
})();
