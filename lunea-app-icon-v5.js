'use strict';

/* LUNEA APP ICON V5
   iOS/Safari 26 fix:
   - direct PNG data URL icon (no nested raster inside SVG)
   - installs immediately so Add to Home Screen can resolve it
   - replaces legacy apple-touch-icon / favicon / manifest links
*/
(() => {
  if (window.__LUNEA_APP_ICON_V5__) return;
  window.__LUNEA_APP_ICON_V5__ = true;

  const ICON = "DATA_PLACEHOLDER";
  const title = 'LUNEA';

  function addLink(rel, href, attrs={}) {
    const el = document.createElement('link');
    el.rel = rel;
    el.href = href;
    el.dataset.luneaIconV5 = '1';
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    document.head.appendChild(el);
    return el;
  }

  function install() {
    document.head.querySelectorAll('link[rel="apple-touch-icon"], link[rel="icon"], link[rel="manifest"]').forEach(el => {
      if (!el.dataset.luneaIconV5) el.remove();
    });

    addLink('apple-touch-icon', ICON, {sizes:'256x256', type:'image/png'});
    addLink('icon', ICON, {sizes:'256x256', type:'image/png'});

    const manifest = {
      name: title,
      short_name: title,
      start_url: './',
      display: 'standalone',
      background_color: '#070916',
      theme_color: '#0b1024',
      icons: [{src: ICON, sizes:'256x256', type:'image/png', purpose:'any maskable'}]
    };
    try {
      const blob = new Blob([JSON.stringify(manifest)], {type:'application/manifest+json'});
      const url = URL.createObjectURL(blob);
      addLink('manifest', url);
    } catch (_) {}

    let meta = document.head.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(meta);
    }
    meta.content = title;
  }

  install();
  window.addEventListener('pageshow', install);
  console.info('✨ LUNEA App Icon V5 loaded · direct PNG data icon');
})();
