"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { WalletBar } from "@/components/WalletBar";
import { SendXLMForm } from "@/components/SendXLMForm";
import { CreateVaultForm } from "@/components/CreateVaultForm";
import { DepositFundsForm } from "@/components/DepositFundsForm";
import { SubmitDeliverableForm } from "@/components/SubmitDeliverableForm";
import { ApproveReleaseForm } from "@/components/ApproveReleaseForm";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Logo } from "@/components/Logo";
import { DialRule } from "@/components/landing/DialRule";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";

const card: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid var(--cream-line)",
  background: "var(--paper)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  padding: "28px 28px",
};

/** Shared section divider — dial rule + uppercase ledger label. */
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DialRule />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="ledger-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brown)" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--cream-line)" }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { wallet, walletReady, balance, balanceHistory, isRefreshingBalance, refreshBalance } = useWallet();
  const router = useRouter();
  const { toasts, addToast, dismiss } = useToast();

  useEffect(() => {
    if (walletReady && !wallet) router.replace("/");
  }, [wallet, walletReady, router]);

  if (!wallet) return null;

  const balanceNum = parseFloat(balance || "0");

  const onSendError = (err: string) => {
    const isRejected = err.includes("Rejected") || err.includes("reject");
    const isWallet   = err.includes("WalletNotConnected");
    addToast("error",
      isWallet ? "Wallet Not Connected" : isRejected ? "Transaction Rejected" : "Transaction Failed",
      err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|NetworkError):\s*/, "")
    );
  };
  const onVaultError = (err: string) => {
    const isRejected = err.includes("Rejected") || err.includes("reject");
    const isWallet   = err.includes("WalletNotConnected");
    addToast("error",
      isWallet ? "Wallet Not Connected" : isRejected ? "Transaction Rejected" : "Contract Call Failed",
      err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|NetworkError):\s*/, "")
    );
  };
  const onDepositError = (err: string) => {
    const isRejected = err.includes("Rejected") || err.includes("reject");
    const isWallet   = err.includes("WalletNotConnected");
    addToast("error",
      isWallet ? "Wallet Not Connected" : isRejected ? "Transaction Rejected" : "Deposit Failed",
      err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|NetworkError):\s*/, "")
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Top nav — paper + brand ──────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--cream-line)",
        flexShrink: 0,
      }}>
        {/* Full-width — no maxWidth so logo is always at true left corner */}
        <div style={{
          width: "100%",
          paddingLeft: "clamp(20px, 5vw, 52px)", paddingRight: "clamp(20px, 4vw, 40px)", height: 68,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Left — logo + brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Logo variant="brand" size={40} tagline="Dashboard" />
          </Link>

          {/* Right — ledger Testnet badge */}
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
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto",
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Wallet bar */}
        <WalletBar />

        {/* Balance card — dark-green passbook */}
        <div id="balance-card" style={{
          position: "relative", overflow: "hidden",
          borderRadius: 20,
          border: "1px solid var(--green-deep)",
          background: "linear-gradient(150deg, #1a2e26 0%, #14251d 55%, #0f1f18 100%)",
          boxShadow: "0 18px 44px rgba(15,31,24,0.3)",
        }}>
          {/* top dial strip */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: "repeating-linear-gradient(to right, rgba(244,239,230,0.45) 0 1px, transparent 1px 9px)",
          }} />

          {/* Real balance sparkline — bottom-right */}
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
            {/* Number */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="ledger-mono" style={{ fontSize: 11, fontWeight: 700, color: "#a8b8a6", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                XLM Balance
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* XLM coin monogram */}
                <span
                  style={{
                    width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: "var(--brand-cream)",
                    boxShadow: "0 0 0 1px rgba(244,239,230,0.2), 0 4px 14px rgba(0,0,0,0.35)",
                    color: "var(--green-deep)", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                    fontFamily: "var(--font-mono)",
                  }}
                >
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
              <p className="ledger-mono" style={{ fontSize: 11, color: "#7a8f7e", marginTop: 2 }} title={wallet.publicKey}>
                {wallet.publicKey}
              </p>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                  background: "rgba(244,239,230,0.1)", border: "1px solid rgba(244,239,230,0.22)",
                  color: "var(--brand-cream)",
                }}>
                  ● {wallet.mode === "freighter" ? "Freighter"
                     : wallet.mode === "xbull" ? "xBull"
                     : wallet.mode === "albedo" ? "Albedo"
                     : wallet.mode === "rabet" ? "Rabet"
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

        {/* Forms grid — Client actions */}
        <SectionDivider label="Client Actions" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "stretch" }}>
          <div id="send-xlm-section" style={{ display: "flex", flexDirection: "column" }}>
            <SendXLMForm
              onSuccess={(hash) => addToast("success", "XLM Sent!", "Transaction confirmed on-chain.", hash)}
              onError={onSendError}
            />
          </div>
          <div id="vault-section" style={{ display: "flex", flexDirection: "column" }}>
            <CreateVaultForm
              onSuccess={(vaultId, hash) => addToast("success", `Vault #${vaultId} Created!`, "Soroban contract called.", hash)}
              onError={onVaultError}
            />
          </div>
          <div id="deposit-section" style={{ display: "flex", flexDirection: "column" }}>
            <DepositFundsForm
              onSuccess={(hash) => addToast("success", "Funds Locked!", "XLM is now held in escrow.", hash)}
              onError={onDepositError}
            />
          </div>
        </div>

        {/* Forms grid — Freelancer + Release actions */}
        <SectionDivider label="Deliver & Release" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "stretch" }}>
          <div id="deliverable-section" style={{ display: "flex", flexDirection: "column" }}>
            <SubmitDeliverableForm
              onSuccess={(hash) => addToast("success", "Deliverable Submitted!", "Vault is now In Review.", hash)}
              onError={(err) => {
                const isRejected = err.includes("Rejected") || err.includes("reject");
                addToast("error", isRejected ? "Transaction Rejected" : "Submission Failed",
                  err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|NetworkError):\s*/, ""));
              }}
            />
          </div>
          <div id="release-section" style={{ display: "flex", flexDirection: "column" }}>
            <ApproveReleaseForm
              onSuccess={(hash) => addToast("success", "Funds Released!", "Vault is now Completed.", hash)}
              onError={(err) => {
                const isRejected = err.includes("Rejected") || err.includes("reject");
                addToast("error", isRejected ? "Transaction Rejected" : "Release Failed",
                  err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|NetworkError):\s*/, ""));
              }}
            />
          </div>
        </div>

        {/* Activity Feed — full width */}
        <SectionDivider label="Live Ledger" />
        <div id="activity-feed-section">
          <ActivityFeed />
        </div>

        {/* Error reference */}
        <div id="error-reference" style={{ ...card }}>
          <p className="ledger-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
            Error Handling · 3 Types (Level 2)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { id: "error-type-1", code: "WalletNotConnected", icon: "wallet" as const, color: "#8a5c1f", bg: "#fbf3e0", border: "#d9bc7a", desc: "Action attempted without a connected wallet." },
              { id: "error-type-2", code: "TransactionRejected", icon: "x" as const, color: "#8a3a2a", bg: "#fbf3f0", border: "#e3c7c0", desc: "User dismissed the Freighter signing popup." },
              { id: "error-type-3", code: "ContractCallFailed", icon: "alert" as const, color: "#6a3e26", bg: "#f7f3ea", border: "#dcd3c1", desc: "Soroban contract returned an on-chain error." },
            ].map(e => (
              <div key={e.code} id={e.id} style={{
                borderRadius: 12, padding: "14px 16px",
                background: e.bg, border: `1px solid ${e.border}`,
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", color: e.color }}><Icon name={e.icon} size={15} /></span>
                  <code style={{ fontSize: 11, fontWeight: 700, color: e.color, fontFamily: "var(--font-mono)" }}>{e.code}</code>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
