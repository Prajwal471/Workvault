"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { sendXLM } from "@/lib/stellar";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface SendXLMFormProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

type TxState = "idle" | "signing" | "pending" | "success" | "failed";

const stateLabel: Record<TxState, string> = {
  idle: "Send XLM",
  signing: "Waiting for Freighter…",
  pending: "Broadcasting…",
  success: "Sent! Send again",
  failed: "Try again",
};

export function SendXLMForm({ onSuccess, onError }: SendXLMFormProps) {
  const { wallet, networkPassphrase, refreshBalance } = useWallet();

  const [destination, setDestination] = useState("");
  const [amount, setAmount]           = useState("");
  const [txState, setTxState]         = useState<TxState>("idle");
  const [txHash, setTxHash]           = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [destError, setDestError]     = useState("");
  const [amountError, setAmountError] = useState("");

  const validate = () => {
    let ok = true;
    if (!destination.trim() || !destination.startsWith("G") || destination.length !== 56) {
      setDestError("Enter a valid Stellar address (G…, 56 chars)"); ok = false;
    } else setDestError("");
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError("Enter a positive XLM amount"); ok = false;
    } else setAmountError("");
    return ok;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setErrorMessage(null); setTxHash(null); setTxState("signing");
    const result = await sendXLM(wallet?.publicKey ?? "", destination.trim(), amount.trim(), networkPassphrase);
    if (!result.ok) {
      setTxState("failed");
      setErrorMessage(result.error ?? "Transaction failed");
      onError?.(result.error ?? "Transaction failed");
      return;
    }
    setTxState("pending"); setTxHash(result.hash ?? null);
    setTxState(result.status === "success" ? "success" : "failed");
    if (result.status === "success") {
      onSuccess?.(result.hash ?? "");
      await refreshBalance();
      setDestination(""); setAmount("");
    }
  };

  const busy = txState === "signing" || txState === "pending";

  return (
    <Card id="send-xlm-form-card">
      <CardHeader icon={<Icon name="send" size={18} />} accent="#a855f7" title="Send XLM" subtitle="Level 1 · Signed with Freighter" />

      {/* Form */}
      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 16, flexGrow: 1 }}>
        <Input
          id="send-destination" label="Recipient Address" placeholder="GABC…XYZ"
          value={destination} onChange={e => setDestination(e.target.value)}
          error={destError} disabled={busy}
        />
        <Input
          id="send-amount" label="Amount (XLM)" type="number" placeholder="0.00"
          min="0.0000001" step="any"
          value={amount} onChange={e => setAmount(e.target.value)}
          error={amountError} disabled={busy}
        />

        {!wallet && <p style={{ fontSize: 13, color: "#fbbf24" }}>⚠ Connect your wallet to send XLM.</p>}
        {wallet?.mode === "watch" && <p style={{ fontSize: 13, color: "#fbbf24" }}>⚠ Watch-only mode — connect Freighter to sign.</p>}

        {/* Submit button */}
        <button
          id="send-xlm-btn" type="submit"
          className="btn-sweep"
          disabled={!wallet || wallet.mode === "watch" || busy}
          style={{
            width: "100%",
            background: busy || !wallet || wallet.mode === "watch"
              ? "rgba(168,85,247,0.3)"
              : "linear-gradient(135deg,#a855f7,#c026d3)",
            border: "none", borderRadius: 12,
            padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: !wallet || wallet.mode === "watch" || busy ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: "auto",
            transition: "opacity 0.2s, transform 0.15s ease",
          }}
        >
          {busy && (
            <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
              <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {stateLabel[txState]}
        </button>
      </form>

      {/* Feedback */}
      {txState !== "idle" && txState !== "signing" && (
        <div id="tx-feedback" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
            background: txState === "success" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
            border: txState === "success" ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(248,113,113,0.25)",
            color: txState === "success" ? "#4ade80" : "#f87171",
          }}>
            <span>{txState === "success" ? "✓" : "✕"}</span>
            {txState === "success" ? "Transaction confirmed" : txState === "pending" ? "Broadcasting…" : "Transaction failed"}
          </div>

          {txHash && (
            <div style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#475569", flexShrink: 0, marginTop: 1 }}>Tx:</span>
              <a
                id="tx-hash-link"
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "underline" }}
              >
                {txHash}
              </a>
            </div>
          )}

          {errorMessage && (
            <p id="tx-error-message" style={{ fontSize: 13, color: "#f87171", wordBreak: "break-word" }}>{errorMessage}</p>
          )}
        </div>
      )}
    </Card>
  );
}
