"use client";

import React from "react";

export const BRAND_ACCENT = "#a855f7";

interface CardProps {
  id?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const base: React.CSSProperties = {
  borderRadius: 20,
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  flex: 1,
};

export function Card({ id, style, children }: CardProps) {
  return (
    <div id={id} className="card-premium" style={{ ...base, ...style }}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  icon: React.ReactNode;
  accent?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  tagColor?: string;
  right?: React.ReactNode;
  style?: React.CSSProperties;
}

export function CardHeader({ icon, accent = BRAND_ACCENT, title, subtitle, tag, tagColor, right, style }: CardHeaderProps) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, ...style }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `${accent}26`, border: `1px solid ${accent}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent,
          }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{
                fontSize: 16, fontWeight: 700, color: "#fff", margin: 0,
                fontFamily: "var(--font-display)", letterSpacing: "-0.01em",
              }}>{title}</h2>
              {tag && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: `${tagColor ?? accent}1A`, border: `1px solid ${tagColor ?? accent}33`,
                  color: tagColor ?? accent, whiteSpace: "nowrap",
                }}>
                  {tag}
                </span>
              )}
            </div>
            {subtitle && (
              <p style={{ fontSize: 11, color: "#8b85a0", margin: 0, marginTop: 1 }}>{subtitle}</p>
            )}
          </div>
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
    </>
  );
}
