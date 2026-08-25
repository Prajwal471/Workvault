"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRole } from "@/context/RoleContext";
import { getVault, getVaultCount, VaultInfo } from "@/lib/contracts";
import { VAULT_STATUS_META } from "@/lib/myVaults";
import { Card } from "@/components/ui/Card";
import { VaultActions } from "@/components/VaultActions";

interface VaultListProps {
  onAction?: () => void;
}

export function VaultList({ onAction }: VaultListProps) {
  const { wallet } = useWallet();
  const { role } = useRole();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVaults = useCallback(async (isRefresh = false) => {
    if (!wallet || !role) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const count = await getVaultCount();
      const results: VaultInfo[] = [];
      const key = wallet.publicKey.toLowerCase();

      for (let i = 1; i <= count; i++) {
        const v = await getVault(BigInt(i));
        if (!v) continue;
        const isClient = role === "client" && v.client.toLowerCase() === key;
        const isFreelancer = role === "freelancer" && v.freelancer.toLowerCase() === key;
        if (isClient || isFreelancer) results.push(v);
      }

      setVaults(results);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wallet, role]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchVaults(); }, [fetchVaults]);

  // Auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(() => fetchVaults(true), 15_000);
    return () => clearInterval(id);
  }, [fetchVaults]);

  const shorten = (key: string) => key.length < 12 ? key : `${key.slice(0, 6)}…${key.slice(-4)}`;
  const xlm = (stroops: bigint) => (Number(stroops) / 10_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  if (loading) {
    return (
      <Card style={{ padding: 24 }}>
        <p className="ledger-mono" style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
          Loading vaults…
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="ledger-mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--brown)", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
          My Vaults ({vaults.length})
        </p>
        <button
          onClick={() => fetchVaults(true)}
          disabled={refreshing}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4,
            padding: 0,
          }}
        >
          <span style={{ display: "inline-block", animation: refreshing ? "spin 1s linear infinite" : "none" }}>↻</span>
          Refresh
        </button>
      </div>

      {vaults.length === 0 ? (
        <Card style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
            No vaults found for your wallet as {role}.
          </p>
        </Card>
      ) : (
        vaults.map(v => {
          const meta = VAULT_STATUS_META[v.status];
          return (
            <Card key={String(v.id)} style={{ padding: "clamp(16px, 3vw, 20px)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ledger-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                      Vault #{String(v.id)}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                      background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text,
                    }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="ledger-mono" style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                    {role === "client" ? `Freelancer: ${shorten(v.freelancer)}` : `Client: ${shorten(v.client)}`}
                  </p>
                  <p className="landing-serif tabular-nums" style={{ fontSize: 20, fontWeight: 600, color: "var(--green)", margin: 0 }}>
                    {xlm(v.amount)} XLM
                  </p>
                </div>
                <VaultActions vault={v} onAction={onAction} />
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
