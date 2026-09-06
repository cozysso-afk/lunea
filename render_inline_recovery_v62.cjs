'use strict';

/*
  Temporary Render-only V62 escape shim.
  Injects a self-contained cleanup script directly into index.html before any
  cached external asset can run. It removes only LUNEA Cache Storage and SW
  registrations. localStorage and IndexedDB are intentionally untouched.
*/
const fs = require('fs');
const path = require('path');

if (!global.__LUNEA_INLINE_RECOVERY_V62__) {
  global.__LUNEA_INLINE_RECOVERY_V62__ = true;
  const previousReadFile = fs.readFile.bind(fs);

  const INLINE = `<script id="luneaInlineRecoveryV62">(()=>{
    if(window.__LUNEA_INLINE_RECOVERY_V62__)return;
    window.__LUNEA_INLINE_RECOVERY_V62__=true;
    try{if(new URL(location.href).searchParams.get('lunea_inline_retired')==='1')return}catch{}
    (async()=>{
      try{
        if('caches' in window){
          const ks=await caches.keys();
          await Promise.all(ks.filter(k=>/^lunea-/i.test(k)).map(k=>caches.delete(k)));
        }
      }catch{}
      try{
        if('serviceWorker' in navigator){
          const rs=await navigator.serviceWorker.getRegistrations();
          for(const r of rs){
            try{r.waiting&&r.waiting.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}
            try{r.active&&r.active.postMessage({type:'LUNEA_SW_RETIRE'})}catch{}
            try{await r.unregister()}catch{}
          }
        }
      }catch{}
      try{
        const u=new URL(location.href);
        u.searchParams.set('lunea_inline_retired','1');
        u.searchParams.set('fresh',String(Date.now()));
        location.replace(u.toString());
      }catch{try{location.reload()}catch{}}
    })();
  })();<\/script>`;

  function patchIndex(data) {
    let html = Buffer.isBuffer(data) ? data.toString('utf8') : String(data ?? '');
    if (html.includes('luneaInlineRecoveryV62')) return Buffer.from(html, 'utf8');
    html = html.includes('<head>') ? html.replace('<head>', '<head>\n' + INLINE) : INLINE + html;
    return Buffer.from(html, 'utf8');
  }

  fs.readFile = function(file, ...args) {
    const callback = args[args.length - 1];
    if (typeof callback !== 'function') return previousReadFile(file, ...args);
    const options = args.slice(0, -1);
    return previousReadFile(file, ...options, (err, data) => {
      if (err) return callback(err, data);
      try {
        const target = typeof file === 'string' || Buffer.isBuffer(file) ? String(file) : String(file?.href || file || '');
        if (path.basename(target.split('?')[0]) === 'index.html') data = patchIndex(data);
      } catch (error) {
        console.warn('[LUNEA inline recovery V62] index patch skipped:', error?.message || error);
      }
      callback(null, data);
    });
  };

  console.info('LUNEA inline recovery V62 armed');
}
