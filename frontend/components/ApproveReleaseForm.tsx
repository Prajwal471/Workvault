"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { approveAndRelease, getVault, VaultInfo } from "@/lib/contracts";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface ApproveReleaseFormProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

type FormState = "idle" | "looking-up" | "ready" | "releasing" | "success" | "failed";

const STROOP = 10_000_000n;

export function ApproveReleaseForm({ onSuccess, onError }: ApproveReleaseFormProps) {
  const { wallet, refreshBalance } = useWallet();

  const [vaultIdInput, setVaultIdInput] = useState("");
  const [vault, setVault]               = useState<VaultInfo | null>(null);
  const [formState, setFormState]       = useState<FormState>("idle");
  const [txHash, setTxHash]             = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [idError, setIdError]           = useState("");

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
    setFormState("releasing"); setErrorMsg(null); setTxHash(null);

    const result = await approveAndRelease(wallet.publicKey, vault.id);
    if (!result.ok) {
      setFormState("failed");
      setErrorMsg(result.error ?? "Release failed");
      onError?.(result.error ?? "Release failed");
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
      <CardHeader icon={<Icon name="release" size={18} />} accent="#a855f7" title="Approve & Release" subtitle="Client · Release escrow to freelancer" />

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
              background: busy || !vaultIdInput ? "rgba(255,255,255,0.04)" : "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.3)", borderRadius: 10, padding: "11px 18px",
              color: busy || !vaultIdInput ? "#475569" : "#c084fc",
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

          {errorMsg && formState !== "failed" && <p style={{ fontSize: 13, color: "#f87171" }}>{errorMsg}</p>}

          {vault && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flexGrow: 1 }}>
              {/* Vault preview */}
              <div style={{
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)", padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Vault #{String(vault.id)}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                    background: vault.status === "InReview" ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.06)",
                    border: vault.status === "InReview" ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.1)",
                    color: vault.status === "InReview" ? "#fbbf24" : "#64748b",
                  }}>{vault.status}</span>
                </div>

                {[
                  { label: "Escrow amount", value: `${xlmAmount.toLocaleString()} XLM` },
                  { label: "Freelancer", value: `${vault.freelancer.slice(0,8)}…${vault.freelancer.slice(-6)}`, mono: true },
                  ...(vault.proofUrl ? [{ label: "Proof URL", value: vault.proofUrl, link: vault.proofUrl }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>{row.label}</span>
                    {(row as any).link ? (
                      <a href={(row as any).link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#c084fc", wordBreak: "break-all", textDecoration: "underline", textAlign: "right" }}>
                        {row.value.length > 40 ? row.value.slice(0, 40) + "…" : row.value}
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: (row as any).mono ? "monospace" : "inherit", textAlign: "right" }}>
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Guards */}
              {vault.status !== "InReview" && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 13 }}>
                  ⚠ Vault must be <code style={{ fontSize: 11 }}>InReview</code> to release. Current status: <strong>{vault.status}</strong>
                </div>
              )}

              {vault.status === "InReview" && wallet?.publicKey !== vault.client && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>
                  ⚠ Only the client (<code style={{ fontFamily: "monospace", fontSize: 11 }}>{vault.client.slice(0,8)}…</code>) can release funds.
                </div>
              )}

              {/* Release button */}
              {vault.status === "InReview" && wallet?.publicKey === vault.client && (
                <button
                  id="release-funds-btn"
                  className="btn-sweep"
                  onClick={handleRelease}
                  disabled={busy}
                  style={{
                    width: "100%",
                    background: busy ? "rgba(168,85,247,0.2)" : "linear-gradient(135deg,#a855f7,#c026d3)",
                    border: "none", borderRadius: 12, padding: 14,
                    color: "#fff", fontSize: 15, fontWeight: 800,
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
                <p style={{ fontSize: 13, color: "#f87171" }}>{errorMsg}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Success */}
      {formState === "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}>
            ✓ Funds released! Vault is now Completed.
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            <strong style={{ color: "#4ade80" }}>{xlmAmount.toLocaleString()} XLM</strong> has been transferred to the freelancer.
          </p>
          {txHash && (
            <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#475569", flexShrink: 0, marginTop: 1 }}>Tx:</span>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "underline" }}>{txHash}</a>
            </div>
          )}
          <button onClick={reset} style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Release another vault
          </button>
        </div>
      )}
    </Card>
  );
}
