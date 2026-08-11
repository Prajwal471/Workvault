/**
 * freighter.ts
 * Wrappers around @stellar/freighter-api v6 with correct types.
 *
 * v6 API key changes vs older versions:
 *   - `getPublicKey` → `getAddress` (returns { address: string })
 *   - `requestAccess` returns { address: string }
 *   - `signTransaction` returns { signedTxXdr: string, signerAddress: string }
 *   - All functions return { error?: FreighterApiError } on failure
 */

"use client";

// ── Types ──────────────────────────────────────────────────────────────────

export type WalletCheckResult =
  | { ok: true; publicKey: string; networkPassphrase: string }
  | { ok: false; error: string };

export type SignResult =
  | { ok: true; signedXdr: string }
  | { ok: false; error: string };

// ── Freighter API wrappers ─────────────────────────────────────────────────

/**
 * Check whether Freighter is installed in the browser.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected } = await import("@stellar/freighter-api");
    const result = await isConnected();
    return result.isConnected ?? false;
  } catch {
    return false;
  }
}

/**
 * Request wallet access and return the public key + network passphrase.
 * Shows the Freighter pop-up if not yet granted.
 */
export async function connectFreighter(): Promise<WalletCheckResult> {
  try {
    const { requestAccess, getNetwork } = await import("@stellar/freighter-api");

    // requestAccess returns { address: string } or { error: FreighterApiError }
    const accessResult = await requestAccess();

    if (accessResult.error) {
      return { ok: false, error: String(accessResult.error) };
    }

    const publicKey = accessResult.address;
    if (!publicKey || typeof publicKey !== "string") {
      return { ok: false, error: "Connection refused or no address returned" };
    }

    // getNetwork returns { network, networkPassphrase } or { error }
    const networkResult = await getNetwork();
    const networkPassphrase: string =
      (!networkResult.error && networkResult.networkPassphrase)
        ? networkResult.networkPassphrase
        : (process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015");

    return { ok: true, publicKey, networkPassphrase };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error connecting wallet";
    return { ok: false, error: msg };
  }
}

/**
 * Read the currently connected address without prompting.
 * Returns null if not connected or Freighter is not installed.
 */
export async function getConnectedPublicKey(): Promise<string | null> {
  try {
    const { getAddress } = await import("@stellar/freighter-api");
    const result = await getAddress();
    if (result.error || !result.address) return null;
    return result.address;
  } catch {
    return null;
  }
}

/**
 * Sign a transaction XDR string using Freighter.
 * Returns the signed XDR or an error string.
 */
export async function signWithFreighter(
  xdr: string,
  networkPassphrase: string
): Promise<SignResult> {
  try {
    const { signTransaction } = await import("@stellar/freighter-api");
    // v6: signTransaction returns { signedTxXdr, signerAddress } | { error }
    const result = await signTransaction(xdr, { networkPassphrase });

    if (result.error) {
      const errMsg = String(result.error);
      if (errMsg.toLowerCase().includes("reject") || errMsg.toLowerCase().includes("cancel")) {
        return { ok: false, error: "Transaction rejected by user" };
      }
      return { ok: false, error: errMsg };
    }

    if (!result.signedTxXdr) {
      return { ok: false, error: "Signing failed — no XDR returned" };
    }

    return { ok: true, signedXdr: result.signedTxXdr };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
      return { ok: false, error: "Transaction rejected by user" };
    }
    return { ok: false, error: msg || "Signing error" };
  }
}

/**
 * Auto-fund a new Testnet account via Friendbot.
 * No-op (silent) if the account already exists or on non-testnet.
 *
 * The funding transaction can take several seconds to propagate to Horizon and
 * the Soroban RPC node. Acting before it propagates fails with "tx_no_account"
 * (Horizon 400) or an RPC "Account not found" error, so this waits for the
 * account to be visible on Horizon before returning.
 */
export async function friendbotFund(
  publicKey: string,
  timeoutMs = 60_000
): Promise<void> {
  const horizonUrl =
    process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

  const accountExists = async (): Promise<boolean> => {
    const res = await fetch(`${horizonUrl}/accounts/${publicKey}`);
    return res.ok;
  };

  try {
    if (await accountExists()) return; // account already funded

    const res = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    if (!res.ok) return; // friendbot rejected — user may fund manually

    // Wait for the funding transaction to become visible on Horizon.
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await accountExists()) return;
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch {
    // Friendbot failure is non-fatal — user may fund manually
  }
}
