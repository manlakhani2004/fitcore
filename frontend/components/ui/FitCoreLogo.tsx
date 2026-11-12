"use client";

import React, { useId } from "react";
import Link from "next/link";

interface FitCoreLogoProps {
  /** Size preset: xs (24px mark), sm (32px), md (40px), lg (48px), xl (64px) */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Whether to render the 'FitCore' wordmark text */
  showText?: boolean;
  /** Whether to show the badge ('PRO', 'COACH', etc.) */
  showBadge?: boolean;
  /** Custom badge text (defaults to 'PRO') */
  badgeText?: string;
  /** Subtitle under the wordmark (e.g. 'Athlete Portal', 'Coach Platform', 'Admin HQ') */
  subtitle?: string;
  /** If true, renders only the centered icon badge for collapsed sidebars */
  collapsed?: boolean;
  /** Optional link destination (defaults to undefined / non-clickable unless provided) */
  href?: string;
  /** Additional container classes */
  className?: string;
}

/**
 * Pure SVG Logo Mark for FitCore
 * High-performance, athletic kinetic vector mark representing power, cardiovascular flow, and peak core strength.
 */
export function FitCoreLogoMark({ 
  size = 40, 
  className = "" 
}: { 
  size?: number; 
  className?: string; 
}) {
  const id = useId().replace(/:/g, "_");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Background Depth Gradient */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="55%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Dynamic Electric Edge Ring */}
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.85" />
        </linearGradient>

        {/* Athletic Kinetic F-Blade Gradient */}
        <linearGradient id={`${id}-f-blade`} x1="8" y1="8" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="40%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Biometric Energy Core Spark Gradient */}
        <linearGradient id={`${id}-core-spark`} x1="22" y1="18" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F5A0" />
          <stop offset="100%" stopColor="#00D9F5" />
        </linearGradient>

        {/* Ambient Core Glow */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Base Stadium / Squircle Plate */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="11.5"
        fill={`url(#${id}-bg)`}
        stroke={`url(#${id}-edge)`}
        strokeWidth="1.5"
      />

      {/* 2. Soft Ambient Luminescence in the Core */}
      <circle cx="20" cy="20" r="13" fill="#6366F1" opacity="0.22" filter={`url(#${id}-glow)`} />

      {/* 3. The Kinetic Athletic 'F' Emblem */}
      {/* Dynamic Vertical Power Spine */}
      <path
        d="M 11 11.5 C 11 10.12 12.12 9 13.5 9 L 17 9 L 17 29.5 C 17 30.88 15.88 32 14.5 32 L 13.5 32 C 12.12 32 11 30.88 11 29.5 Z"
        fill={`url(#${id}-f-blade)`}
      />

      {/* Upper Speed Wing (Momentum Forward Sweep) */}
      <path
        d="M 17 9 L 30 9 C 31.15 9 32.02 10.05 31.62 11.12 L 29.8 15 C 29.48 15.62 28.85 16 28.18 16 L 17 16 Z"
        fill={`url(#${id}-f-blade)`}
      />

      {/* Center Power Core Wing */}
      <path
        d="M 17 18.5 L 25 18.5 C 26.15 18.5 27.02 19.55 26.62 20.62 L 25.1 24.3 C 24.78 24.92 24.15 25.3 23.48 25.3 L 17 25.3 Z"
        fill={`url(#${id}-f-blade)`}
      />

      {/* 4. Electric Core Diamond Spark (The Cardiovascular Engine) */}
      <path
        d="M 30.5 21.5 L 32 25.5 L 36 27 L 32 28.5 L 30.5 32.5 L 29 28.5 L 25 27 L 29 25.5 Z"
        fill={`url(#${id}-core-spark)`}
        opacity="0.95"
      />
    </svg>
  );
}

export function FitCoreLogo({
  size = "md",
  showText = true,
  showBadge = true,
  badgeText = "PRO",
  subtitle,
  collapsed = false,
  href,
  className = "",
}: FitCoreLogoProps) {
  // Preset pixel dimensions for mark & typography
  const sizeConfig = {
    xs: { mark: 26, text: "text-base", badge: "text-[8px] px-1.5 py-0.2", sub: "text-[8px]" },
    sm: { mark: 32, text: "text-lg", badge: "text-[9px] px-1.5 py-0.5", sub: "text-[8.5px]" },
    md: { mark: 40, text: "text-xl", badge: "text-[9px] px-2 py-0.5", sub: "text-[9px]" },
    lg: { mark: 48, text: "text-2xl", badge: "text-[10px] px-2.5 py-0.5", sub: "text-[10px]" },
    xl: { mark: 64, text: "text-4xl", badge: "text-xs px-3 py-1", sub: "text-xs" },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* The Iconic Vector Mark */}
      <FitCoreLogoMark size={sizeConfig.mark} />

      {/* Wordmark & Hierarchy (Hidden when collapsed or showText is false) */}
      {!collapsed && showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {/* High-Performance Typography */}
            <span className={`font-black tracking-tight leading-none text-text-primary ${sizeConfig.text}`}>
              Fit<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400">Core</span>
            </span>

            {/* Premium Athletic Tech Badge */}
            {showBadge && (
              <span 
                className={`font-black tracking-wider uppercase rounded-full leading-none shrink-0 ${sizeConfig.badge} bg-gradient-to-r from-indigo-500/15 via-sky-500/15 to-emerald-500/15 text-indigo-500 dark:text-sky-400 border border-indigo-500/30 dark:border-sky-500/30 shadow-2xs backdrop-blur-sm`}
              >
                {badgeText}
              </span>
            )}
          </div>

          {/* Subtitle / Portal Category with Live Pulse Dot */}
          {subtitle && (
            <span className={`font-bold tracking-[0.18em] uppercase text-text-muted mt-1 flex items-center gap-1.5 ${sizeConfig.sub}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-500/50" />
              <span className="truncate">{subtitle}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex cursor-pointer transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

export default FitCoreLogo;
