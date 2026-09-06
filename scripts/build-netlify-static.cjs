'use strict';

/*
  LUNEA Netlify static builder V2
  --------------------------------
  Serve the repository's V57.1 app files as-is.
  Do NOT reproduce Render's synchronous preboot/head injection here:
  that extra blocking layer is the current suspect for Safari's white screen.
  No service worker or offline shell is installed.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist-netlify');
const STAMP = '20260906-1057-render-v57-1-raw';

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

fs.rmSync(DIST, {recursive:true, force:true});
copyTree(ROOT, DIST);

// Safety: never publish the V58 registration helper into the clean static app.
for (const stale of ['lunea-sw-register-v58.js', 'lunea-sw-v58.js']) {
  try { fs.rmSync(path.join(DIST, stale), {force:true}); } catch {}
}

// Keep a plain transport probe available for diagnostics.
const ping = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LUNEA ping</title><body style="font-family:-apple-system;padding:32px"><h1>LUNEA OK</h1><p>static transport test</p></body>';
fs.writeFileSync(path.join(DIST, 'ping.html'), ping, 'utf8');

// Marker only; index.html itself is intentionally left byte-for-byte as copied.
fs.writeFileSync(path.join(DIST, 'lunea-netlify-build.txt'), `${STAMP}\n`, 'utf8');

console.log(`LUNEA Netlify raw V57.1 build ready: ${STAMP}`);
