"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { WalletPicker } from "@/components/WalletPicker";
import { Logo } from "@/components/Logo";
import { Icon, IconName } from "@/components/ui/Icon";

const FEATURES: { id: string; num: string; icon: IconName; level: string; title: string; desc: string }[] = [
  {
    id: "feature-wallet",
    num: "01",
    icon: "wallet",
    level: "Level 1",
    title: "Wallet Connect",
    desc: "Freighter integration with auto-Friendbot funding. Connect your wallet, see your live XLM balance, and sign transactions in seconds.",
  },
  {
    id: "feature-send",
    num: "02",
    icon: "send",
    level: "Level 1",
    title: "Send XLM",
    desc: "Real on-chain XLM payments signed with Freighter. Live tx hash, success & failure states, and a direct link to Stellar Explorer.",
  },
  {
    id: "feature-vault",
    num: "03",
    icon: "lock",
    level: "Level 2",
    title: "Vault Contract",
    desc: "Call a deployed Soroban escrow contract directly from the UI. Create vaults, lock XLM, and track on-chain status in real time.",
  },
];

const PILLS: { icon: IconName; label: string }[] = [
  { icon: "bolt", label: "Instant payouts" },
  { icon: "lock", label: "Soroban vault" },
  { icon: "globe", label: "Testnet live" },
  { icon: "shield", label: "Non-custodial" },
  { icon: "file", label: "On-chain history" },
];

const WALLETS = [
  {
    id: "hero-freighter-btn", label: "Freighter",
    sublabel: (installed: boolean) => (installed ? "Browser extension" : "Not installed"),
    available: (installed: boolean) => installed,
    installUrl: "https://freighter.app",
    color: "#818cf8",
  },
  {
    id: "hero-xbull-btn", label: "xBull",
    sublabel: (installed: boolean) => (installed ? "Browser extension" : "Not installed"),
    available: (installed: boolean) => installed,
    installUrl: "https://xbull.app",
    color: "#fbbf24",
  },
  {
    id: "hero-albedo-btn", label: "Albedo",
    sublabel: () => "Web wallet · no extension",
    available: () => true,
    installUrl: null,
    color: "#4ade80",
  },
  {
    id: "hero-rabet-btn", label: "Rabet",
    sublabel: (installed: boolean) => (installed ? "Browser extension" : "Not installed"),
    available: (installed: boolean) => installed,
    installUrl: "https://rabet.io",
    color: "#c084fc",
  },
] as const;

