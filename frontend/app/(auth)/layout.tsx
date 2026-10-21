"use client";

import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        {/* Abstract shapes / Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold flex items-center gap-3">
            <span className="text-primary">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2L35.5885 11V29L20 38L4.41154 29V11L20 2Z" fill="#6C63FF" stroke="#00F5A0" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </span>
            FitCore
          </h1>
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
