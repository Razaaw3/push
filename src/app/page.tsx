'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {requestPermissionAndGetToken} from '@/firebase/firbaseConfig';
import {listenFirebaseMessages} from '@/firebase/firbaseConfig';
import NotificationSubscribe from '@/components/NotificationSubscribe';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [stamps, setStamps] = useState('');
  const [categories, setCategories] = useState('');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔥 Request permission & get token on page load
  useEffect(() => {
    registerFCM();
  }, []);

  const registerFCM = async () => {
    const token = await requestPermissionAndGetToken();
    setFcmToken(token);

    console.log('Token received (auto): ', token);

    if (!token) {
      console.log('No token generated.');
      return;
    }

    // Foreground message listener
    listenFirebaseMessages((payload: any) => {
      console.log('Foreground Notification:', payload);

      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Notification', {
          body: payload.notification?.body || '',
          icon: '/next.svg',
        });
      }
    });
  };

  // Your backend base URL
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || 'https://914684e8ba56.ngrok-free.app';

  /* ------------------------------------------------------------------
     Register Push Token (User Clicks this Button)
  ------------------------------------------------------------------ */
  const registerPushTokenToBackend = async () => {
    if (!userId.trim()) return setError('Please enter a user ID.');
    if (!fcmToken) return setError('No FCM token generated yet.');

    try {
      setLoading('register-token');
      setError(null);

      console.log(userId, fcmToken);

      const res = await fetch(
        `https://914684e8ba56.ngrok-free.app/save-token`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId: userId.trim(),
            fcmToken,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Token registration failed');

      alert('✅ Push token registered with backend!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const sendTestPush = async () => {
    const res = await fetch(`https://914684e8ba56.ngrok-free.app/send-push`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId,
        title: '🔥 Test Push',
        body: 'This is a working push notification!',
      }),
    });
    const data = await res.json();
    console.log('Response: ', data);
  };

  /* ------------------------------------------------------------------
     APPLE WALLET CREATE
  ------------------------------------------------------------------ */
  const handleAppleWalletCreate = async () => {
    if (!userId.trim()) return setError('Please enter a user ID.');
    setError(null);
    setLoading('apple-create');

    try {
      const params = new URLSearchParams();
      if (userName.trim()) params.append('userName', userName.trim());
      if (stamps.trim()) params.append('stamps', stamps.trim());

      const url = `${API_BASE}/wallet/${encodeURIComponent(
        userId.trim()
      )}.pkpass${params.toString() ? `?${params.toString()}` : ''}`;

      window.location.href = url; // redirects for .pkpass
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const sendWebPushNotification = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID.');
      return;
    }

    try {
      setLoading('web-push');
      setError(null);

      const res = await fetch(`${API_BASE}/api/push/send`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: userId.trim(),
          title: '🔥 Test Web Push',
          body: 'This is a Web Push notification!',
          url: '/',
          tag: 'test',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send notification');

      alert(
        `✅ Web Push sent! Results: ${data.results?.sent || 0} sent, ${
          data.results?.failed || 0
        } failed`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  /* ------------------------------------------------------------------
     APPLE WALLET UPDATE
  ------------------------------------------------------------------ */
  const handleAppleWalletUpdate = async () => {
    if (!userId.trim()) return setError('Please enter a user ID.');

    setError(null);
    setLoading('apple-update');

    try {
      const payload: any = {};
      if (stamps.trim()) payload.stamps = Number(stamps.trim());
      if (userName.trim()) payload.userName = userName.trim();
      if (categories.trim()) {
        payload.categories = categories
          .split(/[,\s]+/)
          .map((c) => c.trim())
          .filter(Boolean);
      }

      if (
        !payload.stamps &&
        !payload.userName &&
        (!payload.categories || !payload.categories.length)
      ) {
        return setError(
          'Provide at least one field (stamps, userName, categories)'
        );
      }

      const res = await fetch(
        `${API_BASE}/wallet/${encodeURIComponent(userId.trim())}/update`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || 'Failed to update Apple Wallet pass');

      alert('✅ Pass will refresh shortly in Apple Wallet.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  /* ------------------------------------------------------------------
     GOOGLE WALLET CREATE / UPDATE
  ------------------------------------------------------------------ */
  const handleGoogleWallet = async (action: 'create' | 'update') => {
    if (!userId.trim()) return setError('Please enter a user ID.');
    setError(null);
    setLoading(`google-${action}`);

    try {
      const res = await fetch(
        `http://192.168.1.9:8080/google-wallet/create-loyalty-pass`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId: userId.trim(),
            stamps: stamps.trim() ? Number(stamps.trim()) : 0,
            userName: userName.trim() || undefined,
            categories: categories
              .split(/[,\s]+/)
              .map((c) => c.trim())
              .filter(Boolean),
            isUpdate: action === 'update',
            expiry:
              action === 'update'
                ? new Date(Date.now() + 7 * 86400000).toISOString()
                : undefined,
            support: 'z1@yopmail.com',
            terms: 'Terms and conditions apply.',
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (action === 'create') {
        window.location.href = data.saveUrl;
      } else {
        alert('✅ Google Wallet pass updated.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-md flex flex-col gap-6">
        <Image
          className="dark:invert mx-auto"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        {/* USER ID */}
        <div>
          <label className="text-sm font-medium">User ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="w-full rounded-md border px-3 py-2 text-sm mt-1"
          />
        </div>

        {/* USER NAME */}
        <div>
          <label className="text-sm font-medium">User Name</label>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter user name"
            className="w-full rounded-md border px-3 py-2 text-sm mt-1"
          />
        </div>

        {/* STAMPS */}
        <div>
          <label className="text-sm font-medium">Stamps (0-10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={stamps}
            onChange={(e) => setStamps(e.target.value)}
            placeholder="Enter stamps"
            className="w-full rounded-md border px-3 py-2 text-sm mt-1"
          />
        </div>

        {/* CATEGORIES */}
        <div>
          <label className="text-sm font-medium">Categories</label>
          <input
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="e.g. coffee, salon, auto"
            className="w-full rounded-md border px-3 py-2 text-sm mt-1"
          />
        </div>
        {/* WEB PUSH NOTIFICATIONS */}
        <div className="flex flex-col gap-2">
          <NotificationSubscribe userId={userId} />
          <button
            onClick={sendWebPushNotification}
            disabled={!userId.trim() || loading !== null}
            className="h-10 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60"
          >
            {loading === 'web-push'
              ? 'Sending...'
              : 'Send Test Web Push Notification'}
          </button>
        </div>

        {/* REGISTER PUSH TOKEN */}
        <button
          onClick={registerPushTokenToBackend}
          disabled={!fcmToken || !userId.trim() || loading !== null}
          className="h-10 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {loading === 'register-token'
            ? 'Registering...'
            : 'Register Push Token'}
        </button>

        <button
          onClick={sendTestPush}
          disabled={!userId.trim()}
          className="h-10 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
        >
          Send Test Push Notification
        </button>

        {/* APPLE WALLET */}
        <button
          onClick={handleAppleWalletCreate}
          disabled={!userId.trim() || loading !== null}
          className="h-10 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading === 'apple-create' ? 'Generating...' : 'Add to Apple Wallet'}
        </button>

        {/* GOOGLE WALLET CREATE */}
        <button
          onClick={() => handleGoogleWallet('create')}
          disabled={!userId.trim() || loading !== null}
          className="h-10 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading === 'google-create'
            ? 'Generating...'
            : 'Add to Google Wallet'}
        </button>

        {/* APPLE UPDATE */}
        <button
          onClick={handleAppleWalletUpdate}
          disabled={!userId.trim() || loading !== null}
          className="h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading === 'apple-update' ? 'Updating...' : 'Update Apple Pass'}
        </button>

        {/* GOOGLE UPDATE */}
        <button
          onClick={() => handleGoogleWallet('update')}
          disabled={!userId.trim() || loading !== null}
          className="h-10 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60"
        >
          {loading === 'google-update' ? 'Updating...' : 'Update Google Pass'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}
