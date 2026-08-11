"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { depositFunds, getVault, VaultInfo } from "@/lib/contracts";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface DepositFundsFormProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

type FormState = "idle" | "looking-up" | "ready" | "depositing" | "success" | "failed";

const STROOP = 10_000_000n;

export function DepositFundsForm({ onSuccess, onError }: DepositFundsFormProps) {
  const { wallet, refreshBalance } = useWallet();

  const [vaultIdInput, setVaultIdInput] = useState("");
  const [vault, setVault]               = useState<VaultInfo | null>(null);
  const [formState, setFormState]       = useState<FormState>("idle");
  const [txHash, setTxHash]             = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [idError, setIdError]           = useState("");

  // ── Step 1: look up the vault ──────────────────────────────────────────────
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = vaultIdInput.trim();
    if (!raw || isNaN(Number(raw)) || Number(raw) <= 0) {
      setIdError("Enter a valid vault ID (positive integer)");
      return;
    }
    setIdError("");
    setVault(null);
    setErrorMsg(null);
    setFormState("looking-up");

    const info = await getVault(BigInt(raw));
    if (!info) {
      setErrorMsg(`Vault #${raw} not found on-chain.`);
      setFormState("idle");
      return;
    }
    setVault(info);
    setFormState("ready");
  };

  // ── Step 2: deposit ────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!wallet || !vault) return;
    setFormState("depositing");
    setErrorMsg(null);
    setTxHash(null);

    const result = await depositFunds(wallet.publicKey, vault.id);

    if (!result.ok) {
      setFormState("failed");
      setErrorMsg(result.error ?? "Deposit failed");
      onError?.(result.error ?? "Deposit failed");
      return;
    }

    setTxHash(result.hash ?? null);
    setFormState("success");
    onSuccess?.(result.hash ?? "");
    await refreshBalance();
  };

  const reset = () => {
    setVaultIdInput(""); setVault(null);
    setFormState("idle"); setTxHash(null);
    setErrorMsg(null); setIdError("");
  };

  const xlmAmount = vault ? Number(vault.amount) / Number(STROOP) : 0;

  const statusColor: Record<string, { bg: string; border: string; text: string; label: string }> = {
    Created:   { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.3)",  text: "#818cf8", label: "Ready to fund" },
    Funded:    { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   text: "#4ade80", label: "Already funded" },
    InReview:  { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24", label: "In review" },
    Completed: { bg: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.3)",  text: "#22d3ee", label: "Completed" },
    Cancelled: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171", label: "Cancelled" },
  };
  const sc = vault ? (statusColor[vault.status] ?? statusColor.Created) : null;

  const busy = formState === "looking-up" || formState === "depositing";

  return (
    <Card id="deposit-funds-form-card">
      <CardHeader icon={<Icon name="deposit" size={18} />} accent="#a855f7" title="Deposit Funds" subtitle="Level 2 · Lock XLM into escrow" />

      {/* Step 1 — Vault lookup */}
      {formState !== "success" && (
        <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Input
                id="deposit-vault-id"
                label="Vault ID"
                placeholder="e.g. 1"
                type="number"
                min="1"
                step="1"
                value={vaultIdInput}
                onChange={e => { setVaultIdInput(e.target.value); setVault(null); setFormState("idle"); }}
                error={idError}
                disabled={busy}
              />
            </div>
            <button
              id="lookup-vault-btn"
              type="submit"
              disabled={busy || !vaultIdInput}
              style={{
                flexShrink: 0,
                background: busy || !vaultIdInput ? "rgba(255,255,255,0.06)" : "rgba(168,85,247,0.15)",
                border: "1px solid rgba(168,85,247,0.35)",
                borderRadius: 10, padding: "11px 18px",
                color: busy || !vaultIdInput ? "#475569" : "#c084fc",
                fontSize: 13, fontWeight: 700,
                cursor: busy || !vaultIdInput ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              {formState === "looking-up" ? (
                <svg style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : <Icon name="search" size={14} />}
              Look up
            </button>
          </div>
        </form>
      )}

      {/* Error banner */}
      {errorMsg && formState !== "failed" && (
        <p style={{ fontSize: 13, color: "#f87171" }}>{errorMsg}</p>
      )}

      {/* Step 2 — Vault preview + deposit */}
      {vault && formState !== "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flexGrow: 1 }}>
          {/* Vault info card */}
          <div style={{
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
                Vault #{String(vault.id)}
              </span>
              {sc && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                  background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                }}>
                  {sc.label}
                </span>
              )}
            </div>

            {[
              { label: "Amount", value: `${xlmAmount.toLocaleString("en-US", { maximumFractionDigits: 7 })} XLM` },
              { label: "Freelancer", value: `${vault.freelancer.slice(0, 8)}…${vault.freelancer.slice(-6)}`, mono: true },
              { label: "Client", value: `${vault.client.slice(0, 8)}…${vault.client.slice(-6)}`, mono: true },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#475569" }}>{row.label}</span>
                <span style={{
                  fontSize: 12, color: "#94a3b8",
                  fontFamily: row.mono ? "monospace" : "inherit",
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Guard: only client can deposit */}
          {vault.status !== "Created" && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
              color: "#fbbf24", fontSize: 13,
            }}>
              ⚠ This vault is <strong>{vault.status}</strong> — only <code style={{ fontSize: 11 }}>Created</code> vaults can be funded.
            </div>
          )}

          {vault.status === "Created" && wallet?.publicKey !== vault.client && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
              color: "#f87171", fontSize: 13,
            }}>
              ⚠ Only the vault's client (<code style={{ fontFamily: "monospace", fontSize: 11 }}>{vault.client.slice(0,8)}…</code>) can deposit.
            </div>
          )}

          {/* Deposit button */}
          {vault.status === "Created" && (
            <button
              id="deposit-funds-btn"
              className="btn-sweep"
              onClick={handleDeposit}
              disabled={busy || !wallet || wallet.mode === "watch" || wallet.publicKey !== vault.client}
              style={{
                width: "100%",
                background: busy || !wallet || wallet.mode === "watch" || wallet.publicKey !== vault.client
                  ? "rgba(168,85,247,0.2)"
                  : "linear-gradient(135deg,#a855f7,#c026d3)",
                border: "none", borderRadius: 12,
                padding: 14, color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: busy || !wallet || wallet.mode === "watch" || wallet.publicKey !== vault.client
                  ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: "auto",
                transition: "opacity 0.2s, transform 0.15s ease",
              }}
            >
              {formState === "depositing" && (
                <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {formState === "depositing"
                ? "Locking funds…"
                : `Lock ${xlmAmount.toLocaleString()} XLM into Vault #${String(vault.id)}`}
            </button>
          )}

          {/* Failed */}
          {formState === "failed" && errorMsg && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13,
                fontWeight: 600, padding: "8px 14px", borderRadius: 8,
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171",
              }}>✕ Deposit failed</div>
              <p style={{ fontSize: 13, color: "#f87171", wordBreak: "break-word" }}>{errorMsg}</p>
            </div>
          )}
        </div>
      )}

      {/* Success state */}
      {formState === "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13,
            fontWeight: 600, padding: "10px 16px", borderRadius: 10,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80",
          }}>✓ Funds locked in escrow!</div>

          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            <strong style={{ color: "#4ade80" }}>{xlmAmount.toLocaleString()} XLM</strong> is now held in Vault #{String(vault?.id)}.
            The freelancer can now submit their deliverable.
          </p>

          {txHash && (
            <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#475569", flexShrink: 0, marginTop: 1 }}>Tx:</span>
              <a
                id="deposit-tx-hash-link"
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "underline" }}
              >
                {txHash}
              </a>
            </div>
          )}

          <button
            onClick={reset}
            style={{
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "8px 16px", color: "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Deposit to another vault
          </button>
        </div>
      )}
    </Card>
  );
}
