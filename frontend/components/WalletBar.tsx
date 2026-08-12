"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WalletPicker } from "@/components/WalletPicker";
import { Icon } from "@/components/ui/Icon";

export function WalletBar() {
  const {
    wallet,
    balance,
    isConnecting,
    freighterInstalled,
    error,
    disconnect,
    watchAddress,
    clearError,
    isRefreshingBalance,
    refreshBalance,
  } = useWallet();

  const [showWatch, setShowWatch] = useState(false);
  const [watchInput, setWatchInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const handleWatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = watchInput.trim();
    if (addr.length === 56 && addr.startsWith("G")) {
      watchAddress(addr);
      setShowWatch(false);
      setWatchInput("");
    }
  };

  if (!wallet) {
    return (
      <div className="flex flex-col gap-3">
        {/* Freighter not installed warning */}
        {!freighterInstalled && (
          <div
            id="freighter-missing-warning"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbf3e0] border border-[#d9bc7a] text-[#8a5c1f] text-sm"
          >
            <span>⚠</span>
            <span>Freighter wallet not detected.{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#6a3e26]"
              >
                Install it here
              </a>
            </span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            id="wallet-error"
            className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#fbf3f0] border border-[#e3c7c0] text-[#8a3a2a] text-sm"
          >
            <span>{error}</span>
            <button onClick={clearError} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            id="connect-wallet-btn"
            onClick={() => setShowPicker(true)}
            loading={isConnecting}
            disabled={isConnecting}
            size="md"
          >
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </Button>
          <Button
            id="watch-wallet-btn"
            variant="secondary"
            size="md"
            onClick={() => setShowWatch((v) => !v)}
          >
            <Icon name="eye" size={14} /> Watch Address
          </Button>
        </div>

        {showWatch && (
          <form onSubmit={handleWatchSubmit} className="flex gap-2 items-end">
            <Input
              id="watch-address-input"
              label="Stellar Address (G…)"
              placeholder="GABC…XYZ"
              value={watchInput}
              onChange={(e) => setWatchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="md" variant="secondary">
              Watch
            </Button>
          </form>
        )}

        <WalletPicker open={showPicker} onClose={() => setShowPicker(false)} tone="light" />
      </div>
    );
  }

  return (
    <div
      id="wallet-bar"
      style={{
        display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between",
        gap: 16, padding: "16px 20px",
        borderRadius: 16, border: "1px solid var(--cream-line)",
        background: "var(--cream-soft)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--green), var(--walnut))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--brand-cream)", flexShrink: 0,
        }}>
          {wallet.mode === "watch" ? <Icon name="eye" size={18} /> : <Icon name="star" size={16} />}
        </div>

        {/* Address + balance */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              id="wallet-address"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)", fontWeight: 600 }}
              title={wallet.publicKey}
            >
              {wallet.displayKey}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "rgba(28,51,40,0.08)", border: "1px solid rgba(28,51,40,0.18)",
              color: "var(--green)",
            }}>
              ● {wallet.mode === "freighter" ? "Freighter"
                : wallet.mode === "xbull"   ? "xBull"
                : wallet.mode === "albedo"  ? "Albedo"
                : wallet.mode === "rabet"   ? "Rabet"
                : "Watch-only"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span id="xlm-balance" className="ledger-mono" style={{ fontSize: 12, color: "var(--muted)" }}>
              {isRefreshingBalance ? "…" : `${parseFloat(balance).toFixed(2)} XLM`}
            </span>
            <button
              id="refresh-balance-btn"
              onClick={refreshBalance}
              disabled={isRefreshingBalance}
              title="Refresh balance"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted-soft)", fontSize: 13, padding: 0, lineHeight: 1,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--brown)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-soft)")}
            >↻</button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {wallet.mode === "watch" && (
          <button
            id="connect-freighter-btn"
            onClick={() => setShowPicker(true)}
            disabled={isConnecting}
            style={{
              background: "var(--green)",
              border: "1px solid var(--green-deep)", borderRadius: 10, padding: "8px 16px",
              color: "var(--brand-cream)", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Connect Wallet
          </button>
        )}
        <button
          id="disconnect-wallet-btn"
          onClick={disconnect}
          style={{
            background: "var(--paper)", border: "1px solid var(--cream-line)",
            borderRadius: 10, padding: "8px 16px",
            color: "var(--muted)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8a3a2a"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(138,58,42,0.35)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cream-line)"; }}
        >
          Disconnect
        </button>
      </div>

      <WalletPicker open={showPicker} onClose={() => setShowPicker(false)} tone="light" />
    </div>
  );
}
