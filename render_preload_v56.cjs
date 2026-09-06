'use strict';

/*
  LUNEA RENDER PRELOAD V61 RECOVERY BRIDGE
  ----------------------------------------
  Stable application core stays on V57.1, the last pre-service-worker build.
  This shim only repairs devices captured by the broken V58 root-scope worker.

  Why the bridge path works:
  V58 explicitly ignores /__lunea_bypass_health in its fetch handler. Any old
  controlled WebView therefore has a guaranteed network-only escape route.
*/
require('./render_preload_v57_core.cjs');

const http = require('http');

if (!global.__LUNEA_RENDER_RECOVERY_V61__) {
  global.__LUNEA_RENDER_RECOVERY_V61__ = true;

  const nativeCreateServer = http.createServer.bind(http);
  const BRIDGE_PATH = '/__lunea_bypass_health';
  const RECOVERY_COOKIE = 'lunea_recovered_v61=1';
  const RETIRE_WORKER = '/lunea-sw-v58.js?v=20260906-1348-v61-retire';

  const BRIDGE_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#070916"><title>LUNEA</title><style>html,body{margin:0;width:100%;height:100%;background:#070916;color:#f4efff;font-family:-apple-system,BlinkMacSystemFont,"Pretendard",sans-serif}body{display:grid;place-items:center}.wrap{text-align:center}.logo{font:600 20px/1.2 Georgia,serif;letter-spacing:5px;text-shadow:0 0 22px rgba(204,187,255,.42)}.status{margin-top:14px;font-size:12px;color:#aaa3bd}</style></head><body><div class="wrap"><div class="logo">☾ L U N E A</div><div class="status" id="s">앱 캐시 복구 중…</div></div><script>(async()=>{const s=document.getElementById('s');try{if('serviceWorker'in navigator){try{const rr=await navigator.serviceWorker.register('${RETIRE_WORKER}',{scope:'/',updateViaCache:'none'});try{await rr.update()}catch{}}catch{}const rs=await navigator.serviceWorker.getRegistrations();for(const r of rs){try{r.waiting&&r.waiting.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}try{r.active&&r.active.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}try{await r.unregister()}catch{}}}if('caches'in window){const ks=await caches.keys();await Promise.all(ks.filter(k=>/^lunea-/i.test(k)).map(k=>caches.delete(k)))}}catch{}try{document.cookie='${RECOVERY_COOKIE}; Path=/; Max-Age=31536000; SameSite=Lax'}catch{}s.textContent='복구 완료 · 화면 여는 중…';location.replace('${BRIDGE_PATH}?lunea_app_v61=1&t='+Date.now())})();<\/script></body></html>`;

  const APP_BRIDGE_HEAD = `<base href="/"><script id="luneaAppBridgeV61">(()=>{try{document.cookie='${RECOVERY_COOKIE}; Path=/; Max-Age=31536000; SameSite=Lax'}catch{}try{history.replaceState(null,'','/')}catch{}try{if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>{try{r.active&&r.active.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}try{r.unregister()}catch{}})).catch(()=>{})}catch{}try{if('caches'in window)caches.keys().then(ks=>Promise.all(ks.filter(k=>/^lunea-/i.test(k)).map(k=>caches.delete(k)))).catch(()=>{})}catch{}})();<\/script>`;

  function parseRequestUrl(req) {
    try { return new URL(String(req?.url || '/'), 'https://lunea.local'); }
    catch { return new URL('https://lunea.local/'); }
  }

  function isRootGet(req) {
    const method = String(req?.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return false;
    const pathname = parseRequestUrl(req).pathname;
    return pathname === '/' || pathname === '/index.html';
  }

  function hasRecoveredV61(req) {
    const u = parseRequestUrl(req);
    if (u.searchParams.get('lunea_recovered_v61') === '1') return true;
    return /(?:^|;\s*)lunea_recovered_v61=1(?:;|$)/.test(String(req?.headers?.cookie || ''));
  }

  function sendBridge(req, res) {
    const body = Buffer.from(BRIDGE_HTML, 'utf8');
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('pragma', 'no-cache');
    res.setHeader('expires', '0');
    res.setHeader('set-cookie', `${RECOVERY_COOKIE}; Path=/; Max-Age=31536000; SameSite=Lax`);
    res.setHeader('content-length', String(body.length));
    res.setHeader('x-lunea-recovery', 'v61-bridge');
    return res.end(req.method === 'HEAD' ? undefined : body);
  }

  function redirectToBridge(res) {
    res.statusCode = 302;
    res.setHeader('location', `${BRIDGE_PATH}?lunea_bridge_v61=1&t=${Date.now()}`);
    res.setHeader('cache-control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('pragma', 'no-cache');
    res.setHeader('expires', '0');
    res.setHeader('content-length', '0');
    res.setHeader('x-lunea-recovery', 'v61-redirect');
    return res.end();
  }

  function serveAppBridge(req, res, handler) {
    const originalUrl = req.url;
    const originalEnd = res.end.bind(res);
    let transformed = false;

    res.end = function luneaV61End(chunk, encoding, callback) {
      if (!transformed) {
        transformed = true;
        try {
          const type = String(res.getHeader('content-type') || '');
          if (chunk != null && /text\/html/i.test(type)) {
            let html = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
            if (!html.includes('luneaAppBridgeV61')) {
              html = html.includes('<head>')
                ? html.replace('<head>', '<head>' + APP_BRIDGE_HEAD)
                : APP_BRIDGE_HEAD + html;
            }
            const out = Buffer.from(html, 'utf8');
            try { res.setHeader('content-length', String(out.length)); } catch {}
            req.url = originalUrl;
            return originalEnd(req.method === 'HEAD' ? undefined : out, undefined, callback);
          }
        } catch (error) {
          console.warn('[LUNEA recovery V61] app bridge transform skipped:', error?.message || error);
        }
      }
      req.url = originalUrl;
      return originalEnd(chunk, encoding, callback);
    };

    req.url = '/?lunea_recovered_v61=1';
    return handler(req, res);
  }

  http.createServer = function luneaCreateServerV61(handler, ...rest) {
    return nativeCreateServer((req, res) => {
      const u = parseRequestUrl(req);

      // V58's old worker explicitly bypasses this pathname, making these two
      // navigations network-only even while that worker still controls the app.
      if (u.pathname === BRIDGE_PATH && u.searchParams.get('lunea_bridge_v61') === '1') {
        return sendBridge(req, res);
      }
      if (u.pathname === BRIDGE_PATH && u.searchParams.get('lunea_app_v61') === '1') {
        return serveAppBridge(req, res, handler);
      }

      // A stale V60 recovery page keeps retrying root. Its old V58 worker follows
      // this redirect on the network leg and caches the bridge response, so the
      // loop self-breaks without asking the user to change iPhone settings.
      if (isRootGet(req) && !hasRecoveredV61(req)) {
        return redirectToBridge(res);
      }

      return handler(req, res);
    }, ...rest);
  };

  console.info('LUNEA Render recovery bridge V61 armed · stable core V57.1');
}
