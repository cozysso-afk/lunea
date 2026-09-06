'use strict';
/* Tombstone for the poisoned V58 root-scope worker.
   NO fetch handler. NO clients.claim().
   Browser data stores (localStorage / IndexedDB) are never touched. */
const PREFIX = 'lunea-';

async function clearLuneaCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX)).map(k => caches.delete(k)));
  } catch {}
}

async function retireAndRecoverOpenClients() {
  await clearLuneaCaches();

  let windows = [];
  try {
    windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  } catch {}

  try { await self.registration.unregister(); } catch {}

  await Promise.all(windows.map(async client => {
    try {
      const url = new URL(client.url);
      if (url.origin !== self.location.origin) return;
      if (url.searchParams.get('sw_retired') !== '1') {
        url.searchParams.set('sw_retired', '1');
        url.searchParams.set('fresh', String(Date.now()));
      }
      await client.navigate(url.toString());
    } catch {}
  }));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await clearLuneaCaches();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(retireAndRecoverOpenClients());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'LUNEA_SW_SKIP_WAITING' || event.data?.type === 'LUNEA_SW_RETIRE') {
    event.waitUntil(retireAndRecoverOpenClients());
  }
});
