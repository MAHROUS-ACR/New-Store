import { useEffect, useState } from 'react';
import { Bell, X, Trash2, CheckCircle } from 'lucide-react';
import { RealtimeNotification, listenForNewOrders, stopAllListeners, formatNotificationTime } from '@/lib/firestoreNotifications';
import { useUser } from '@/lib/userContext';

interface RealtimeNotificationsProps {
  adminId?: string;
  showPanel?: boolean;
}

export function RealtimeNotifications({ adminId, showPanel = true }: RealtimeNotificationsProps) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Only listen if user is admin
    if (!user?.role || user.role !== 'admin') {
      return;
    }

    // Start listening for new orders
    const unsubscribe = listenForNewOrders(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
      stopAllListeners();
    };
  }, [user?.id, user?.role]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      {/* Notification Bell Icon */}
      {showPanel && (
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition"
            title="Real-time Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="font-semibold">Notifications ({notifications.length})</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatNotificationTime(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notifications.length > 0 && (
                <div className="border-t p-3 text-center">
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
