"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Missing reset token");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setIsLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        setDone(true);
        toast.success("Password reset successful!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-8">
        <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Password Reset!</h3>
        <p className="text-text-muted mb-8">Your password has been updated successfully.</p>
        <Link href="/login" className="bg-primary hover:bg-primary-hover text-white font-medium py-3 px-8 rounded-lg transition-all">Go to Login</Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold mb-2">Reset Password</h2>
        <p className="text-text-muted">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
        </button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
