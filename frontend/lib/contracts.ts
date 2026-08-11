/**
 * contracts.ts
 * Typed wrappers for calling the WorkVault Soroban contract.
 * Handles build → prepareTransaction (simulate+assemble) → sign → submit flow.
 */

import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Account,
  Keypair,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { signWithFreighter } from "./freighter";
import { submitAndPollSoroban, TxResult } from "./stellar";

// ── Config ─────────────────────────────────────────────────────────────────

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  "https://soroban-testnet.stellar.org";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

// ── Return types ───────────────────────────────────────────────────────────

export type VaultStatus =
  | "Created"
  | "Funded"
  | "InReview"
  | "Completed"
  | "Cancelled";

export interface VaultInfo {
  id: bigint;
  client: string;
  freelancer: string;
  token: string;
  amount: bigint;
  status: VaultStatus;
  proofUrl: string;
}

// The contract's VaultStatus enum serializes to an ScVal that decodes as an
// array of one string (e.g. ["Created"]). Normalise it to a plain status
// string regardless of encoding (string / [string] / numeric enum).
const VAULT_STATUS_NAMES: VaultStatus[] = [
  "Created",
  "Funded",
  "InReview",
  "Completed",
  "Cancelled",
];

function statusFromScVal(raw: unknown): VaultStatus {
  if (typeof raw === "string") {
    if ((VAULT_STATUS_NAMES as readonly string[]).includes(raw)) return raw as VaultStatus;
    return "Created";
  }
  if (Array.isArray(raw)) {
    const inner = raw[0];
    if (typeof inner === "string") {
      if ((VAULT_STATUS_NAMES as readonly string[]).includes(inner)) return inner as VaultStatus;
      return "Created";
    }
    return VAULT_STATUS_NAMES[Number(inner)] ?? "Created";
  }
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < VAULT_STATUS_NAMES.length
    ? VAULT_STATUS_NAMES[n]
    : "Created";
}

export interface ContractCallResult<T = void> {
  ok: boolean;
  data?: T;
  hash?: string;
  error?: string;
}

// ── Internal helper ────────────────────────────────────────────────────────

/**
 * Fetch an account's sequence from the Soroban RPC node with retries.
 * A fresh Friendbot-funded account may not be visible to the RPC node for a
 * few seconds, so retry before surfacing an error to the user.
 */
async function getAccountWithRetry(
  server: rpc.Server,
  publicKey: string,
  attempts = 5,
  delayMs = 1500
): Promise<Account> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await server.getAccount(publicKey);
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

