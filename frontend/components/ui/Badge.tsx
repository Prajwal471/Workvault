"use client";

import React from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "pending";

const styles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  warning: "bg-amber-500/20 border-amber-500/30 text-amber-400",
  error: "bg-red-500/20 border-red-500/30 text-red-400",
  info: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
  neutral: "bg-white/10 border-white/15 text-slate-400",
  pending: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
};

const dots: Record<BadgeVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-cyan-400",
  neutral: "bg-slate-400",
  pending: "bg-indigo-400 animate-pulse",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = "neutral", children, dot, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium",
        styles[variant],
        className,
      ].join(" ")}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  );
}

/** Map a vault status string to a Badge variant. */
export function statusVariant(
  status: string
): BadgeVariant {
  switch (status) {
    case "Created": return "neutral";
    case "Funded": return "info";
    case "InReview": return "pending";
    case "Completed": return "success";
    case "Cancelled": return "warning";
    default: return "neutral";
  }
}
