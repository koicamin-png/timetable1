// Service Worker for Push Notifications - 대진전자통신고등학교 과제 알리미
const CACHE_NAME = 'daejin-planner-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event listener
self.addEventListener('push', (event) => {
  let data = {
    title: '과제 마감 알림',
    body: '제출 마감 시간이 임박한 과제가 있습니다.',
    icon: '/icon-192.png',
    badge: '/badge.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    actions: [
      { action: 'open', title: '과제 확인하기' },
      { action: 'close', title: '닫기' }
    ],
    tag: data.tag || 'assignment-alert',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
