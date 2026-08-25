"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { updateMilestone, MilestoneInfo } from "@/lib/contracts";
import { TxStage } from "@/lib/stellar";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";

interface EditMilestoneFormProps {
  vaultId: bigint;
  milestone: MilestoneInfo;
  vaultTotalAmount: bigint;
  onSuccess?: (hash: string) => void;
  onError?: (error: string, hash?: string) => void;
  onStage?: (stage: TxStage) => void;
  onCancel?: () => void;
}

export function EditMilestoneForm({ vaultId, milestone, vaultTotalAmount, onSuccess, onError, onStage, onCancel }: EditMilestoneFormProps) {
  const { wallet } = useWallet();
  const [description, setDescription] = useState(milestone.description);
  const [amountXLM, setAmountXLM] = useState((Number(milestone.amount) / 10_000_000).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; hash?: string; error?: string } | null>(null);
  const [stage, setStage] = useState<TxStage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.mode === "watch") return;
    setIsSubmitting(true);
    setResult(null);
    setStage(null);

    const parsed = parseFloat(amountXLM);
    if (!amountXLM || isNaN(parsed) || parsed <= 0 || !isFinite(parsed)) {
      setResult({ ok: false, error: "Enter a valid positive XLM amount." });
      onError?.("Enter a valid positive XLM amount.");
      setIsSubmitting(false);
      return;
    }

    if (!description.trim()) {
      setResult({ ok: false, error: "Description cannot be empty." });
      onError?.("Description cannot be empty.");
      setIsSubmitting(false);
      return;
    }

    const newAmountStroops = BigInt(Math.round(parsed * 10_000_000));

    const callResult = await updateMilestone(
      wallet.publicKey, vaultId, milestone.id, description.trim(), newAmountStroops,
      (s) => { setStage(s); onStage?.(s); }
    );

    if (callResult.ok) {
      setResult({ ok: true, hash: callResult.hash });
      onSuccess?.(callResult.hash!);
    } else {
      setResult({ ok: false, error: callResult.error });
      onError?.(callResult.error ?? "Unknown error", callResult.hash);
    }
    setIsSubmitting(false);
  };

  return (
    <Card style={{ overflow: "hidden", minWidth: 0 }}>
      <CardHeader
        icon={<Icon name="lock" size={18} />}
        accent="#8a5c1f"
        title={`Edit Milestone #${String(milestone.id)}`}
        tag="Contract Call"
        tagColor="#8a5c1f"
        subtitle="Update before funding"
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, flexGrow: 1 }}>
        <Input
          id={`edit-ms-desc-${String(milestone.id)}`} label="Description" placeholder="Updated description"
          value={description} onChange={e => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          id={`edit-ms-amount-${String(milestone.id)}`} label="Amount (XLM)" type="number" placeholder="100"
          min="0.01" step="any"
          value={amountXLM} onChange={e => setAmountXLM(e.target.value)}
          hint={`Vault total: ${(Number(vaultTotalAmount) / 10_000_000).toLocaleString()} XLM`}
          disabled={isSubmitting}
        />

        {isSubmitting && <TxStepper stage={stage} />}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={!wallet || wallet.mode === "watch" || isSubmitting}
            style={{
              flex: 1, background: isSubmitting ? "var(--cream-line)" : "var(--green)",
              border: "1px solid var(--green-deep)", borderRadius: 12,
              padding: "14px", color: isSubmitting ? "var(--muted-soft)" : "var(--brand-cream)",
              fontSize: 15, fontWeight: 700,
              cursor: !wallet || wallet.mode === "watch" || isSubmitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isSubmitting ? "Updating…" : "Update Milestone"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                background: "var(--paper)", border: "1px solid var(--cream-line)", borderRadius: 12,
                padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "var(--brown)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.ok ? (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
                background: "#e7f2ec", border: "1px solid rgba(28,51,40,0.3)", color: "var(--green)",
              }}>✓ Milestone updated on-chain!</div>
              {result.hash && (
                <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span className="ledger-mono" style={{ color: "var(--muted-soft)", flexShrink: 0, marginTop: 1 }}>Tx:</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--green)", fontFamily: "var(--font-mono)", wordBreak: "break-all", textDecoration: "underline" }}
                  >
                    {result.hash}
                  </a>
                </div>
              )}
            </>
          ) : (
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
                background: "#fbf3f0", border: "1px solid #e3c7c0", color: "#8a3a2a",
              }}>✕ Failed</div>
              <p style={{ fontSize: 13, color: "#8a3a2a", marginTop: 8, wordBreak: "break-word" }}>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
