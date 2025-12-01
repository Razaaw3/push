importScripts(
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js'
);

// IMPORTANT: Initialize Firebase FIRST
firebase.initializeApp({
  apiKey: 'AIzaSyBtNCUWt9GwM3V73WZ6ha830BLOlbb6oak',
  authDomain: 'push-notifications-3162d.firebaseapp.com',
  projectId: 'push-notifications-3162d',
  storageBucket: 'push-notifications-3162d.firebasestorage.app',
  messagingSenderId: '296647172202',
  appId: '1:296647172202:web:6b22d6509f1a58b6b56a13',
  measurementId: 'G-86QLPD3N1P',
});

// MUST be after initializeApp
const messaging = firebase.messaging();

// Background push handler
messaging.onBackgroundMessage(function (payload) {
  console.log('📩 Received background message:', payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/next.svg',
  });
});
