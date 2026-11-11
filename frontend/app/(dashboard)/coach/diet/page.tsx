"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CoachDietRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/coach/programs?tab=diet');
  }, [router]);

  return (
    <div className="flex h-96 items-center justify-center flex-col gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs text-text-muted">Redirecting to Nutrition & Diet Library...</p>
    </div>
  );
}
