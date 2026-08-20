/**
 * events.ts
 * Polls the Soroban RPC getEvents endpoint for WorkVault contract events.
 * Tracks ledger cursor so each poll only fetches new events.
 */

import { xdr, scValToNative } from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

export type VaultEventType =
  | "created"
  | "funded"
  | "review"
  | "done"
  | "cancel"
  | "unknown";

export interface VaultEvent {
  id: string;
  type: VaultEventType;
  vaultId: string;
  ledger: number;
  ledgerClosedAt: string;
  rawTopics: string[];
  rawValue: string;
}

// Module-level cursor — persists across polls within the browser session
let _startLedger: number | null = null;

/**
 * Decode a base64-encoded ScVal returned by the raw Soroban RPC getEvents
 * response into its native JS value (symbols → strings, tuples → arrays).
 */
function decodeScVal(b64: string): unknown {
  return scValToNative(xdr.ScVal.fromXDR(Buffer.from(b64, "base64")));
}

function topicToEventType(topics: string[]): VaultEventType {
  // Topics: [symbol_short!("vault"), symbol_short!("<action>"), ...]
  // Raw RPC returns them base64-encoded, so decode the action symbol.
  const action = decodeScVal(topics[1]);
  switch (action) {
    case "created": return "created";
    case "funded":  return "funded";
    case "review":  return "review";
    case "done":    return "done";
    case "cancel":  return "cancel";
    default:        return "unknown";
  }
}

/**
 * Fetch new vault events from the Soroban RPC.
 * On the first call, fetches from the last ~200 ledgers (~17 min).
 * On subsequent calls, fetches only ledgers since the last check.
 */
export async function fetchVaultEvents(): Promise<VaultEvent[]> {
  if (!CONTRACT_ID) return [];

  try {
    // Get latest ledger to know where to start
    const healthRes = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger", params: {} }),
    });
    const health = await healthRes.json();
    const latestLedger: number = health?.result?.sequence ?? 0;

    if (!latestLedger) return [];

    // First call: start from 200 ledgers ago; subsequent: from last cursor
    const startLedger = _startLedger ?? Math.max(1, latestLedger - 200);

    // Update cursor for next poll
    _startLedger = latestLedger + 1;

    const body = {
      jsonrpc: "2.0",
      id: 2,
      method: "getEvents",
      params: {
        startLedger,
        filters: [
          {
            type: "contract",
            contractIds: [CONTRACT_ID],
          },
        ],
        pagination: { limit: 50 },
      },
    };

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawEvents: any[] = json?.result?.events ?? [];

    return rawEvents.map((e): VaultEvent => {
      const topics: string[] = e.topic ?? [];
      const type = topicToEventType(topics);

      // Value is a base64 ScVal. create/funded/review/done emit a tuple whose
      // first element is the vault_id; cancel emits a bare vault_id.
      let vaultId = "?";
      let decodedValue: unknown = null;
      try {
        decodedValue = decodeScVal(e.value);
        if (Array.isArray(decodedValue) && decodedValue.length > 0) {
          vaultId = String(decodedValue[0]);
        } else if (decodedValue !== null && decodedValue !== undefined) {
          vaultId = String(decodedValue);
        }
      } catch {
        /* best-effort */
      }

      return {
        id: e.id ?? `${e.ledger}-${Math.random()}`,
        type,
        vaultId,
        ledger: e.ledger ?? 0,
        ledgerClosedAt: e.ledgerClosedAt ?? new Date().toISOString(),
        rawTopics: topics,
        rawValue: JSON.stringify(decodedValue),
      };
    });
  } catch {
    return [];
  }
}

/** Reset the cursor (e.g. on wallet change). */
export function resetEventCursor() {
  _startLedger = null;
}
