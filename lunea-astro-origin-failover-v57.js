'use strict';

/* LUNEA ASTRO ORIGIN FAILOVER V57.4
   Stable-host adapter for the two official Astro Core origins.
   - V2 preferred for shared core routes; full Docker service owns extended routes.
   - Health checks tolerate free-tier cold starts.
   - Calculation requests fail over once on network timeout / transient server failure.
   - POST compatibility 404/405 can fail over when one origin is behind the other.
   - Prashna / Vedic / Four Pillars / Astro jobs go to the full service first.
   - Successful shared-core responses pin subsequent shared-core calls only.
   - Custom API URLs remain untouched.
   - no localStorage / IndexedDB writes. */
(() => {
  const W=window;
  if(W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__||typeof W.fetch!=='function')return;
  W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__=true;

  const V2='https://lunea-astro-api-v2.onrender.com';
  const FULL='https://lunea-astro-api.onrender.com';
  const ORIGINS=Object.freeze([V2,FULL]);
  const TRANSIENT=new Set([408,425,429,500,502,503,504]);
  const HEALTH_TIMEOUTS=[7000,15000];
  const FULL_SERVICE_PATH=/^\/v1\/(?:prashna|vedic\/profile|profile\/four-pillars|jobs\/astro)(?:\/|$)/i;
  const nativeFetch=W.fetch.bind(W);
  let lastHealthyOrigin=null;

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const rawUrl=input=>{try{return typeof input==='string'?input:(input instanceof URL?input.href:String(input?.url||''))}catch{return''}};
  const official=url=>ORIGINS.find(o=>url===o||url.startsWith(o+'/'))||'';
  const targetUrl=(original,target)=>{const u=new URL(original);return `${target}${u.pathname}${u.search}`};
  const requestMethod=(input,init)=>String(init?.method||input?.method||'GET').toUpperCase();
  const requiresFullService=path=>FULL_SERVICE_PATH.test(String(path||''));

  function orderedOrigins(originalUrl,isHealth,path=''){
    if(isHealth)return ORIGINS.slice();
    if(requiresFullService(path))return [FULL,V2];
    const first=lastHealthyOrigin||V2||official(originalUrl);
    return [first,...ORIGINS.filter(origin=>origin!==first)];
  }

  function calculationTimeouts(path){
    if(/^\/v1\/jobs\/astro\/?$/i.test(path))return [30000,45000];
    if(/^\/v1\/horary\/?$/i.test(path))return [45000,60000];
    if(/^\/v1\/returns\/context\/?$/i.test(path))return [60000,90000];
    if(/^\/v1\/transits\/scan\/?$/i.test(path))return [90000,120000];
    return [45000,60000];
  }

  function compatibilityMiss(response,path,method){
    if(method!=='POST'||![404,405].includes(Number(response?.status)))return false;
    return /^\/v1\//i.test(path);
  }

  async function runFetch(input,init,url,timeoutMs){
    const controller=new AbortController();
    const upstream=init?.signal||input?.signal||null;
    let timedOut=false,relay=null;
    if(upstream?.aborted)controller.abort(upstream.reason);
    else if(upstream?.addEventListener){
      relay=()=>{try{controller.abort(upstream.reason)}catch{controller.abort()}};
      upstream.addEventListener('abort',relay,{once:true});
    }
    const timer=setTimeout(()=>{
      timedOut=true;
      try{controller.abort('lunea-astro-origin-timeout')}catch{controller.abort()}
    },timeoutMs);
    const nextInit={...(init||{}),signal:controller.signal};
    try{
      if(typeof input==='string'||input instanceof URL)return await nativeFetch(url,nextInit);
      let request=null;
      try{request=new Request(url,input.clone())}catch{}
      return await nativeFetch(request||url,nextInit);
    }catch(error){
      if(!timedOut)throw error;
      const timeoutError=new TypeError(`Astro origin timeout after ${timeoutMs}ms`);
      timeoutError.luneaOriginTimeout=true;
      throw timeoutError;
    }finally{
      clearTimeout(timer);
      if(upstream&&relay)upstream.removeEventListener?.('abort',relay);
    }
  }

  async function tryOrigins(input,init,originalUrl,{isHealth=false,path='',method='GET'}={}){
    const origins=orderedOrigins(originalUrl,isHealth,path);
    const timeouts=isHealth?HEALTH_TIMEOUTS:calculationTimeouts(path);
    let lastResponse=null,lastError=null;

    for(let index=0;index<origins.length;index+=1){
      const origin=origins[index];
      try{
        const response=await runFetch(input,init,targetUrl(originalUrl,origin),timeouts[index]||timeouts[timeouts.length-1]);
        lastResponse=response;
        const retryable=TRANSIENT.has(Number(response.status))||compatibilityMiss(response,path,method);
        if(!retryable){
          if(response.ok&&!requiresFullService(path))lastHealthyOrigin=origin;
          return {done:true,response,origin};
        }
      }catch(error){
        lastError=error;
        const upstream=init?.signal||input?.signal||null;
        if(upstream?.aborted)throw error;
      }
    }
    return {done:false,response:lastResponse,error:lastError};
  }

  W.fetch=async function luneaAstroFailoverV57(input,init){
    const originalUrl=rawUrl(input);
    if(!official(originalUrl))return nativeFetch(input,init);

    const parsed=(()=>{try{return new URL(originalUrl)}catch{return null}})();
    const path=parsed?.pathname||'';
    const isHealth=/\/health\/?$/i.test(path);
    const method=requestMethod(input,init);

    if(!isHealth){
      const result=await tryOrigins(input,init,originalUrl,{isHealth:false,path,method});
      if(result.done)return result.response;
      if(result.response)return result.response;
      throw result.error||new TypeError('Astro Core calculation request failed');
    }

    /* Health is only a wake/readiness probe, so retry both origins across a cold start. */
    const waits=[0,4200,5200,6200,7200,8200];
    let lastResponse=null,lastError=null;
    for(let i=0;i<waits.length;i++){
      if(waits[i])await sleep(waits[i]);
      const result=await tryOrigins(input,init,originalUrl,{isHealth:true,path,method});
      if(result.done)return result.response;
      if(result.response)lastResponse=result.response;
      if(result.error)lastError=result.error;
      if(result.response?.status===429){
        try{
          const h=result.response.headers?.get?.('retry-after');
          if(h&&/^\d+(?:\.\d+)?$/.test(h))await sleep(Math.min(3000,Math.max(500,Number(h)*1000)));
        }catch{}
      }
    }
    if(lastResponse)return lastResponse;
    throw lastError||new TypeError('Astro Core network request failed');
  };

  /* Wake both services early; user actions are never blocked on these probes. */
  setTimeout(()=>{
    for(const origin of ORIGINS)nativeFetch(`${origin}/health?t=${Date.now()}`,{method:'GET',cache:'no-store'}).catch(()=>{});
  },150);

  W.LUNEA_ASTRO_ORIGIN_FAILOVER_V57=Object.freeze({
    version:'57.4',origins:ORIGINS.slice(),fullService:FULL,requiresFullService
  });
  console.info('✦ LUNEA Astro Origin Failover V57.4 active · capability routing ON');
})();
