"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { raiseDispute } from "@/lib/contracts";
import { TxStage } from "@/lib/stellar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";

interface RaiseDisputeFormProps {
  vaultId: bigint;
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

export function RaiseDisputeForm({ vaultId, onSuccess, onError }: RaiseDisputeFormProps) {
  const { wallet } = useWallet();

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; hash?: string; error?: string } | null>(null);
  const [stage, setStage] = useState<TxStage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.mode === "watch") return;
    setIsSubmitting(true);
    setResult(null);
    setStage(null);

    const trimmed = reason.trim();
    if (!trimmed) {
      setResult({ ok: false, error: "Provide a reason for the dispute." });
      setIsSubmitting(false);
      return;
    }

    const res = await raiseDispute(wallet.publicKey, vaultId, trimmed, s => {
      setStage(s);
    });

    if (res.ok) {
      setResult({ ok: true, hash: res.hash });
      onSuccess?.(res.hash!);
      setReason("");
    } else {
      setResult({ ok: false, error: res.error });
      onError?.(res.error ?? "Unknown error");
    }
    setIsSubmitting(false);
  };

  return (
    <Card id="raise-dispute-form-card" style={{ overflow: "hidden", minWidth: 0 }}>
      <CardHeader
        icon={<Icon name="alert" size={18} />}
        accent="#8a3a2a"
        title="Raise Dispute"
        tag="Escalation"
        tagColor="#8a3a2a"
        subtitle="Either party can escalate on funded vaults"
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <div>
          <label className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, display: "block" }}>
            Reason for dispute
          </label>
          <textarea
            placeholder="Describe why the deliverable doesn't meet the agreed terms…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid var(--cream-line)", background: "var(--paper)",
              fontSize: 14, color: "var(--ink)", outline: "none",
              resize: "vertical", fontFamily: "inherit",
            }}
          />
        </div>

        {wallet?.mode === "watch" && <p style={{ fontSize: 13, color: "#8a3a2a" }}>⚠ Watch-only mode — connect Freighter.</p>}
        {!wallet && <p style={{ fontSize: 13, color: "#8a3a2a" }}>⚠ Connect your wallet first.</p>}

        {isSubmitting && <TxStepper stage={stage} />}

        <button
          type="submit"
          disabled={!wallet || wallet.mode === "watch" || isSubmitting || !reason.trim()}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: "1px solid #c45b4a",
            background: !wallet || isSubmitting || !reason.trim() ? "var(--cream-line)" : "#8a3a2a",
            color: !wallet || isSubmitting || !reason.trim() ? "var(--muted)" : "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: !wallet || isSubmitting ? "not-allowed" : "pointer",
            marginTop: "auto", transition: "opacity 0.2s",
          }}
        >
          {isSubmitting ? "Submitting dispute…" : "Raise Dispute"}
        </button>
      </form>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.ok ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
              background: "#fbf3e0", border: "1px solid #d9bc7a", color: "#8a5c1f",
            }}>
              ⚠ Dispute raised — vault funds are now locked pending resolution.
            </div>
          ) : (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
                background: "#fbf3f0", border: "1px solid #e3c7c0", color: "#8a3a2a",
              }}>✕ Failed</div>
              <p style={{ fontSize: 13, color: "#8a3a2a", wordBreak: "break-word" }}>{result.error}</p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
