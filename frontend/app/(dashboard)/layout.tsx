"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";
import { FitBot } from "@/components/ui/FitBot";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, setUser, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const initDone = useRef(false);

  // 1. Initial auth sync & refresh on mount
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    api.post('/auth/refresh-token').then(res => {
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        logout();
        router.replace('/login');
      }
    }).catch(() => {
      logout();
      router.replace('/login');
    });
  }, [logout, router, setUser]);

  // 2. Strict Continuous RBAC Guard on every route navigation
  useEffect(() => {
    if (!user) return;
    const role = user.role;
    if (role === 'member' && (pathname.startsWith('/coach') || pathname.startsWith('/admin'))) {
      router.replace('/member/dashboard');
    } else if (role === 'coach' && (pathname.startsWith('/member') || pathname.startsWith('/admin'))) {
      router.replace('/coach/dashboard');
    } else if (role === 'admin' && (pathname.startsWith('/member') || pathname.startsWith('/coach'))) {
      router.replace('/admin/dashboard');
    }
  }, [pathname, user, router]);

  if (!isAuthenticated) return null;

  return (
    <div suppressHydrationWarning className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10">
          {children}
        </main>
      </div>
      <FitBot />
    </div>
  );
}
