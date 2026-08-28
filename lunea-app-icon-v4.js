'use strict';

/* LUNEA APP ICON V4
   Uses the selected opal tarot-card artwork for Safari / Home Screen / favicon.
   Safari 26 supports SVG icons for web apps, so the image is stored as a small
   self-contained SVG asset instead of replacing the legacy PNG binary. */
(() => {
  if (window.__LUNEA_APP_ICON_V4__) return;
  window.__LUNEA_APP_ICON_V4__ = true;

  const ICON = './lunea-app-icon-v4.svg?v=4';
  const MANIFEST = './lunea-webapp-v4.webmanifest?v=4';

  function upsertLink(rel, href, attrs={}) {
    let el = document.head.querySelector(`link[data-lunea-icon-v4="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.dataset.luneaIconV4 = rel;
      document.head.appendChild(el);
    }
    el.rel = rel;
    el.href = href;
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    return el;
  }

  function install() {
    document.head.querySelectorAll('link[rel="apple-touch-icon"]').forEach(el => {
      if (!el.dataset.luneaIconV4) el.remove();
    });
    upsertLink('apple-touch-icon', ICON, {sizes:'any', type:'image/svg+xml'});
    upsertLink('icon', ICON, {sizes:'any', type:'image/svg+xml'});
    upsertLink('manifest', MANIFEST);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
  window.addEventListener('pageshow', install);
})();
