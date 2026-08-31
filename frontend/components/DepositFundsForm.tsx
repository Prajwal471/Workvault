"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { depositFunds, getVault, VaultInfo } from "@/lib/contracts";
import { TxStage, checkSufficientBalance } from "@/lib/stellar";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";
import { useNetwork } from "@/lib/useNetwork";

interface DepositFundsFormProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string, hash?: string) => void;
  onStage?: (stage: TxStage) => void;
}

type FormState = "idle" | "looking-up" | "ready" | "depositing" | "success" | "failed";

const STROOP = 10_000_000n;

export function DepositFundsForm({ onSuccess, onError, onStage }: DepositFundsFormProps) {
  const { wallet, refreshBalance } = useWallet();
  const { network } = useNetwork();

  const [vaultIdInput, setVaultIdInput] = useState("");
  const [vault, setVault]               = useState<VaultInfo | null>(null);
  const [formState, setFormState]       = useState<FormState>("idle");
  const [txHash, setTxHash]             = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [idError, setIdError]           = useState("");
  const [stage, setStage]               = useState<TxStage | null>(null);

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
    setStage(null);

    const check = await checkSufficientBalance(wallet.publicKey, xlmAmount);
    if (!check.ok) {
      setFormState("failed");
      setErrorMsg(check.error ?? "Insufficient balance");
      onError?.(check.error ?? "Insufficient balance");
      return;
    }

    const result = await depositFunds(wallet.publicKey, vault.id, (s) => { setStage(s); onStage?.(s); });

    if (!result.ok) {
      setFormState("failed");
      setErrorMsg(result.error ?? "Deposit failed");
      onError?.(result.error ?? "Deposit failed", result.hash);
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
    Created:   { bg: "#f7f3ea",   border: "#dcd3c1",                  text: "#3e2f21", label: "Ready to fund" },
    Funded:    { bg: "#e7f2ec",   border: "rgba(28,51,40,0.3)",       text: "#1c3328", label: "Already funded" },
    InReview:  { bg: "#fbf3e0",   border: "#d9bc7a",                  text: "#8a5c1f", label: "In review" },
    Completed: { bg: "#e7f2ec",   border: "rgba(15,31,24,0.35)",      text: "#0f1f18", label: "Completed" },
    Cancelled: { bg: "#fbf3f0",   border: "#e3c7c0",                  text: "#8a3a2a", label: "Cancelled" },
  };
  const sc = vault ? (statusColor[vault.status] ?? statusColor.Created) : null;

  const busy = formState === "looking-up" || formState === "depositing";

  return (
    <Card id="deposit-funds-form-card" style={{ overflow: "hidden", minWidth: 0 }}>
      <CardHeader icon={<Icon name="deposit" size={18} />} accent="var(--green)" title="Deposit Funds" subtitle="Level 2 · Lock XLM into escrow" />

      {/* Step 1 — Vault lookup */}
      {formState !== "success" && (
        <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="lookup-row" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
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
                background: busy || !vaultIdInput ? "var(--cream-soft)" : "rgba(28,51,40,0.08)",
                border: "1px solid rgba(28,51,40,0.28)",
                borderRadius: 10, padding: "11px 18px",
                color: busy || !vaultIdInput ? "var(--muted-soft)" : "var(--green)",
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
        <p style={{ fontSize: 13, color: "#8a3a2a" }}>{errorMsg}</p>
      )}

      {/* Step 2 — Vault preview + deposit */}
      {vault && formState !== "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flexGrow: 1 }}>
          {/* Vault info card */}
          <div style={{
            borderRadius: 12, border: "1px solid var(--cream-line)",
            background: "var(--cream-soft)", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="ledger-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
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
                <span className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)" }}>{row.label}</span>
                <span style={{
                  fontSize: 12, color: "var(--brown)",
                  fontFamily: row.mono ? "var(--font-mono)" : "inherit",
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
              background: "#fbf3e0", border: "1px solid #d9bc7a",
              color: "#8a5c1f", fontSize: 13,
            }}>
              ⚠ This vault is <strong>{vault.status}</strong> — only <code className="ledger-mono" style={{ fontSize: 11 }}>Created</code> vaults can be funded.
            </div>
          )}

          {vault.status === "Created" && wallet?.publicKey !== vault.client && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "#fbf3f0", border: "1px solid #e3c7c0",
              color: "#8a3a2a", fontSize: 13,
            }}>
              ⚠ Only the vault&apos;s client (<code className="ledger-mono" style={{ fontSize: 11 }}>{vault.client.slice(0,8)}…</code>) can deposit.
            </div>
          )}

          {/* Tx progress stepper */}
          {formState === "depositing" && <TxStepper stage={stage} />}

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
                  ? "var(--cream-line)"
                  : "var(--green)",
                border: "1px solid var(--green-deep)", borderRadius: 12,
                padding: 14, color: busy || !wallet || wallet.mode === "watch" || wallet.publicKey !== vault.client
                  ? "var(--muted-soft)"
                  : "var(--brand-cream)",
                fontSize: 15, fontWeight: 700,
                cursor: busy || !wallet || wallet.mode === "watch" || wallet.publicKey !== vault.client
                  ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: "auto",
                transition: "opacity 0.2s, transform 0.15s ease",
              }}
            >
              {formState === "depositing" && (
                <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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
                background: "#fbf3f0", border: "1px solid #e3c7c0", color: "#8a3a2a",
              }}>✕ Deposit failed</div>
              <p style={{ fontSize: 13, color: "#8a3a2a", wordBreak: "break-word" }}>{errorMsg}</p>
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
            background: "#e7f2ec", border: "1px solid rgba(28,51,40,0.3)", color: "var(--green)",
          }}>✓ Funds locked in escrow!</div>

          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            <strong style={{ color: "var(--green)" }}>{xlmAmount.toLocaleString()} XLM</strong> is now held in Vault #{String(vault?.id)}.
            The freelancer can now submit their deliverable.
          </p>

          {txHash && (
            <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span className="ledger-mono" style={{ color: "var(--muted-soft)", flexShrink: 0, marginTop: 1 }}>Tx:</span>
              <a
                id="deposit-tx-hash-link"
                href={`https://stellar.expert/explorer/${network.explorer}/tx/${txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--green)", fontFamily: "var(--font-mono)", wordBreak: "break-all", textDecoration: "underline" }}
              >
                {txHash}
              </a>
            </div>
          )}

          <button
            onClick={reset}
            style={{
              alignSelf: "flex-start",
              background: "var(--paper)", border: "1px solid var(--cream-line)",
              borderRadius: 10, padding: "8px 16px", color: "var(--muted)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Deposit to another vault
          </button>
        </div>
      )}
      <style>{`
        #deposit-funds-form-card .lookup-row { min-width: 0; }
        @media (max-width: 640px) {
          #deposit-funds-form-card .lookup-row {
            flex-direction: column;
            align-items: stretch;
          }
          #deposit-funds-form-card .lookup-row button { width: 100%; justify-content: center; }
        }
      `}</style>
    </Card>
  );
}
