"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { createVault, getVaultCount } from "@/lib/contracts";
import { TxStage, checkSufficientBalance } from "@/lib/stellar";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TxStepper } from "@/components/ui/TxStepper";

const NATIVE_TOKEN_TESTNET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

interface CreateVaultFormProps {
  onSuccess?: (vaultId: bigint, hash: string) => void;
  onError?: (error: string, hash?: string) => void;
  onStage?: (stage: TxStage) => void;
}

export function CreateVaultForm({ onSuccess, onError, onStage }: CreateVaultFormProps) {
  const { wallet } = useWallet();

  const [freelancer, setFreelancer]   = useState("");
  const [amountXLM, setAmountXLM]     = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult]           = useState<{ ok: boolean; vaultId?: bigint; hash?: string; error?: string } | null>(null);
  const [vaultCount, setVaultCount]   = useState<number | null>(null);
  const [stage, setStage]             = useState<TxStage | null>(null);

  useEffect(() => { getVaultCount().then(setVaultCount); }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.mode === "watch") return;
    setIsSubmitting(true); setResult(null); setStage(null);

    const parsed = parseFloat(amountXLM);
    if (!amountXLM || isNaN(parsed) || parsed <= 0 || !isFinite(parsed)) {
      setResult({ ok: false, error: "Enter a valid positive XLM amount." });
      onError?.("Enter a valid positive XLM amount.");
      setIsSubmitting(false);
      return;
    }

    const amountStroops = BigInt(Math.round(parsed * 10_000_000));

    const check = await checkSufficientBalance(wallet.publicKey, parsed);
    if (!check.ok) {
      setResult({ ok: false, error: check.error });
      onError?.(check.error ?? "Insufficient balance");
      setIsSubmitting(false);
      return;
    }

    const callResult = await createVault(wallet.publicKey, freelancer.trim(), NATIVE_TOKEN_TESTNET, amountStroops, (s) => { setStage(s); onStage?.(s); });
    if (callResult.ok) {
      const res = { ok: true, vaultId: callResult.data, hash: callResult.hash };
      setResult(res);
      onSuccess?.(callResult.data!, callResult.hash!);
      setFreelancer(""); setAmountXLM("");
    } else {
      setResult({ ok: false, error: callResult.error });
      onError?.(callResult.error ?? "Unknown error", callResult.hash);
    }
    setIsSubmitting(false);
  };

  return (
    <Card id="create-vault-form-card">
      <CardHeader
        icon={<Icon name="lock" size={18} />}
        accent="var(--green)"
        title="Create Vault"
        tag="Contract Call"
        tagColor="var(--green)"
        subtitle="Level 2 · Soroban escrow"
        right={vaultCount !== null ? (
          <span className="ledger-mono" style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {vaultCount} vault{vaultCount !== 1 ? "s" : ""} on-chain
          </span>
        ) : undefined}
      />

      {/* No contract warning */}
      {!process.env.NEXT_PUBLIC_CONTRACT_ID && (
        <div id="contract-not-configured" style={{
          padding: "12px 14px", borderRadius: 10,
          background: "#fbf3e0", border: "1px solid #d9bc7a",
          color: "#8a5c1f", fontSize: 13, lineHeight: 1.5,
        }}>
          ⚠ Contract ID not set. Deploy the contract and add{" "}
          <code style={{ fontFamily: "var(--font-mono)", background: "rgba(138,92,31,0.12)", padding: "1px 5px", borderRadius: 4 }}>
            NEXT_PUBLIC_CONTRACT_ID
          </code>{" "}to{" "}
          <code style={{ fontFamily: "var(--font-mono)", background: "rgba(138,92,31,0.12)", padding: "1px 5px", borderRadius: 4 }}>
            .env.local
          </code>.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, flexGrow: 1 }}>
        <Input
          id="vault-freelancer" label="Freelancer Address" placeholder="GABC…XYZ"
          value={freelancer} onChange={e => setFreelancer(e.target.value)}
          hint="Stellar address of the freelancer" disabled={isSubmitting}
        />
        <Input
          id="vault-amount" label="Escrow Amount (XLM)" type="number" placeholder="100"
          min="1" step="any"
          value={amountXLM} onChange={e => setAmountXLM(e.target.value)}
          hint="Total XLM to be locked in the vault" disabled={isSubmitting}
        />

        {wallet?.mode === "watch" && <p style={{ fontSize: 13, color: "#8a5c1f" }}>⚠ Watch-only mode — connect Freighter to create vaults.</p>}
        {!wallet && <p style={{ fontSize: 13, color: "#8a5c1f" }}>⚠ Connect your wallet first.</p>}

        {/* Tx progress stepper */}
        {isSubmitting && <TxStepper stage={stage} />}

        <button
          id="create-vault-btn" type="submit"
          className="btn-sweep"
          disabled={!wallet || wallet.mode === "watch" || isSubmitting}
          style={{
            width: "100%",
            background: isSubmitting || !wallet || wallet.mode === "watch"
              ? "var(--cream-line)"
              : "var(--green)",
            border: "1px solid var(--green-deep)", borderRadius: 12,
            padding: "14px", color: isSubmitting || !wallet || wallet.mode === "watch" ? "var(--muted-soft)" : "var(--brand-cream)",
            fontSize: 15, fontWeight: 700,
            cursor: !wallet || wallet.mode === "watch" || isSubmitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: "auto",
            transition: "opacity 0.2s, transform 0.15s ease",
          }}
        >
          {isSubmitting && (
            <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {isSubmitting ? "Creating vault…" : "Create Vault on Testnet"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div id="vault-result" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.ok ? (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
                background: "#e7f2ec", border: "1px solid rgba(28,51,40,0.3)", color: "var(--green)",
              }}>✓ Vault created on-chain!</div>
              {result.vaultId !== undefined && (
                <p style={{ fontSize: 13, color: "var(--ink)" }}>
                  Vault ID: <span className="ledger-mono" style={{ fontWeight: 700, color: "var(--green)" }}>#{String(result.vaultId)}</span>
                </p>
              )}
              {result.hash && (
                <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span className="ledger-mono" style={{ color: "var(--muted-soft)", flexShrink: 0, marginTop: 1 }}>Tx:</span>
                  <a
                    id="vault-tx-hash-link"
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
              <p id="vault-error-message" style={{ fontSize: 13, color: "#8a3a2a", marginTop: 8, wordBreak: "break-word" }}>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
