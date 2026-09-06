'use strict';

/*
  LUNEA Netlify static builder V3
  --------------------------------
  Publish the stable V57.1 frontend with the SAME synchronous script ordering
  that the working Render preload applied to index.html, but do it once at
  build time. No service worker and no offline shell are published.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist-netlify');
const STAMP = '20260906-netlify-v57-static3';

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stampAsset(html, asset) {
  const escaped = escapeRegExp(asset);
  return html.replace(new RegExp(`${escaped}\\?v=[^"']+`, 'g'), `${asset}?v=${STAMP}`);
}

function patchStableV57Index(indexPath) {
  let html = fs.readFileSync(indexPath, 'utf8');

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

  // Match the stable V57.1 boot window used before the V58 incident.
  html = html.replace('},3500);', '},6500);');

  const structuralRe = /<script src="\.\/lunea-structural-routing-v4\.js\?v=[^"]+"><\/script>/;
  const match = html.match(structuralRe);
  if (!match) throw new Error('Netlify V57 build aborted: structural V4 script marker missing');

  if (!html.includes('data-lunea-netlify-v57="1"')) {
    const structural = match[0];
    const injected = [
      `<script data-lunea-netlify-v57="1" src="./lunea-netlify-astro-route-v57.js?v=${STAMP}"></script>`,
      `<script src="./lunea-boot-reveal-v29.js?v=${STAMP}"></script>`,
      `<script src="./lunea-timing-moondial-sync-v15.js?v=${STAMP}"></script>`,
      `<script src="./lunea-timing-image-assets-v16.js?v=${STAMP}"></script>`,
      `<script src="./lunea-astro-job-queue-v56.js?v=${STAMP}"></script>`,
      structural,
      `<script src="./lunea-runtime-state-v56.js?v=${STAMP}"></script>`,
      `<script src="./lunea-thai-date-display-v57.js?v=${STAMP}"></script>`,
    ].join('\n');
    html = html.replace(structural, injected);
  }

  const required = [
    'data-lunea-netlify-v57="1"',
    `lunea-boot-reveal-v29.js?v=${STAMP}`,
    `lunea-timing-moondial-sync-v15.js?v=${STAMP}`,
    `lunea-timing-image-assets-v16.js?v=${STAMP}`,
    `lunea-astro-job-queue-v56.js?v=${STAMP}`,
    `lunea-structural-routing-v4.js?v=${STAMP}`,
    `lunea-runtime-state-v56.js?v=${STAMP}`,
    `lunea-thai-date-display-v57.js?v=${STAMP}`,
  ];
  for (const token of required) {
    if (!html.includes(token)) throw new Error(`Netlify V57 build aborted: missing ${token}`);
  }
  if (html.includes('},3500);')) throw new Error('Netlify V57 build aborted: old 3.5s boot gate remains');

  fs.writeFileSync(indexPath, html, 'utf8');
}

fs.rmSync(DIST, {recursive:true, force:true});
copyTree(ROOT, DIST);

// Safety: never publish the poisoned V58 registration helper/worker.
for (const stale of ['lunea-sw-register-v58.js', 'lunea-sw-v58.js']) {
  try { fs.rmSync(path.join(DIST, stale), {force:true}); } catch {}
}

patchStableV57Index(path.join(DIST, 'index.html'));

const ping = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LUNEA ping</title><body style="font-family:-apple-system;padding:32px"><h1>LUNEA OK</h1><p>static transport test</p></body>';
fs.writeFileSync(path.join(DIST, 'ping.html'), ping, 'utf8');
fs.writeFileSync(path.join(DIST, 'lunea-netlify-build.txt'), `${STAMP}\n`, 'utf8');

console.log(`LUNEA Netlify stable V57.1 static build ready: ${STAMP}`);
