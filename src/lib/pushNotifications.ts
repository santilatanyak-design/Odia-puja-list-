import { StoreOrder } from '../types';

const FCM_TOKEN_KEY = 'puja_fcm_token';

/**
 * Register Service Worker & Request Notification Permission
 */
export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Web Push notifications not supported in this browser environment.');
    return null;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.log('Push Notification Service Worker registered successfully:', registration);

    // 2. Request User Permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Notification permission was denied or dismissed.');
      return null;
    }

    // 3. Generate or retrieve push token
    let token = localStorage.getItem(FCM_TOKEN_KEY);
    if (!token) {
      token = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(FCM_TOKEN_KEY, token);
    }

    return token;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return null;
  }
}

/**
 * Admin Trigger: Send Web Push Notification for Order Approval
 * Title: "Order Approved!"
 * Body: "Your order for [Item Names] has been approved and is being processed."
 */
export async function sendOrderApprovedPushNotification(order: StoreOrder): Promise<boolean> {
  const itemNames = order.items && order.items.length > 0
    ? order.items.map((i) => i.productName).join(', ')
    : 'Puja Samagri Items';

  const title = 'Order Approved!';
  const body = `Your order for ${itemNames} has been approved and is being processed.`;

  console.log(`[Push Notification Trigger] Order #${order.id} Approved! Target Token: ${order.fcmToken || 'Local Device'}`);

  try {
    // 1. Service Worker Background Notification Trigger
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-icon.svg',
          badge: '/pwa-icon.svg',
          vibrate: [200, 100, 200, 100, 200],
          data: { orderId: order.id, url: '/' },
        } as NotificationOptions);
        console.log('Background Service Worker notification displayed successfully.');
        return true;
      }
    }

    // 2. Fallback Browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-icon.svg',
        badge: '/pwa-icon.svg',
      });
      return true;
    }
  } catch (err) {
    console.warn('Failed to dispatch push notification locally:', err);
  }

  return false;
}
