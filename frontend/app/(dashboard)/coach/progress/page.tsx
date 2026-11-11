"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CoachProgressRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/coach/clients?tab=progress');
  }, [router]);

  return (
    <div className="flex h-96 items-center justify-center flex-col gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs text-text-muted">Redirecting to 3D Biometrics & Progress Hub...</p>
    </div>
  );
}
