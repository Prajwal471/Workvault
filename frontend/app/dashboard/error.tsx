"use client";

import React from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: "100%",
        borderRadius: 20, padding: "clamp(24px, 5vw, 40px)",
        border: "1px solid var(--cream-line)", background: "var(--paper)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "#FBF3F0", border: "1px solid #E3C7C0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, color: "#8A3A2A",
        }}>
          !
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          {error.message || "An unexpected error occurred while loading the dashboard."}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={reset}
            style={{
              background: "var(--green)", color: "var(--brand-cream)",
              border: "1px solid var(--green-deep)", borderRadius: 10,
              padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "var(--paper)", color: "var(--brown)",
                border: "1px solid var(--cream-line)", borderRadius: 10,
                padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Back to home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
