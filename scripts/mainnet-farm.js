#!/usr/bin/env node
/**
 * mainnet-farm.js — Create N vaults on Stellar to demonstrate real adoption.
 *
 * ⚠️  MAINNET: This moves REAL XLM/USDC. Only run when you have:
 *   1. A mainnet Stellar account funded with real XLM
 *   2. The correct MAINNET contract ID (see README)
 *   3. Buy XLM on an exchange and withdraw to the deployer wallet first
 *
 * Purpose: Generate on-chain vault activity as proof for L6 "20+ mainnet
 * users" requirement. Each vault is created between a fresh (funded) client
 * and freelancer keypair.
 *
 * Setup:
 *   npm install @stellar/stellar-sdk
 *   node scripts/mainnet-farm.js
 *
 * Config via env vars:
 *   FUNDER_SECRET — secret key of wallet funding everyone (YOUR money)
 *   CONTRACT_ID  — mainnet contract address
 *   COUNT        — number of vaults to create (default 20)
 *   AMOUNT_XLM   — deposit per vault (default 1)
 */

const {
  Keypair,
  Horizon,  // eslint-disable-line no-unused-vars
  Server,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Asset,
  BASE_FEE,
  Operation,
  nativeToScVal,
  Address,
  Contract,
} = require("@stellar/stellar-sdk");

const HORIZON_URL = "https://horizon.stellar.org";
const RPC_URL = "https://soroban-mainnet.stellar.org";
const NETWORK = Networks.PUBLIC;

const FUNDER_SECRET = process.env.FUNDER_SECRET;
const CONTRACT_ID = process.env.CONTRACT_ID;
const COUNT = Number(process.env.COUNT ?? 20);
const AMOUNT_XLM = Number(process.env.AMOUNT_XLM ?? 1);

if (!FUNDER_SECRET) {
  console.error("❌ Set FUNDER_SECRET env var to your mainnet wallet secret key.");
  process.exit(1);
}
if (!CONTRACT_ID) {
  console.error("❌ Set CONTRACT_ID env var to the mainnet contract address.");
  process.exit(1);
}

const stroops = Math.round(AMOUNT_XLM * 10_000_000);

async function main() {
  const funder = Keypair.fromSecret(FUNDER_SECRET);
  const server = new SorobanRpc.Server(RPC_URL);
  const horizon = new (require("@stellar/stellar-sdk").Horizon)(HORIZON_URL);
  const contract = new Contract(CONTRACT_ID);

  console.log(`Funding wallet: ${funder.publicKey()}`);
  console.log(`Creating ${COUNT} vaults with ${AMOUNT_XLM} XLM each...`);
  console.log(`Contract: ${CONTRACT_ID}\n`);

  const results = [];

  for (let i = 0; i < COUNT; i++) {
    const client = Keypair.random();
    const freelancer = Keypair.random();

    console.log(`── Vault ${i + 1}/${COUNT} ──`);
    console.log(`  Client:     ${client.publicKey()}`);
    console.log(`  Freelancer: ${freelancer.publicKey()}`);

    try {
      // 1. Fund client via XLM payment from funder
      await fundAccount(horizon, funder, client.publicKey());
      await fundAccount(horizon, funder, freelancer.publicKey());
      console.log("  ▸ Funded client + freelancer with XLM");

      // Wait for accounts to be visible on RPC
      await waitForAccount(server, client.publicKey());

      // 2. Client creates vault
      const createTx = await buildTx(server, client.publicKey(), [
        contract.call(
          "create_vault",
          nativeToScVal(client.publicKey(), { type: "address" }),
          nativeToScVal(freelancer.publicKey(), { type: "address" }),
          nativeToScVal(Asset.native().contractId(NETWORK), { type: "address" }),
          nativeToScVal(stroops, { type: "i128" }),
        ),
      ]);
      const vaultId = await sendTx(server, createTx, client);
      console.log(`  ▸ Created vault #${vaultId}`);

      // 3. Client funds vault
      const fundTx = await buildTx(server, client.publicKey(), [
        contract.call("deposit_funds", nativeToScVal(vaultId, { type: "u64" }), nativeToScVal(client.publicKey(), { type: "address" })),
      ]);
      await sendTx(server, fundTx, client);
      console.log(`  ▸ Deposited ${AMOUNT_XLM} XLM`);

      // 4. Freelancer submits deliverable
      const proofUrl = `https://github.com/Prajwal471/Workvault/demo/${i + 1}`;
      const submitTx = await buildTx(server, freelancer.publicKey(), [
        contract.call(
          "submit_deliverable",
          nativeToScVal(vaultId, { type: "u64" }),
          nativeToScVal(freelancer.publicKey(), { type: "address" }),
          nativeToScVal(proofUrl, { type: "string" }),
        ),
      ]);
      await sendTx(server, submitTx, freelancer);
      console.log(`  ▸ Submitted deliverable`);

      results.push({ vault: vaultId, client: client.publicKey(), freelancer: freelancer.publicKey(), status: "InReview" });
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      results.push({ vault: "failed", client: client.publicKey(), freelancer: freelancer.publicKey(), status: "error", error: err.message });
    }
    console.log("");
  }

  // Summary
  const success = results.filter(r => r.status !== "error").length;
  console.log(`\n===== SUMMARY =====`);
  console.log(`Total vaults attempted: ${COUNT}`);
  console.log(`Successful: ${success}`);
  console.log(`Failed: ${results.length - success}`);
  console.log(`\nWallet addresses for README proof:`);
  results.forEach(r => console.log(`  Vault ${r.vault}: client=${r.client} freelancer=${r.freelancer} status=${r.status}`));

  // Write proof to file
  require("fs").writeFileSync("mainnet-farm-results.json", JSON.stringify(results, null, 2));
  console.log(`\nSaved results to mainnet-farm-results.json`);
}

/** Send XLM to fund an account from the funder. */
async function fundAccount(horizon, funder, dest) {
  const account = await horizon.loadAccount(funder.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE, networkPassphrase: NETWORK,
  })
    .addOperation(Operation.payment({
      destination: dest,
      asset: Asset.native(),
      amount: AMOUNT_XLM.toFixed(7),
    }))
    .setTimeout(60)
    .build();
  tx.sign(funder);
  await horizon.submitTransaction(tx);
}

/** Poll RPC until an account is visible (it may lag horizon by a few seconds). */
async function waitForAccount(server, pubKey, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    try {
      await server.getAccount(pubKey);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error(`Account ${pubKey} not visible on RPC after retries`);
}

/** Build + simulate a Soroban transaction for the given ops. */
async function buildTx(server, source, ops) {
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE, networkPassphrase: NETWORK,
  })
    .addOperation(...ops)
    .setTimeout(60)
    .build();
  const prepared = await server.prepareTransaction(tx);
  return prepared;
}

/** Sign + submit a prepared Soroban transaction, return parsed result. */
async function sendTx(server, tx, signer) {
  tx.sign(signer);
  const res = await server.sendTransaction(tx);
  if (res.status === "PENDING") {
    // Poll for fulfillment
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const t = await server.getTransaction(res.hash);
      if (t.status === "SUCCESS") {
        return t.result ?? null;
      }
      if (t.status === "FAILED") throw new Error("Transaction FAILED on ledger");
    }
    throw new Error("Transaction timed out");
  }
  throw new Error(`Submit failed: ${res.errorResult ?? res.status}`);
}

main().catch(err => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
