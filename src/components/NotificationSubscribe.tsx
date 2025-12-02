// components/NotificationSubscribe.tsx
'use client';

import {useState, useEffect} from 'react';

const VAPID_PUBLIC_KEY =
  'BD-IbjQUFiG1Cr0MVPcnaH33r1YX1miuf1XAwZXtDeb4DymjV1XBVQpu0MQutySRtH67RAC7iPvzqfJIyUTldus';

// Backend API base URL - update this to match your backend
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://914684e8ba56.ngrok-free.app';

interface NotificationSubscribeProps {
  userId?: string;
}

export default function NotificationSubscribe({
  userId,
}: NotificationSubscribeProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    alert('serviceWorker' in navigator && 'PushManager' in window);
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      alert(registration);
      const subscription = await registration.pushManager.getSubscription();
      alert(subscription);
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = async () => {
    if (!userId || !userId.trim()) {
      alert('Please enter a User ID first before subscribing to notifications');
      return;
    }

    try {
      setIsLoading(true);

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to backend with userId
      const response = await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: userId.trim(),
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register subscription');
      }

      setIsSubscribed(true);
      alert('✅ Successfully subscribed to Web Push notifications!');
    } catch (error: any) {
      console.error('Error subscribing:', error);
      alert(`Failed to subscribe: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify backend about unsubscription
        const response = await fetch(`${API_BASE}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            userId: userId?.trim(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to unsubscribe');
        }

        setIsSubscribed(false);
        alert('✅ Successfully unsubscribed from notifications!');
      }
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      alert(`Failed to unsubscribe: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Push notifications are not supported in this browser
      </div>
    );
  }

  return (
    <div>
      {isSubscribed ? (
        <button
          onClick={unsubscribe}
          disabled={isLoading}
          className="h-10 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60 w-full"
        >
          {isLoading ? 'Unsubscribing...' : 'Disable Web Push Notifications'}
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={isLoading || !userId || !userId.trim()}
          className="h-10 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 w-full"
        >
          {isLoading ? 'Subscribing...' : 'Enable Web Push Notifications'}
        </button>
      )}
      {!userId || !userId.trim() ? (
        <p className="text-xs text-gray-500 mt-1">
          Enter User ID to enable notifications
        </p>
      ) : null}
    </div>
  );
}
