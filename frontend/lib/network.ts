/**
 * network.ts
 * Shared network detection.
 *
 * Before a wallet connects, the network is derived from the build-time env var
 * `NEXT_PUBLIC_NETWORK_PASSPHRASE` (i.e. the deployment's configured network).
 *
 * Once a wallet connects, the UI should reflect the WALLET's actual network.
 * Use `networkFromPassphrase(passphrase)` to derive `NetworkInfo` from any
 * passphrase (the connected wallet's is exposed via `useWallet().walletNetwork`).
 */

export interface NetworkInfo {
  isTestnet: boolean;
  name: string;
  explorer: string;
}

const DEFAULT_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";

/** Derive a network descriptor from a Stellar network passphrase. */
export function networkFromPassphrase(passphrase: string): NetworkInfo {
  const isTestnet = passphrase.includes("Test");
  return {
    isTestnet,
    name: isTestnet ? "Testnet" : "Mainnet",
    explorer: isTestnet ? "testnet" : "mainnet",
  };
}

/** Network configured for this deployment (used before a wallet connects). */
export const deploymentNetwork: NetworkInfo = networkFromPassphrase(DEFAULT_PASSPHRASE);

/** True if the connected wallet's network matches this deployment's network. */
export function passphraseMatchesDeployment(passphrase: string): boolean {
  return networkFromPassphrase(passphrase).isTestnet === deploymentNetwork.isTestnet;
}

// Keep the simple constants for any non-React consumers that legitimately need
// the deployment network (e.g. static rendering / lib modules).
export const IS_TESTNET = deploymentNetwork.isTestnet;
export const NETWORK_NAME = deploymentNetwork.name;
export const EXPLORER_NETWORK = deploymentNetwork.explorer;

export { MAINNET_PASSPHRASE };
