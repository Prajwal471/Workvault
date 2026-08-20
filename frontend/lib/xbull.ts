/**
 * xbull.ts
 * xBull Wallet integration — same interface shape as freighter.ts
 * for drop-in multi-wallet support.
 *
 * xBull injects window.xBullSDK when the extension is installed.
 * Docs: https://docs.xbull.app
 */

export interface SignResult {
  ok: boolean;
  signedXdr?: string;
  error?: string;
}

export interface ConnectResult {
  ok: boolean;
  publicKey?: string;
  networkPassphrase?: string;
  error?: string;
}

/** True if the xBull extension is present in this browser. */
export async function isXBullInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).xBullSDK;
}

/** Request the user's public key from xBull. */
export async function connectXBull(): Promise<ConnectResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sdk = (window as any).xBullSDK;
    if (!sdk) {
      return { ok: false, error: "xBull extension is not installed." };
    }

    // xBull SDK: getPublicKey() opens the extension popup
    const publicKey: string = await sdk.getPublicKey();
    if (!publicKey) {
      return { ok: false, error: "xBull did not return a public key." };
    }

    // xBull always operates on whichever network the user has selected
    const networkDetails = await sdk.getNetworkDetails().catch(() => null);
    const networkPassphrase: string =
      networkDetails?.networkPassphrase ??
      "Test SDF Network ; September 2015";

    return { ok: true, publicKey, networkPassphrase };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel")) {
      return { ok: false, error: "User rejected the xBull connection." };
    }
    return { ok: false, error: msg };
  }
}

/** Sign a transaction XDR string with xBull. */
export async function signWithXBull(
  xdr: string,
  networkPassphrase: string
): Promise<SignResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sdk = (window as any).xBullSDK;
    if (!sdk) {
      return { ok: false, error: "xBull extension is not installed." };
    }

    // xBull SDK: sign() returns the signed XDR
    const signedXdr: string = await sdk.sign({ xdr, publicKey: undefined, network: networkPassphrase });
    if (!signedXdr) {
      return { ok: false, error: "xBull returned an empty signed XDR." };
    }

    return { ok: true, signedXdr };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("denied")) {
      return { ok: false, error: "TransactionRejected: User rejected the transaction in xBull." };
    }
    return { ok: false, error: msg };
  }
}
