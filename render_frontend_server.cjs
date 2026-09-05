'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 10000);
const API_ORIGIN = 'https://lunea-astro-api-v2.onrender.com';
const LEGACY_API_ORIGIN = 'https://lunea-astro-api.onrender.com';
const UI_BUILD = '20260906-0356-journal-astro-v52';
const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);
const GENERAL_RETRY_DELAYS_MS = [0, 1000, 2600, 5200];
const NATAL_CACHE_TTL_MS = 10 * 60 * 1000;
const NATAL_RETRY_DELAYS_MS = [0, 1200, 3000, 6000];
const natalCache = new Map();
const natalInflight = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/* Correctness-critical scripts load directly on the canonical Render origin. */
const INJECT = `
<meta name="lunea-render-build" content="${UI_BUILD}">
<script id="luneaRenderBypassV52Bootstrap">
(() => {
  const proxyBase = location.origin + '/__lunea_api';
  const upstreamOrigins = ['${API_ORIGIN}', '${LEGACY_API_ORIGIN}'];
  try { localStorage.setItem('LUNEA_ASTRO_API_URL', proxyBase); } catch {}
  window.__LUNEA_RENDER_BYPASS_V52__ = '${UI_BUILD}';
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      const raw = typeof input === 'string' ? input : (input && input.url) || '';
      const matched = upstreamOrigins.find(origin => raw.startsWith(origin));
      if (matched) {
        const target = proxyBase + raw.slice(matched.length);
        if (typeof input === 'string') return nativeFetch(target, init);
        return nativeFetch(new Request(target, input), init);
      }
    } catch {}
    return nativeFetch(input, init);
  };
})();
</script>
<script src="./lunea-cardback-sector-v20.js?v=${UI_BUILD}" data-lunea-render-direct="cardbacks"></script>
<script src="./lunea-timing-image-assets-v16.js?v=${UI_BUILD}" data-lunea-render-direct="timing"></script>
<script src="./lunea-daily-timing-v49.js?v=${UI_BUILD}" data-lunea-render-direct="daily-timing-v49"></script>
<script src="./lunea-draft-timing-v50.js?v=${UI_BUILD}" data-lunea-render-direct="draft-timing-v50"></script>
<script src="./lunea-horary-mobile-stability-v42.js?v=${UI_BUILD}" data-lunea-render-direct="horary"></script>
<script src="./lunea-learning-auth-recovery-v2.js?v=${UI_BUILD}" data-lunea-render-direct="learning-auth"></script>
<script src="./lunea-emergency-repair-v43.js?v=${UI_BUILD}" data-lunea-render-direct="emergency-v43"></script>
<script src="./lunea-profile-natal-v45.js?v=${UI_BUILD}" data-lunea-render-direct="profile-natal-v45"></script>
<script src="./lunea-archive-timing-v47.js?v=${UI_BUILD}" data-lunea-render-direct="archive-timing-v47"></script>
<script src="./lunea-journal-detail-v51.js?v=${UI_BUILD}" data-lunea-render-direct="journal-detail-v51"></script>`;

function safePath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { decoded = '/'; }
  decoded = decoded.replace(/\\/g, '/');
  const rel = decoded.replace(/^\/+/, '');
  const full = path.resolve(ROOT, rel || 'index.html');
  return full.startsWith(ROOT + path.sep) || full === path.resolve(ROOT, 'index.html') ? full : null;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/*
  Render adds x-forwarded-* / x-render-* headers to the browser -> frontend hop.
  Forwarding those again to the backend can make a second Render edge treat the
  request as malformed or rate-limited before FastAPI ever sees it. Keep only
  application-level headers that the Astro API actually needs.
*/
function cleanProxyHeaders(raw) {
  const allow = new Set([
    'content-type',
    'accept',
    'accept-language',
    'authorization',
    'user-agent',
    'x-requested-with',
  ]);
  const headers = {};
  for (const [key, value] of Object.entries(raw || {})) {
    if (allow.has(String(key).toLowerCase()) && value != null) headers[key] = value;
  }
  return headers;
}

function headerPairs(headers) {
  const pairs = [];
  headers.forEach((value, key) => {
    if (!['content-encoding','transfer-encoding','connection','content-length'].includes(key.toLowerCase())) {
      pairs.push([key,value]);
    }
  });
  return pairs;
}

async function upstreamOnce(target, method, headers, body) {
  const upstream = await fetch(target, {
    method,
    headers,
    body: ['GET','HEAD'].includes(method) ? undefined : body,
    redirect: 'follow',
  });
  return {
    status: upstream.status,
    headers: headerPairs(upstream.headers),
    body: Buffer.from(await upstream.arrayBuffer())
  };
}

