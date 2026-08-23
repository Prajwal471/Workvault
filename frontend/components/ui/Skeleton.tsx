"use client";

import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--cream-soft) 25%, var(--cream) 50%, var(--cream-soft) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  const widths = ["85%", "72%", "93%", "68%", "78%"];
  return (
    <div style={{
      borderRadius: 20,
      padding: "clamp(16px, 4vw, 28px)",
      border: "1px solid var(--cream-line)",
      background: "var(--paper)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="100%" height={14} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={widths[i % widths.length]} height={14} />
      ))}
    </div>
  );
}
