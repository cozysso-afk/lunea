'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 10000);
const API_ORIGIN = 'https://lunea-astro-api.onrender.com';
const UI_BUILD = '20260905-2240-emergency-v43';

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

/*
 * IMPORTANT: correctness-critical scripts are deliberately injected directly
 * into the Render HTML instead of depending on the legacy cache-refresh chain.
 * This keeps the bypass self-contained for stale iOS Home Screen sessions.
 */
const INJECT = `
<meta name="lunea-render-build" content="${UI_BUILD}">
<script id="luneaRenderBypassV42Bootstrap">
(() => {
  const proxyBase = location.origin + '/__lunea_api';
  try { localStorage.setItem('LUNEA_ASTRO_API_URL', proxyBase); } catch {}
  window.__LUNEA_RENDER_BYPASS_V42__ = '${UI_BUILD}';
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      const raw = typeof input === 'string' ? input : (input && input.url) || '';
      if (raw.startsWith('${API_ORIGIN}')) {
        const target = proxyBase + raw.slice('${API_ORIGIN}'.length);
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
<script src="./lunea-horary-mobile-stability-v42.js?v=${UI_BUILD}" data-lunea-render-direct="horary"></script>
<script src="./lunea-learning-auth-recovery-v2.js?v=${UI_BUILD}" data-lunea-render-direct="learning-auth"></script>
<script src="./lunea-emergency-repair-v43.js?v=${UI_BUILD}" data-lunea-render-direct="emergency-v43"></script>`;

function safePath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { decoded = '/'; }
  decoded = decoded.replace(/\\/g, '/');
  const rel = decoded.replace(/^\/+/, '');
  const full = path.resolve(ROOT, rel || 'index.html');
  return full.startsWith(ROOT + path.sep) || full === path.resolve(ROOT, 'index.html') ? full : null;
}

async function proxy(req, res) {
  const suffix = req.url.slice('/__lunea_api'.length) || '/';
  const target = API_ORIGIN + suffix;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.origin;
  delete headers.referer;
  delete headers['content-length'];
  delete headers.connection;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
      redirect: 'follow',
    });
    const out = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    res.setHeader('content-length', out.length);
    res.end(req.method === 'HEAD' ? undefined : out);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'LUNEA API proxy failed', detail: String(err && err.message || err) }));
  }
}

function serveFile(file, req, res) {
  fs.readFile(file, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT' && !path.extname(file)) return serveFile(path.join(ROOT, 'index.html'), req, res);
      res.statusCode = 404;
      return res.end('Not found');
    }

    const ext = path.extname(file).toLowerCase();
    let out = data;
    if (ext === '.html') {
      let html = data.toString('utf8');
      if (!html.includes('luneaRenderBypassV42Bootstrap')) {
        html = html.includes('<head>') ? html.replace('<head>', '<head>' + INJECT) : INJECT + html;
      }
      out = Buffer.from(html, 'utf8');
    }

    if (['.html', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      res.setHeader('cache-control', 'no-store, max-age=0, must-revalidate');
      res.setHeader('pragma', 'no-cache');
      res.setHeader('expires', '0');
    } else {
      res.setHeader('cache-control', 'public, max-age=300');
    }

    res.statusCode = 200;
    res.setHeader('content-type', MIME[ext] || 'application/octet-stream');
    res.setHeader('content-length', out.length);
    res.setHeader('x-lunea-deploy', 'render-v43-emergency-bypass');
    res.setHeader('x-lunea-ui-build', UI_BUILD);
    res.end(req.method === 'HEAD' ? undefined : out);
  });
}

const server = http.createServer(async (req, res) => {
  if ((req.url || '').startsWith('/__lunea_api')) return proxy(req, res);
  if (req.url === '/__lunea_bypass_health') {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    return res.end(JSON.stringify({ ok: true, build: UI_BUILD, proxy: true, directFixes: ['cardbacks-v20','timing-v16','horary-v42','learning-auth-recovery-v2','emergency-v43'] }));
  }

  const file = safePath(req.url || '/');
  if (!file) {
    res.statusCode = 400;
    return res.end('Bad path');
  }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) return serveFile(path.join(file, 'index.html'), req, res);
    serveFile(file, req, res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LUNEA Render direct bypass ${UI_BUILD} listening on ${PORT}`);
});