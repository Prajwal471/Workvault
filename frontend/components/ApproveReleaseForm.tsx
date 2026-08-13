"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { approveAndRelease, getVault, VaultInfo } from "@/lib/contracts";
import { TxStage } from "@/lib/stellar";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";

interface ApproveReleaseFormProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string, hash?: string) => void;
  onStage?: (stage: TxStage) => void;
}

type FormState = "idle" | "looking-up" | "ready" | "releasing" | "success" | "failed";

const STROOP = 10_000_000n;

interface VaultPreviewRow {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}

export function ApproveReleaseForm({ onSuccess, onError, onStage }: ApproveReleaseFormProps) {
  const { wallet, refreshBalance } = useWallet();

  const [vaultIdInput, setVaultIdInput] = useState("");
  const [vault, setVault]               = useState<VaultInfo | null>(null);
  const [formState, setFormState]       = useState<FormState>("idle");
  const [txHash, setTxHash]             = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [idError, setIdError]           = useState("");
  const [stage, setStage]               = useState<TxStage | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = vaultIdInput.trim();
    if (!raw || isNaN(Number(raw)) || Number(raw) <= 0) {
      setIdError("Enter a valid vault ID"); return;
    }
    setIdError(""); setVault(null); setErrorMsg(null);
    setFormState("looking-up");

    const info = await getVault(BigInt(raw));
    if (!info) {
      setErrorMsg(`Vault #${raw} not found.`);
      setFormState("idle"); return;
    }
    setVault(info);
    setFormState("ready");
  };

  const handleRelease = async () => {
    if (!wallet || !vault) return;
    setFormState("releasing"); setErrorMsg(null); setTxHash(null); setStage(null);

    const result = await approveAndRelease(wallet.publicKey, vault.id, (s) => { setStage(s); onStage?.(s); });
    if (!result.ok) {
      setFormState("failed");
      setErrorMsg(result.error ?? "Release failed");
      onError?.(result.error ?? "Release failed", result.hash);
      return;
    }
    setTxHash(result.hash ?? null);
    setFormState("success");
    onSuccess?.(result.hash ?? "");
    await refreshBalance();
  };

  const reset = () => {
    setVaultIdInput(""); setVault(null);
    setFormState("idle"); setTxHash(null); setErrorMsg(null); setIdError("");
  };

  const busy = formState === "looking-up" || formState === "releasing";
  const xlmAmount = vault ? Number(vault.amount) / Number(STROOP) : 0;

  return (
    <Card id="approve-release-card">
      <CardHeader icon={<Icon name="release" size={18} />} accent="var(--green)" title="Approve & Release" subtitle="Client · Release escrow to freelancer" />

      {formState !== "success" && (
        <>
          {/* Vault lookup */}
          <form onSubmit={handleLookup} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Input
                id="approve-vault-id"
                label="Vault ID"
                type="number" min="1" step="1"
                placeholder="e.g. 1"
                value={vaultIdInput}
                onChange={e => { setVaultIdInput(e.target.value); setVault(null); setFormState("idle"); }}
                disabled={busy}
                error={idError}
              />
            </div>
            <button type="submit" disabled={busy || !vaultIdInput} style={{
              flexShrink: 0,
              background: busy || !vaultIdInput ? "var(--cream-soft)" : "rgba(28,51,40,0.08)",
              border: "1px solid rgba(28,51,40,0.28)", borderRadius: 10, padding: "11px 18px",
              color: busy || !vaultIdInput ? "var(--muted-soft)" : "var(--green)",
              fontSize: 13, fontWeight: 700, cursor: busy || !vaultIdInput ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {formState === "looking-up" ? (
                <svg style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : <Icon name="search" size={14} />} Look up
            </button>
          </form>

          {errorMsg && formState !== "failed" && <p style={{ fontSize: 13, color: "#8a3a2a" }}>{errorMsg}</p>}

          {vault && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flexGrow: 1 }}>
              {/* Vault preview */}
              <div style={{
                borderRadius: 12, border: "1px solid var(--cream-line)",
                background: "var(--cream-soft)", padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ledger-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Vault #{String(vault.id)}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                    background: vault.status === "InReview" ? "#fbf3e0" : "var(--cream-soft)",
                    border: vault.status === "InReview" ? "1px solid #d9bc7a" : "1px solid var(--cream-line)",
                    color: vault.status === "InReview" ? "#8a5c1f" : "var(--muted)",
                  }}>{vault.status}</span>
                </div>

                {[
                  { label: "Escrow amount", value: `${xlmAmount.toLocaleString()} XLM` },
                  { label: "Freelancer", value: `${vault.freelancer.slice(0,8)}…${vault.freelancer.slice(-6)}`, mono: true },
                  ...(vault.proofUrl ? [{ label: "Proof URL", value: vault.proofUrl, link: vault.proofUrl }] : []),
                ].map((row: VaultPreviewRow) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <span className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{row.label}</span>
                    {row.link ? (
                      <a href={row.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "var(--green)", wordBreak: "break-all", textDecoration: "underline", textAlign: "right" }}>
                        {row.value.length > 40 ? row.value.slice(0, 40) + "…" : row.value}
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--brown)", fontFamily: row.mono ? "var(--font-mono)" : "inherit", textAlign: "right" }}>
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Guards */}
              {vault.status !== "InReview" && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fbf3e0", border: "1px solid #d9bc7a", color: "#8a5c1f", fontSize: 13 }}>
                  ⚠ Vault must be <code className="ledger-mono" style={{ fontSize: 11 }}>InReview</code> to release. Current status: <strong>{vault.status}</strong>
                </div>
              )}

              {vault.status === "InReview" && wallet?.publicKey !== vault.client && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fbf3f0", border: "1px solid #e3c7c0", color: "#8a3a2a", fontSize: 13 }}>
                  ⚠ Only the client (<code className="ledger-mono" style={{ fontSize: 11 }}>{vault.client.slice(0,8)}…</code>) can release funds.
                </div>
              )}

              {/* Tx progress stepper */}
              {formState === "releasing" && <TxStepper stage={stage} />}

              {/* Release button */}
              {vault.status === "InReview" && wallet?.publicKey === vault.client && (
                <button
                  id="release-funds-btn"
                  onClick={handleRelease}
                  disabled={busy}
                  style={{
                    width: "100%",
                    background: busy ? "var(--cream-line)" : "var(--green)",
                    border: "1px solid var(--green-deep)", borderRadius: 12,
                    padding: 14, color: busy ? "var(--muted-soft)" : "var(--brand-cream)",
                    fontSize: 15, fontWeight: 700,
                    cursor: busy ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: "auto",
                    transition: "opacity 0.2s, transform 0.15s ease",
                  }}
                >
                  {busy && <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {busy ? "Releasing…" : `Release ${xlmAmount.toLocaleString()} XLM to Freelancer`}
                </button>
              )}

              {formState === "failed" && errorMsg && (
                <p style={{ fontSize: 13, color: "#8a3a2a" }}>{errorMsg}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Success */}
      {formState === "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10, background: "#e7f2ec", border: "1px solid rgba(28,51,40,0.3)", color: "var(--green)" }}>
            ✓ Funds released! Vault is now Completed.
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            <strong style={{ color: "var(--green)" }}>{xlmAmount.toLocaleString()} XLM</strong> has been transferred to the freelancer.
          </p>
          {txHash && (
            <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span className="ledger-mono" style={{ color: "var(--muted-soft)", flexShrink: 0, marginTop: 1 }}>Tx:</span>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--green)", fontFamily: "var(--font-mono)", wordBreak: "break-all", textDecoration: "underline" }}>{txHash}</a>
            </div>
          )}
          <button onClick={reset} style={{ alignSelf: "flex-start", background: "var(--paper)", border: "1px solid var(--cream-line)", borderRadius: 10, padding: "8px 16px", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Release another vault
          </button>
        </div>
      )}
    </Card>
  );
}
