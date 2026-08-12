// Firebase Cloud Messaging (FCM) Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyAZJ7IYlhSIA4n3ZFS6WfLUdYpYWTdE_-o",
  authDomain: "evident-quality-d40ks.firebaseapp.com",
  projectId: "evident-quality-d40ks",
  storageBucket: "evident-quality-d40ks.firebasestorage.app",
  messagingSenderId: "1082236902872",
  appId: "1:1082236902872:web:7d91416ab47f9d8693e6ad"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages when website is closed or in background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  const title = payload.notification?.title || payload.data?.title || '🚨 ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ (New Pujari Registered)';
  const body = payload.notification?.body || payload.data?.body || 'ଜଣେ ନୂଆ ପୂଜାରୀ ଆପ୍‌ରେ ପଞ୍ଜୀକୃତ ହୋଇଛନ୍ତି।';
  
  const notificationOptions = {
    body: body,
    icon: '/pwa-icon.svg',
    badge: '/pwa-icon.svg',
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/' },
    actions: [
      { action: 'open', title: 'ଦେଖନ୍ତୁ (View Admin)' }
    ]
  };

  self.registration.showNotification(title, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
