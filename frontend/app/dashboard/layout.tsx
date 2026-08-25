"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { useRole, UserRole } from "@/context/RoleContext";
import { WalletBar } from "@/components/WalletBar";
import { Logo } from "@/components/Logo";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Sparkline } from "@/components/ui/Sparkline";
import { ToastContainer, useToast } from "@/components/ui/Toast";

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string }[] = [
  { role: "client", label: "Client", desc: "Create vaults & manage milestones" },
  { role: "freelancer", label: "Freelancer", desc: "Submit work & track earnings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { wallet, walletReady, balance, balanceHistory, isRefreshingBalance, refreshBalance } = useWallet();
  const { role, roleReady, setRole } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const { toasts, dismiss } = useToast();

  const isSelectRole = pathname === "/dashboard/select-role";

  // Redirect to landing if wallet not connected
  useEffect(() => {
    if (walletReady && !wallet) {
      router.replace("/");
    }
  }, [walletReady, wallet, router]);

  // Show role selector if no role chosen (skip when already on select-role)
  useEffect(() => {
    if (roleReady && !role && !isSelectRole) {
      router.replace("/dashboard/select-role");
    }
  }, [roleReady, role, isSelectRole, router]);

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRoleDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [roleDropdownOpen]);

  // Don't render children until ready (skip guard for select-role)
  if (!walletReady || !wallet || !roleReady || (!role && !isSelectRole)) {
    return null;
  }

  const handleRoleSwitch = (r: UserRole) => {
    setRole(r);
    setRoleDropdownOpen(false);
    router.push(`/dashboard/${r}`);
  };

  const balanceNum = parseFloat(balance || "0");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--cream-line)",
        flexShrink: 0,
      }}>
        <div style={{
          width: "100%",
          paddingLeft: "clamp(20px, 5vw, 52px)", paddingRight: "clamp(20px, 4vw, 40px)", height: 68,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          {/* Left — logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Logo variant="brand" size={40} tagline="Dashboard" />
          </Link>

          {/* Right — role dropdown + testnet badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Role dropdown */}
            {role && (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  id="role-dropdown-trigger"
                  onClick={() => setRoleDropdownOpen(prev => !prev)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", border: "1px solid var(--cream-line)",
                    background: "var(--cream-soft)", color: "var(--brown)",
                    transition: "box-shadow 0.15s, background 0.15s",
                    boxShadow: roleDropdownOpen ? "0 0 0 3px rgba(28,51,40,0.12)" : "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={e => (e.currentTarget.style.background = roleDropdownOpen ? "var(--cream)" : "var(--cream-soft)")}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "var(--green)", boxShadow: "0 0 6px #7fbf9d",
                  }} />
                  {role === "client" ? "Client" : "Freelancer"}
                  <span style={{
                    display: "inline-block", fontSize: 9, transition: "transform 0.2s",
                    transform: roleDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}>▾</span>
                </button>

                {roleDropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 200,
                    borderRadius: 14, border: "1px solid var(--cream-line)", background: "var(--paper)",
                    boxShadow: "0 12px 36px rgba(28,51,40,0.18)", zIndex: 50, overflow: "hidden",
                  }}>
                    {ROLE_OPTIONS.map(opt => (
                      <button
                        key={opt.role}
                        id={`role-option-${opt.role}`}
                        onClick={() => handleRoleSwitch(opt.role)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", padding: "12px 16px", border: "none",
                          background: role === opt.role ? "rgba(28,51,40,0.06)" : "transparent",
                          cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,51,40,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = role === opt.role ? "rgba(28,51,40,0.06)" : "transparent")}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: role === opt.role ? "var(--green)" : "var(--cream-line)",
                        }} />
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{opt.label}</span>
                          <span className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginTop: 1 }}>{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Testnet badge */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "7px 14px", borderRadius: 999,
              background: "var(--green)", border: "1px solid var(--green-deep)",
              color: "var(--brand-cream)", letterSpacing: "0.08em",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: "0 4px 14px rgba(28,51,40,0.25)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#7fbf9d",
                display: "inline-block", boxShadow: "0 0 6px #7fbf9d",
              }} />
              Testnet
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto",
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* Wallet bar */}
        <WalletBar />

        {/* Balance card */}
        <div id="balance-card" style={{
          position: "relative", overflow: "hidden",
          borderRadius: 20,
          border: "1px solid var(--green-deep)",
          background: "linear-gradient(150deg, #1a2e26 0%, #14251d 55%, #0f1f18 100%)",
          boxShadow: "0 18px 44px rgba(15,31,24,0.3)",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: "repeating-linear-gradient(to right, rgba(244,239,230,0.45) 0 1px, transparent 1px 9px)",
          }} />
          <div style={{
            position: "absolute", right: 0, bottom: 0, zIndex: 0,
            width: "46%", height: "72%", opacity: 0.5, pointerEvents: "none",
          }}>
            <Sparkline
              data={balanceHistory}
              color="rgba(244,239,230,0.55)"
              fillTop="rgba(244,239,230,0.16)"
              fillBottom="rgba(244,239,230,0)"
            />
          </div>
          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "flex-end",
            padding: "clamp(24px, 3vw, 32px)", gap: 20,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="ledger-mono" style={{ fontSize: 11, fontWeight: 700, color: "#a8b8a6", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                XLM Balance
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "var(--brand-cream)",
                  boxShadow: "0 0 0 1px rgba(244,239,230,0.2), 0 4px 14px rgba(0,0,0,0.35)",
                  color: "var(--green-deep)", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                  fontFamily: "var(--font-mono)",
                }}>
                  XLM
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    id="balance-display"
                    className="landing-serif tabular-nums"
                    style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 600, lineHeight: 1, color: "var(--brand-cream)", letterSpacing: "-0.01em" }}
                  >
                    {isRefreshingBalance
                      ? <span style={{ opacity: 0.4 }}>···</span>
                      : balanceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                    }
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "#a8b8a6" }}>XLM</span>
                </div>
              </div>
              <p className="ledger-mono" style={{ fontSize: 11, color: "#7a8f7e", marginTop: 2 }} title={wallet?.publicKey ?? ""}>
                {wallet?.publicKey ?? "—"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                  background: "rgba(244,239,230,0.1)", border: "1px solid rgba(244,239,230,0.22)",
                  color: "var(--brand-cream)",
                }}>
                  ● {wallet?.mode === "freighter" ? "Freighter"
                     : wallet?.mode === "xbull" ? "xBull"
                     : wallet?.mode === "albedo" ? "Albedo"
                     : wallet?.mode === "rabet" ? "Rabet"
                     : "Watch-only"}
                </span>
                <span className="ledger-mono" style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                  background: "rgba(244,239,230,0.06)", border: "1px solid rgba(244,239,230,0.14)",
                  color: "#a8b8a6",
                }}>
                  Stellar Testnet
                </span>
              </div>
              <button
                id="refresh-balance-btn"
                onClick={refreshBalance}
                disabled={isRefreshingBalance}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "#a8b8a6", display: "flex", alignItems: "center", gap: 5,
                  transition: "color 0.15s", padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--brand-cream)")}
                onMouseLeave={e => (e.currentTarget.style.color = "#a8b8a6")}
              >
                <span style={{ fontSize: 14, display: "inline-block", animation: isRefreshingBalance ? "spin 1s linear infinite" : "none" }}>↻</span>
                Refresh balance
              </button>
            </div>
          </div>
        </div>

        {/* Panel content */}
        {children}

        {/* Activity Feed */}
        <div id="activity-feed-section">
          <ActivityFeed />
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
