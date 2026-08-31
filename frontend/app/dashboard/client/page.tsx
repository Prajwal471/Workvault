"use client";

import React, { useRef } from "react";
import { TxStage } from "@/lib/stellar";
import { SendXLMForm } from "@/components/SendXLMForm";
import { CreateVaultForm } from "@/components/CreateVaultForm";
import { DepositFundsForm } from "@/components/DepositFundsForm";
import { VaultList } from "@/components/VaultList";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { NETWORK_NAME } from "@/lib/network";

const card: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid var(--cream-line)",
  background: "var(--paper)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  padding: "clamp(16px, 4vw, 28px)",
};

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="ledger-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brown)" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--cream-line)" }} />
      </div>
    </div>
  );
}

export default function ClientPage() {
  const { toasts, addToast, dismiss } = useToast();
  const pendingToastShown = useRef(false);

  const notifyPending = (s: TxStage) => {
    if (s !== "broadcast" || pendingToastShown.current) return;
    pendingToastShown.current = true;
    addToast("info", "Transaction Pending", `Broadcasting on Stellar ${NETWORK_NAME}…`);
  };
  const resetPending = () => { pendingToastShown.current = false; };

  const onSendError = (err: string, hash?: string) => {
    resetPending();
    const isRejected = err.includes("Rejected") || err.includes("reject");
    const isWallet   = err.includes("WalletNotConnected");
    const isBalance  = err.includes("InsufficientBalance");
    addToast("error",
      isWallet ? "Wallet Not Connected" : isRejected ? "Transaction Rejected" : isBalance ? "Insufficient Balance" : "Transaction Failed",
      err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|InsufficientBalance|NetworkError):\s*/, ""),
      hash
    );
  };

  return (
    <>
      {/* Forms grid */}
      <SectionDivider label="Client Actions" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "stretch" }}>
        <div id="send-xlm-section" style={{ display: "flex", flexDirection: "column" }}>
          <SendXLMForm
            onSuccess={(hash) => { resetPending(); addToast("success", "XLM Sent!", "Transaction confirmed on-chain.", hash); }}
            onError={onSendError}
            onStage={notifyPending}
          />
        </div>
        <div id="vault-section" style={{ display: "flex", flexDirection: "column" }}>
          <CreateVaultForm
            onSuccess={(vaultId, hash) => { resetPending(); addToast("success", `Vault #${vaultId} Created!`, "Soroban contract called.", hash); }}
            onError={onSendError}
            onStage={notifyPending}
          />
        </div>
        <div id="deposit-section" style={{ display: "flex", flexDirection: "column" }}>
          <DepositFundsForm
            onSuccess={(hash) => { resetPending(); addToast("success", "Funds Locked!", "XLM is now held in escrow.", hash); }}
            onError={onSendError}
            onStage={notifyPending}
          />
        </div>
      </div>

      {/* Vault list */}
      <SectionDivider label="Your Vaults" />
      <VaultList />

      {/* Error reference */}
      <div id="error-reference" style={{ ...card }}>
        <p className="ledger-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
          Error Handling · 4 Types
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { id: "error-type-1", code: "WalletNotConnected", icon: "wallet" as const, color: "#8a5c1f", bg: "#fbf3e0", border: "#d9bc7a", desc: "Action attempted without a connected wallet." },
            { id: "error-type-2", code: "TransactionRejected", icon: "x" as const, color: "#8a3a2a", bg: "#fbf3f0", border: "#e3c7c0", desc: "User dismissed the wallet signing popup." },
            { id: "error-type-3", code: "InsufficientBalance", icon: "alert" as const, color: "#6a3e26", bg: "#f7f3ea", border: "#dcd3c1", desc: "Account balance is below the requested amount." },
            { id: "error-type-4", code: "ContractCallFailed", icon: "alert" as const, color: "#6a3e26", bg: "#f7f3ea", border: "#dcd3c1", desc: "Soroban contract returned an on-chain error." },
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

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
