"use client";

import { motion } from "framer-motion";
import { FitCoreLogo } from "@/components/ui/FitCoreLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        {/* Abstract shapes / Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

        <div className="relative z-10">
          <FitCoreLogo
            size="lg"
            badgeText="PRO"
            subtitle="Elite Fitness Network"
            href="/"
          />
        </div>
        
        <div className="relative z-10 max-w-lg mt-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-display font-bold leading-tight mb-6"
          >
            Forge Your Core. <br />
            <span className="text-accent">Own Your Journey.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-muted text-lg font-sans"
          >
            Join the elite network of professional trainers and dedicated members. Track workouts, manage diet plans, and see real results.
          </motion.p>
        </div>
        
        <div className="relative z-10 text-sm text-text-muted">
          &copy; {new Date().getFullYear()} FitCore. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
