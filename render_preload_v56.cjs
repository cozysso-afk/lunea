'use strict';

/*
  LUNEA RENDER PRELOAD V56
  ------------------------
  Loaded with NODE_OPTIONS before render_frontend_server.cjs. It only patches
  index.html reads so the canonical iOS/PWA origin receives cache-busted V56
  state guards before the legacy structural queue can install.
*/
const fs = require('fs');
const path = require('path');

if (!global.__LUNEA_RENDER_PRELOAD_V56__) {
  global.__LUNEA_RENDER_PRELOAD_V56__ = true;

  const STAMP = '20260906-0805-render-v56';
  const originalReadFile = fs.readFile.bind(fs);

  function stampAsset(html, asset) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return html.replace(new RegExp(`${escaped}\\?v=[^"']+`, 'g'), `${asset}?v=${STAMP}`);
  }

  function patchIndex(data) {
    let html = Buffer.isBuffer(data) ? data.toString('utf8') : String(data ?? '');

    for (const asset of [
      'lunea-cache-refresh-v1.js',
      'lunea-structural-routing-v4.js',
      'astro-transit-v1.js',
      'astro-return-v1.js',
      'thai-taksa-v1.js',
      'lunea-astro-stability-v2.js',
      'lunea-ios-performance-v3.js',
    ]) {
      html = stampAsset(html, asset);
    }

    const structuralRe = /<script src="\.\/lunea-structural-routing-v4\.js\?v=[^"]+"><\/script>/;
    const match = html.match(structuralRe);
    if (match && !html.includes('lunea-astro-job-queue-v56.js')) {
      const structural = match[0];
      const injected = [
        `<script src="./lunea-astro-job-queue-v56.js?v=${STAMP}"></script>`,
        structural,
        `<script src="./lunea-runtime-state-v56.js?v=${STAMP}"></script>`,
        `<script src="./lunea-thai-date-center-v54.js?v=${STAMP}"></script>`,
      ].join('\n');
      html = html.replace(structural, injected);
    }

    return Buffer.from(html, 'utf8');
  }

  fs.readFile = function(file, ...args) {
    const callback = args[args.length - 1];
    if (typeof callback !== 'function') return originalReadFile(file, ...args);
    const options = args.slice(0, -1);

    return originalReadFile(file, ...options, (err, data) => {
      if (err) return callback(err, data);
      try {
        const target = typeof file === 'string' || Buffer.isBuffer(file) ? String(file) : String(file?.href || file || '');
        if (path.basename(target.split('?')[0]) === 'index.html') data = patchIndex(data);
      } catch (patchError) {
        console.warn('[LUNEA preload V56] index patch skipped:', patchError?.message || patchError);
      }
      callback(null, data);
    });
  };

  console.info(`LUNEA Render preload V56 armed · ${STAMP}`);
}
