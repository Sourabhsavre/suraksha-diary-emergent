/* Suraksha Diary — Service Worker
   Handles: install/activate, push notifications, notification click
*/
const CACHE = 'suraksha-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'नई रिपोर्ट', body: '', urgent: false, id: '' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}
  const title = data.title || 'नई रिपोर्ट';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.urgent ? 'urgent' : 'incident',
    renotify: !!data.urgent,
    requireInteraction: !!data.urgent,
    vibrate: data.urgent ? [300, 100, 300, 100, 300] : [200],
    data: { url: `/admin?focus=${encodeURIComponent(data.id || '')}` },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
