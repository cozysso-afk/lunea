'use strict';

/*
  LUNEA RENDER PRELOAD V57.1
  --------------------------
  Kept at the existing filename because Render NODE_OPTIONS already requires it.

  V57 fixes four production issues captured in the iPhone recording:
  1) hold the boot curtain until Daily Orbit 6 / Celestial V22 is actually painted;
  2) force the semantic Timing artwork guards before older nested loaders;
  3) load the non-native centered Thai date display;
  4) never block an Astro calculation behind a 70s health-probe loop. Real health
     requests warm both free services in the background while readiness is
     optimistic; actual API requests keep hard timeouts and existing failover.
*/
const fs = require('fs');
const path = require('path');

if (!global.__LUNEA_RENDER_PRELOAD_V56__) {
  global.__LUNEA_RENDER_PRELOAD_V56__ = true;
  global.__LUNEA_RENDER_PRELOAD_V57__ = true;

  const STAMP = '20260906-1057-render-v57-1';
  const V2 = 'https://lunea-astro-api-v2.onrender.com';
  const LEGACY = 'https://lunea-astro-api.onrender.com';
  const BACKENDS = [V2, LEGACY];
  const originalReadFile = fs.readFile.bind(fs);
  const nativeFetch = typeof global.fetch === 'function' ? global.fetch.bind(global) : null;
  const warmActive = new Set();
  const warmAttempts = new Map();
  const warmNextAt = new Map();
  const WARM_DELAYS = [10000, 20000, 30000, 45000, 60000];

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
      headers:{Accept:'application/json','User-Agent':'LUNEA-Render-Warm-V57'}
    }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      warmAttempts.set(origin, 0);
      warmNextAt.set(origin, Date.now() + 4 * 60 * 1000);
      console.info(`[LUNEA preload V57] Astro warm ${origin.includes('-v2') ? 'v2' : 'legacy'} -> ${response.status}`);
    }).catch(error => {
      const delay = WARM_DELAYS[Math.min(attempt - 1, WARM_DELAYS.length - 1)];
      warmNextAt.set(origin, Date.now() + delay);
      console.warn(`[LUNEA preload V57] Astro warm ${origin.includes('-v2') ? 'v2' : 'legacy'} attempt ${attempt} pending/failed: ${String(error?.message || error)}; retry in ${Math.round(delay/1000)}s`);
      if (attempt <= WARM_DELAYS.length) setTimeout(() => warmInBackground(origin, true), delay);
    }).finally(() => {
      clearTimeout(timer);
      warmActive.delete(origin);
    });
  }

  /* Start waking both calculation services as soon as the frontend process wakes. */
  BACKENDS.forEach(origin => warmInBackground(origin, true));

  if (nativeFetch) {
    global.fetch = async function luneaFetchV57(input, init = {}) {
      const raw = urlFrom(input);
      const origin = backendFor(raw);
      if (!origin) return nativeFetch(input, init);

      /* The existing server gates every calculation on /health. On free Render,
         that made the button wait up to 70s before the real POST even began.
         A real warm cycle is already running; answer readiness immediately so
         the calculation itself becomes the authoritative health check. */
      if (/\/health(?:\?|$)/.test(raw)) {
        warmInBackground(origin, false);
        return new Response(JSON.stringify({ok:true,warming:true,source:'lunea-preload-v57'}), {
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

      console.info(`[LUNEA preload V57] Astro request ${origin === V2 ? 'v2' : 'legacy'} ${raw.slice(origin.length)} timeout=${timeoutMs}ms`);
      try {
        const response = await nativeFetch(input, {...init, signal:controller.signal});
        console.info(`[LUNEA preload V57] Astro response ${origin === V2 ? 'v2' : 'legacy'} ${response.status}`);
        return response;
      } finally {
        clearTimeout(timer);
        if (init?.signal && upstreamAbort) init.signal.removeEventListener?.('abort', upstreamAbort);
      }
    };
  }

  function stampAsset(html, asset) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return html.replace(new RegExp(`${escaped}\\?v=[^"']+`, 'g'), `${asset}?v=${STAMP}`);
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
        console.warn('[LUNEA preload V57] index patch skipped:', patchError?.message || patchError);
      }
      callback(null,data);
    });
  };

  console.info(`LUNEA Render preload V57.1 armed · ${STAMP}`);
}
