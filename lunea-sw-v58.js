'use strict';

/* LUNEA V61 silent retirement worker.
   No fetch interception, no client navigation, no offline shell.
   It only deletes LUNEA Cache Storage and unregisters itself.
*/
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
  event.waitUntil(retire());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'LUNEA_SW_RETIRE' || event.data?.type === 'LUNEA_SW_SKIP_WAITING') {
    event.waitUntil(retire());
  }
});
