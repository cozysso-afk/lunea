'use strict';

/*
  Temporary Render-only V63 PWA escape.
  Purpose: force recovery to execute INSIDE the installed iOS Home Screen app,
  then retire any stale LUNEA root service worker/cache without touching
  localStorage or IndexedDB. Remove this preload after the device is clean.
*/
const http = require('http');

if (!global.__LUNEA_PWA_ESCAPE_V63__) {
  global.__LUNEA_PWA_ESCAPE_V63__ = true;
  const originalCreateServer = http.createServer.bind(http);

  const page = (stage) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#070916"><title>LUNEA Recovery</title>
<style>html,body{margin:0;width:100%;height:100%;background:#070916;color:#f4efff;font-family:-apple-system,BlinkMacSystemFont,"Pretendard",sans-serif}body{display:grid;place-items:center}.box{text-align:center;padding:28px}.moon{font:600 20px Georgia,serif;letter-spacing:5px;text-shadow:0 0 22px rgba(204,187,255,.42)}.s{margin-top:13px;font-size:12px;line-height:1.7;color:#aaa3bd}.dot{display:inline-block;animation:p 1.1s infinite alternate}@keyframes p{to{opacity:.25}}</style></head>
<body><div class="box"><div class="moon">☾ L U N E A</div><div class="s" id="s">복구 중<span class="dot">…</span></div></div>
<script>(()=>{
  const STAGE=${JSON.stringify(stage)};
  const status=t=>{try{document.getElementById('s').textContent=t}catch{}};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const clean=async()=>{
    try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.filter(k=>/^lunea-/i.test(k)).map(k=>caches.delete(k)))}}catch{}
    try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();for(const r of rs){try{r.waiting&&r.waiting.postMessage({type:'LUNEA_SW_RETIRE'})}catch{};try{r.active&&r.active.postMessage({type:'LUNEA_SW_RETIRE'})}catch{};try{await r.unregister()}catch{}}}}catch{}
  };
  (async()=>{
    if(STAGE==='one'){
      status('기존 캐시와 서비스워커 정리 중…');
      /* If old V58 returned a stale shell while fetching this page in the background,
         that fetch may still be writing its shell cache. Give it time to settle, then
         delete after the write rather than racing it. */
      await sleep(1800);
      await clean();
      await sleep(700);
      location.replace('/__lunea_bypass_health?lunea_escape_v63=2&t='+Date.now());
      return;
    }
    status('마지막 정리 중…');
    await sleep(700);
    await clean();
    for(let i=0;i<8;i++){
      let n=0;try{n=(await navigator.serviceWorker.getRegistrations()).length}catch{}
      if(!n)break;
      await sleep(350);
      await clean();
    }
    await sleep(650);
    location.replace('/?pwa_clean_v63=1&t='+Date.now());
  })();
})();</script></body></html>`;

  function send(res, html) {
    const body = Buffer.from(html, 'utf8');
    res.statusCode = 200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0, must-revalidate');
    res.setHeader('pragma','no-cache');
    res.setHeader('expires','0');
    res.setHeader('x-lunea-pwa-escape','v63');
    res.setHeader('content-length',body.length);
    res.end(body);
  }

  http.createServer = function wrappedCreateServer(handler, ...rest) {
    if (typeof handler !== 'function') return originalCreateServer(handler, ...rest);
    return originalCreateServer((req,res) => {
      try {
        const u = new URL(req.url || '/', 'http://lunea.local');
        if ((req.method || 'GET') === 'GET') {
          if (u.pathname === '/__lunea_bypass_health' && u.searchParams.get('lunea_escape_v63') === '2') {
            console.info('[LUNEA PWA escape V63] stage2 served');
            return send(res, page('two'));
          }
          if ((u.pathname === '/' || u.pathname === '/index.html') && u.searchParams.get('pwa_clean_v63') !== '1') {
            console.info('[LUNEA PWA escape V63] stage1 served');
            return send(res, page('one'));
          }
        }
      } catch {}
      return handler(req,res);
    }, ...rest);
  };

  console.info('LUNEA PWA escape V63 armed');
}
