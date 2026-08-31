"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { submitDeliverable, getVault, VaultInfo } from "@/lib/contracts";
import { TxStage } from "@/lib/stellar";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";
import { EXPLORER_NETWORK } from "@/lib/network";

interface SubmitDeliverableFormProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string, hash?: string) => void;
  onStage?: (stage: TxStage) => void;
}

type FormState = "idle" | "looking-up" | "ready" | "submitting" | "success" | "failed";

export function SubmitDeliverableForm({ onSuccess, onError, onStage }: SubmitDeliverableFormProps) {
  const { wallet } = useWallet();

  const [vaultIdInput, setVaultIdInput] = useState("");
  const [proofUrl, setProofUrl]         = useState("");
  const [vault, setVault]               = useState<VaultInfo | null>(null);
  const [formState, setFormState]       = useState<FormState>("idle");
  const [txHash, setTxHash]             = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [idError, setIdError]           = useState("");
  const [urlError, setUrlError]         = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !vault) return;

    const url = proofUrl.trim();
    if (!url) { setUrlError("Enter a proof URL"); return; }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setUrlError("URL must start with http:// or https://"); return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setUrlError("URL must start with http:// or https://"); return;
    }
    setUrlError("");

    setFormState("submitting"); setErrorMsg(null); setTxHash(null); setStage(null);
    const result = await submitDeliverable(wallet.publicKey, vault.id, url, (s) => { setStage(s); onStage?.(s); });

    if (!result.ok) {
      setFormState("failed");
      setErrorMsg(result.error ?? "Submission failed");
      onError?.(result.error ?? "Submission failed", result.hash);
      return;
    }
    setTxHash(result.hash ?? null);
    setFormState("success");
    onSuccess?.(result.hash ?? "");
  };

  const reset = () => {
    setVaultIdInput(""); setProofUrl(""); setVault(null);
    setFormState("idle"); setTxHash(null); setErrorMsg(null); setIdError(""); setUrlError("");
  };

  const busy = formState === "looking-up" || formState === "submitting";

  return (
    <Card id="submit-deliverable-card" style={{ overflow: "hidden", minWidth: 0 }}>
      <CardHeader icon={<Icon name="file" size={18} />} accent="var(--green)" title="Submit Deliverable" subtitle="Freelancer · Submit proof of work" />

      {formState !== "success" && (
        <>
          {/* Step 1: Vault lookup */}
          <form onSubmit={handleLookup} className="lookup-row" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Input
                id="deliverable-vault-id" label="Vault ID" placeholder="e.g. 1"
                type="number" min="1" step="1"
                value={vaultIdInput}
                onChange={e => { setVaultIdInput(e.target.value); setVault(null); setFormState("idle"); }}
                error={idError} disabled={busy}
              />
            </div>
            <button type="submit" disabled={busy || !vaultIdInput} style={{
              flexShrink: 0,
              background: busy || !vaultIdInput ? "var(--cream-soft)" : "rgba(28,51,40,0.08)",
              border: "1px solid rgba(28,51,40,0.28)",
              borderRadius: 10, padding: "11px 18px",
              color: busy || !vaultIdInput ? "var(--muted-soft)" : "var(--green)",
              fontSize: 13, fontWeight: 700,
              cursor: busy || !vaultIdInput ? "not-allowed" : "pointer",
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

          {/* Step 2: proof URL + guards */}
          {vault && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, flexGrow: 1 }}>
              {/* Vault status badge */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: 10,
                background: "var(--cream-soft)", border: "1px solid var(--cream-line)",
              }}>
                <span className="ledger-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>Vault #{String(vault.id)}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                  background: vault.status === "Funded" ? "#e7f2ec" : "#fbf3f0",
                  border: vault.status === "Funded" ? "1px solid rgba(28,51,40,0.3)" : "1px solid #e3c7c0",
                  color: vault.status === "Funded" ? "var(--green)" : "#8a3a2a",
                }}>{vault.status}</span>
              </div>

              {vault.status !== "Funded" && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fbf3e0", border: "1px solid #d9bc7a", color: "#8a5c1f", fontSize: 13 }}>
                  ⚠ Only <code className="ledger-mono" style={{ fontSize: 11 }}>Funded</code> vaults can receive a deliverable. This vault is <strong>{vault.status}</strong>.
                </div>
              )}

              {vault.status === "Funded" && wallet?.publicKey !== vault.freelancer && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fbf3f0", border: "1px solid #e3c7c0", color: "#8a3a2a", fontSize: 13 }}>
                  ⚠ Only the assigned freelancer (<code className="ledger-mono" style={{ fontSize: 11 }}>{vault.freelancer.slice(0,8)}…</code>) can submit.
                </div>
              )}

              {vault.status === "Funded" && wallet?.publicKey === vault.freelancer && (
                <>
                  <Input
                    id="proof-url" label="Proof URL"
                    placeholder="https://github.com/org/repo/pull/42"
                    type="url" value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    error={urlError} disabled={busy}
                    hint="GitHub PR · Figma link · Google Doc · any public URL"
                  />
                  {/* Tx progress stepper */}
                  {busy && <TxStepper stage={stage} />}
                  <button type="submit" disabled={busy} style={{
                    width: "100%",
                    background: busy ? "var(--cream-line)" : "var(--green)",
                    border: "1px solid var(--green-deep)", borderRadius: 12,
                    padding: 14, color: busy ? "var(--muted-soft)" : "var(--brand-cream)",
                    fontSize: 15, fontWeight: 700,
                    cursor: busy ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: "auto",
                    transition: "opacity 0.2s, transform 0.15s ease",
                  }}>
                    {busy && <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {busy ? "Submitting…" : "Submit Deliverable"}
                  </button>
                </>
              )}

              {formState === "failed" && errorMsg && (
                <p style={{ fontSize: 13, color: "#8a3a2a" }}>{errorMsg}</p>
              )}
            </form>
          )}
        </>
      )}

      {/* Success */}
      {formState === "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10, background: "#e7f2ec", border: "1px solid rgba(28,51,40,0.3)", color: "var(--green)" }}>
            ✓ Deliverable submitted — vault is now In Review!
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>The client can now review your work and release the funds.</p>
          {txHash && (
            <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span className="ledger-mono" style={{ color: "var(--muted-soft)", flexShrink: 0, marginTop: 1 }}>Tx:</span>
              <a href={`https://stellar.expert/explorer/${EXPLORER_NETWORK}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--green)", fontFamily: "var(--font-mono)", wordBreak: "break-all", textDecoration: "underline" }}>{txHash}</a>
            </div>
          )}
          <button onClick={reset} style={{ alignSelf: "flex-start", background: "var(--paper)", border: "1px solid var(--cream-line)", borderRadius: 10, padding: "8px 16px", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Submit another
          </button>
        </div>
      )}
      <style>{`
        #submit-deliverable-card .lookup-row { min-width: 0; }
        @media (max-width: 640px) {
          #submit-deliverable-card .lookup-row {
            flex-direction: column;
            align-items: stretch;
          }
          #submit-deliverable-card .lookup-row button { width: 100%; justify-content: center; }
        }
      `}</style>
    </Card>
  );
}
