"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-400 hover:to-fuchsia-400 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50",
  secondary:
    "bg-white/10 border border-white/20 text-white hover:bg-white/15 backdrop-blur-sm",
  ghost:
    "text-slate-300 hover:text-white hover:bg-white/8",
  danger:
    "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-sm font-bold rounded-xl active:scale-[0.97]",
  lg: "px-8 py-4 text-base font-bold rounded-2xl active:scale-[0.97]",
};

const sweepClasses =
  "relative overflow-hidden hover:scale-[1.01] active:scale-[0.97] " +
  "after:absolute after:inset-0 after:pointer-events-none " +
  "after:-translate-x-[130%] after:skew-x-[-20deg] hover:after:translate-x-[130%] " +
  "after:transition-transform after:duration-700 " +
  "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60",
        variantClasses[variant],
        variant === "primary" ? sweepClasses : "",
        sizeClasses[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
