'use strict';
/* Tombstone for the poisoned V58 root-scope worker.
   This file intentionally has NO fetch handler and NO clients.claim().
   Browser data stores (localStorage / IndexedDB) are never touched. */
const PREFIX = 'lunea-';
async function retire() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX)).map(k => caches.delete(k)));
  } catch {}
  try { await self.registration.unregister(); } catch {}
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith(PREFIX)).map(k => caches.delete(k)));
    } catch {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => { event.waitUntil(retire()); });
self.addEventListener('message', event => {
  if (event.data?.type === 'LUNEA_SW_SKIP_WAITING' || event.data?.type === 'LUNEA_SW_RETIRE') event.waitUntil(retire());
});
