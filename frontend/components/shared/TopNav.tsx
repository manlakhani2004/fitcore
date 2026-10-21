"use client";

import { useAuthStore } from "@/store/authStore";
import { UserCircle, Menu, Bell } from "lucide-react";
import { NotificationDrawer } from "@/components/ui/NotificationDrawer";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export function TopNav() {
  const user = useAuthStore((state) => state.user);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(res => {
          if (res.data.success) {
            setNotifications(res.data.data);
          }
        })
        .catch(err => console.error("Failed to fetch notifications", err));
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="h-20 bg-background/50 backdrop-blur-md border-b border-border sticky top-0 z-30 px-6 sm:px-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className="font-display font-bold text-xl lg:hidden pl-12">
            Fit<span className="text-primary">Core</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 text-text-muted hover:text-primary transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-background animate-pulse" />
            )}
          </button>

          <div className="flex items-center gap-3 pl-6 border-l border-border cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
              <p className="text-xs text-text-muted capitalize">{user?.role || 'Member'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-border overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <NotificationDrawer 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </>
  );
}
