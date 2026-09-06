'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 10000);
const API_ORIGIN = 'https://lunea-astro-api-v2.onrender.com';
const LEGACY_API_ORIGIN = 'https://lunea-astro-api.onrender.com';
const UI_BUILD = '20260906-0715-astro-ui-v54';
const TRANSIENT_STATUSES = new Set([408, 425, 429, 502, 503, 504]);
const READY_FRESH_MS = 4 * 60 * 1000;
const READY_DEADLINE_MS = 70 * 1000;
const PROBE_TIMEOUT_MS = 10 * 1000;
const NATAL_CACHE_TTL_MS = 10 * 60 * 1000;
const natalCache = new Map();
const natalInflight = new Map();

const ASTRO_ORIGINS = [
  {label:'v2', origin:API_ORIGIN},
  {label:'legacy', origin:LEGACY_API_ORIGIN},
];

const readyState = {
  entry: null,
  readyAt: 0,
  promise: null,
};

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

function safePath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { decoded = '/'; }
  decoded = decoded.replace(/\\/g, '/');
  const rel = decoded.replace(/^\/+/, '');
  const full = path.resolve(ROOT, rel || 'index.html');
  return full.startsWith(ROOT + path.sep) || full === path.resolve(ROOT, 'index.html') ? full : null;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
  const entry = (headers || []).find(([k]) => k.toLowerCase() === 'retry-after');
  if (!entry) return 0;
  const raw = String(entry[1] || '').trim();
  if (/^\d+(?:\.\d+)?$/.test(raw)) return Math.min(10000, Math.max(700, Number(raw) * 1000));
  const when = Date.parse(raw);
  return Number.isFinite(when) ? Math.min(10000, Math.max(700, when - Date.now())) : 0;
}

async function probeOrigin(entry) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    try { controller.abort('lunea-astro-probe-timeout'); } catch { controller.abort(); }
  }, PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(`${entry.origin}/health`, {
      method:'GET',
      cache:'no-store',
      headers:{Accept:'application/json'},
      signal:controller.signal,
    });
    if (!response.ok) return false;
    let data = null;
    try { data = await response.json(); } catch {}
    return !data || data.ok !== false;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForOrigin(entry, deadlineAt, stop = () => false) {
  let attempt = 0;
  while (Date.now() < deadlineAt && !stop()) {
    attempt += 1;
    if (await probeOrigin(entry)) return true;
    if (stop()) return false;
    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) break;
    const delay = Math.min(7000, 900 + attempt * 900, remaining);
    await sleep(delay);
  }
  return false;
}

function cacheReady(entry) {
  readyState.entry = entry;
  readyState.readyAt = Date.now();
  return entry;
}

function invalidateReady(entry) {
  if (!entry || readyState.entry?.origin === entry.origin) {
    readyState.entry = null;
    readyState.readyAt = 0;
  }
}

function readyIsFresh() {
  return Boolean(
    readyState.entry && readyState.readyAt &&
    Date.now() - readyState.readyAt < READY_FRESH_MS
  );
}

function findReadyOrigin(force = false, excludedOrigin = '') {
  if (!force && readyIsFresh() && readyState.entry.origin !== excludedOrigin) {
    return Promise.resolve(readyState.entry);
  }
  if (!force && !excludedOrigin && readyState.promise) return readyState.promise;

  const candidates = ASTRO_ORIGINS.filter(entry => entry.origin !== excludedOrigin);
  const deadlineAt = Date.now() + READY_DEADLINE_MS;
  let done = false;
  let remaining = candidates.length;

  const promise = new Promise(resolve => {
    if (!remaining) return resolve(null);
    candidates.forEach(entry => {
      (async () => {
        const ok = await waitForOrigin(entry, deadlineAt, () => done);
        if (done) return;
        if (ok) {
          done = true;
          console.info(`[LUNEA proxy] Astro backend ready: ${entry.label}`);
          return resolve(cacheReady(entry));
        }
        remaining -= 1;
        if (remaining <= 0 && !done) {
          done = true;
          resolve(null);
        }
      })().catch(() => {
        if (done) return;
        remaining -= 1;
        if (remaining <= 0) {
          done = true;
          resolve(null);
        }
      });
    });
  });

  if (!excludedOrigin) {
    readyState.promise = promise.finally(() => { readyState.promise = null; });
    return readyState.promise;
  }
  return promise;
}

