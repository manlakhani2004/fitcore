"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import {
  LayoutDashboard,
  User,
  Users,
  Calendar,
  Dumbbell,
  Apple,
  LineChart,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database,
  BarChart3,
  AlertTriangle,
  X,
  Sparkles,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const MEMBER_NAV = [
  { name: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
  { name: "Workouts", href: "/member/workouts", icon: Dumbbell },
  { name: "Nutrition", href: "/member/diet", icon: Apple },
  { name: "Progress", href: "/member/progress", icon: LineChart },
  { name: "My Coach", href: "/member/my-coach", icon: User },
  { name: "Community", href: "/member/community", icon: MessageSquare },
  { name: "Membership", href: "/member/membership", icon: Sparkles },
  { name: "Settings", href: "/member/settings", icon: Settings },
];

const COACH_NAV = [
  { name: "Dashboard", href: "/coach/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/coach/clients", icon: Users },
  { name: "Library", href: "/coach/programs", icon: Dumbbell },
  { name: "Schedule", href: "/coach/schedule", icon: Calendar },
  { name: "Inbox", href: "/coach/inbox", icon: MessageSquare },
  { name: "Earnings", href: "/coach/earnings", icon: CreditCard },
  { name: "Profile", href: "/coach/profile", icon: User },
];

const ADMIN_NAV = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Coaches", href: "/admin/coaches", icon: User },
  { name: "Content", href: "/admin/content", icon: Database },
  { name: "Memberships", href: "/admin/memberships", icon: CreditCard },
  { name: "Payments", href: "/admin/payments", icon: LineChart },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  // Poll unread messages count in background
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        if (user.role === 'coach') {
          const res = await api.get('/coach-dashboard/unread-count');
          if (res.data?.success) {
            setUnreadCount(res.data.data?.totalUnread || 0);
          }
        } else if (user.role === 'member') {
          const res = await api.get('/users/unread-messages');
          if (res.data?.success) {
            setUnreadCount(res.data.data?.totalUnread || 0);
          }
        }
      } catch {
        // non-fatal
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  const navItems = user?.role === 'admin' ? ADMIN_NAV : user?.role === 'coach' ? COACH_NAV : MEMBER_NAV;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L35.5885 11V29L20 38L4.41154 29V11L20 2Z" fill="#6C63FF" stroke="#00F5A0" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="text-xl font-display font-bold">FitCore</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L35.5885 11V29L20 38L4.41154 29V11L20 2Z" fill="#6C63FF" stroke="#00F5A0" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isChatTab = (user?.role === 'coach' && item.name === 'Inbox') || (user?.role === 'member' && item.name === 'My Coach');
          const showBadge = isChatTab && unreadCount > 0;

          return (
            <Link key={item.name} href={item.href}>
              <span className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-border/50 hover:text-text-primary'}`}>
                <div className="relative shrink-0 flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                  {collapsed && showBadge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-surface animate-pulse" />
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="font-medium whitespace-nowrap">{item.name}</span>
                    {showBadge && (
                      <span className="ml-auto bg-danger text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md shadow-danger/40 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full text-danger hover:bg-danger/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden md:block h-screen sticky top-0 z-20 shrink-0 relative"
      >
        {sidebarContent}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-surface border border-border rounded-full p-1 text-text-muted hover:text-primary z-30 shadow-lg"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-surface p-2 rounded-lg border border-border shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-surface border border-border rounded-3xl w-full max-w-sm p-6 shadow-2xl pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-danger" />
                  </div>
                  <button onClick={() => setShowLogoutModal(false)} className="p-1 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-xl font-bold mb-2">Logout</h3>
                <p className="text-text-muted text-sm mb-6">Are you sure you want to sign out? You'll need to log in again to access your dashboard.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 border border-border rounded-xl font-bold hover:bg-background transition-colors text-sm">
                    Cancel
                  </button>
                  <button onClick={() => { setShowLogoutModal(false); logout(); router.push("/login"); }}
                    className="flex-1 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-bold transition-colors text-sm">
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
