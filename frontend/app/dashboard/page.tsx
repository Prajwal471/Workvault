"use client";

import React, { useEffect, useState } from "react";
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
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";

const card: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(18,15,30,0.92)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  padding: "28px 28px",
};

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
      <div className="dashboard-bg" />

      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(8,6,13,0.85)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        {/* Full-width — no maxWidth so logo is always at true left corner */}
        <div style={{
          width: "100%",
          paddingLeft: 52, paddingRight: 32, height: 68,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Left — logo + brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Logo size={44} tagline="DASHBOARD" />
          </Link>

          {/* Right — Testnet badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 999,
            background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)",
            color: "#c084fc", letterSpacing: "0.08em",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", display: "inline-block", boxShadow: "0 0 6px #a855f7" }} />
            Testnet
          </span>
        </div>
      </header>


      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto",
        padding: "28px 28px 48px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Wallet bar */}
        <WalletBar />

        {/* Balance card */}
        <div id="balance-card" style={{
          position: "relative", overflow: "hidden",
          borderRadius: 20, border: "1px solid rgba(255,255,255,0.09)",
        }}>
          {/* Subtle bg image strip */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/bg-b.png')",
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.12,
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(168,85,247,0.28) 0%, rgba(8,6,13,0.72) 55%, rgba(217,70,239,0.18) 100%)",
          }} />

          {/* Real balance sparkline — bottom-right */}
          <div style={{
            position: "absolute", right: 0, bottom: 0, zIndex: 0,
            width: "46%", height: "72%", opacity: 0.55, pointerEvents: "none",
          }}>
            <Sparkline data={balanceHistory} />
          </div>

          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "flex-end",
            padding: "28px 32px", gap: 20,
          }}>
            {/* Number */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5b5670", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                XLM Balance
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* XLM coin monogram */}
                <span
                  style={{
                    width: 38, height: 38, flexShrink: 0, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, #a855f7 0%, #c026d3 100%)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.15), 0 4px 16px rgba(168,85,247,0.45)",
                    color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  XLM
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    id="balance-display"
                    className="gradient-text tabular-nums"
                    style={{ fontSize: "clamp(36px,6vw,56px)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}
                  >
                    {isRefreshingBalance
                      ? <span style={{ opacity: 0.4 }}>···</span>
                      : balanceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                    }
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "#5b5670" }}>XLM</span>
                </div>
              </div>
              <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#454156", marginTop: 2 }} title={wallet.publicKey}>
                {wallet.publicKey}
              </p>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                  background: wallet.mode === "freighter" ? "rgba(34,197,94,0.12)" : "rgba(34,211,238,0.12)",
                  border: wallet.mode === "freighter" ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(34,211,238,0.25)",
                  color: wallet.mode === "freighter" ? "#4ade80" : "#22d3ee",
                }}>
                  ● {wallet.mode === "freighter" ? "Freighter" : "Watch-only"}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#64748b",
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
                  fontSize: 12, color: "#5b5670", display: "flex", alignItems: "center", gap: 5,
                  transition: "color 0.15s", padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8b85a0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#5b5670")}
              >
                <span style={{ fontSize: 14, display: "inline-block", animation: isRefreshingBalance ? "spin 1s linear infinite" : "none" }}>↻</span>
                Refresh balance
              </button>
            </div>
          </div>
        </div>

        {/* Forms grid — Client actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5b5670" }}>Client Actions</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5b5670" }}>Deliver & Release</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>
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
        <div id="activity-feed-section">
          <ActivityFeed />
        </div>

        {/* Error reference */}
        <div id="error-reference" style={{ ...card }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#454156", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
            Error Handling · 3 Types (Level 2)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { id: "error-type-1", code: "WalletNotConnected", icon: "wallet" as const, color: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.2)", desc: "Action attempted without a connected wallet." },
              { id: "error-type-2", code: "TransactionRejected", icon: "x" as const, color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)", desc: "User dismissed the Freighter signing popup." },
              { id: "error-type-3", code: "ContractCallFailed", icon: "alert" as const, color: "#c084fc", bg: "rgba(192,132,252,0.07)", border: "rgba(192,132,252,0.2)", desc: "Soroban contract returned an on-chain error." },
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
                <p style={{ fontSize: 12, color: "#8b85a0", lineHeight: 1.6 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
