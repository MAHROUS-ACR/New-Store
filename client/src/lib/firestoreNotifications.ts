/**
 * Simple Real-time Notifications using Firestore listeners
 * No Firebase auth setup needed - just watches Firestore collections
 */

import { getFirestore, collection, query, where, orderBy, onSnapshot, Query } from 'firebase/firestore';
import { toast } from 'sonner';

export interface RealtimeNotification {
  id: string;
  type: 'order' | 'status_update' | 'user_action';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
  userId?: string;
  orderId?: string;
}

let notificationListeners: { [key: string]: () => void } = {};

/**
 * Listen for new orders in real-time
 * Shows toast and triggers callback for each new order
 */
export function listenForNewOrders(
  adminId: string,
  onNewOrder: (notification: RealtimeNotification) => void
) {
  const db = getFirestore();
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const orderData = change.doc.data();
        const notification: RealtimeNotification = {
          id: change.doc.id,
          type: 'order',
          title: '📦 New Order',
          message: `Order #${orderData.orderNumber || change.doc.id.slice(0, 6)} - ${orderData.total} EGP`,
          data: orderData,
          timestamp: new Date(orderData.createdAt),
          read: false,
          orderId: change.doc.id,
          userId: orderData.userId,
        };

        // Show toast
        toast.success(notification.message, {
          description: `from ${orderData.userEmail || 'Customer'}`,
        });

        // Call callback
        onNewOrder(notification);
      }
    });
  });

  notificationListeners['orders'] = unsubscribe;
  return unsubscribe;
}

/**
 * Listen for order status changes
 */
export function listenForStatusUpdates(
  userId: string,
  onStatusUpdate: (notification: RealtimeNotification) => void
) {
  const db = getFirestore();
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const orderData = change.doc.data();
        const notification: RealtimeNotification = {
          id: change.doc.id,
          type: 'status_update',
          title: '📬 Order Status Updated',
          message: `Order #${orderData.orderNumber} is now: ${orderData.status}`,
          data: orderData,
          timestamp: new Date(orderData.updatedAt || new Date()),
          read: false,
          orderId: change.doc.id,
          userId: userId,
        };

        // Show toast
        toast.info(notification.message);

        // Call callback
        onStatusUpdate(notification);
      }
    });
  });

  notificationListeners['status'] = unsubscribe;
  return unsubscribe;
}

/**
 * Listen for new users
 */
export function listenForNewUsers(
  onNewUser: (notification: RealtimeNotification) => void
) {
  const db = getFirestore();
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const userData = change.doc.data();
        const notification: RealtimeNotification = {
          id: change.doc.id,
          type: 'user_action',
          title: '👤 New User Registered',
          message: `${userData.email} just joined!`,
          data: userData,
          timestamp: new Date(userData.createdAt),
          read: false,
          userId: change.doc.id,
        };

        // Show toast
        toast.success(notification.message);

        // Call callback
        onNewUser(notification);
      }
    });
  });

  notificationListeners['users'] = unsubscribe;
  return unsubscribe;
}

/**
 * Stop listening to specific notification type
 */
export function stopListening(type: string) {
  if (notificationListeners[type]) {
    notificationListeners[type]();
    delete notificationListeners[type];
  }
}

/**
 * Stop all listeners
 */
export function stopAllListeners() {
  Object.values(notificationListeners).forEach(unsubscribe => unsubscribe());
  notificationListeners = {};
}

/**
 * Format timestamp for display
 */
export function formatNotificationTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
}
