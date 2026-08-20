"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { setMilestones } from "@/lib/contracts";
import { TxStage } from "@/lib/stellar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";

interface MilestoneRow {
  description: string;
  amountXLM: string;
}

interface SetMilestonesFormProps {
  vaultId: bigint;
  vaultAmountXLM: number;
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

export function SetMilestonesForm({ vaultId, vaultAmountXLM, onSuccess, onError }: SetMilestonesFormProps) {
  const { wallet } = useWallet();

  const [milestones, setMilestones_] = useState<MilestoneRow[]>([
    { description: "", amountXLM: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; hash?: string; error?: string } | null>(null);
  const [stage, setStage] = useState<TxStage | null>(null);

  const totalXLM = milestones.reduce((sum, m) => sum + (parseFloat(m.amountXLM) || 0), 0);
  const sumMatches = Math.abs(totalXLM - vaultAmountXLM) < 0.0001;
  const allFilled = milestones.every(m => m.description.trim() && parseFloat(m.amountXLM) > 0);

  const addRow = () => setMilestones_(prev => [...prev, { description: "", amountXLM: "" }]);
  const removeRow = (i: number) => setMilestones_(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof MilestoneRow, value: string) =>
    setMilestones_(prev => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.mode === "watch") return;
    setIsSubmitting(true);
    setResult(null);
    setStage(null);

    if (milestones.length < 1) {
      setResult({ ok: false, error: "Add at least one milestone." });
      setIsSubmitting(false);
      return;
    }

    if (!allFilled) {
      setResult({ ok: false, error: "Fill in all milestone descriptions and amounts." });
      setIsSubmitting(false);
      return;
    }

    if (!sumMatches) {
      setResult({ ok: false, error: `Milestone amounts (Σ ${totalXLM} XLM) must equal vault total (${vaultAmountXLM} XLM).` });
      setIsSubmitting(false);
      return;
    }

    const descriptions = milestones.map(m => m.description.trim());
    const amounts = milestones.map(m => BigInt(Math.round(parseFloat(m.amountXLM) * 10_000_000)));

    const res = await setMilestones(wallet.publicKey, vaultId, descriptions, amounts, s => {
      setStage(s);
    });

    if (res.ok) {
      setResult({ ok: true, hash: res.hash });
      onSuccess?.(res.hash!);
    } else {
      setResult({ ok: false, error: res.error });
      onError?.(res.error ?? "Unknown error");
    }
    setIsSubmitting(false);
  };

  return (
    <Card id="set-milestones-form-card" style={{ overflow: "hidden", minWidth: 0 }}>
      <CardHeader
        icon={<Icon name="file" size={18} />}
        accent="var(--green)"
        title="Set Milestones"
        tag="Escrow"
        tagColor="var(--green)"
        subtitle={`Split ${vaultAmountXLM} XLM across deliverables`}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        {milestones.map((m, i) => (
          <div key={i} className="milestone-row">
            <div className="milestone-field-desc">
              <label className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, display: "block" }}>
                Milestone {i + 1}
              </label>
              <input
                placeholder="Design mockups"
                value={m.description}
                onChange={e => updateRow(i, "description", e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1px solid var(--cream-line)", background: "var(--paper)",
                  fontSize: 14, color: "var(--ink)", outline: "none",
                }}
              />
            </div>
            <div className="milestone-field-xlm">
              <label className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, display: "block" }}>
                XLM
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="100"
                value={m.amountXLM}
                onChange={e => updateRow(i, "amountXLM", e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1px solid var(--cream-line)", background: "var(--paper)",
                  fontSize: 14, color: "var(--ink)", outline: "none",
                }}
              />
            </div>
            {milestones.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={isSubmitting}
                className="milestone-delete"
                style={{
                  padding: "10px", borderRadius: 8, border: "1px solid #e3c7c0",
                  background: "#fbf3f0", color: "#8a3a2a", cursor: "pointer",
                  fontSize: 14, lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <div className="milestone-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={addRow}
            disabled={isSubmitting}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "1px dashed var(--cream-line)",
              background: "transparent", color: "var(--green)", cursor: "pointer",
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            }}
          >
            + Add milestone
          </button>
          <span className="ledger-mono" style={{
            fontSize: 13,
            color: milestones.length > 0 && !sumMatches ? "#8a3a2a" : "var(--muted)",
          }}>
            Σ {totalXLM.toFixed(2)} / {vaultAmountXLM} XLM
          </span>
        </div>

        {wallet?.mode === "watch" && <p style={{ fontSize: 13, color: "#8a3a2f" }}>⚠ Watch-only mode — connect Freighter to set milestones.</p>}
        {!wallet && <p style={{ fontSize: 13, color: "#8a3a2a" }}>⚠ Connect your wallet first.</p>}

        {isSubmitting && <TxStepper stage={stage} />}

        <button
          type="submit"
          disabled={!wallet || wallet.mode === "watch" || isSubmitting || !allFilled || !sumMatches}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "1px solid var(--green-deep)",
            background: !wallet || isSubmitting || !allFilled || !sumMatches ? "var(--cream-line)" : "var(--green)",
            color: !wallet || isSubmitting || !allFilled || !sumMatches ? "var(--muted)" : "var(--brand-cream)",
            fontSize: 15, fontWeight: 700, cursor: !wallet || isSubmitting ? "not-allowed" : "pointer",
            marginTop: "auto", transition: "opacity 0.2s",
          }}
        >
          {isSubmitting ? "Setting milestones…" : "Set Milestones on Testnet"}
        </button>
      </form>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.ok ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
              background: "#e7f2ec", border: "1px solid rgba(28,51,40,0.3)", color: "var(--green)",
            }}>
              ✓ Milestones set on-chain!
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
      <style>{`
        #set-milestones-form-card .milestone-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        #set-milestones-form-card .milestone-field-desc { flex: 2; min-width: 0; }
        #set-milestones-form-card .milestone-field-xlm  { flex: 1; min-width: 0; }
        #set-milestones-form-card .milestone-delete { margin-bottom: 0; }

        @media (max-width: 640px) {
          #set-milestones-form-card .milestone-row {
            flex-direction: column;
            gap: 10px;
          }
          #set-milestones-form-card .milestone-field-desc,
          #set-milestones-form-card .milestone-field-xlm {
            flex: none;
            width: 100%;
          }
          #set-milestones-form-card .milestone-delete {
            align-self: flex-end;
            margin-top: -4px;
          }
          #set-milestones-form-card .milestone-controls {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </Card>
    );
  }
