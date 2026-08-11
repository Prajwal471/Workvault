/**
 * albedo.ts
 * Albedo wallet integration — web-based popup wallet (no extension needed).
 * Docs: https://albedo.link/docs
 * Package: @albedo-link/intent
 */

import albedo from "@albedo-link/intent";

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

/**
 * Albedo is always "available" — it's web-based, no extension check needed.
 * We return true so the button is always shown.
 */
export async function isAlbedoAvailable(): Promise<boolean> {
  return true;
}

/** Request the user's public key via Albedo popup. */
export async function connectAlbedo(): Promise<ConnectResult> {
  try {
    const result = await albedo.publicKey({ require_existing: false });
    if (!result?.pubkey) {
      return { ok: false, error: "Albedo did not return a public key." };
    }
    return {
      ok: true,
      publicKey: result.pubkey,
      networkPassphrase: TESTNET_PASSPHRASE,
    };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
      return { ok: false, error: "User closed the Albedo popup." };
    }
    return { ok: false, error: msg };
  }
}

/** Sign a transaction XDR string via Albedo popup. */
export async function signWithAlbedo(
  xdr: string,
  networkPassphrase: string
): Promise<SignResult> {
  try {
    const result = await albedo.tx({
      xdr,
      network: networkPassphrase === TESTNET_PASSPHRASE ? "testnet" : "public",
      submit: false, // we submit ourselves
    });

    if (!result?.signed_envelope_xdr) {
      return { ok: false, error: "Albedo returned no signed XDR." };
    }

    return { ok: true, signedXdr: result.signed_envelope_xdr };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
      return { ok: false, error: "TransactionRejected: User cancelled in Albedo." };
    }
    return { ok: false, error: msg };
  }
}
