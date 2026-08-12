"use client";

import React from "react";
import { TxStage } from "@/lib/stellar";

const STAGES: { key: TxStage; label: string }[] = [
  { key: "sign", label: "Sign" },
  { key: "broadcast", label: "Broadcast" },
  { key: "confirmed", label: "Confirmed" },
];

const ORDER: TxStage[] = ["sign", "broadcast", "confirmed"];

/**
 * Three-step transaction progress indicator (sign → broadcast → confirmed).
 * Renders nothing until a stage is reported, then fills steps up to it.
 */
export function TxStepper({ stage }: { stage: TxStage | null }) {
  if (!stage) return null;
  const activeIdx = ORDER.indexOf(stage);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }} aria-label={`Transaction stage: ${stage}`}>
      {STAGES.map((s, i) => {
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div style={{
                flex: 1, height: 1,
                background: i <= activeIdx ? "var(--green)" : "var(--cream-line)",
                transition: "background 0.3s",
              }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, flexShrink: 0,
                background: state === "todo" ? "var(--cream-soft)"
                  : state === "active" ? "var(--green)" : "var(--green-deep)",
                border: state === "todo" ? "1px solid var(--cream-line)" : "1px solid transparent",
                color: state === "todo" ? "var(--muted-soft)" : "var(--brand-cream)",
                transition: "background 0.3s, color 0.3s",
              }}>
                {state === "done" ? "✓" : state === "active" ? (
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    border: "2px solid rgba(244,239,230,0.35)",
                    borderTopColor: "#f4efe6",
                    animation: "spin 0.8s linear infinite",
                    display: "block",
                  }} />
                ) : i + 1}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                color: state === "todo" ? "var(--muted-soft)" : "var(--green)",
                transition: "color 0.3s",
              }}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
