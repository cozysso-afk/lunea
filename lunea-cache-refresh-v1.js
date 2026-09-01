'use strict';

/*
  LUNEA Cache Refresh V1
  Keeps the iOS home-screen web app from staying on a stale GitHub Pages build.
  It compares the build stamp embedded in index.html with a no-store build file.
  If a newer build exists, it reloads once with a versioned URL so the browser
  must request the fresh HTML and versioned loader assets.

  The build-stamped entry point also loads tiny UI hotfixes whose own cache key
  must follow the current build (currently the mobile journal header entry).
*/
(() => {
  if (window.__LUNEA_CACHE_REFRESH_V1__) return;
  window.__LUNEA_CACHE_REFRESH_V1__ = true;

  const BUILD_FILE = './lunea-build.json';
  const SELF_BUILD = (() => {
    try {
      const src = document.currentScript?.src || '';
      return src ? (new URL(src, location.href).searchParams.get('v') || '') : '';
    } catch {
      return '';
    }
  })();

  function currentPageBuild() {
    try {
      const script = [...document.scripts].find(s => /lunea-structural-routing-v4\.js/i.test(s.src || ''));
      if (!script?.src) return '';
      return new URL(script.src, location.href).searchParams.get('v') || '';
    } catch {
      return '';
    }
  }

  function loadJournalHeaderFix() {
    if (document.getElementById('luneaJournalHeaderFixLoader')) return;
    const script = document.createElement('script');
    script.id = 'luneaJournalHeaderFixLoader';
    script.src = `./lunea-journal-header-fix-v1.js?v=${encodeURIComponent(SELF_BUILD || Date.now())}`;
    script.async = false;
    script.onerror = () => console.info('[LUNEA cache refresh] journal header fix skipped');
    (document.head || document.documentElement).appendChild(script);
  }

  function refreshTo(build) {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('lunea_v') === build) return;
      url.searchParams.set('lunea_v', build);
      url.searchParams.set('fresh', String(Date.now()));
      location.replace(url.toString());
    } catch {
      location.reload();
    }
  }

  async function checkBuild() {
    try {
      const res = await fetch(`${BUILD_FILE}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {'cache-control':'no-cache'}
      });
      if (!res.ok) return;
      const data = await res.json();
      const remote = String(data?.version || '').trim();
      if (!remote) return;

      const embedded = currentPageBuild();
      if (embedded && embedded !== remote) {
        refreshTo(remote);
      }
    } catch (err) {
      console.info('[LUNEA cache refresh] skipped', err?.message || err);
    }
  }

  function boot() {
    loadJournalHeaderFix();
    checkBuild();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
