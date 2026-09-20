import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, CheckCheck, MessageSquare, FileText, DollarSign, UserPlus, Settings } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5" />;
      case 'project': return <FileText className="w-5 h-5" />;
      case 'invoice': return <DollarSign className="w-5 h-5" />;
      case 'lead': return <UserPlus className="w-5 h-5" />;
      case 'system': return <Settings className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-600';
      case 'project': return 'bg-purple-100 text-purple-600';
      case 'invoice': return 'bg-green-100 text-green-600';
      case 'lead': return 'bg-orange-100 text-orange-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all as read
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                              </div>
                              <div className="flex gap-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3 text-gray-500" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Delete"
                                >
                                  <X className="w-3 h-3 text-gray-400 hover:text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