async function callAstro(suffix, method, headers, body) {
  let entry = await findReadyOrigin(false);
  if (!entry) {
    const err = new Error('Astro 계산 서버를 깨우는 데 시간이 너무 오래 걸렸어. 잠시 후 다시 시도해줘.');
    err.httpStatus = 503;
    throw err;
  }

  let attempts = 0;
  let result = null;
  let lastError = null;

  for (let pass = 0; pass < 2; pass += 1) {
    attempts += 1;
    const target = `${entry.origin}${suffix}`;
    try {
      result = await upstreamOnce(target, method, headers, body);
      if (!TRANSIENT_STATUSES.has(result.status)) {
        return {...result, attempts, originLabel:entry.label};
      }
      const preview = result.body?.toString('utf8').slice(0,240) || '';
      console.warn(`[LUNEA proxy] ${entry.label} ${result.status}; ${target}; body=${preview}`);
      const extra = retryAfterMs(result.headers);
      if (extra) await sleep(extra);
    } catch (err) {
      lastError = err;
      console.warn(`[LUNEA proxy] ${entry.label} network error; ${target}: ${String(err?.message || err)}`);
    }

    invalidateReady(entry);
    if (pass === 0) {
      const alternate = await findReadyOrigin(true, entry.origin);
      if (alternate) entry = alternate;
      else {
        const recovered = await findReadyOrigin(true);
        if (recovered) entry = recovered;
      }
    }
  }

  if (result) return {...result, attempts, originLabel:entry.label};
  throw lastError || new Error('Astro upstream request failed');
}

function natalKey(body) {
  return crypto.createHash('sha256').update(body || Buffer.alloc(0)).digest('hex');
}

function pruneNatalCache() {
  const now = Date.now();
  for (const [key,item] of natalCache) {
    if (!item || now - item.at > NATAL_CACHE_TTL_MS) natalCache.delete(key);
  }
}

function sendProxyResult(req, res, result, extraHeaders = {}) {
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
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = cleanProxyHeaders(req.headers);
  const method = req.method || 'GET';
  const isNatal = method === 'POST' && /^\/v1\/natal(?:\?|$)/.test(suffix);

  try {
    if (!isNatal) {
      const result = await callAstro(suffix, method, headers, body);
      return sendProxyResult(req, res, result, {
        'x-lunea-proxy-attempts': String(result.attempts || 1),
        'x-lunea-api-origin': result.originLabel || 'unknown'
      });
    }

    pruneNatalCache();
    const key = natalKey(body);
    const cached = natalCache.get(key);
    if (cached && Date.now() - cached.at <= NATAL_CACHE_TTL_MS) {
      return sendProxyResult(req,res,cached.result,{
        'x-lunea-natal-cache':'hit',
        'x-lunea-proxy-attempts':'0',
        'x-lunea-api-origin':cached.result.originLabel || 'cache'
      });
    }

    let promise = natalInflight.get(key);
    const joined = Boolean(promise);
    if (!promise) {
      promise = callAstro(suffix, method, headers, body)
        .then(result => {
          if (result.status >= 200 && result.status < 300) natalCache.set(key,{at:Date.now(),result});
          return result;
        })
        .finally(() => natalInflight.delete(key));
      natalInflight.set(key,promise);
    }

    const result = await promise;
    return sendProxyResult(req,res,result,{
      'x-lunea-natal-cache': joined ? 'single-flight' : 'miss',
      'x-lunea-proxy-attempts': String(result.attempts || 1),
      'x-lunea-api-origin': result.originLabel || 'unknown'
    });
  } catch (err) {
    const status = Number(err?.httpStatus) || 502;
    res.statusCode = status;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('cache-control','no-store');
    res.end(JSON.stringify({
      ok:false,
      error:'LUNEA API proxy failed',
      detail:String(err?.message || err),
      build:UI_BUILD
    }));
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
    const out = data;

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
    res.setHeader('x-lunea-deploy','render-astro-ui-v54-raw-html');
    res.setHeader('x-lunea-ui-build',UI_BUILD);
    res.end(req.method === 'HEAD' ? undefined : out);
  });
}

const server = http.createServer(async (req,res) => {
  const url = req.url || '/';

  /* /__lunea_api/health is intentionally REAL backend health now. */
  if (url.startsWith('/__lunea_api')) return proxy(req,res);

  if (url === '/__lunea_bypass_health') {
    res.setHeader('content-type','application/json; charset=utf-8');
    res.setHeader('cache-control','no-store');
    return res.end(JSON.stringify({
      ok:true,
      build:UI_BUILD,
      proxy:true,
      rawHtml:true,
      apiOrigin:readyState.entry?.label || 'warming',
      directFixes:[
        'astro-proxy-v54','raw-v57.1-html'
      ],
      natalProxy:{singleFlight:true,cacheMinutes:10,backendHealth:'real'},
      astroProxy:{dualOrigin:true,coldStartWaitSeconds:70,transientFailover:true}
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
  console.log(`LUNEA Render raw V57.1 HTML + Astro proxy ${UI_BUILD} listening on ${PORT}`);
  setTimeout(() => {
    findReadyOrigin(false).catch(err => {
      console.info('[LUNEA proxy] background Astro warm pending/failed:', err?.message || err);
    });
  }, 250);
});
