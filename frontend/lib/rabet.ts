/**
 * rabet.ts
 * Rabet Wallet integration — browser extension wallet for Stellar.
 * Docs: https://rabet.io/docs
 * Rabet injects window.rabet when the extension is installed.
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

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

/** True if the Rabet extension is installed. */
export async function isRabetInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return !!(window as any).rabet;
}

/** Request the user's public key from Rabet. */
export async function connectRabet(): Promise<ConnectResult> {
  try {
    const rabet = (window as any).rabet;
    if (!rabet) {
      return { ok: false, error: "Rabet extension is not installed. Get it at rabet.io" };
    }

    // Rabet: connect() returns { publicKey, network }
    const result = await rabet.connect();
    if (!result?.publicKey) {
      return { ok: false, error: "Rabet did not return a public key." };
    }

    const networkPassphrase =
      result.network === "MainNet"
        ? "Public Global Stellar Network ; September 2015"
        : TESTNET_PASSPHRASE;

    return { ok: true, publicKey: result.publicKey, networkPassphrase };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("denied")) {
      return { ok: false, error: "User rejected the Rabet connection." };
    }
    return { ok: false, error: msg };
  }
}

/** Sign a transaction XDR string with Rabet. */
export async function signWithRabet(
  xdr: string,
  networkPassphrase: string
): Promise<SignResult> {
  try {
    const rabet = (window as any).rabet;
    if (!rabet) {
      return { ok: false, error: "Rabet extension is not installed." };
    }

    // Rabet: sign(xdr, network) returns { xdr: signedXdr }
    const network = networkPassphrase === TESTNET_PASSPHRASE ? "TestNet" : "MainNet";
    const result = await rabet.sign(xdr, network);

    if (!result?.xdr) {
      return { ok: false, error: "Rabet returned no signed XDR." };
    }

    return { ok: true, signedXdr: result.xdr };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("denied")) {
      return { ok: false, error: "TransactionRejected: User rejected the transaction in Rabet." };
    }
    return { ok: false, error: msg };
  }
}
