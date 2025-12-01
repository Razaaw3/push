// firebase/firebase-config.js
import {initializeApp} from 'firebase/app';
import {getMessaging, getToken, onMessage} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyBtNCUWt9GwM3V73WZ6ha830BLOlbb6oak',
  authDomain: 'push-notifications-3162d.firebaseapp.com',
  projectId: 'push-notifications-3162d',
  storageBucket: 'push-notifications-3162d.firebasestorage.app',
  messagingSenderId: '296647172202',
  appId: '1:296647172202:web:6b22d6509f1a58b6b56a13',
  measurementId: 'G-86QLPD3N1P',
};

const app = initializeApp(firebaseConfig);
export const messaging =
  typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestPermissionAndGetToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    alert('Permission: ', permission);
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    alert('Permission: ', token);
    return token;
  } catch (err) {
    console.error('FCM Token Error:', err);
    return null;
  }
};

// Listen foreground messages
export const listenFirebaseMessages = (callback) => {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};
