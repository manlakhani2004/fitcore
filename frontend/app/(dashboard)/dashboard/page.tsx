"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function GenericDashboardRedirect() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin/dashboard');
    } else if (user?.role === 'coach') {
      router.replace('/coach/dashboard');
    } else {
      router.replace('/member/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-muted">Loading your workspace...</h2>
      </div>
    </div>
  );
}
