"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { createVault, getVaultCount } from "@/lib/contracts";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const NATIVE_TOKEN_TESTNET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

interface CreateVaultFormProps {
  onSuccess?: (vaultId: bigint, hash: string) => void;
  onError?: (error: string) => void;
}

export function CreateVaultForm({ onSuccess, onError }: CreateVaultFormProps) {
  const { wallet } = useWallet();

  const [freelancer, setFreelancer]   = useState("");
  const [amountXLM, setAmountXLM]     = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult]           = useState<{ ok: boolean; vaultId?: bigint; hash?: string; error?: string } | null>(null);
  const [vaultCount, setVaultCount]   = useState<number | null>(null);

  useEffect(() => { getVaultCount().then(setVaultCount); }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.mode === "watch") return;
    setIsSubmitting(true); setResult(null);

    const parsed = parseFloat(amountXLM);
    if (!amountXLM || isNaN(parsed) || parsed <= 0 || !isFinite(parsed)) {
      setResult({ ok: false, error: "Enter a valid positive XLM amount." });
      onError?.("Enter a valid positive XLM amount.");
      setIsSubmitting(false);
      return;
    }

    const amountStroops = BigInt(Math.round(parsed * 10_000_000));
    const callResult = await createVault(wallet.publicKey, freelancer.trim(), NATIVE_TOKEN_TESTNET, amountStroops);
    if (callResult.ok) {
      const res = { ok: true, vaultId: callResult.data, hash: callResult.hash };
      setResult(res);
      onSuccess?.(callResult.data!, callResult.hash!);
      setFreelancer(""); setAmountXLM("");
    } else {
      setResult({ ok: false, error: callResult.error });
      onError?.(callResult.error ?? "Unknown error");
    }
    setIsSubmitting(false);
  };

  return (
    <Card id="create-vault-form-card">
      <CardHeader
        icon={<Icon name="lock" size={18} />}
        accent="#a855f7"
        title="Create Vault"
        tag="Contract Call"
        tagColor="#a855f7"
        subtitle="Level 2 · Soroban escrow"
        right={vaultCount !== null ? (
          <span style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", whiteSpace: "nowrap" }}>
            {vaultCount} vault{vaultCount !== 1 ? "s" : ""} on-chain
          </span>
        ) : undefined}
      />

      {/* No contract warning */}
      {!process.env.NEXT_PUBLIC_CONTRACT_ID && (
        <div id="contract-not-configured" style={{
          padding: "12px 14px", borderRadius: 10,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
          color: "#fbbf24", fontSize: 13, lineHeight: 1.5,
        }}>
          ⚠ Contract ID not set. Deploy the contract and add{" "}
          <code style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.3)", padding: "1px 5px", borderRadius: 4 }}>
            NEXT_PUBLIC_CONTRACT_ID
          </code>{" "}to{" "}
          <code style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.3)", padding: "1px 5px", borderRadius: 4 }}>
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

        {wallet?.mode === "watch" && <p style={{ fontSize: 13, color: "#fbbf24" }}>⚠ Watch-only mode — connect Freighter to create vaults.</p>}
        {!wallet && <p style={{ fontSize: 13, color: "#fbbf24" }}>⚠ Connect your wallet first.</p>}

        <button
          id="create-vault-btn" type="submit"
          className="btn-sweep"
          disabled={!wallet || wallet.mode === "watch" || isSubmitting}
          style={{
            width: "100%",
            background: isSubmitting || !wallet || wallet.mode === "watch"
              ? "rgba(168,85,247,0.3)"
              : "linear-gradient(135deg,#a855f7,#c026d3)",
            border: "none", borderRadius: 12,
            padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: !wallet || wallet.mode === "watch" || isSubmitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: "auto",
            transition: "opacity 0.2s, transform 0.15s ease",
          }}
        >
          {isSubmitting && (
            <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
              <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80",
              }}>✓ Vault created on-chain!</div>
              {result.vaultId !== undefined && (
                <p style={{ fontSize: 13, color: "#cbd5e1" }}>
                  Vault ID: <span style={{ fontFamily: "monospace", color: "#c084fc" }}>#{String(result.vaultId)}</span>
                </p>
              )}
              {result.hash && (
                <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "#475569", flexShrink: 0, marginTop: 1 }}>Tx:</span>
                  <a
                    id="vault-tx-hash-link"
                    href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "underline" }}
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
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171",
              }}>✕ Failed</div>
              <p id="vault-error-message" style={{ fontSize: 13, color: "#f87171", marginTop: 8, wordBreak: "break-word" }}>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
