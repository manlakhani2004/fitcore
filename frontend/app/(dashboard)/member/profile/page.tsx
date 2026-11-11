"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/member/settings?tab=profile');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center flex-col gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs text-text-muted">Redirecting to Profile & Health Settings...</p>
    </div>
  );
}
