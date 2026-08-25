"use client";

import React, { useRef } from "react";
import { TxStage } from "@/lib/stellar";
import { SubmitDeliverableForm } from "@/components/SubmitDeliverableForm";
import { VaultList } from "@/components/VaultList";
import { ToastContainer, useToast } from "@/components/ui/Toast";

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

export default function FreelancerPage() {
  const { toasts, addToast, dismiss } = useToast();
  const pendingToastShown = useRef(false);

  const notifyPending = (s: TxStage) => {
    if (s !== "broadcast" || pendingToastShown.current) return;
    pendingToastShown.current = true;
    addToast("info", "Transaction Pending", "Broadcasting on Stellar Testnet…");
  };
  const resetPending = () => { pendingToastShown.current = false; };

  const onFreelancerError = (err: string, hash?: string) => {
    resetPending();
    const isRejected = err.includes("Rejected") || err.includes("reject");
    const isBalance  = err.includes("InsufficientBalance");
    addToast("error",
      isRejected ? "Transaction Rejected" : isBalance ? "Insufficient Balance" : "Submission Failed",
      err.replace(/^(WalletNotConnected|TransactionRejected|ContractCallFailed|InsufficientBalance|NetworkError):\s*/, ""),
      hash
    );
  };

  return (
    <>
      {/* Freelancer forms */}
      <SectionDivider label="Freelancer Actions" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "stretch" }}>
        <div id="deliverable-section" style={{ display: "flex", flexDirection: "column" }}>
          <SubmitDeliverableForm
            onSuccess={(hash) => { resetPending(); addToast("success", "Deliverable Submitted!", "Vault is now In Review.", hash); }}
            onError={onFreelancerError}
            onStage={notifyPending}
          />
        </div>
      </div>

      {/* Vault list */}
      <SectionDivider label="Your Assigned Vaults" />
      <VaultList />

      {/* Freelancer info */}
      <div style={{
        borderRadius: 20, border: "1px solid var(--cream-line)",
        background: "var(--paper)", padding: "clamp(16px, 4vw, 28px)",
      }}>
        <p className="ledger-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
          Freelancer Workflow
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { step: "1", title: "Get Hired", desc: "A client creates a vault with your Stellar address as the freelancer." },
            { step: "2", title: "Funded Vault", desc: "The client funds the vault. XLM is locked in the Soroban contract." },
            { step: "3", title: "Submit Work", desc: "Submit your proof of work URL. The vault status changes to InReview." },
            { step: "4", title: "Get Paid", desc: "The client approves and funds release instantly to your wallet." },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "var(--green)", color: "var(--brand-cream)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>
                {s.step}
              </span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
