"use client";

import React, { useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { Icon } from "@/components/ui/Icon";

interface WalletPickerProps {
  open: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  label: string;
  color: string;
  sublabel: string;
  available: boolean;
  installUrl: string | null;
  connect: () => Promise<void>;
}

export function WalletPicker({ open, onClose }: WalletPickerProps) {
  const {
    wallet,
    isConnecting,
    freighterInstalled,
    xbullInstalled,
    albedoAvailable,
    rabetInstalled,
    connect,
    connectXBullWallet,
    connectAlbedoWallet,
    connectRabetWallet,
  } = useWallet();

  // Close once a wallet has successfully connected.
  useEffect(() => {
    if (open && wallet) onClose();
  }, [wallet, open, onClose]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const options: WalletOption[] = [
    {
      id: "pick-freighter",
      label: "Freighter",
      color: "#818cf8",
      sublabel: freighterInstalled ? "Browser extension" : "Not installed",
      available: freighterInstalled,
      installUrl: "https://freighter.app",
      connect,
    },
    {
      id: "pick-xbull",
      label: "xBull",
      color: "#fbbf24",
      sublabel: xbullInstalled ? "Browser extension" : "Not installed",
      available: xbullInstalled,
      installUrl: "https://xbull.app",
      connect: connectXBullWallet,
    },
    {
      id: "pick-albedo",
      label: "Albedo",
      color: "#4ade80",
      sublabel: "Web wallet · no extension",
      available: albedoAvailable,
      installUrl: null,
      connect: connectAlbedoWallet,
    },
    {
      id: "pick-rabet",
      label: "Rabet",
      color: "#c084fc",
      sublabel: rabetInstalled ? "Browser extension" : "Not installed",
      available: rabetInstalled,
      installUrl: "https://rabet.io",
      connect: connectRabetWallet,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a wallet"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(8,6,13,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "#0f0c1a",
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Connect a Wallet
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Choose how you want to sign transactions
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              width: 32,
              height: 32,
              color: "#64748b",
              fontSize: 15,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Wallet list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options.map((w) => (
            <div key={w.id}>
              {w.available ? (
                <button
                  id={w.id}
                  onClick={w.connect}
                  disabled={isConnecting}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(255,255,255,0.09)`,
                    color: "#cbd5e1",
                    cursor: isConnecting ? "not-allowed" : "pointer",
                    opacity: isConnecting ? 0.55 : 1,
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (isConnecting) return;
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${w.color}55`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)";
                  }}
                >
                  <span style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${w.color}1a`,
                    border: `1px solid ${w.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name="wallet" size={19} color={w.color} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{w.label}</span>
                    <span style={{ fontSize: 11, color: "#475569" }}>{w.sublabel}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: w.color, flexShrink: 0 }}>
                    {isConnecting ? "Connecting…" : "Connect →"}
                  </span>
                </button>
              ) : (
                <a
                  id={w.id}
                  href={w.installUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px dashed rgba(255,255,255,0.12)",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.5,
                      flexShrink: 0,
                    }}>
                      <Icon name="wallet" size={19} color="#64748b" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#64748b" }}>{w.label}</span>
                      <span style={{ fontSize: 11, color: "#334155" }}>Not installed</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                      Install →
                    </span>
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "#334155", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          Testnet only · Auto-funded via Friendbot on connect
        </p>
      </div>
    </div>
  );
}
