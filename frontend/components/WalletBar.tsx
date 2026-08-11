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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
          >
            <span>⚠</span>
            <span>Freighter wallet not detected.{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-300"
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
            className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
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

        <WalletPicker open={showPicker} onClose={() => setShowPicker(false)} />
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
        borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(18,15,30,0.92)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg,#a855f7,#c026d3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", flexShrink: 0,
        }}>
          {wallet.mode === "watch" ? <Icon name="eye" size={18} /> : <Icon name="star" size={16} />}
        </div>

        {/* Address + balance */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              id="wallet-address"
              style={{ fontFamily: "monospace", fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}
              title={wallet.publicKey}
            >
              {wallet.displayKey}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: wallet.mode === "freighter" ? "rgba(34,197,94,0.12)"
                        : wallet.mode === "xbull"     ? "rgba(251,191,36,0.12)"
                        : wallet.mode === "albedo"    ? "rgba(99,102,241,0.12)"
                        : wallet.mode === "rabet"     ? "rgba(192,132,252,0.12)"
                        : "rgba(34,211,238,0.12)",
              border: wallet.mode === "freighter" ? "1px solid rgba(34,197,94,0.25)"
                    : wallet.mode === "xbull"     ? "1px solid rgba(251,191,36,0.25)"
                    : wallet.mode === "albedo"    ? "1px solid rgba(99,102,241,0.25)"
                    : wallet.mode === "rabet"     ? "1px solid rgba(192,132,252,0.25)"
                    : "1px solid rgba(34,211,238,0.25)",
              color: wallet.mode === "freighter" ? "#4ade80"
                   : wallet.mode === "xbull"     ? "#fbbf24"
                   : wallet.mode === "albedo"    ? "#818cf8"
                   : wallet.mode === "rabet"     ? "#c084fc"
                   : "#22d3ee",
            }}>
              ● {wallet.mode === "freighter" ? "Freighter"
                : wallet.mode === "xbull"   ? "xBull"
                : wallet.mode === "albedo"  ? "Albedo"
                : wallet.mode === "rabet"   ? "Rabet"
                : "Watch-only"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span id="xlm-balance" style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
              {isRefreshingBalance ? "…" : `${parseFloat(balance).toFixed(2)} XLM`}
            </span>
            <button
              id="refresh-balance-btn"
              onClick={refreshBalance}
              disabled={isRefreshingBalance}
              title="Refresh balance"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#475569", fontSize: 13, padding: 0, lineHeight: 1,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
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
              background: "linear-gradient(135deg,#a855f7,#c026d3)",
              border: "none", borderRadius: 10, padding: "8px 16px",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Connect Wallet
          </button>
        )}
        <button
          id="disconnect-wallet-btn"
          onClick={disconnect}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "8px 16px",
            color: "#64748b", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          Disconnect
        </button>
      </div>

      <WalletPicker open={showPicker} onClose={() => setShowPicker(false)} />
    </div>
  );
}
