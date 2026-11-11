"use client";

import { useAuthStore } from "@/store/authStore";
import { Bell, ShieldCheck, ChevronDown } from "lucide-react";
import { NotificationDrawer } from "@/components/ui/NotificationDrawer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";

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
      <header className="h-16 bg-surface/80 dark:bg-[#0B0C10]/80 backdrop-blur-xl border-b border-border sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between w-full select-none transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 lg:hidden pl-10">
            <span className="font-semibold text-base tracking-tight text-text-primary">FitCore</span>
            <span className="text-[10px] font-mono text-text-muted">PRO</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-border transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface animate-pulse" />
            )}
          </button>

          <Link 
            href={user?.role === 'coach' ? '/coach/profile' : user?.role === 'admin' ? '/admin/settings' : '/member/settings?tab=profile'}
            className="flex items-center gap-2.5 pl-3 border-l border-border cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-slate-800 border border-indigo-500/30 overflow-hidden flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-white group-hover:border-indigo-400 transition-colors">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-text-primary group-hover:text-indigo-600 dark:group-hover:text-white transition-colors leading-tight">
                {user?.name || 'Athlete'}
              </p>
              <p className="text-[10px] text-text-muted capitalize font-medium">
                {user?.role || 'Member'}
              </p>
            </div>
          </Link>
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
