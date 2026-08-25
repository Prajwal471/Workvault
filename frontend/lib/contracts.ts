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
import { submitAndPollSoroban, TxStage } from "./stellar";

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
  | "Cancelled"
  | "Disputed";

export interface VaultInfo {
  id: bigint;
  client: string;
  freelancer: string;
  token: string;
  amount: bigint;
  status: VaultStatus;
  proofUrl: string;
  milestones: MilestoneInfo[];
}

export type MilestoneStatus = "Pending" | "Submitted" | "Approved" | "Disputed";

export interface MilestoneInfo {
  id: bigint;
  description: string;
  amount: bigint;
  status: MilestoneStatus;
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
  "Disputed",
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
  parseResult?: (val: xdr.ScVal) => T,
  onStage?: (stage: TxStage) => void
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
    onStage?.("sign");
    const signResult = await signWithFreighter(prepared.toXDR(), NETWORK_PASSPHRASE);
    if (!signResult.ok) {
      return { ok: false, error: `TransactionRejected: ${signResult.error}` };
    }

    // Submit + poll
    const txResult = await submitAndPollSoroban(signResult.signedXdr, NETWORK_PASSPHRASE, onStage);
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
  } catch (err: unknown) {
    // Error type 3: ContractCallFailed
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `ContractCallFailed: ${message}`,
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
  amountStroops: bigint,
  onStage?: (stage: TxStage) => void
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
      return typeof native === "bigint" ? native : BigInt(String(native));
    },
    onStage
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const native = scValToNative(returnVal) as any;
    const milestonesRaw = native.milestones;
    const milestones: MilestoneInfo[] = Array.isArray(milestonesRaw)
      ? milestonesRaw.map((ms: Record<string, unknown>) => ({
          id: BigInt((ms.id as number | bigint) ?? 0),
          description: (ms.description as string) ?? "",
          amount: BigInt((ms.amount as number | bigint) ?? 0),
          status: (typeof ms.status === "string" ? ms.status : Array.isArray(ms.status) ? ms.status[0] : "Pending") as MilestoneStatus,
          proofUrl: (ms.proof_url as string) ?? "",
        }))
      : [];
    return {
      id: BigInt(native.id ?? 0),
      client: native.client?.toString() ?? "",
      freelancer: native.freelancer?.toString() ?? "",
      token: native.token?.toString() ?? "",
      amount: BigInt(native.amount ?? 0),
      status: statusFromScVal(native.status),
      proofUrl: native.proof_url ?? "",
      milestones,
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
  vaultId: bigint,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    callerPublicKey,
    "deposit_funds",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(callerPublicKey).toScVal(),
    ],
    undefined,
    onStage
  );
}

/**
 * Freelancer submits a proof-of-work URL for a funded vault.
 * Sets vault status to InReview.
 */
export async function submitDeliverable(
  freelancerPublicKey: string,
  vaultId: bigint,
  proofUrl: string,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    freelancerPublicKey,
    "submit_deliverable",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(freelancerPublicKey).toScVal(),
      nativeToScVal(proofUrl, { type: "string" }),
    ],
    undefined,
    onStage
  );
}

/**
 * Client approves deliverable and releases escrow to the freelancer.
 * Vault status → Completed.
 */
export async function approveAndRelease(
  clientPublicKey: string,
  vaultId: bigint,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    clientPublicKey,
    "approve_and_release",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(clientPublicKey).toScVal(),
    ],
    undefined,
    onStage
  );
}

/**
 * Set milestones on a vault (must be in Created status).
 * Descriptions and amounts must match in length, and amounts must sum to vault total.
 */
export async function setMilestones(
  clientPublicKey: string,
  vaultId: bigint,
  descriptions: string[],
  amounts: bigint[],
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  const descScVals = descriptions.map(d => nativeToScVal(d, { type: "string" }));
  const amtScVals = amounts.map(a => nativeToScVal(a, { type: "i128" }));
  const descVals = xdr.ScVal.scvVec(descScVals);
  const amtVals = xdr.ScVal.scvVec(amtScVals);

  return invokeContract(
    clientPublicKey,
    "set_milestones",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(clientPublicKey).toScVal(),
      descVals,
      amtVals,
    ],
    undefined,
    onStage
  );
}

/**
 * Freelancer submits proof-of-work for a specific milestone.
 */
export async function submitMilestoneDeliverable(
  freelancerPublicKey: string,
  vaultId: bigint,
  milestoneId: bigint,
  proofUrl: string,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    freelancerPublicKey,
    "submit_milestone_deliverable",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      nativeToScVal(milestoneId, { type: "u64" }),
      new Address(freelancerPublicKey).toScVal(),
      nativeToScVal(proofUrl, { type: "string" }),
    ],
    undefined,
    onStage
  );
}

/**
 * Client approves a milestone and releases its funds.
 */
export async function approveMilestone(
  clientPublicKey: string,
  vaultId: bigint,
  milestoneId: bigint,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    clientPublicKey,
    "approve_milestone",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      nativeToScVal(milestoneId, { type: "u64" }),
      new Address(clientPublicKey).toScVal(),
    ],
    undefined,
    onStage
  );
}

/**
 * Raise a dispute on a funded or in-review vault.
 */
export async function raiseDispute(
  reporterPublicKey: string,
  vaultId: bigint,
  reason: string,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    reporterPublicKey,
    "raise_dispute",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(reporterPublicKey).toScVal(),
      nativeToScVal(reason, { type: "string" }),
    ],
    undefined,
    onStage
  );
}

/**
 * Refund remaining funds to the client (post-dispute).
 */
export async function refund(
  clientPublicKey: string,
  vaultId: bigint,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    clientPublicKey,
    "refund",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      new Address(clientPublicKey).toScVal(),
    ],
    undefined,
    onStage
  );
}

/**
 * Update a milestone's description and amount before funding.
 * Only the client can call this, and only when vault is in Created status.
 */
export async function updateMilestone(
  clientPublicKey: string,
  vaultId: bigint,
  milestoneId: bigint,
  newDescription: string,
  newAmount: bigint,
  onStage?: (stage: TxStage) => void
): Promise<ContractCallResult> {
  return invokeContract(
    clientPublicKey,
    "update_milestone",
    [
      nativeToScVal(vaultId, { type: "u64" }),
      nativeToScVal(milestoneId, { type: "u64" }),
      new Address(clientPublicKey).toScVal(),
      nativeToScVal(newDescription, { type: "string" }),
      nativeToScVal(newAmount, { type: "i128" }),
    ],
    undefined,
    onStage
  );
}

/**
 * Read-only: fetch milestones for a vault.
 */
export async function getMilestones(vaultId: bigint): Promise<MilestoneInfo[]> {
  if (!CONTRACT_ID) return [];

  try {
    const server = new rpc.Server(RPC_URL);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(simulationAccount(), {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call("get_milestones", nativeToScVal(vaultId, { type: "u64" }))
      )
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) return [];

    const returnVal = (simResult as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    if (!returnVal) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const native = scValToNative(returnVal) as any[];
    if (!Array.isArray(native)) return [];

    return native.map((ms: Record<string, unknown>) => ({
      id: BigInt((ms.id as number | bigint) ?? 0),
      description: (ms.description as string) ?? "",
      amount: BigInt((ms.amount as number | bigint) ?? 0),
      status: (ms.status as MilestoneStatus) ?? "Pending",
      proofUrl: (ms.proof_url as string) ?? "",
    }));
  } catch {
    return [];
  }
}
