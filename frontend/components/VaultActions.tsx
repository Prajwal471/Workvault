"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRole } from "@/context/RoleContext";
import { VaultInfo, depositFunds, requestRelease, approveRelease, approveAndRelease, raiseDispute, refund } from "@/lib/contracts";

interface VaultActionsProps {
  vault: VaultInfo;
  onAction?: () => void;
}

export function VaultActions({ vault, onAction }: VaultActionsProps) {
  const { wallet } = useWallet();
  const { role } = useRole();
  const [loading, setLoading] = useState<string | null>(null);

  if (!wallet || !role) return null;

  const key = wallet.publicKey.toLowerCase();
  const isClient = role === "client" && vault.client.toLowerCase() === key;
  const isFreelancer = role === "freelancer" && vault.freelancer.toLowerCase() === key;

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setLoading(action);
    try {
      await fn();
      onAction?.();
    } finally {
      setLoading(null);
    }
  };

  const btnStyle = (color = "var(--green)"): React.CSSProperties => ({
    fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 8,
    border: `1px solid ${color}`, background: color === "var(--green)" ? "var(--green)" : "transparent",
    color: color === "var(--green)" ? "var(--brand-cream)" : color,
    cursor: "pointer", whiteSpace: "nowrap" as const,
    opacity: loading ? 0.6 : 1,
  });

  const actions: { label: string; action: string; fn: () => Promise<unknown>; color?: string }[] = [];

  if (isClient) {
    if (vault.status === "Created") {
      actions.push({
        label: "Fund Vault",
        action: "fund",
        fn: () => depositFunds(wallet.publicKey, vault.id),
      });
    }
    if (vault.status === "InReview") {
      actions.push({
        label: "Request Release",
        action: "request_release",
        fn: () => requestRelease(wallet.publicKey, vault.id),
      });
      actions.push({
        label: "Approve & Release (Legacy)",
        action: "approve",
        fn: () => approveAndRelease(wallet.publicKey, vault.id),
      });
    }
    if (vault.status === "PendingRelease" && !vault.clientApprovedRelease) {
      actions.push({
        label: "Approve Release",
        action: "approve_release",
        fn: () => approveRelease(wallet.publicKey, vault.id),
      });
    }
    if (vault.status === "Funded" || vault.status === "InReview" || vault.status === "PendingRelease") {
      actions.push({
        label: "Raise Dispute",
        action: "dispute",
        fn: () => raiseDispute(wallet.publicKey, vault.id, "Dispute raised from dashboard"),
        color: "#8a3a2a",
      });
    }
    if (vault.status === "Disputed") {
      actions.push({
        label: "Refund",
        action: "refund",
        fn: () => refund(wallet.publicKey, vault.id),
        color: "#8a5c1f",
      });
    }
  }

  if (isFreelancer) {
    if (vault.status === "PendingRelease" && !vault.freelancerApprovedRelease) {
      actions.push({
        label: "Approve Release",
        action: "approve_release",
        fn: () => approveRelease(wallet.publicKey, vault.id),
      });
    }
    if (vault.status === "Funded" || vault.status === "InReview" || vault.status === "PendingRelease") {
      actions.push({
        label: "Raise Dispute",
        action: "dispute",
        fn: () => raiseDispute(wallet.publicKey, vault.id, "Dispute raised from dashboard"),
        color: "#8a3a2a",
      });
    }
  }

  if (actions.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {actions.map(a => (
        <button
          key={a.action}
          onClick={() => handleAction(a.action, a.fn)}
          disabled={!!loading}
          style={btnStyle(a.color)}
        >
          {loading === a.action ? "Processing…" : a.label}
        </button>
      ))}
    </div>
  );
}
