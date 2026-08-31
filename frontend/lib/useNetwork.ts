/**
 * useNetwork.ts
 * React hook exposing the effective network for rendering.
 *
 * - When a wallet is connected, returns the WALLET's actual network.
 * - Otherwise returns the deployment's configured network.
 */
"use client";

import { useWallet } from "@/context/WalletContext";
import { NetworkInfo, deploymentNetwork } from "@/lib/network";

export interface UseNetworkResult {
  /** Network to render in the UI (follows the connected wallet). */
  network: NetworkInfo;
  /** True if the connected wallet's network differs from the deployment's. */
  mismatch: boolean;
}

export function useNetwork(): UseNetworkResult {
  const { walletNetwork, networkMismatch } = useWallet();
  return { network: walletNetwork, mismatch: networkMismatch };
}

export { deploymentNetwork };
