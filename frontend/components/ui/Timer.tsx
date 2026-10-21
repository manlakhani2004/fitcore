"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TimerProps {
  initialSeconds: number;
  onComplete?: () => void;
}

export function Timer({ initialSeconds, onComplete }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 0);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, onComplete]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setSecondsLeft(initialSeconds);
  };

  const percentage = (secondsLeft / initialSeconds) * 100;
  
  // Format MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const size = 150;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-4" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="var(--color-border)" strokeWidth={strokeWidth} fill="transparent" />
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            stroke="var(--color-accent)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "linear" }}
            className="drop-shadow-[0_0_8px_rgba(0,245,160,0.5)]"
          />
        </svg>
        <div className="absolute font-mono text-3xl font-bold">{timeString}</div>
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={toggle}
          className="bg-primary hover:bg-primary-hover text-white p-3 rounded-full transition-colors shadow-lg"
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button 
          onClick={reset}
          className="bg-surface border border-border hover:bg-border text-text-primary p-3 rounded-full transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