export default function LandingPage() {
  const {
    wallet, isConnecting,
    freighterInstalled, xbullInstalled, albedoAvailable, rabetInstalled,
    connect, connectXBullWallet, connectAlbedoWallet, connectRabetWallet,
    error, clearError,
  } = useWallet();

  // Prevent SSR flash: don't render extension-dependent UI until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [showPicker, setShowPicker] = useState(false);

  const connectFns = { connect, connectXBullWallet, connectAlbedoWallet, connectRabetWallet };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 bg-[#08060d]/80 backdrop-blur-2xl"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="w-full flex items-center justify-between"
          style={{ height: "76px", paddingLeft: 52, paddingRight: 32 }}
        >
          {/* ── Logo ── */}
          <Logo tagline="TESTNET" />

          {/* ── Nav CTA ── */}
          {wallet ? (
            <Link href="/dashboard">
                  <button
                    id="nav-dashboard-btn"
                    className="btn-sweep"
                    onClick={() => window.location.href = "/dashboard"}
                    style={{
                      background: "linear-gradient(135deg,#a855f7,#c026d3)",
                      border: "none", borderRadius: 14, padding: "16px 34px",
                      color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 0 32px rgba(168,85,247,0.5)",
                      letterSpacing: "-0.01em",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "opacity 0.2s, box-shadow 0.2s, transform 0.15s ease",
                    }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Dashboard →
              </button>
            </Link>
          ) : (
            <button
              id="nav-connect-btn"
              className="btn-sweep"
              onClick={() => setShowPicker(true)}
              disabled={isConnecting}
              style={{
                background: isConnecting
                  ? "rgba(168,85,247,0.5)"
                  : "linear-gradient(135deg,#a855f7,#c026d3)",
                border: "none", borderRadius: 12, padding: "12px 26px",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: isConnecting ? "not-allowed" : "pointer",
                boxShadow: "0 0 24px rgba(168,85,247,0.45)",
                letterSpacing: "-0.01em", whiteSpace: "nowrap",
                transition: "opacity 0.2s, transform 0.15s ease", opacity: isConnecting ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { if (!isConnecting) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
              onMouseLeave={e => { if (!isConnecting) (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              {isConnecting && (
                <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* ── Hero — full-screen ───────────────────────────────────────── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "100svh" }}>

        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/bg-b.png')" }} />
        <div className="absolute inset-0" style={{ background: "rgba(8,6,13,0.62)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,6,13,0.35) 0%, transparent 40%, rgba(8,6,13,1) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,6,13,0.55) 0%, transparent 50%, rgba(8,6,13,0.55) 100%)" }} />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center text-center"
          style={{ maxWidth: 840, width: "100%", padding: "0 24px", paddingTop: 76, gap: 28 }}
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#cbd5e1" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built on Stellar Soroban · Live on Testnet
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 8vw, 84px)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#fff", display: "block" }}>Freelance escrow</span>
            <span className="gradient-text" style={{ display: "block" }}>you actually own.</span>
          </h1>

          {/* Sub */}
          <p style={{ maxWidth: 480, fontSize: 17, color: "rgba(203,213,225,0.75)", lineHeight: 1.7 }}>
            Lock milestone payments into a Soroban smart contract vault.
            Instant XLM release on approval — no platform, no middleman, no trust required.
          </p>

          {/* Error */}
          {error && (
            <div id="landing-error" className="w-full max-w-md flex items-start justify-between gap-3 px-4 py-3 rounded-xl text-sm text-left"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <span>{error}</span>
              <button onClick={clearError} style={{ opacity: 0.6 }}>✕</button>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {wallet ? (
              <Link href="/dashboard">
                <button
                  id="hero-dashboard-btn"
                  className="btn-sweep"
                  style={{
                    background: "linear-gradient(135deg,#a855f7,#c026d3)",
                    border: "none", borderRadius: 16, padding: "18px 44px",
                    color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 0 48px rgba(168,85,247,0.55)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Open Dashboard →
                </button>
              </Link>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 520 }}>
                <p style={{ fontSize: 13, color: "#5b5670", fontWeight: 500 }}>Choose your wallet to connect</p>
                {/* 2×2 wallet grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
                  {WALLETS.map((w) => {
                    const installed = w.available(
                      w.id === "hero-freighter-btn" ? freighterInstalled
                      : w.id === "hero-xbull-btn" ? xbullInstalled
                      : w.id === "hero-albedo-btn" ? albedoAvailable
                      : rabetInstalled
                    );
                    const onClick = connectFns[
                      w.id === "hero-freighter-btn" ? "connect"
                      : w.id === "hero-xbull-btn" ? "connectXBullWallet"
                      : w.id === "hero-albedo-btn" ? "connectAlbedoWallet"
                      : "connectRabetWallet"
                    ];
                    if (installed) {
                      return (
                        <button
                          key={w.id}
                          id={w.id}
                          onClick={onClick}
                          disabled={isConnecting}
                          style={{
                            background: `${w.color}14`, border: `1px solid ${w.color}38`,
                            borderRadius: 14, padding: "16px 20px",
                            color: w.color, fontSize: 15, fontWeight: 700,
                            cursor: isConnecting ? "not-allowed" : "pointer",
                            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6,
                            opacity: isConnecting ? 0.6 : 1,
                            transition: "opacity 0.2s, transform 0.15s, background 0.2s",
                            textAlign: "left",
                          }}
                          onMouseEnter={e => { if (!isConnecting) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                        >
                          <Icon name="wallet" size={18} color={w.color} />
                          <span>{w.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>{w.sublabel(installed)}</span>
                        </button>
                      );
                    }
                    return (
                      <a key={w.id} href={w.installUrl!} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <button
                          id={w.id}
                          style={{
                            width: "100%", background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 14, padding: "16px 20px",
                            color: "#475569", fontSize: 15, fontWeight: 700,
                            cursor: "pointer", display: "flex", flexDirection: "column",
                            alignItems: "flex-start", gap: 6, textAlign: "left",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        >
                          <Icon name="wallet" size={18} color="#475569" />
                          <span>Install {w.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 400, color: "#334155" }}>Click to get the extension →</span>
                        </button>
                      </a>
                    );
                  })}
                </div>
                {isConnecting && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13 }}>
                    <svg style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Connecting wallet…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PILLS.map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-sm"
                style={{
                  height: 34, padding: "0 14px", borderRadius: 999,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
                  color: "#8b85a0",
                }}
              >
                <Icon name={icon} size={13} color="#8b85a0" />
                {label}
              </span>
            ))}
          </div>

          {/* Scroll cue */}
          <div className="flex flex-col items-center gap-1.5 pt-2" style={{ opacity: 0.25 }}>
            <span style={{ fontSize: 10, color: "#8b85a0", letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</span>
            <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, #8b85a0, transparent)" }} />
          </div>
        </div>
      </section>

      {/* ── Feature section ──────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px 100px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>

          {/* Section label */}
          <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#5b5670", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 12 }}>
            What&apos;s inside
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", textAlign: "center", fontSize: "clamp(24px,4vw,34px)", fontWeight: 700, color: "#fff", marginBottom: 56, letterSpacing: "-0.02em" }}>
            Everything you need to{" "}
            <span className="gradient-text">earn trustlessly</span>
          </h2>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {FEATURES.map((f) => (
              <div
                key={f.id}
                id={f.id}
                style={{
                  position: "relative",
                  borderRadius: 24,
                  padding: "36px 32px",
                  background: "rgba(18,15,30,0.92)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderTop: "2px solid #a855f7",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 60px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
                }}
              >
                {/* Ghost number */}
                <span style={{
                  position: "absolute", top: 20, right: 24,
                  fontSize: 72, fontWeight: 900, lineHeight: 1,
                  color: "rgba(255,255,255,0.04)", userSelect: "none",
                  pointerEvents: "none",
                }}>
                  {f.num}
                </span>

                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#c084fc",
                }}>
                  <Icon name={f.icon} size={26} color="#c084fc" />
                </div>

                {/* Level badge */}
                <span
                  style={{
                    display: "inline-block", fontSize: 10, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(168,85,247,0.25)",
                    background: "rgba(168,85,247,0.15)", color: "#c084fc",
                    letterSpacing: "0.1em", textTransform: "uppercase", width: "fit-content",
                  }}
                >
                  {f.level}
                </span>

                {/* Title + desc */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#8b85a0", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px", textAlign: "center", fontSize: 12, color: "#5b5670" }}>
        Stellar WorkVault · Soroban Testnet · Stellar Developer Program
      </footer>

      <WalletPicker open={showPicker} onClose={() => setShowPicker(false)} />
    </div>
  );
}
