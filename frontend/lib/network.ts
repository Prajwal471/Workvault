/**
 * network.ts
 * Shared network detection — derives testnet/mainnet from env vars.
 * All UI labels and Stellar Expert links use this instead of hardcoding.
 */

const PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const IS_TESTNET = PASSPHRASE.includes("Test");
export const NETWORK_NAME = IS_TESTNET ? "Testnet" : "Mainnet";
export const EXPLORER_NETWORK = IS_TESTNET ? "testnet" : "mainnet";
