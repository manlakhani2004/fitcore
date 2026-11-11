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
  CheckCircle2,
  Shield
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
    <div className="flex flex-col h-full bg-[#10121A] border-r border-[#1C202C] overflow-hidden select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[#1C202C] flex items-center justify-between">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 p-[1px] shadow-sm">
              <div className="w-full h-full bg-[#10121A] rounded-[7px] flex items-center justify-center">
                <span className="font-mono text-sm font-black text-white tracking-tighter">FC</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold tracking-tight text-white">FitCore</span>
              <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">PRO</span>
            </div>
          </Link>
        ) : (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 p-[1px] shadow-sm">
              <div className="w-full h-full bg-[#10121A] rounded-[7px] flex items-center justify-center">
                <span className="font-mono text-sm font-black text-white tracking-tighter">FC</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {user?.role === 'coach' ? 'Coach Navigation' : user?.role === 'admin' ? 'Administration' : 'Athlete Portal'}
          </div>
        )}

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isChatTab = (user?.role === 'coach' && item.name === 'Inbox') || (user?.role === 'member' && item.name === 'My Coach');
          const showBadge = isChatTab && unreadCount > 0;

          return (
            <Link key={item.name} href={item.href}>
              <span className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive 
                  ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.08]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}>
                <div className="relative shrink-0 flex items-center justify-center">
                  <item.icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  {collapsed && showBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#10121A] animate-pulse" />
                  )}
                </div>

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="tracking-wide">{item.name}</span>
                    {showBadge && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full shadow-sm animate-pulse">
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

      {/* User Footer / Logout */}
      <div className="p-3 border-t border-[#1C202C] space-y-2">
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 250 }}
        animate={{ width: collapsed ? 76 : 250 }}
        className="hidden md:block h-screen sticky top-0 z-20 shrink-0 relative"
      >
        {sidebarContent}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-[#12141C] border border-[#1C202C] rounded-full p-1 text-slate-400 hover:text-white z-30 shadow-md transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-[#12141C] p-2 rounded-lg border border-[#1C202C] shadow-lg text-slate-200"
        >
          <Menu className="w-5 h-5" />
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 22 }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-[#12141C] border border-[#1C202C] rounded-2xl w-full max-w-sm p-6 shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-white mb-1.5">Sign Out of FitCore</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Are you sure you want to end your active session? You will need to log back in to access your coach and training programs.
              </p>
              <div className="flex gap-2.5">
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="flex-1 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setShowLogoutModal(false); logout(); router.push("/login"); }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
