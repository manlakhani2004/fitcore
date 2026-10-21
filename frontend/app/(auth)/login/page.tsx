"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useHookForm } from "react-hook-form";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useHookForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      
      if (res.data.success) {
        login(res.data.data, res.data.data.accessToken);
        toast.success("Successfully logged in!");
        if (res.data.data.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (res.data.data.role === 'coach') {
          router.push('/coach/dashboard');
        } else {
          router.push('/member/profile');
        }
      } else {
        toast.error(res.data.message || "Invalid credentials");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Network error. Please check your connection.';
      toast.error(message);
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
        <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
        <p className="text-text-muted">Enter your details to access your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-text-primary">Email Address</label>
          <input
            {...register("email")}
            type="email"
            className={`w-full bg-surface border ${errors.email ? 'border-danger' : 'border-border'} rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors`}
            placeholder="john@example.com"
          />
          {errors.email && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-danger text-sm mt-1">
              {errors.email.message}
            </motion.p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-text-primary">Password</label>
            <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-hover transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            {...register("password")}
            type="password"
            className={`w-full bg-surface border ${errors.password ? 'border-danger' : 'border-border'} rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors`}
            placeholder="••••••••"
          />
          {errors.password && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-danger text-sm mt-1">
              {errors.password.message}
            </motion.p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
        </button>
      </form>

      <p className="mt-8 text-center text-text-muted">
        Don't have an account?{" "}
        <Link href="/register" className="text-accent hover:underline font-medium">
          Create one now
        </Link>
      </p>
    </motion.div>
  );
}
