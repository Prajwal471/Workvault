"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, style, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.03em" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10,
          padding: "11px 14px",
          fontSize: 14,
          color: "#f1f5f9",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          fontFamily: "inherit",
          ...style,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = error
            ? "rgba(239,68,68,0.7)"
            : "rgba(168,85,247,0.65)";
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 3px rgba(239,68,68,0.12)"
            : "0 0 0 3px rgba(168,85,247,0.14), 0 0 12px rgba(168,85,247,0.15)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = error
            ? "rgba(239,68,68,0.5)"
            : "rgba(255,255,255,0.1)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...rest}
      />
      {hint && !error && (
        <p style={{ fontSize: 11, color: "#475569" }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 11, color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}
