"use client";

import React from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "pending";

const styles: Record<BadgeVariant, string> = {
  success: "bg-[#e7f2ec] border-[#1c3328]/30 text-[#1c3328]",
  warning: "bg-[#fbf3e0] border-[#b38a3a]/30 text-[#8a5c1f]",
  error: "bg-[#fbf3f0] border-[#e3c7c0] text-[#8a3a2a]",
  info: "bg-[#e8efe8] border-[#2d4a3c]/30 text-[#1c3328]",
  neutral: "bg-[var(--cream-soft)] border-[var(--cream-line)] text-[var(--muted)]",
  pending: "bg-[#efe9dc] border-[#b38a3a]/40 text-[#8a5c1f]",
};

const dots: Record<BadgeVariant, string> = {
  success: "bg-[#1c3328]",
  warning: "bg-[#b38a3a]",
  error: "bg-[#a34a36]",
  info: "bg-[#2d4a3c]",
  neutral: "bg-[var(--muted-soft)]",
  pending: "bg-[#b38a3a] animate-pulse",
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
