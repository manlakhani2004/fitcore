"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TasksRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/member/dashboard');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center flex-col gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs text-text-muted">Redirecting to Dashboard...</p>
    </div>
  );
}
