'use strict';

/* LUNEA ASTRO ORIGIN FAILOVER V57.1
   Stable-host adapter for the two official Astro Core origins.
   - V2 preferred; legacy fallback.
   - health checks tolerate free-tier cold starts instead of failing on the first 502.
   - calculation requests retry transient edge/network failures with bounded spacing.
   - custom API URLs remain untouched.
   - no localStorage / IndexedDB writes. */
(() => {
  const W=window;
  if(W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__||typeof W.fetch!=='function')return;
  W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__=true;

  const ORIGINS=Object.freeze(['https://lunea-astro-api-v2.onrender.com','https://lunea-astro-api.onrender.com']);
  const TRANSIENT=new Set([408,425,429,500,502,503,504]);
  const nativeFetch=W.fetch.bind(W);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const rawUrl=input=>{try{return typeof input==='string'?input:(input instanceof URL?input.href:String(input?.url||''))}catch{return''}};
  const official=url=>ORIGINS.find(o=>url===o||url.startsWith(o+'/'))||'';
  const targetUrl=(original,target)=>{const u=new URL(original);return `${target}${u.pathname}${u.search}`};

  async function runFetch(input,init,url){
    if(typeof input==='string'||input instanceof URL)return nativeFetch(url,init);
    try{return nativeFetch(new Request(url,input.clone()),init)}catch{return nativeFetch(url,init)}
  }

  async function oneRound(input,init,originalUrl){
    let lastResponse=null,lastError=null;
    for(const origin of ORIGINS){
      try{
        const response=await runFetch(input,init,targetUrl(originalUrl,origin));
        lastResponse=response;
        if(!TRANSIENT.has(response.status))return {done:true,response};
      }catch(error){
        lastError=error;
        if(String(error?.name||'')==='AbortError')throw error;
      }
    }
    return {done:false,response:lastResponse,error:lastError};
  }

  W.fetch=async function luneaAstroFailoverV57(input,init){
    const originalUrl=rawUrl(input);
    if(!official(originalUrl))return nativeFetch(input,init);

    const path=(()=>{try{return new URL(originalUrl).pathname}catch{return''}})();
    const isHealth=/\/health\/?$/i.test(path);
    /* Health is the wake gate. Free services can need tens of seconds after sleep. */
    const waits=isHealth?[0,4200,5200,6200,7200,8200]:[0,1100,2800];
    let lastResponse=null,lastError=null;

    for(let i=0;i<waits.length;i++){
      if(waits[i])await sleep(waits[i]);
      const result=await oneRound(input,init,originalUrl);
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

  /* Start waking both servers as soon as LUNEA boots. */
  setTimeout(()=>{
    for(const origin of ORIGINS)nativeFetch(`${origin}/health?t=${Date.now()}`,{method:'GET',cache:'no-store'}).catch(()=>{});
  },150);

  W.LUNEA_ASTRO_ORIGIN_FAILOVER_V57=Object.freeze({version:'57.1',origins:ORIGINS.slice()});
  console.info('✦ LUNEA Astro Origin Failover V57.1 active · cold-start tolerant');
})();
