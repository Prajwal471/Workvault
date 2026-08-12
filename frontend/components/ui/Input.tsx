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
          style={{ fontSize: 12, fontWeight: 600, color: "var(--brown)", letterSpacing: "0.03em" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: "100%",
          background: "var(--paper)",
          border: `1px solid ${error ? "rgba(138,58,42,0.55)" : "var(--cream-line)"}`,
          borderRadius: 10,
          padding: "11px 14px",
          fontSize: 14,
          color: "var(--ink)",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          fontFamily: "inherit",
          ...style,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = error
            ? "rgba(138,58,42,0.7)"
            : "var(--green)";
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 3px rgba(138,58,42,0.12)"
            : "0 0 0 3px rgba(28,51,40,0.12)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = error
            ? "rgba(138,58,42,0.55)"
            : "var(--cream-line)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...rest}
      />
      {hint && !error && (
        <p style={{ fontSize: 11, color: "var(--muted-soft)" }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 11, color: "#8a3a2a" }}>{error}</p>
      )}
    </div>
  );
}
