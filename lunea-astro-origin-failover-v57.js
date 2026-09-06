'use strict';

/* LUNEA ASTRO ORIGIN FAILOVER V57.2
   Vercel uses a same-origin proxy; other hosts retain V2 -> legacy failover. */
(() => {
  const W=window;if(W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__||typeof W.fetch!=='function')return;W.__LUNEA_ASTRO_ORIGIN_FAILOVER_V57__=true;
  /* Structural V4 loads this before the current home. Extend the existing boot curtain
     so the base 3.5s timer cannot expose the legacy shell while current UI scripts load. */
  try{clearTimeout(W.__LUNEA_BOOT_FAILSAFE__);W.__LUNEA_BOOT_FAILSAFE__=setTimeout(()=>{document.documentElement.classList.remove('lunea-booting');document.documentElement.classList.add('lunea-ui-ready')},7000)}catch{}
  const ORIGINS=Object.freeze(['https://lunea-astro-api-v2.onrender.com','https://lunea-astro-api.onrender.com']);
  const TRANSIENT=new Set([408,425,429,500,502,503,504]);const nativeFetch=W.fetch.bind(W);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const isVercel=/\.vercel\.app$/i.test(location.hostname);const rawUrl=input=>{try{return typeof input==='string'?input:(input instanceof URL?input.href:String(input?.url||''))}catch{return''}};
  const official=url=>ORIGINS.find(o=>url===o||url.startsWith(o+'/'))||'';const targetUrl=(original,target)=>{const u=new URL(original);return `${target}${u.pathname}${u.search}`};
  const proxyUrl=original=>{const u=new URL(original);return `${location.origin}/api/lunea-astro-proxy?path=${encodeURIComponent(u.pathname+u.search)}`};
  async function runFetch(input,init,url){if(typeof input==='string'||input instanceof URL)return nativeFetch(url,{...init,cache:'no-store'});try{return nativeFetch(new Request(url,input.clone()),{...init,cache:'no-store'})}catch{return nativeFetch(url,{...init,cache:'no-store'})}}
  async function directRound(input,init,originalUrl){let lastResponse=null,lastError=null;for(const origin of ORIGINS){try{const response=await runFetch(input,init,targetUrl(originalUrl,origin));lastResponse=response;if(!TRANSIENT.has(response.status))return {done:true,response}}catch(error){lastError=error;if(String(error?.name||'')==='AbortError')throw error}}return {done:false,response:lastResponse,error:lastError}}
  async function proxyRound(input,init,originalUrl){try{const response=await runFetch(input,init,proxyUrl(originalUrl));return {done:!TRANSIENT.has(response.status),response}}catch(error){if(String(error?.name||'')==='AbortError')throw error;return {done:false,error}}}
  W.fetch=async function luneaAstroFailoverV57(input,init){const originalUrl=rawUrl(input);if(!official(originalUrl))return nativeFetch(input,init);const path=(()=>{try{return new URL(originalUrl).pathname}catch{return''}})();const isHealth=/\/health\/?$/i.test(path);const waits=isHealth?[0,1800,3200]:[0,1800,4500];let lastResponse=null,lastError=null;for(let i=0;i<waits.length;i++){if(waits[i])await sleep(waits[i]);const result=isVercel?await proxyRound(input,init,originalUrl):await directRound(input,init,originalUrl);if(result.done)return result.response;if(result.response)lastResponse=result.response;if(result.error)lastError=result.error}if(lastResponse)return lastResponse;throw lastError||new TypeError('Astro Core network request failed')};
  setTimeout(()=>{if(isVercel)nativeFetch(`${location.origin}/api/lunea-astro-proxy?path=${encodeURIComponent('/health?t='+Date.now())}`,{cache:'no-store'}).catch(()=>{});else for(const origin of ORIGINS)nativeFetch(`${origin}/health?t=${Date.now()}`,{method:'GET',cache:'no-store'}).catch(()=>{})},150);
  W.LUNEA_ASTRO_ORIGIN_FAILOVER_V57=Object.freeze({version:'57.2',origins:ORIGINS.slice(),proxy:isVercel});console.info(`✦ LUNEA Astro Failover V57.2 active · ${isVercel?'Vercel proxy':'direct failover'}`);
})();