import { useEffect, useState } from 'react';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { BottomNav } from '@/components/bottom-nav';
import { ArrowLeft, Bell, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUser } from '@/lib/userContext';
import { listenForNewOrders, stopAllListeners, formatNotificationTime, RealtimeNotification } from '@/lib/firestoreNotifications';
import { toast } from 'sonner';

export default function AdminNotificationsPage() {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn } = useUser();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      setLocation('/');
      return;
    }

    setLoading(true);
    const unsubscribe = listenForNewOrders(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      stopAllListeners();
    };
  }, [user?.id, user?.role, isLoggedIn, setLocation]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MobileWrapper>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setLocation('/profile')}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Real-time Notifications
            </h1>
            <p className="text-sm text-gray-500">{notifications.length} total</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 w-full">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">
                  {loading ? 'Listening for notifications...' : 'No notifications yet'}
                </p>
                <p className="text-sm text-gray-400">
                  You'll see real-time updates here when orders are placed
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border-2 p-4 transition ${
                    !notification.read
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      {notification.type === 'order' ? (
                        <span className="text-2xl">📦</span>
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatNotificationTime(notification.timestamp)}
                      </p>
                      {notification.data && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <p>Order ID: {notification.orderId?.slice(0, 8)}...</p>
                          <p>Amount: {notification.data.total} EGP</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 justify-end">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t bg-white p-4 flex gap-3">
            <button
              onClick={handleClearAll}
              className="flex-1 py-2 px-4 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition"
            >
              Clear All ({unreadCount} unread)
            </button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0">
          <BottomNav />
        </div>
      </div>
    </MobileWrapper>
  );
}
