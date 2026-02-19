const CACHE_NAME = 'gaslite-v6';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled([
        cache.add('/favicon.png'),
        cache.add('/icon-192.png'),
        cache.add('/icon-512.png'),
        cache.add('/manifest.json'),
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/ws')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'gaslite-notification',
      data: {
        url: data.url || '/',
        orderId: data.orderId || null,
        type: data.type || 'general',
      },
      vibrate: [200, 100, 200],
      requireInteraction: data.type === 'new-order',
    };

    if (data.type === 'new-order' && data.orderId) {
      options.actions = [
        { action: 'accept', title: 'Accept Order' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
      options.requireInteraction = true;
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Gaslite', options)
    );
  } catch (e) {
    console.error('Push event error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notificationData = event.notification.data || {};

  event.notification.close();

  if (action === 'accept' && notificationData.orderId) {
    event.waitUntil(
      fetch('/api/driver/accept-order/' + notificationData.orderId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
        .then((response) => {
          if (response.ok) {
            return self.registration.showNotification('Gaslite', {
              body: 'Order accepted! Open the app to start your delivery.',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'order-accepted',
              data: { url: '/' },
            }).then(() => openApp('/'));
          } else {
            return response.text().then((text) => {
              let errorMsg = 'Could not accept order — it may already be taken.';
              try { errorMsg = JSON.parse(text).error || errorMsg; } catch (_) {}
              return self.registration.showNotification('Gaslite', {
                body: errorMsg,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'order-accept-failed',
                data: { url: '/' },
              });
            });
          }
        })
        .catch(() => {
          return self.registration.showNotification('Gaslite', {
            body: 'Could not accept order. Please open the app and try again.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'order-accept-failed',
            data: { url: '/' },
          });
        })
    );
    return;
  }

  if (action === 'dismiss') {
    return;
  }

  const url = notificationData.url || '/';
  event.waitUntil(openApp(url));
});

function openApp(url) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        client.focus();
        client.navigate(url);
        return;
      }
    }
    return self.clients.openWindow(url);
  });
}
