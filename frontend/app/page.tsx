"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { WalletPicker } from "@/components/WalletPicker";
import { Logo } from "@/components/Logo";
import { SealMark } from "@/components/landing/SealMark";
import { DialRule } from "@/components/landing/DialRule";
import { BrandMark } from "@/components/landing/BrandMark";
import { VaultPassbookCard } from "@/components/landing/VaultPassbookCard";
import "./landing.css";

// Real on-chain proof (see README)
const CONTRACT_ID = "CAQ6QWRDHIF54ECVHAFIZF3CULKDFG6UXZMOYH577HZQODJPDQ7NV2WS";
const PROOF_TX = "d33f6990178296046853554007e74b3a7f941f7ec8e6dc7373a95f725a00f8a7";
const PROOF_LEDGER = 4089944;

const STAGES: { stage: string; sealed: boolean; desc: string }[] = [
  {
    stage: "Lock",
    sealed: true,
    desc: "The client locks the milestone payment into a Soroban vault.",
  },
  {
    stage: "Submit",
    sealed: true,
    desc: "The freelancer submits proof of work, linked on-chain.",
  },
  {
    stage: "Approve",
    sealed: false,
    desc: "The client reviews the deliverable and approves it.",
  },
  {
    stage: "Release",
    sealed: true,
    desc: "Funds release to the freelancer in seconds, not days.",
  },
];