function retryAfterMs(headers) {
  const entry = headers.find(([k]) => k.toLowerCase() === 'retry-after');
  if (!entry) return 0;
  const raw = String(entry[1] || '').trim();
  if (/^\d+(?:\.\d+)?$/.test(raw)) return Math.min(8000, Math.max(500, Number(raw) * 1000));
  const when = Date.parse(raw);
  return Number.isFinite(when) ? Math.min(8000, Math.max(500, when - Date.now())) : 0;
}

async function genericAstroUpstream(target, method, headers, body) {
  let last = null;
  let lastError = null;
  for (let i = 0; i < GENERAL_RETRY_DELAYS_MS.length; i += 1) {
    if (GENERAL_RETRY_DELAYS_MS[i]) await sleep(GENERAL_RETRY_DELAYS_MS[i]);
    try {
      const result = await upstreamOnce(target, method, headers, body);
      last = result;
      if (!TRANSIENT_STATUSES.has(result.status)) return {...result, attempts:i + 1};
      const bodyPreview = result.body?.toString('utf8').slice(0, 240) || '';
      console.warn(`[LUNEA proxy] Astro upstream ${result.status}; attempt ${i + 1}/${GENERAL_RETRY_DELAYS_MS.length}; ${target}; body=${bodyPreview}`);
      if (i < GENERAL_RETRY_DELAYS_MS.length - 1) {
        const extra = retryAfterMs(result.headers);
        if (extra) await sleep(extra);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[LUNEA proxy] Astro upstream network error; attempt ${i + 1}/${GENERAL_RETRY_DELAYS_MS.length}; ${target}: ${String(err?.message || err)}`);
      if (i === GENERAL_RETRY_DELAYS_MS.length - 1) throw err;
    }
  }
  if (last) return {...last, attempts:GENERAL_RETRY_DELAYS_MS.length};
  throw lastError || new Error('Astro upstream request failed');
}

async function natalUpstream(target, method, headers, body) {
  let last = null;
  for (let i=0; i<NATAL_RETRY_DELAYS_MS.length; i+=1) {
    if (NATAL_RETRY_DELAYS_MS[i]) await sleep(NATAL_RETRY_DELAYS_MS[i]);
    try {
      const result = await upstreamOnce(target, method, headers, body);
      last = result;
      if (!TRANSIENT_STATUSES.has(result.status)) return {...result, attempts:i+1};
      const bodyPreview = result.body?.toString('utf8').slice(0,240) || '';
      console.warn(`[LUNEA proxy] Natal upstream ${result.status}; attempt ${i+1}/${NATAL_RETRY_DELAYS_MS.length}; body=${bodyPreview}`);
      if (i < NATAL_RETRY_DELAYS_MS.length-1) {
        const extra = retryAfterMs(result.headers);
        if (extra) await sleep(extra);
      }
    } catch (err) {
      console.warn(`[LUNEA proxy] Natal upstream network error; attempt ${i+1}/${NATAL_RETRY_DELAYS_MS.length}: ${String(err?.message || err)}`);
      if (i === NATAL_RETRY_DELAYS_MS.length-1) throw err;
    }
  }
  return {...last, attempts:NATAL_RETRY_DELAYS_MS.length};
}

function natalKey(body) {
  return crypto.createHash('sha256').update(body || Buffer.alloc(0)).digest('hex');
}

function pruneNatalCache() {
  const now = Date.now();
  for (const [key,item] of natalCache) if (!item || now-item.at > NATAL_CACHE_TTL_MS) natalCache.delete(key);
}

function sendProxyResult(req, res, result, extraHeaders={}) {
  res.statusCode = result.status;
  for (const [key,value] of result.headers || []) {
    try { res.setHeader(key,value); } catch {}
  }
  for (const [key,value] of Object.entries(extraHeaders)) res.setHeader(key,value);
  res.setHeader('content-length', result.body.length);
  res.end(req.method === 'HEAD' ? undefined : result.body);
}

async function proxy(req, res) {
  const suffix = req.url.slice('/__lunea_api'.length) || '/';
  const target = API_ORIGIN + suffix;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = cleanProxyHeaders(req.headers);
  const method = req.method || 'GET';
  const isNatal = method === 'POST' && /^\/v1\/natal(?:\?|$)/.test(suffix);
  const isAstroV1 = /^\/v1\//.test(suffix);

  try {
    if (!isNatal) {
      const result = isAstroV1
        ? await genericAstroUpstream(target, method, headers, body)
        : await upstreamOnce(target, method, headers, body);
      return sendProxyResult(req,res,result,isAstroV1 ? {
        'x-lunea-proxy-attempts': String(result.attempts || 1),
        'x-lunea-api-origin': 'v2'
      } : {});
    }

    pruneNatalCache();
    const key = natalKey(body);
    const cached = natalCache.get(key);
    if (cached && Date.now()-cached.at <= NATAL_CACHE_TTL_MS) {
      return sendProxyResult(req,res,cached.result,{'x-lunea-natal-cache':'hit','x-lunea-proxy-attempts':'0'});
    }

    let promise = natalInflight.get(key);
    const joined = Boolean(promise);
    if (!promise) {
      promise = natalUpstream(target, method, headers, body)
        .then(result => {
          if (result.status >= 200 && result.status < 300) natalCache.set(key,{at:Date.now(),result});
          return result;
        })
        .finally(() => natalInflight.delete(key));
      natalInflight.set(key,promise);
    }

    const result = await promise;
    if (result.status < 200 || result.status >= 300) {
      const bodyPreview = result.body?.toString('utf8').slice(0,320) || '';
      console.warn(`[LUNEA proxy] Natal final upstream ${result.status}; attempts=${result.attempts || 1}; body=${bodyPreview}`);
    }
    return sendProxyResult(req,res,result,{
      'x-lunea-natal-cache': joined ? 'single-flight' : 'miss',
      'x-lunea-proxy-attempts': String(result.attempts || 1),
      'x-lunea-api-origin': 'v2'
    });
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.end(JSON.stringify({ok:false,error:'LUNEA API proxy failed',detail:String(err?.message || err)}));
  }
}

function serveFile(file, req, res) {
  fs.readFile(file, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT' && !path.extname(file)) return serveFile(path.join(ROOT,'index.html'),req,res);
      res.statusCode = 404;
      return res.end('Not found');
    }

    const ext = path.extname(file).toLowerCase();
    let out = data;
    if (ext === '.html') {
      let html = data.toString('utf8');
      if (!html.includes('luneaRenderBypassV52Bootstrap')) {
        html = html.includes('<head>') ? html.replace('<head>','<head>'+INJECT) : INJECT+html;
      }
      out = Buffer.from(html,'utf8');
    }

    if (['.html','.js','.json','.png','.jpg','.jpeg','.webp'].includes(ext)) {
      res.setHeader('cache-control','no-store, max-age=0, must-revalidate');
      res.setHeader('pragma','no-cache');
      res.setHeader('expires','0');
    } else {
      res.setHeader('cache-control','public, max-age=300');
    }

    res.statusCode = 200;
    res.setHeader('content-type',MIME[ext] || 'application/octet-stream');
    res.setHeader('content-length',out.length);
    res.setHeader('x-lunea-deploy','render-journal-astro-v52');
    res.setHeader('x-lunea-ui-build',UI_BUILD);
    res.end(req.method === 'HEAD' ? undefined : out);
  });
}

const server = http.createServer(async (req,res) => {
  const url = req.url || '/';

  if (/^\/__lunea_api\/health(?:\?|$)/.test(url)) {
    res.statusCode = 200;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.setHeader('x-lunea-ui-build',UI_BUILD);
    return res.end(JSON.stringify({ok:true,proxy:true,local_health:true,build:UI_BUILD,apiOrigin:'v2'}));
  }

  if (url.startsWith('/__lunea_api')) return proxy(req,res);

  if (url === '/__lunea_bypass_health') {
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('cache-control','no-store');
    return res.end(JSON.stringify({
      ok:true,
      build:UI_BUILD,
      proxy:true,
      apiOrigin:API_ORIGIN,
      directFixes:[
        'cardbacks-v20','timing-v16','daily-timing-v49','draft-timing-v50',
        'horary-v42','learning-auth-recovery-v2','emergency-v43','profile-natal-v45',
        'archive-timing-v47','journal-detail-v51','astro-proxy-v52'
      ],
      natalProxy:{localHealth:true,retry429:true,singleFlight:true,cacheMinutes:10},
      astroProxy:{legacyOriginRewrite:true,cleanForwardedHeaders:true,retryTransient:true}
    }));
  }

  const file = safePath(url);
  if (!file) {
    res.statusCode = 400;
    return res.end('Bad path');
  }
  fs.stat(file,(err,stat) => {
    if (!err && stat.isDirectory()) return serveFile(path.join(file,'index.html'),req,res);
    serveFile(file,req,res);
  });
});

server.listen(PORT,'0.0.0.0',() => {
  console.log(`LUNEA Render direct bypass ${UI_BUILD} listening on ${PORT}`);
});
