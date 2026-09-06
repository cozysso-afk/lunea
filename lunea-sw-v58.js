'use strict';

/* V60 retirement worker for the broken V58 shell. */
const PREFIX = 'lunea-';

async function retire() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX)).map(k => caches.delete(k)));
  } catch {}
  try { await self.registration.unregister(); } catch {}
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try { await self.clients.claim(); } catch {}
    await retire();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request, {cache:'no-store'}));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'LUNEA_SW_RETIRE' || event.data?.type === 'LUNEA_SW_SKIP_WAITING') {
    event.waitUntil(retire());
  }
});
