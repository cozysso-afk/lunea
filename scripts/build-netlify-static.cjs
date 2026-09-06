'use strict';

/*
  LUNEA Netlify static builder V3
  --------------------------------
  Keep the clean V57.1 static app (NO service worker), then port only the
  proven V57.1 browser/runtime fixes that Render previously applied at serve time:
  - hold the boot curtain until current Home Portal + Daily Orbit 6 are ready;
  - load Timing semantic artwork guards before legacy/nested loaders;
  - load V56 runtime state + V57 Thai centered date display;
  - route Astro requests through the same-origin Netlify failover proxy.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist-netlify');
const STAMP = '20260906-netlify-v57-runtime-1';

const SKIP_TOP = new Set([
  '.git', '.github', 'dist-netlify', 'netlify', 'scripts', '.vercel',
]);

function copyTree(src, dst, depth = 0) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, {recursive:true});
    for (const name of fs.readdirSync(src)) {
      if (depth === 0 && SKIP_TOP.has(name)) continue;
      copyTree(path.join(src, name), path.join(dst, name), depth + 1);
    }
    return;
  }
  fs.mkdirSync(path.dirname(dst), {recursive:true});
  fs.copyFileSync(src, dst);
}

function stampAsset(html, asset) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`${escaped}\\?v=[^"']+`, 'g'), `${asset}?v=${STAMP}`);
}

fs.rmSync(DIST, {recursive:true, force:true});
copyTree(ROOT, DIST);

// Never publish/register the experimental V58 offline shell on Netlify.
for (const stale of ['lunea-sw-register-v58.js', 'lunea-sw-v58.js']) {
  try { fs.rmSync(path.join(DIST, stale), {force:true}); } catch {}
}

const indexPath = path.join(DIST, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Give V29 enough time to wait for the current portal/orbit DOM instead of
// exposing the legacy base UI after 3.5s.
html = html.replace('},3500);', '},6500);');

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

// Same-origin API bridge. This keeps browser-side code off direct Render API
// origins and lets the Netlify function do timeout/failover handling.
const proxyBootstrap = `
<script id="luneaNetlifyApiBridgeV57">
(() => {
  if (window.__LUNEA_NETLIFY_API_BRIDGE_V57__) return;
  window.__LUNEA_NETLIFY_API_BRIDGE_V57__ = true;
  const proxyBase = location.origin + '/__lunea_api';
  const upstreamOrigins = [
    'https://lunea-astro-api-v2.onrender.com',
    'https://lunea-astro-api.onrender.com'
  ];
  try { localStorage.setItem('LUNEA_ASTRO_API_URL', proxyBase); } catch {}
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
</script>`;

if (!html.includes('luneaNetlifyApiBridgeV57')) {
  html = html.includes('<head>')
    ? html.replace('<head>', '<head>' + proxyBootstrap)
    : proxyBootstrap + html;
}

// Recreate the proven V57.1 load order. Crucially, the Timing guards execute
// before structural/nested loaders can rewrite semantic artwork filenames.
const structuralRe = /<script src="\.\/lunea-structural-routing-v4\.js\?v=[^"]+"><\/script>/;
const match = html.match(structuralRe);
if (match && !html.includes('data-lunea-netlify-v57="1"')) {
  const structural = match[0];
  const injected = [
    `<script data-lunea-netlify-v57="1" src="./lunea-boot-reveal-v29.js?v=${STAMP}"></script>`,
    `<script src="./lunea-timing-moondial-sync-v15.js?v=${STAMP}"></script>`,
    `<script src="./lunea-timing-image-assets-v16.js?v=${STAMP}"></script>`,
    `<script src="./lunea-astro-job-queue-v56.js?v=${STAMP}"></script>`,
    structural,
    `<script src="./lunea-runtime-state-v56.js?v=${STAMP}"></script>`,
    `<script src="./lunea-thai-date-display-v57.js?v=${STAMP}"></script>`,
  ].join('\n');
  html = html.replace(structural, injected);
}

fs.writeFileSync(indexPath, html, 'utf8');

// Plain transport probe remains available, but is not part of app boot.
const ping = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LUNEA ping</title><body style="font-family:-apple-system;padding:32px"><h1>LUNEA OK</h1><p>static transport test</p></body>';
fs.writeFileSync(path.join(DIST, 'ping.html'), ping, 'utf8');
fs.writeFileSync(path.join(DIST, 'lunea-netlify-build.txt'), `${STAMP}\n`, 'utf8');

console.log(`LUNEA Netlify V57.1 runtime fixes ready: ${STAMP}`);
