"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/member/membership?tab=billing');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center flex-col gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs text-text-muted">Redirecting to Billing & Invoices...</p>
    </div>
  );
}
