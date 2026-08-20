/**
 * myVaults.ts
 * Aggregates on-chain vault state for a connected wallet.
 * Polls contract events, then reads each vault via get_vault (read-only sim)
 * and keeps only vaults where the wallet is the client or the freelancer.
 */

import { fetchVaultEvents, VaultEvent } from "./events";
import { getVault, VaultInfo } from "./contracts";

export interface MyVault {
  vault: VaultInfo;
  latestEvent: VaultEvent | null;
}

/**
 * Fetch vaults involving `publicKey` (as client or freelancer).
 * Vaults are derived from recent contract events, so this reflects vaults
 * with activity in the recent ledger window — sufficient for "Your Vaults".
 */
export async function fetchMyVaults(publicKey: string): Promise<MyVault[]> {
  const events = await fetchVaultEvents();

  // First event per vault id = most recent activity (feed is newest-first).
  const latestByVault = new Map<string, VaultEvent>();
  for (const ev of events) {
    if (ev.vaultId === "?") continue;
    if (!latestByVault.has(ev.vaultId)) latestByVault.set(ev.vaultId, ev);
  }

  const mine: MyVault[] = [];
  for (const [vaultId, latestEvent] of latestByVault) {
    const info = await getVault(BigInt(vaultId));
    if (!info) continue;
    const key = publicKey.toLowerCase();
    const isClient = info.client.toLowerCase() === key;
    const isFreelancer = info.freelancer.toLowerCase() === key;
    if (!isClient && !isFreelancer) continue;
    mine.push({ vault: info, latestEvent });
  }
  return mine;
}

/** Fetch the most recently active vault (for the landing passbook card). */
export async function fetchLatestVault(): Promise<VaultInfo | null> {
  const events = await fetchVaultEvents();
  for (const ev of events) {
    if (ev.vaultId === "?") continue;
    const info = await getVault(BigInt(ev.vaultId));
    if (info) return info;
  }
  return null;
}

/** Palette chips for each vault status — shared by dashboard + drawer. */
export const VAULT_STATUS_META: Record<
  VaultInfo["status"],
  { label: string; bg: string; border: string; text: string }
> = {
  Created:   { label: "Ready to fund",          bg: "#f7f3ea", border: "#dcd3c1",        text: "#3e2f21" },
  Funded:    { label: "Awaiting deliverable",   bg: "#e7f2ec", border: "rgba(28,51,40,0.3)",  text: "#1c3328" },
  InReview:  { label: "In review",              bg: "#fbf3e0", border: "#d9bc7a",        text: "#8a5c1f" },
  Completed: { label: "Completed",              bg: "#e7f2ec", border: "rgba(15,31,24,0.35)", text: "#0f1f18" },
  Cancelled: { label: "Cancelled",              bg: "#fbf3f0", border: "#e3c7c0",        text: "#8a3a2a" },
  Disputed:  { label: "Disputed",               bg: "#fbf3e0", border: "#c45b4a",        text: "#8a3a2a" },
};
