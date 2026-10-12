import React from 'react';
import { Bell, Check, Trash2, AlertTriangle, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, dismissNotification } = useHotel();

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'booking':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
      role="menu"
    >
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <span className="text-sm font-semibold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white font-mono tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          Close
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No active notifications.
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              className={`p-3.5 transition-colors flex items-start gap-3 ${
                item.read ? 'bg-white opacity-75' : 'bg-blue-50/30'
              }`}
            >
              <div className="p-1.5 rounded-md bg-slate-100 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">{item.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  {!item.read && (
                    <button
                      onClick={() => markNotificationAsRead(item.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                  <button
                    onClick={() => dismissNotification(item.id)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
