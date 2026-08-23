import { NextResponse } from "next/server";

const startTime = Date.now();

export async function GET() {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";
  const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const network = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

  return NextResponse.json({
    status: "ok",
    contract: contractId || "not configured",
    network: network.includes("Testnet") ? "testnet" : "mainnet",
    rpc: rpcUrl,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
}
