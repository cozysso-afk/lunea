'use strict';

/*
  LUNEA RENDER PRELOAD V60 RECOVERY
  -------------------------------
  Stable base: V57.1 (last pre-service-worker production build).
  Adds one-time same-origin recovery for any iOS standalone/Safari container
  that was captured by the broken V58 service worker. The recovery removes only
  LUNEA service workers + Cache Storage; saved readings/localStorage/IndexedDB
  are preserved. After recovery the normal V57.1 app loads and no service worker
  is registered again.
*/
const fs = require('fs');
const path = require('path');
const http = require('http');

if (!global.__LUNEA_RENDER_PRELOAD_V56__) {
  global.__LUNEA_RENDER_PRELOAD_V56__ = true;
  global.__LUNEA_RENDER_PRELOAD_V57__ = true;
  global.__LUNEA_RENDER_PRELOAD_V60__ = true;

  const STAMP = '20260906-1320-render-v60-recovery';
  const V2 = 'https://lunea-astro-api-v2.onrender.com';
  const LEGACY = 'https://lunea-astro-api.onrender.com';
  const BACKENDS = [V2, LEGACY];
  const originalReadFile = fs.readFile.bind(fs);
  const originalCreateServer = http.createServer.bind(http);
  const nativeFetch = typeof global.fetch === 'function' ? global.fetch.bind(global) : null;
  const warmActive = new Set();
  const warmAttempts = new Map();
  const warmNextAt = new Map();
  const WARM_DELAYS = [10000, 20000, 30000, 45000, 60000];

  const RECOVERY_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#070916"><title>LUNEA</title><style>html,body{margin:0;width:100%;height:100%;background:#070916;color:#f4efff;font-family:-apple-system,BlinkMacSystemFont,"Pretendard",sans-serif}body{display:grid;place-items:center}.wrap{text-align:center}.logo{font:600 20px/1.2 Georgia,serif;letter-spacing:5px;text-shadow:0 0 22px rgba(204,187,255,.42)}.status{margin-top:14px;font-size:12px;color:#aaa3bd}</style></head><body><div class="wrap"><div class="logo">☾ L U N E A</div><div class="status" id="s">앱 복구 중…</div></div><script>(async()=>{const s=document.getElementById('s');try{if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();for(const r of rs){try{r.waiting&&r.waiting.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}try{r.active&&r.active.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}try{await r.unregister()}catch{}}}if('caches'in window){const ks=await caches.keys();await Promise.all(ks.filter(k=>/^lunea-/i.test(k)).map(k=>caches.delete(k)))}}catch{}try{document.cookie='lunea_recovered_v60=1; Path=/; Max-Age=31536000; SameSite=Lax'}catch{}s.textContent='복구 완료 · LUNEA 여는 중…';setTimeout(()=>location.replace('/?lunea_recovered_v60=1&t='+Date.now()),300)})();<\/script></body></html>`;

  function recoveryNeeded(req) {
    const raw = String(req?.url || '/');
    const pathname = raw.split('?')[0];
    if (!['GET','HEAD'].includes(String(req?.method || 'GET').toUpperCase())) return false;
    if (pathname !== '/' && pathname !== '/index.html') return false;
    if (/([?&])lunea_recovered_v60=1(?:&|$)/.test(raw)) return false;
    const cookie = String(req?.headers?.cookie || '');
    return !/(?:^|;\s*)lunea_recovered_v60=1(?:;|$)/.test(cookie);
  }

  http.createServer = function luneaCreateServerV60(handler, ...rest) {
    return originalCreateServer((req, res) => {
      if (recoveryNeeded(req)) {
        const body = Buffer.from(RECOVERY_HTML, 'utf8');
        res.statusCode = 200;
        res.setHeader('content-type','text/html; charset=utf-8');
        res.setHeader('cache-control','no-store, max-age=0, must-revalidate');
        res.setHeader('pragma','no-cache');
        res.setHeader('expires','0');
        res.setHeader('content-length',String(body.length));
        res.setHeader('x-lunea-recovery','v60');
        return res.end(req.method === 'HEAD' ? undefined : body);
      }
      return handler(req, res);
    }, ...rest);
  };

  function urlFrom(input) {
    try {
      if (typeof input === 'string') return input;
      if (input instanceof URL) return input.href;
      return String(input?.url || '');
    } catch { return ''; }
  }

  function backendFor(url) {
    return BACKENDS.find(origin => url === origin || url.startsWith(origin + '/')) || '';
  }

  function warmInBackground(origin, force = false) {
    if (!nativeFetch || warmActive.has(origin)) return;
    const now = Date.now();
    const allowedAt = Number(warmNextAt.get(origin) || 0);
    if (!force && now < allowedAt) return;

    const attempt = Number(warmAttempts.get(origin) || 0) + 1;
    warmAttempts.set(origin, attempt);
    warmActive.add(origin);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    nativeFetch(`${origin}/health`, {
      method:'GET', cache:'no-store', signal:controller.signal,
      headers:{Accept:'application/json','User-Agent':'LUNEA-Render-Warm-V60'}
    }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      warmAttempts.set(origin, 0);
      warmNextAt.set(origin, Date.now() + 4 * 60 * 1000);
      console.info(`[LUNEA preload V60] Astro warm ${origin.includes('-v2') ? 'v2' : 'legacy'} -> ${response.status}`);
    }).catch(error => {
      const delay = WARM_DELAYS[Math.min(attempt - 1, WARM_DELAYS.length - 1)];
      warmNextAt.set(origin, Date.now() + delay);
      console.warn(`[LUNEA preload V60] Astro warm ${origin.includes('-v2') ? 'v2' : 'legacy'} attempt ${attempt} pending/failed: ${String(error?.message || error)}; retry in ${Math.round(delay/1000)}s`);
      if (attempt <= WARM_DELAYS.length) setTimeout(() => warmInBackground(origin, true), delay);
    }).finally(() => {
      clearTimeout(timer);
      warmActive.delete(origin);
    });
  }

  BACKENDS.forEach(origin => warmInBackground(origin, true));

  if (nativeFetch) {
    global.fetch = async function luneaFetchV60(input, init = {}) {
      const raw = urlFrom(input);
      const origin = backendFor(raw);
      if (!origin) return nativeFetch(input, init);

      if (/\/health(?:\?|$)/.test(raw)) {
        warmInBackground(origin, false);
        return new Response(JSON.stringify({ok:true,warming:true,source:'lunea-preload-v60'}), {
          status:200,
          headers:{'content-type':'application/json','cache-control':'no-store'}
        });
      }

      const timeoutMs = origin === V2 ? 18000 : 30000;
      const controller = new AbortController();
      let upstreamAbort = null;
      if (init?.signal) {
        upstreamAbort = () => controller.abort(init.signal.reason);
        if (init.signal.aborted) upstreamAbort();
        else init.signal.addEventListener('abort', upstreamAbort, {once:true});
      }
      const timer = setTimeout(() => controller.abort(`lunea-astro-${timeoutMs}ms-timeout`), timeoutMs);

      console.info(`[LUNEA preload V60] Astro request ${origin === V2 ? 'v2' : 'legacy'} ${raw.slice(origin.length)} timeout=${timeoutMs}ms`);
      try {
        const response = await nativeFetch(input, {...init, signal:controller.signal});
        console.info(`[LUNEA preload V60] Astro response ${origin === V2 ? 'v2' : 'legacy'} ${response.status}`);
        return response;
      } finally {
        clearTimeout(timer);
        if (init?.signal && upstreamAbort) init.signal.removeEventListener?.('abort', upstreamAbort);
      }
    };
  }

  function stampAsset(html, asset) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return html.replace(new RegExp(`${escaped}\\?v[^"']*`, 'g'), `${asset}?v=${STAMP}`);
  }

  function patchIndex(data) {
    let html = Buffer.isBuffer(data) ? data.toString('utf8') : String(data ?? '');

    for (const asset of [
      'lunea-cache-refresh-v1.js',
      'lunea-structural-routing-v4.js',
      'lunea-boot-reveal-v29.js',
      'lunea-timing-moondial-sync-v15.js',
      'lunea-timing-image-assets-v16.js',
      'lunea-thai-range-v33.js',
      'astro-transit-v1.js',
      'astro-return-v1.js',
      'thai-taksa-v1.js',
      'lunea-astro-stability-v2.js',
      'lunea-ios-performance-v3.js',
    ]) html = stampAsset(html, asset);

    html = html.replace('},3500);', '},6500);');

    const structuralRe = /<script src="\.\/lunea-structural-routing-v4\.js\?v=[^"]+"><\/script>/;
    const match = html.match(structuralRe);
    if (match && !html.includes('data-lunea-render-v57="1"')) {
      const structural = match[0];
      const injected = [
        `<script data-lunea-render-v57="1" src="./lunea-boot-reveal-v29.js?v=${STAMP}"></script>`,
        `<script src="./lunea-timing-moondial-sync-v15.js?v=${STAMP}"></script>`,
        `<script src="./lunea-timing-image-assets-v16.js?v=${STAMP}"></script>`,
        `<script src="./lunea-astro-job-queue-v56.js?v=${STAMP}"></script>`,
        structural,
        `<script src="./lunea-runtime-state-v56.js?v=${STAMP}"></script>`,
        `<script src="./lunea-thai-date-display-v57.js?v=${STAMP}"></script>`,
      ].join('\n');
      html = html.replace(structural, injected);
    }

    return Buffer.from(html,'utf8');
  }

  fs.readFile = function(file, ...args) {
    const callback = args[args.length - 1];
    if (typeof callback !== 'function') return originalReadFile(file, ...args);
    const options = args.slice(0,-1);
    return originalReadFile(file, ...options, (err,data) => {
      if (err) return callback(err,data);
      try {
        const target = typeof file === 'string' || Buffer.isBuffer(file) ? String(file) : String(file?.href || file || '');
        if (path.basename(target.split('?')[0]) === 'index.html') data = patchIndex(data);
      } catch (patchError) {
        console.warn('[LUNEA preload V60] index patch skipped:', patchError?.message || patchError);
      }
      callback(null,data);
    });
  };

  console.info(`LUNEA Render preload V60 recovery armed · ${STAMP}`);
}
