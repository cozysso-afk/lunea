'use strict';

/*
  LUNEA Netlify static builder V1
  --------------------------------
  Goal: reproduce the exact V57.1 Render-served UI as static files.
  It deliberately does NOT install a service worker or an offline app shell.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist-netlify');
const STAMP = '20260906-1057-render-v57-1';
const UI_BUILD = '20260906-0715-astro-ui-v54';
const API_ORIGIN = 'https://lunea-astro-api-v2.onrender.com';
const LEGACY_API_ORIGIN = 'https://lunea-astro-api.onrender.com';

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

function applyV57Preload(html) {
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
  return html;
}

const HEAD_INJECT = `
<script id="luneaRenderPreBootV54">
(() => {
  const root = document.documentElement;
  root.classList.add('lunea-booting');
  if (!window.__LUNEA_BOOT_STARTED__) window.__LUNEA_BOOT_STARTED__ = performance.now();
  window.__LUNEA_RENDER_CANONICAL__ = true;
  window.__LUNEA_STATIC_HOST__ = 'netlify-v1';
})();
</script>
<style id="luneaRenderPreBootV54Style">
html.lunea-booting,html.lunea-booting body{background:#060713!important;overflow:hidden!important}
html.lunea-booting body>*{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
html.lunea-booting body::before{content:'';position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:radial-gradient(circle at 50% 43%,rgba(205,190,255,.16) 0 7%,transparent 23%),radial-gradient(circle at 50% 46%,rgba(112,222,213,.075),transparent 34%),linear-gradient(180deg,#080a18 0%,#090918 52%,#050610 100%)}
html.lunea-booting body::after{content:'☾  L U N E A';position:fixed;left:50%;top:46%;z-index:2147483001;transform:translate(-50%,-50%);pointer-events:none;white-space:nowrap;color:#f4efff;font:600 18px/1.2 Georgia,'Times New Roman',serif;letter-spacing:5px;text-shadow:0 0 22px rgba(204,187,255,.42),0 0 36px rgba(108,220,211,.14)}
</style>
<meta name="lunea-render-build" content="${UI_BUILD}">
<meta name="lunea-static-host" content="netlify-v1">
<script id="luneaRenderBypassV54Bootstrap">
(() => {
  const proxyBase = location.origin + '/__lunea_api';
  const upstreamOrigins = ['${API_ORIGIN}', '${LEGACY_API_ORIGIN}'];
  try { localStorage.setItem('LUNEA_ASTRO_API_URL', proxyBase); } catch {}
  window.__LUNEA_RENDER_BYPASS_V52__ = '${UI_BUILD}';
  window.__LUNEA_RENDER_BYPASS_V54__ = '${UI_BUILD}';
  window.__LUNEA_RENDER_CANONICAL__ = true;
  window.__LUNEA_STATIC_HOST__ = 'netlify-v1';
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

fs.rmSync(DIST, {recursive:true, force:true});
copyTree(ROOT, DIST);

const indexPath = path.join(DIST, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = applyV57Preload(html);
if (!html.includes('luneaRenderBypassV54Bootstrap')) {
  html = html.includes('<head>') ? html.replace('<head>', '<head>' + HEAD_INJECT) : HEAD_INJECT + html;
}
fs.writeFileSync(indexPath, html, 'utf8');

// Never publish the broken V58 registration helper into the static app.
for (const stale of ['lunea-sw-register-v58.js']) {
  try { fs.rmSync(path.join(DIST, stale), {force:true}); } catch {}
}

console.log(`LUNEA Netlify static build ready: ${STAMP}`);
