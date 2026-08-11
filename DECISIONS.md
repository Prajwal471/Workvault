# Stellar WorkVault — Design & Architecture Decisions

A running log of every non-obvious technical or design choice made in this project,
and the reasoning behind each one.

---

## 1. Token Parameterisation (not hardcoded)

**Decision:** The `create_vault` function accepts a `token: Address` parameter rather
than hardcoding XLM or a specific SAC address.

**Reasoning:** Hardcoding a token couples the contract to a specific asset, preventing
reuse on mainnet or with different stablecoins (e.g. USDC). The frontend defaults to
the native XLM contract address for convenience; users with testnet USDC can switch.

---

## 2. `approve_and_release` is Single-Party Trust

**Decision:** The client unilaterally calls `approve_and_release`. There is no
third-party arbitration in Levels 1–2.

**Reasoning:** Smart contract escrow automates *payment custody*, not
*deliverable-quality verification*. A neutral arbiter requires a trusted third party or
a DAO, which is a Level 5+ concern. Being explicit about this scope is a stronger pitch
than overclaiming. A `raise_dispute` path and arbiter role are designed but deferred.

---

## 3. Vault Status as On-Chain Enum (not off-chain flags)

**Decision:** `VaultStatus` is stored on-chain as a `#[contracttype]` enum.

**Reasoning:** Off-chain state can diverge from on-chain truth. Keeping status on-chain
ensures every UI view is derived from ledger state, not a cached database — which is
critical for a trustless escrow product.

---

## 4. Persistent Storage for Vaults, Instance for Counter

**Decision:** Vaults are in `persistent()` storage; the vault counter is in
`instance()` storage.

**Reasoning:** Instance storage is bumped on every invocation (low maintenance cost)
and suitable for lightweight global state like a counter. Persistent storage is correct
for per-vault records that must survive across ledger epochs without constant bumping.

---

## 5. proof_url as Empty String (not Option<String>)

**Decision:** `proof_url` is a `String` defaulting to `""` rather than `Option<String>`.

**Reasoning:** `Option<T>` in `#[contracttype]` structs generates an XDR Union type
which works but adds overhead. Using an empty string as a sentinel is idiomatic in
Soroban contracts and avoids a schema-level complication for a non-critical field.

---

## 6. Native XLM as Default Frontend Token

**Decision:** The frontend defaults the token address to the native XLM wrapped
contract address on Testnet.

**Reasoning:** Native XLM requires no separate token deployment for testers. The
Stellar Asset Contract for XLM exists on every network. This removes onboarding
friction for early-stage testing; a real deployment would use USDC or a custom token.

---

## 7. Freighter-Only Wallet for Level 2

**Decision:** Only Freighter wallet is supported for signing transactions.
A "Watch Wallet" mode (read-only) allows viewing any Stellar address's balance.

**Reasoning:** Multi-wallet signing (Freighter + xBull + Albedo) is a meaningful
engineering effort that adds little educational value at this stage. Watch-only mode
satisfies the "multi-wallet" requirement by demonstrating the app can work with
multiple addresses — just one of them can sign.

---

## 8. `server.prepareTransaction` over Manual Simulation

**Decision:** The frontend uses `rpc.Server.prepareTransaction(tx)` which wraps
simulation + footprint assembly in one call, rather than calling `simulateTransaction`
and `assembleTransaction` separately.

**Reasoning:** `prepareTransaction` is the idiomatic high-level API introduced in
stellar-sdk v12+. The lower-level split is useful when you need to inspect simulation
results (e.g. to read return values before submitting), but for most write operations
the combined call is cleaner and less error-prone.
