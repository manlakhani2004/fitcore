"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const step2Schema = z.object({
  role: z.enum(["member", "coach", "admin"]),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type CombinedValues = Step1Values & Step2Values;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CombinedValues>>({});

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    setValue: setRoleValue,
    watch: watchRole,
    formState: { errors: errorsStep2 },
  } = useForm<Step2Values>({ 
    resolver: zodResolver(step2Schema),
    defaultValues: { role: "member" } 
  });

  const selectedRole = watchRole("role");

  const onStep1Submit = (data: Step1Values) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = async (data: Step2Values) => {
    const finalData = { ...formData, ...data };
    setIsLoading(true);
    
    try {
      const res = await api.post("/auth/register", finalData);
      
      if (res.data.success) {
        setStep(3);
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (err) {
      // interceptor handles the global error
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold mb-2">
          {step === 1 && "Join FitCore"}
          {step === 2 && "Choose Your Path"}
          {step === 3 && "Welcome to the Elite"}
        </h2>
        <p className="text-text-muted">
          {step === 1 && "Start your journey by creating an account."}
          {step === 2 && "Select how you'll be using the platform."}
          {step === 3 && "Your account has been created successfully!"}
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= i ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-5"
            onSubmit={handleSubmitStep1(onStep1Submit)}
          >
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                {...registerStep1("name")}
                type="text"
                className={`w-full bg-surface border ${errorsStep1.name ? 'border-danger' : 'border-border'} rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors`}
                placeholder="John Doe"
              />
              {errorsStep1.name && <p className="text-danger text-sm mt-1">{errorsStep1.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                {...registerStep1("email")}
                type="email"
                className={`w-full bg-surface border ${errorsStep1.email ? 'border-danger' : 'border-border'} rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors`}
                placeholder="john@example.com"
              />
              {errorsStep1.email && <p className="text-danger text-sm mt-1">{errorsStep1.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                {...registerStep1("password")}
                type="password"
                className={`w-full bg-surface border ${errorsStep1.password ? 'border-danger' : 'border-border'} rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors`}
                placeholder="••••••••"
              />
              {errorsStep1.password && <p className="text-danger text-sm mt-1">{errorsStep1.password.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-5"
            onSubmit={handleSubmitStep2(onStep2Submit)}
          >
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setRoleValue("role", "member")}
                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${selectedRole === 'member' ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-text-muted'}`}
              >
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl">🏋️</div>
                <div className="text-center">
                  <h3 className="font-bold">Member</h3>
                  <p className="text-xs text-text-muted mt-1">I want to get fit</p>
                </div>
              </div>

              <div 
                onClick={() => setRoleValue("role", "coach")}
                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${selectedRole === 'coach' ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-text-muted'}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl">⏱️</div>
                <div className="text-center">
                  <h3 className="font-bold">Coach</h3>
                  <p className="text-xs text-text-muted mt-1">I want to train others</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-surface hover:bg-border border border-border text-text-primary font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
              </button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-8"
          >
            <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">You're all set!</h3>
            <p className="text-text-muted mb-8">
              We've sent a verification email to <span className="text-text-primary">{formData.email}</span>. Please check your inbox.
            </p>
            <Link 
              href="/login"
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center"
            >
              Go to Login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {step !== 3 && (
        <p className="mt-8 text-center text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign In
          </Link>
        </p>
      )}
    </div>
  );
}
