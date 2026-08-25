"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useRole, UserRole } from "@/context/RoleContext";
import { useWallet } from "@/context/WalletContext";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";

const ROLE_OPTIONS: { role: UserRole; title: string; icon: "lock" | "send"; desc: string; actions: string[] }[] = [
  {
    role: "client",
    title: "I'm a Client",
    icon: "lock",
    desc: "Hire freelancers and lock milestone payments into Soroban escrow vaults.",
    actions: ["Create vaults", "Set milestones", "Deposit funds", "Approve & release"],
  },
  {
    role: "freelancer",
    title: "I'm a Freelancer",
    icon: "send",
    desc: "Get hired, submit proof of work, and receive instant on-chain payments.",
    actions: ["Submit deliverables", "Track assigned vaults", "Raise disputes", "View earnings"],
  },
];

export function RoleSelector() {
  const { setRole } = useRole();
  const { wallet } = useWallet();
  const router = useRouter();

  const handleSelect = (role: UserRole) => {
    setRole(role);
    router.push(`/dashboard/${role}`);
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: "var(--brand-cream)",
    }}>
      <div style={{
        maxWidth: 640, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
      }}>
        <Logo variant="brand" size={48} tagline="Choose your role" />

        <div style={{ textAlign: "center" }}>
          <h1 className="landing-serif" style={{
            fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 600,
            color: "var(--green)", margin: "0 0 8px",
          }}>
            How will you use WorkVault?
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", margin: 0 }}>
            Select your role to get a tailored dashboard experience.
          </p>
        </div>

        {wallet && (
          <p className="ledger-mono" style={{
            fontSize: 12, color: "var(--muted)", background: "var(--cream)",
            padding: "8px 16px", borderRadius: 999, border: "1px solid var(--cream-line)",
          }}>
            Connected: {wallet.displayKey}
          </p>
        )}

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20, width: "100%",
        }}>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.role}
              id={`role-select-${opt.role}`}
              onClick={() => handleSelect(opt.role)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                gap: 16, padding: "clamp(24px, 4vw, 32px)",
                borderRadius: 20, border: "2px solid var(--cream-line)",
                background: "var(--paper)", cursor: "pointer", textAlign: "left",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--green)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(28,51,40,0.12)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--cream-line)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--brand-cream)",
              }}>
                <Icon name={opt.icon} size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>
                  {opt.title}
                </h2>
                <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  {opt.desc}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                {opt.actions.map(a => (
                  <div key={a} style={{
                    fontSize: 12, color: "var(--brown)", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ color: "var(--green)", fontSize: 10 }}>●</span> {a}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <p className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
          You can switch roles anytime from the dashboard header.
        </p>
      </div>
    </div>
  );
}