export default function LandingPage() {
  const { wallet, isConnecting, error, clearError, disconnect } = useWallet();

  const [showPicker, setShowPicker] = useState(false);
  const connected = !!wallet;

  return (
    <div className="landing">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--cream-line)",
          flexShrink: 0,
        }}
      >
        <div style={{
          width: "100%",
          paddingLeft: "clamp(20px, 5vw, 52px)", paddingRight: "clamp(20px, 4vw, 40px)", height: 68,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Logo variant="brand" size={40} tagline="Testnet" />

          {connected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/dashboard" style={{ textDecoration: "none" }}>
                <button id="nav-dashboard-btn" className="btn-ledger">
                  Open Dashboard →
                </button>
              </Link>
              <button id="nav-disconnect-btn" className="btn-ledger-outline" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button
              id="nav-connect-btn"
              className="btn-ledger"
              onClick={() => setShowPicker(true)}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px 88px" }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap",
        }}>
          <div style={{
            flex: "1 1 440px", minWidth: 0,
            display: "flex", flexDirection: "column", gap: 22,
          }}>
            <h1 className="landing-serif" style={{
              fontSize: "clamp(36px, 5.5vw, 58px)",
              lineHeight: 1.1, color: "var(--green)", fontWeight: 600,
              letterSpacing: "-0.01em", margin: 0,
            }}>
              Get paid the second your work is approved.
            </h1>

            <p style={{ fontSize: 18, color: "var(--ink)", lineHeight: 1.65, maxWidth: 520, margin: 0 }}>
              <span className="ledger-mono" style={{ fontWeight: 600 }}>
                2% fees, not 20%. Paid in seconds, not days.
              </span>{" "}
              A client locks the milestone payment into a Soroban vault. When they
              approve your proof of work, the funds release — instantly, with no
              platform in between.
            </p>

            {error && (
              <div
                id="landing-error"
                style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  gap: 12, padding: "12px 14px", borderRadius: 10,
                  background: "#FBF3F0", border: "1px solid #E3C7C0",
                  color: "#8A3A2A", fontSize: 14, lineHeight: 1.5, maxWidth: 520,
                }}
              >
                <span>{error}</span>
                <button
                  onClick={clearError}
                  aria-label="Dismiss"
                  style={{ background: "none", border: "none", color: "#8A3A2A", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {connected ? (
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <button id="hero-dashboard-btn" className="btn-ledger" style={{ padding: "16px 36px", fontSize: 16 }}>
                    Open Dashboard →
                  </button>
                </Link>
              ) : (
                <button
                  id="hero-connect-btn"
                  className="btn-ledger"
                  onClick={() => setShowPicker(true)}
                  disabled={isConnecting}
                  style={{ padding: "16px 36px", fontSize: 16 }}
                >
                  {isConnecting ? "Connecting…" : "Connect Wallet"}
                </button>
              )}
            </div>

            <p className="ledger-mono" style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              Freighter · xBull · Albedo · Rabet — Stellar Testnet, auto-funded on connect
            </p>
          </div>

          <div style={{ flex: "1 1 400px", display: "flex", justifyContent: "center" }}>
            <VaultPassbookCard />
          </div>
        </div>
      </section>

      {/* ── How it works — the ledger ─────────────────────────────────── */}
      <section style={{ padding: "0 24px 96px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <DialRule />
          <div style={{ padding: "72px 0 0", textAlign: "center" }}>
            <h2 className="landing-serif" style={{
              fontSize: "clamp(28px, 3.2vw, 40px)",
              color: "var(--green)", fontWeight: 600, margin: 0,
            }}>
              The ledger, in four steps
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 16, margin: "14px 0 52px" }}>
              Every step is recorded on-chain. No middleman, no waiting on a
              platform to pay out.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 28,
          }}>
            {STAGES.map((s) => (
              <div key={s.stage} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 9,
                    padding: "8px 16px", borderRadius: 999,
                    background: s.sealed ? "var(--green)" : "var(--cream)",
                    border: s.sealed ? "1px solid var(--green-deep)" : "1px solid var(--brown)",
                    color: s.sealed ? "#F4EFE6" : "var(--brown)",
                    fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em",
                  }}>
                    {s.stage}
                    {s.sealed && <SealMark size={18} />}
                  </span>
                </div>
                <p style={{
                  color: "var(--muted)", fontSize: 14, lineHeight: 1.6,
                  margin: 0, paddingLeft: 4, maxWidth: 260,
                }}>
                  {s.desc}
                </p>
                <DialRule style={{ width: 56, height: 7 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof, not badges ─────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 96px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <DialRule />
          <div style={{ padding: "72px 0 0" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 className="landing-serif" style={{
                fontSize: "clamp(28px, 3.2vw, 40px)",
                color: "var(--green)", fontWeight: 600, margin: 0,
              }}>
                Proof, not badges
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 16, margin: "14px 0 0" }}>
                Every claim here is verifiable on the Stellar ledger right now.
              </p>
            </div>

            <div style={{
              background: "var(--cream)", border: "1px solid var(--cream-line)",
              borderRadius: 16, padding: "28px 32px",
              display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center",
            }}>
              <SealMark size={72} />

              <div style={{
                flex: "1 1 320px", minWidth: 0,
                display: "flex", flexDirection: "column", gap: 16,
              }}>
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--brown)",
                    margin: "0 0 6px",
                  }}>
                    Deployed contract
                  </p>
                  <code className="ledger-mono" style={{ fontSize: 13, wordBreak: "break-all" }}>
                    {CONTRACT_ID}
                  </code>
                </div>

                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--brown)",
                    margin: "0 0 6px",
                  }}>
                    Proof transaction · create_vault
                  </p>
                  <code className="ledger-mono" style={{ fontSize: 13, wordBreak: "break-all" }}>
                    {PROOF_TX}
                  </code>
                  <p className="ledger-mono" style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>
                    Ledger #{PROOF_LEDGER.toLocaleString("en-US")}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 4 }}>
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--green)", fontWeight: 700, fontSize: 14, textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    View contract on Stellar Expert →
                  </a>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${PROOF_TX}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--green)", fontWeight: 700, fontSize: 14, textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    View transaction →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--cream-line)", padding: "48px 24px 40px" }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
        }}>
          <BrandMark width={168} />

          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="https://github.com/Prajwal471/Workvault"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--green)", fontWeight: 700, fontSize: 14 }}
            >
              GitHub
            </a>
            <a
              href="https://developers.stellar.org/"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--green)", fontWeight: 700, fontSize: 14 }}
            >
              Stellar Docs
            </a>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--green)", fontWeight: 700, fontSize: 14 }}
            >
              Deployed Contract
            </a>
          </div>

          <p className="ledger-mono" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", margin: 0 }}>
            Stellar WorkVault · Soroban Testnet · Test XLM only — not financial advice
          </p>
        </div>
      </footer>

      <WalletPicker open={showPicker} onClose={() => setShowPicker(false)} tone="light" />
    </div>
  );
}
