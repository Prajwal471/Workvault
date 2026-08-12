/**
 * stellar.ts
 * Core Stellar SDK helpers — XLM balance, send XLM, transaction polling.
 * All functions return typed results; errors are never thrown to the caller.
 */

import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset,
  Account,
} from "@stellar/stellar-sdk";
import { signWithFreighter } from "./freighter";

// ── Config ─────────────────────────────────────────────────────────────────

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  "https://soroban-testnet.stellar.org";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ??
  Networks.TESTNET;

// ── Types ──────────────────────────────────────────────────────────────────

export type TxStatus = "pending" | "success" | "failed";

/** Progress through the transaction lifecycle, surfaced to the UI stepper. */
export type TxStage = "sign" | "broadcast" | "confirmed";

export interface TxResult {
  ok: boolean;
  hash?: string;
  status?: TxStatus;
  error?: string;
}

// ── Balance ────────────────────────────────────────────────────────────────

/**
 * Fetch the native XLM balance for any Stellar address.
 * Returns "0" if the account does not exist yet (unfunded).
 */
export async function fetchXLMBalance(publicKey: string): Promise<string> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!res.ok) return "0.00";

    const data = await res.json();
    const xlmBalance = data.balances?.find(
      (b: any) => b.asset_type === "native"
    );
    return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(7) : "0.00";
  } catch {
    return "0.00";
  }
}

// ── Send XLM ──────────────────────────────────────────────────────────────

/**
 * Send a native XLM payment on Testnet using Freighter for signing.
 *
 * Errors handled:
 *  1. WalletNotConnected — no public key provided
 *  2. TransactionRejected — user dismisses Freighter popup
 *  3. NetworkError — RPC submission or timeout failure
 */
export async function sendXLM(
  fromPublicKey: string,
  toPublicKey: string,
  amountXLM: string,
  networkPassphrase: string = NETWORK_PASSPHRASE,
  onStage?: (stage: TxStage) => void
): Promise<TxResult> {
  // Error type 1: wallet not connected
  if (!fromPublicKey) {
    return { ok: false, error: "WalletNotConnected: Please connect your wallet first." };
  }

  try {
    // Load account sequence from Horizon
    const horizonRes = await fetch(`${HORIZON_URL}/accounts/${fromPublicKey}`);
    if (!horizonRes.ok) {
      return { ok: false, error: "NetworkError: Could not load account — is this account funded?" };
    }
    const accountData = await horizonRes.json();

    // Build the payment transaction using a proper SDK Account object
    const account = new Account(fromPublicKey, accountData.sequence);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: toPublicKey,
          asset: Asset.native(),
          amount: amountXLM,
        })
      )
      .setTimeout(30)
      .build();

    // Error type 2: transaction rejected by user
    onStage?.("sign");
    const signResult = await signWithFreighter(tx.toXDR(), networkPassphrase);
    if (!signResult.ok) {
      return {
        ok: false,
        error: `TransactionRejected: ${signResult.error}`,
      };
    }

    // Submit via Horizon. For a brand-new account the funding transaction may
    // still be propagating, which surfaces as "tx_no_account" (HTTP 400).
    // The signed transaction is still valid while un-included, so retry it.
    const MAX_SUBMIT_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_SUBMIT_ATTEMPTS; attempt++) {
      const submitRes = await fetch(`${HORIZON_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ tx: signResult.signedXdr }),
      });

      const submitData = await submitRes.json();

      if (submitRes.ok) {
        onStage?.("confirmed");
        return {
          ok: true,
          hash: submitData.hash,
          status: "success",
        };
      }

      const detail = submitData?.extras?.result_codes?.transaction ?? "unknown";
      if (detail === "tx_no_account" && attempt < MAX_SUBMIT_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      // Error type 3: network / RPC failure
      return {
        ok: false,
        error: `ContractCallFailed: Submission failed — ${detail}`,
      };
    }

    return {
      ok: false,
      error: "ContractCallFailed: Submission failed after retries",
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `NetworkError: ${err?.message ?? "Unexpected error during send"}`,
    };
  }
}

// ── Transaction Status ─────────────────────────────────────────────────────

/**
 * Poll Horizon for the final status of a transaction by hash.
 * Returns after success or failure, or after maxAttempts × intervalMs.
 */
export async function pollTransactionStatus(
  hash: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<TxResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    try {
      const res = await fetch(`${HORIZON_URL}/transactions/${hash}`);
      if (res.ok) {
        const data = await res.json();
        return {
          ok: data.successful,
          hash,
          status: data.successful ? "success" : "failed",
          error: data.successful ? undefined : "Transaction failed on-chain",
        };
      }
      // 404 = not yet finalised, keep polling
    } catch {
      // network blip — keep polling
    }
  }

  return {
    ok: false,
    hash,
    status: "failed",
    error: "NetworkError: Transaction polling timed out",
  };
}

// ── Soroban RPC helper ─────────────────────────────────────────────────────

/**
 * Submit a prepared + signed Soroban transaction and poll for result.
 * Returns the transaction hash and final status.
 */
export async function submitAndPollSoroban(
  signedXdr: string,
  networkPassphrase: string = NETWORK_PASSPHRASE,
  onStage?: (stage: TxStage) => void
): Promise<TxResult> {
  try {
    const server = new rpc.Server(RPC_URL);
    const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

    // For a brand-new account the Friendbot funding transaction may still be
    // propagating to the Horizon node, which surfaces as "txNoAccount" on
    // submission. The signed transaction stays valid while un-included, so
    // retry it a few times before giving up.
    const MAX_SUBMIT_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_SUBMIT_ATTEMPTS; attempt++) {
      const sendResult = await server.sendTransaction(tx);

      if (sendResult.status === "ERROR") {
        const code = sendResult.errorResult?.result()?.switch()?.name;
        if (code === "txNoAccount" && attempt < MAX_SUBMIT_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        return {
          ok: false,
          error: `ContractCallFailed: ${sendResult.errorResult?.toXDR("base64") ?? "Soroban error"}`,
        };
      }

      const hash = sendResult.hash;

      onStage?.("broadcast");

      // Poll for finalisation
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const txInfo = await server.getTransaction(hash);

        if (txInfo.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          onStage?.("confirmed");
          return { ok: true, hash, status: "success" };
        }
        if (txInfo.status === rpc.Api.GetTransactionStatus.FAILED) {
          return { ok: false, hash, status: "failed", error: "ContractCallFailed: Transaction failed on-chain" };
        }
      }

      return { ok: false, hash, status: "pending", error: "NetworkError: Polling timed out" };
    }

    return { ok: false, error: "ContractCallFailed: Submission failed after retries" };
  } catch (err: any) {
    return { ok: false, error: `NetworkError: ${err?.message ?? "Soroban submit error"}` };
  }
}
