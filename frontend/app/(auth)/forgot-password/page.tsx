"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data.success) {
        setSent(true);
        if (res.data.resetToken) {
          toast.success(`Dev mode - Token: ${res.data.resetToken}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold mb-2">Forgot Password</h2>
        <p className="text-text-muted">We'll send you a reset link.</p>
      </div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center py-8"
        >
          <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Check Your Email</h3>
          <p className="text-text-muted mb-8">
            If an account exists for <span className="text-text-primary">{email}</span>, you'll receive a password reset link shortly.
          </p>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Back to Login
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              placeholder="john@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
          </button>

          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </form>
      )}
    </motion.div>
  );
}
