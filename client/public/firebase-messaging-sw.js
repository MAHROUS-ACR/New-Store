// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase with default config (will be passed from client)
let firebaseApp;
let messaging;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle incoming messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE') {
    const config = event.data.config;
    console.log('Initializing Firebase in Service Worker with config:', config);
    
    firebaseApp = firebase.initializeApp(config);
    messaging = firebase.messaging(firebaseApp);
    console.log('✅ Firebase initialized in Service Worker');
  }
});

// Handle background messages (when app is closed)
if (firebase.messaging.isSupported()) {
  const getMessaging = () => {
    if (!messaging) {
      firebaseApp = firebase.initializeApp();
      messaging = firebase.messaging(firebaseApp);
    }
    return messaging;
  };

  getMessaging().onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'Flux Wallet';
    const notificationOptions = {
      body: payload.notification?.body,
      icon: payload.notification?.icon || '/favicon.png',
      badge: '/favicon.png',
      tag: payload.data?.orderId || 'notification',
      data: payload.data,
      click_action: payload.data?.click_action || '/',
      requireInteraction: true,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Handle notification clicks
  self.addEventListener('click', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();
    
    const urlToOpen = event.notification.data?.click_action || '/';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  });
}
