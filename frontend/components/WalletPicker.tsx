"use client";

import React, { useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { Icon } from "@/components/ui/Icon";
import { NETWORK_NAME } from "@/lib/network";

interface WalletPickerProps {
  open: boolean;
  onClose: () => void;
  tone?: "dark" | "light";
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

export function WalletPicker({ open, onClose, tone = "dark" }: WalletPickerProps) {
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

  const light = tone === "light";
  const t = {
    overlay: light ? "rgba(32,28,23,0.35)" : "rgba(8,6,13,0.8)",
    overlayBlur: light ? "blur(4px)" : "blur(12px)",
    panelBg: light ? "#FFFFFF" : "#0f0c1a",
    panelBorder: light ? "#C9BEA8" : "rgba(255,255,255,0.1)",
    title: light ? "#201C17" : "#fff",
    sub: light ? "#5E564B" : "#64748b",
    closeBg: light ? "#EFE9DC" : "rgba(255,255,255,0.05)",
    closeBorder: light ? "#C9BEA8" : "rgba(255,255,255,0.1)",
    closeColor: light ? "#3E2F21" : "#64748b",
    rowBg: light ? "#F7F3EA" : "rgba(255,255,255,0.03)",
    rowBorder: light ? "#DCD3C1" : "rgba(255,255,255,0.09)",
    rowHoverBg: light ? "#EFE9DC" : "rgba(255,255,255,0.06)",
    rowText: light ? "#201C17" : "#f1f5f9",
    rowSub: light ? "#5E564B" : "#475569",
    rowInstallBg: light ? "#F7F3EA" : "rgba(255,255,255,0.02)",
    rowInstallBorder: light ? "#DCD3C1" : "rgba(255,255,255,0.12)",
    rowInstallText: light ? "#5E564B" : "#475569",
    footer: light ? "#5E564B" : "#334155",
  };

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
      color: "#1c3328",
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
        background: t.overlay,
        backdropFilter: t.overlayBlur,
        WebkitBackdropFilter: t.overlayBlur,
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
          borderRadius: light ? 16 : 24,
          border: `1px solid ${t.panelBorder}`,
          background: t.panelBg,
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: t.title, margin: 0, letterSpacing: "-0.02em" }}>
              Connect a Wallet
            </h2>
            <p style={{ fontSize: 13, color: t.sub, margin: 0, lineHeight: 1.5 }}>
              Choose how you want to sign transactions
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: t.closeBg,
              border: `1px solid ${t.closeBorder}`,
              borderRadius: 10,
              width: 32,
              height: 32,
              color: t.closeColor,
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
                    borderRadius: light ? 12 : 14,
                    background: t.rowBg,
                    border: `1px solid ${t.rowBorder}`,
                    color: t.rowText,
                    cursor: isConnecting ? "not-allowed" : "pointer",
                    opacity: isConnecting ? 0.55 : 1,
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (isConnecting) return;
                    (e.currentTarget as HTMLButtonElement).style.background = t.rowHoverBg;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = w.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = t.rowBg;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = t.rowBorder;
                  }}
                >
                  <span style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: light ? "#EFE9DC" : `${w.color}1a`,
                    border: light ? "1px solid #C9BEA8" : `1px solid ${w.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name="wallet" size={19} color={light ? "#3E2F21" : w.color} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: t.rowText }}>{w.label}</span>
                    <span style={{ fontSize: 11, color: t.rowSub }}>{w.sublabel}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: light ? "#3E2F21" : w.color, flexShrink: 0 }}>
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
                      borderRadius: light ? 12 : 14,
                      background: t.rowInstallBg,
                      border: `1px dashed ${t.rowInstallBorder}`,
                      color: t.rowInstallText,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: light ? "#EFE9DC" : "rgba(255,255,255,0.04)",
                      border: light ? "1px solid #C9BEA8" : "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.5,
                      flexShrink: 0,
                    }}>
                      <Icon name="wallet" size={19} color={light ? "#5E564B" : "#64748b"} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.rowInstallText }}>{w.label}</span>
                      <span style={{ fontSize: 11, color: t.rowInstallText }}>Not installed</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.rowInstallText, flexShrink: 0 }}>
                      Install →
                    </span>
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: t.footer, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          {NETWORK_NAME} only · Auto-funded via Friendbot on connect
        </p>
      </div>
    </div>
  );
}
