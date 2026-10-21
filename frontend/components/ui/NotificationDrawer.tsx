"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  setNotifications: (n: any[]) => void;
}

export function NotificationDrawer({ isOpen, onClose, notifications, setNotifications }: NotificationDrawerProps) {
  const router = useRouter();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-accent" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold">Notifications</h2>
              </div>
              <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="px-6 py-3 border-b border-border flex justify-between items-center bg-background/50">
              <span className="text-sm font-bold text-text-muted">{unreadCount} Unread</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(notification => (
                    <div 
                      key={notification._id}
                      onClick={() => {
                        if (notification.link) { onClose(); router.push(notification.link); }
                        else if (!notification.isRead) markRead(notification._id);
                      }}
                      className={`p-4 hover:bg-background transition-colors cursor-pointer flex gap-4 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(notification.type || 'info')}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-sm ${!notification.isRead ? 'text-primary' : 'text-text-primary'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-text-muted">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
