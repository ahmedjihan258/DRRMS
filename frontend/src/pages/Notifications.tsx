import { useEffect, useState } from 'react';
import { Bell, MapPin, Calendar, Loader2 } from 'lucide-react';
import { api } from '../api/services';

interface Notification {
  id: number;
  title: string;
  message: string;
  zone_id?: number;
  zone_name?: string;
  sent_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response: any = await api.getNotifications();
        // Handle both array directly or object with notifications key
        const data = Array.isArray(response) ? response : (response.notifications || []);
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Notifications & Alerts</h2>
        <p className="text-slate-500 mt-1">Stay updated with the latest disaster alerts and system messages.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-slate-800">{notification.title}</h3>
                    <span className="text-xs text-slate-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(notification.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{notification.message}</p>
                  {notification.zone_name && (
                    <div className="mt-3 flex items-center text-sm text-slate-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      Target Zone: <span className="font-medium ml-1 text-slate-700">{notification.zone_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>No notifications found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}