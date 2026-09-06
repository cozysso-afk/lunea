'use strict';

/* LUNEA V61 retirement worker.
   This exists only so devices still holding the broken V58 registration can
   update to a worker that deletes LUNEA Cache Storage, releases control, and
   sends open clients back to the normal app once. No offline shell remains.
*/
const PREFIX = 'lunea-';
const RESET_URL = '/?lunea_sw_retired=1';

async function deleteLuneaCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX)).map(k => caches.delete(k)));
  } catch {}
}

async function releaseClients() {
  await deleteLuneaCaches();
  try { await self.clients.claim(); } catch {}
  let windows = [];
  try { windows = await self.clients.matchAll({type:'window', includeUncontrolled:true}); } catch {}
  try { await self.registration.unregister(); } catch {}
  await Promise.allSettled(windows.map(client => {
    try { return client.navigate(RESET_URL + '&t=' + Date.now()); } catch { return null; }
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(releaseClients());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request, {cache:'no-store'}));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'LUNEA_SW_RETIRE' || event.data?.type === 'LUNEA_SW_SKIP_WAITING') {
    event.waitUntil(releaseClients());
  }
});
