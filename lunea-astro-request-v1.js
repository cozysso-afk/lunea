'use strict';
// One deadline covers preparation, HTTP headers and JSON consumption.
// Settles independently of fetch honoring AbortSignal; no automatic POST retry.
(() => {
  const W = window;
  if (W.LUNEA_ASTRO_REQUEST_V1) return;
  const active = new Set(), generations = new Map();
  const generation = scope => generations.get(scope) || 0;
  function cancelScope(scope) {
    generations.set(scope,generation(scope)+1);
    for (const job of [...active]) if (job.scope === scope) job.cancel();
  }
  function json(url, options={}, config={}) {
    const {timeoutMs=120000,scope='reading',prepare,fetcher=(...args)=>W.fetch(...args)}=config;
    const controller=new AbortController();
    const upstream=options.signal;
    return new Promise((resolve,reject)=>{
      let settled=false,timer;
      const finish=(error,value)=>{
        if(settled)return;settled=true;clearTimeout(timer);active.delete(job);
        upstream?.removeEventListener?.('abort',abort);
        error?reject(error):resolve(value);
      };
      const abort=()=>{const error=new Error('계산 대기를 취소했어.');error.name='AbortError';finish(error);controller.abort();};
      const job={scope,cancel:abort};active.add(job);
      timer=setTimeout(()=>{
        const error=new Error(`서버 응답이 ${Math.round(timeoutMs/1000)}초 안에 완료되지 않아 대기를 중단했어. 잠시 후 다시 시도해줘.`);
        error.name='TimeoutError';finish(error);controller.abort();
      },timeoutMs);
      if(upstream?.aborted){abort();return;}
      upstream?.addEventListener?.('abort',abort,{once:true});
      Promise.resolve().then(async()=>{
        if(prepare)await prepare();
        if(settled)return;
        const response=await fetcher(url,{...options,signal:controller.signal});
        if(settled)return;
        let data;
        try{data=await response.json();}catch(error){
          if(!response.ok)throw new Error(`서버 응답 오류: HTTP ${response.status}`);
          throw new Error('서버 계산 결과를 읽지 못했어. 다시 시도해줘.');
        }
        if(!response.ok)throw new Error(typeof data?.detail==='string'?data.detail:`서버 응답 오류: HTTP ${response.status}`);
        finish(null,{response,data});
      }).catch(error=>finish(error));
    });
  }
  W.LUNEA_ASTRO_REQUEST_V1=Object.freeze({json,cancelScope,generation});
})();
