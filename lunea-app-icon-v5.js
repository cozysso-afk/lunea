'use strict';

/* LUNEA APP ICON V5
   Safari/iOS 26 Home Screen fix.
   Uses a pure SVG icon (no nested raster subresource), installs immediately,
   and removes the broken V4 icon links before Add to Home Screen reads them.
*/
(() => {
  if (window.__LUNEA_APP_ICON_V5__) return;
  window.__LUNEA_APP_ICON_V5__ = true;

  const ICON = './lunea-app-icon-v5.svg?v=5';
  const TITLE = 'LUNEA';

  function link(rel, href, attrs={}) {
    const el=document.createElement('link');
    el.rel=rel; el.href=href; el.dataset.luneaIconV5='1';
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    document.head.appendChild(el);
    return el;
  }

  function install(){
    document.head.querySelectorAll('link[rel="apple-touch-icon"],link[rel="icon"],link[rel="manifest"]').forEach(el=>{
      if(!el.dataset.luneaIconV5) el.remove();
    });

    link('apple-touch-icon',ICON,{sizes:'any',type:'image/svg+xml'});
    link('icon',ICON,{sizes:'any',type:'image/svg+xml'});

    try{
      const manifest={name:TITLE,short_name:TITLE,start_url:'./',display:'standalone',background_color:'#070916',theme_color:'#0b1024',icons:[{src:ICON,sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]};
      link('manifest',URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'})));
    }catch(_){ }

    let meta=document.head.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(!meta){meta=document.createElement('meta');meta.name='apple-mobile-web-app-title';document.head.appendChild(meta)}
    meta.content=TITLE;
  }

  install();
  window.addEventListener('pageshow',install);
  console.info('✨ LUNEA App Icon V5 loaded · pure SVG Home Screen icon');
})();
