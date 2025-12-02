// public/sw.js - Service Worker for Web Push Notifications
self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
    data = {
      title: 'New Notification',
      body: event.data?.text() || 'You have a new notification',
    };
  }

  const options = {
    body: data.body || 'Notification Body',
    icon: data.icon || '/next.svg',
    badge: '/next.svg',
    vibrate: [100, 50, 100],
    tag: data.tag || 'default',
    data: {
      url: data.data?.url || data.url || '/',
      userId: data.data?.userId || data.userId,
    },
    actions: data.actions || [],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Notification Title',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({type: 'window', includeUncontrolled: true})
      .then((windowClients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
