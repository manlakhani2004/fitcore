"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface TimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

// Play pleasant dual-tone chime using Web Audio API
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Note 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.2);
    gain2.gain.setValueAtTime(0.4, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.9);
  } catch (err) {
    console.debug("Web Audio chime skipped or blocked by browser autoplay policy", err);
  }
}

export function Timer({ initialSeconds = 60, onComplete, autoStart = false }: TimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync when initialSeconds changes
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setSecondsLeft(initialSeconds);
    if (autoStart) setIsActive(true);
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      if (soundEnabled) {
        playChime();
      }
      onComplete?.();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, onComplete, soundEnabled]);

  const toggle = () => setIsActive(!isActive);
  
  const reset = () => {
    setIsActive(false);
    setSecondsLeft(totalSeconds);
  };

  const setPreset = (secs: number) => {
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsActive(true); // Auto-start on preset click for convenience
  };

  const percentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  
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
        <div className="absolute flex flex-col items-center">
          <div className="font-mono text-3xl font-bold">{timeString}</div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider">{isActive ? 'Resting...' : 'Rest'}</span>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex gap-1.5 mb-5">
        {[30, 45, 60, 90, 120].map((presetSecs) => (
          <button
            key={presetSecs}
            onClick={() => setPreset(presetSecs)}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold transition-all border ${
              totalSeconds === presetSecs && isActive
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-background border-border text-text-muted hover:text-text-primary hover:border-text-primary/40'
            }`}
          >
            {presetSecs}s
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={toggle}
          aria-label={isActive ? "Pause Timer" : "Start Timer"}
          className="bg-primary hover:bg-primary-hover text-white p-3 rounded-full transition-colors shadow-lg hover:shadow-primary/30"
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button 
          onClick={reset}
          aria-label="Reset Timer"
          className="bg-surface border border-border hover:bg-border text-text-primary p-3 rounded-full transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label="Toggle Sound"
          title={soundEnabled ? "Mute Timer Chime" : "Enable Timer Chime"}
          className={`p-3 rounded-full border transition-colors ${
            soundEnabled 
              ? 'bg-surface border-border text-text-muted hover:text-accent' 
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
