"use client";

import { motion } from "framer-motion";

interface CircularProgressProps {
  percentage: number;
  label: string;
  sublabel: string;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({ 
  percentage, 
  label, 
  sublabel,
  size = 200, 
  strokeWidth = 12 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-[#1E2230]"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4F46E5"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl md:text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">{label}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</span>
      </div>
    </div>
  );
}
