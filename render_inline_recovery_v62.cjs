'use strict';

/*
  Temporary Render-only V62 escape shim.
  Phase 1 clears only LUNEA Cache Storage + service-worker registrations.
  Phase 2, on the fresh recovery navigation, guarantees the current home UI
  can finish booting before the curtain is released.
  localStorage and IndexedDB are intentionally untouched.
*/
const fs = require('fs');
const path = require('path');

if (!global.__LUNEA_INLINE_RECOVERY_V62__) {
  global.__LUNEA_INLINE_RECOVERY_V62__ = true;
  const previousReadFile = fs.readFile.bind(fs);

  const INLINE = `<script id="luneaInlineRecoveryV62">(()=>{
    if(window.__LUNEA_INLINE_RECOVERY_V62__)return;
    window.__LUNEA_INLINE_RECOVERY_V62__=true;

    const root=document.documentElement;
    let recovered=false;
    try{recovered=new URL(location.href).searchParams.get('lunea_inline_retired')==='1'}catch{}

    const reveal=()=>{
      try{clearTimeout(window.__LUNEA_BOOT_FAILSAFE__)}catch{}
      root.classList.remove('lunea-booting');
      root.classList.add('lunea-ui-ready');
    };
    const finalReady=()=>!!(
      (document.querySelector('#luneaHomePortalV8 .lunea-v8-tile')||document.querySelector('.lunea-v8-grid .lunea-v8-tile')) &&
      document.querySelector('.daily.lunea-daily-orbit6 .lunea-v22-sky') &&
      document.querySelector('.daily.lunea-daily-orbit6 .lunea-v22-title-panel')
    );
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const load=(src,id)=>new Promise(resolve=>{
      if(document.getElementById(id))return resolve();
      const s=document.createElement('script');
      s.id=id;
      s.src=src+(src.includes('?')?'&':'?')+'recovery_v62='+Date.now();
      s.async=false;
      s.onload=()=>resolve();
      s.onerror=()=>resolve();
      (document.head||document.documentElement).appendChild(s);
    });

    if(!recovered){
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
      return;
    }

    const rescue=async()=>{
      /* Let the normal stable loader win first. */
      for(let i=0;i<12;i++){
        if(finalReady()){reveal();return;}
        await sleep(100);
      }

      /* Only current-home visual modules; all are guarded against duplicate install. */
      const critical=[
        ['./lunea-luminous-theme-v1.js','luneaRecoveryThemeV62'],
        ['./lunea-luminous-layout-v2.js','luneaRecoveryLayoutV62'],
        ['./lunea-luminous-polish-v3.js','luneaRecoveryPolishV62'],
        ['./lunea-top-spacing-v4.js','luneaRecoverySpacingV62'],
        ['./lunea-daily-lock-v1.js','luneaRecoveryDailyLockV62'],
        ['./lunea-home-portal-v8.js','luneaRecoveryHomePortalV62'],
        ['./lunea-home-timing-polish-v9.js','luneaRecoveryHomePolishV62'],
        ['./lunea-category-art-v10.js','luneaRecoveryCategoryArtV62'],
        ['./lunea-opal-light-polish-v13.js','luneaRecoveryOpalV62'],
        ['./lunea-daily-orbit6-v21.js','luneaRecoveryDailyOrbitV62'],
        ['./lunea-daily-celestial-v22.js','luneaRecoveryDailyCelestialV62'],
        ['./lunea-sector-color-system-v28.js','luneaRecoverySectorColorV62'],
        ['./lunea-boot-reveal-v29.js','luneaRecoveryBootRevealV62']
      ];
      for(const [src,id] of critical) await load(src,id);

      for(let i=0;i<40;i++){
        if(finalReady()){
          try{window.LUNEA_BOOT_REVEAL_V29&&window.LUNEA_BOOT_REVEAL_V29()}catch{}
          reveal();
          return;
        }
        await sleep(100);
      }
    };

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{rescue()},{once:true});
    else rescue();
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
