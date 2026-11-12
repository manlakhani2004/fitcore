"use client";

import React from "react";
import Link from "next/link";

interface FitCoreLogoProps {
  /** Size preset: xs (24px mark), sm (28px mark), md (36px mark), lg (44px mark), xl (56px mark) */
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
  /** Optional link destination */
  href?: string;
  /** Additional container classes */
  className?: string;
}

/**
 * Minimalist, Agency-Grade Athletic Vector Mark for FitCore
 * Bold, forward-canted geometric F with athletic 15° speed angles and core accent.
 * Clean, flat vector without artificial neon gradients, blur filters, or sparks.
 */
export function FitCoreLogoMark({ 
  size = 36, 
  className = "" 
}: { 
  size?: number; 
  className?: string; 
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      {/* Precision Obsidian Container */}
      <rect
        width="36"
        height="36"
        rx="9"
        fill="#0F172A"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="1"
      />

      {/* Kinetic Athletic 'F' in High-Contrast Crisp White */}
      <path
        d="M 10 26 L 14.5 10 H 26 L 24.5 14 H 17.5 L 16.5 17.5 H 22.5 L 21 21.5 H 15.5 L 13.5 26 H 10 Z"
        fill="#FFFFFF"
      />

      {/* Precision Core Accent in Signature Electric Indigo */}
      <rect
        x="23"
        y="21.5"
        width="4.5"
        height="4.5"
        rx="1.5"
        fill="#6366F1"
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
  const sizeConfig = {
    xs: { mark: 24, text: "text-sm", badge: "text-[8px] px-1 py-0.2", sub: "text-[10px]" },
    sm: { mark: 28, text: "text-base", badge: "text-[9px] px-1.5 py-0.5", sub: "text-[11px]" },
    md: { mark: 36, text: "text-lg", badge: "text-[10px] px-2 py-0.5", sub: "text-xs" },
    lg: { mark: 44, text: "text-xl", badge: "text-[10px] px-2 py-0.5", sub: "text-xs" },
    xl: { mark: 56, text: "text-3xl", badge: "text-xs px-2.5 py-1", sub: "text-sm" },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Precision Vector Emblem */}
      <FitCoreLogoMark size={sizeConfig.mark} />

      {/* Wordmark Hierarchy (Hidden when collapsed or showText is false) */}
      {!collapsed && showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {/* Confident, Clean Wordmark (Pure solid typography - no rainbow gradients) */}
            <span className={`font-bold tracking-tight leading-none text-text-primary ${sizeConfig.text}`}>
              FitCore
            </span>

            {/* Understated, Minimalist Role Badge */}
            {showBadge && (
              <span 
                className={`font-semibold tracking-wide uppercase rounded-md leading-none shrink-0 ${sizeConfig.badge} bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10`}
              >
                {badgeText}
              </span>
            )}
          </div>

          {/* Clean, Human-Readable Subtitle */}
          {subtitle && (
            <span className={`text-text-muted font-normal mt-0.5 truncate leading-tight ${sizeConfig.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex cursor-pointer transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export default FitCoreLogo;