async function invokeContract<T = void>(
  publicKey: string,
  method: string,
  args: xdr.ScVal[],
  parseResult?: (val: xdr.ScVal) => T
): Promise<ContractCallResult<T>> {
  // Error type 1: WalletNotConnected
  if (!publicKey) {
    return { ok: false, error: "WalletNotConnected: Connect your wallet to interact with the contract." };
  }
  if (!CONTRACT_ID) {
    return { ok: false, error: "ContractCallFailed: Contract ID not configured — add it to .env.local" };
  }

  try {
    const server = new rpc.Server(RPC_URL);
    const account = await getAccountWithRetry(server, publicKey);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    // Simulate + assemble in one step. A freshly-created vault may not be
    // visible to the RPC node for a few seconds (returns e.g. VaultNotFound),
    // so retry before surfacing an error.
    let prepared: Awaited<ReturnType<typeof server.prepareTransaction>>;
    for (let attempt = 0; ; attempt++) {
      try {
        prepared = await server.prepareTransaction(tx);
        break;
      } catch (err) {
        if (attempt >= 2) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Error type 2: TransactionRejected
    const signResult = await signWithFreighter(prepared.toXDR(), NETWORK_PASSPHRASE);
    if (!signResult.ok) {
      return { ok: false, error: `TransactionRejected: ${signResult.error}` };
    }

    // Submit + poll
    const txResult = await submitAndPollSoroban(signResult.signedXdr, NETWORK_PASSPHRASE);
    if (!txResult.ok) {
      return { ok: false, hash: txResult.hash, error: txResult.error };
    }

    // Parse return value if needed
    if (parseResult && txResult.hash) {
      try {
        const txInfo = await server.getTransaction(txResult.hash);
        if (txInfo.status === rpc.Api.GetTransactionStatus.SUCCESS && txInfo.returnValue) {
          const parsed = parseResult(txInfo.returnValue);
          return { ok: true, hash: txResult.hash, data: parsed };
        }
      } catch {
        // Return value parsing is best-effort
      }
    }

    return { ok: true, hash: txResult.hash };
  } catch (err: any) {
    // Error type 3: ContractCallFailed
    return {
      ok: false,
      error: `ContractCallFailed: ${err?.message ?? "Unknown contract error"}`,
    };
  }
}

// ── Public contract calls ──────────────────────────────────────────────────

/**
 * Create a new vault on-chain.
 * Returns the new vault ID (u64) on success.
 */
export async function createVault(
  callerPublicKey: string,
  freelancerAddress: string,
  tokenAddress: string,
  amountStroops: bigint
): Promise<ContractCallResult<bigint>> {
  return invokeContract<bigint>(
    callerPublicKey,
    "create_vault",
    [
      new Address(callerPublicKey).toScVal(),
      new Address(freelancerAddress).toScVal(),
      new Address(tokenAddress).toScVal(),
      nativeToScVal(amountStroops, { type: "i128" }),
    ],
    (val) => {
      const native = scValToNative(val);
      return typeof native === "bigint" ? native : BigInt(native as any);
    }
  );
}

/**
 * Build a simulation-only source account. Read-only calls don't need a real
 * funded account or a valid on-chain sequence — the SDK just needs a well-formed
 * Account object for the transaction envelope.
 */
function simulationAccount(): Account {
  return new Account(Keypair.random().publicKey(), "0");
}

/**
 * Read-only: fetch a vault's current state.
 * Uses Horizon RPC simulate (no signature needed).
 */
export async function getVault(vaultId: bigint): Promise<VaultInfo | null> {
  if (!CONTRACT_ID) return null;

  try {
    const server = new rpc.Server(RPC_URL);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(simulationAccount(), {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call("get_vault", nativeToScVal(vaultId, { type: "u64" }))
      )
      .setTimeout(30)
      .build();

    const simResult = await (async () => {
      // A vault created moments ago may not be visible to the RPC node yet —
      // retry before reporting "not found".
      for (let attempt = 0; ; attempt++) {
        try {
          const res = await server.simulateTransaction(tx);
          if (!rpc.Api.isSimulationError(res)) return res;
        } catch {
          // fall through to retry
        }
        if (attempt >= 3) return null;
        await new Promise((r) => setTimeout(r, 1500));
      }
    })();

    if (!simResult) return null;

    const returnVal = (simResult as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    if (!returnVal) return null;

    const native = scValToNative(returnVal) as any;
    return {
      id: BigInt(native.id ?? 0),
      client: native.client?.toString() ?? "",
      freelancer: native.freelancer?.toString() ?? "",
      token: native.token?.toString() ?? "",
      amount: BigInt(native.amount ?? 0),
      status: statusFromScVal(native.status),
      proofUrl: native.proof_url ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Get total vault count from the contract (read-only simulation).
 */
export async function getVaultCount(): Promise<number> {
  if (!CONTRACT_ID) return 0;

  try {
    const server = new rpc.Server(RPC_URL);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(simulationAccount(), {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_vault_count"))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) return 0;

    const returnVal = (simResult as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    if (!returnVal) return 0;

    return Number(scValToNative(returnVal));
  } catch {
    return 0;
  }
}

/**
 * Deposit funds into an existing vault (must be in Created status).
 * The contract transfers vault.amount tokens from the client into escrow.
 */
export async function depositFunds(
  callerPublicKey: string,
  vaultId: bigint
): Promise<ContractCallResult> {
  return invokeContract(
    callerPublicKey,
    "deposit_funds",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(callerPublicKey).toScVal(),
    ]
  );
}

/**
 * Freelancer submits a proof-of-work URL for a funded vault.
 * Sets vault status to InReview.
 */
export async function submitDeliverable(
  freelancerPublicKey: string,
  vaultId: bigint,
  proofUrl: string
): Promise<ContractCallResult> {
  return invokeContract(
    freelancerPublicKey,
    "submit_deliverable",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(freelancerPublicKey).toScVal(),
      nativeToScVal(proofUrl, { type: "string" }),
    ]
  );
}

/**
 * Client approves deliverable and releases escrow to the freelancer.
 * Vault status → Completed.
 */
export async function approveAndRelease(
  clientPublicKey: string,
  vaultId: bigint
): Promise<ContractCallResult> {
  return invokeContract(
    clientPublicKey,
    "approve_and_release",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(clientPublicKey).toScVal(),
    ]
  );
}
