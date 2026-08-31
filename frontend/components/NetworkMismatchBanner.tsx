"use client";

import { useWallet } from "@/context/WalletContext";
import { deploymentNetwork } from "@/lib/network";

/**
 * Prominent warning shown when the connected wallet's network differs from the
 * deployment's configured network. Prevents signing-for-on-network / submitting-
 * to-another confusion.
 */
export function NetworkMismatchBanner() {
  const { walletNetwork, networkMismatch } = useWallet();
  if (!networkMismatch) return null;

  return (
    <div id="network-mismatch-banner" style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 16px", borderRadius: 12,
      background: "#fbf3e0", border: "1px solid #d9bc7a",
      color: "#8a5c1f", fontSize: 13, lineHeight: 1.5,
    }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>⚠</span>
      <div>
        <strong style={{ fontWeight: 700 }}>Network mismatch:</strong>{" "}
        Your wallet is on <strong>{walletNetwork.name}</strong>, but this app is
        deployed on <strong>{deploymentNetwork.name}</strong>. Transactions will be
        submitted to the <strong>{deploymentNetwork.name}</strong> network. Switch
        your wallet to {deploymentNetwork.name} or use the correct deployment.
      </div>
    </div>
  );
}
