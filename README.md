# Stellar WorkVault

> Freelance escrow with portable, on-chain reputation — built on Stellar Soroban.

A client locks milestone payments into a Soroban vault; a freelancer submits proof
of work; the client approves and funds release instantly. Every completed contract
builds a verifiable, portable work-history record the freelancer owns — not the platform.

---

## Tools & Technologies

| Category | Technology |
|---|---|
| Smart contract | Rust · Soroban SDK (Stellar's WASM smart-contract platform) |
| Contract tooling | Stellar CLI (`stellar contract`), Stellar RPC, Soroban token interface |
| Frontend | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS |
| Stellar SDK | `@stellar/stellar-sdk` (RPC client, transactions, XDR) |
| Wallets | Freighter · xBull · Albedo · Rabet |
| Network | Stellar Testnet (Soroban) — Horizon + Soroban RPC |
| Testing | Soroban unit tests with `test_snapshots`, `cargo test` |
| Version control | Git · GitHub |

---

## Architecture

```
stellar-workvault/
├── contracts/vault/        # Soroban smart contract (Rust)
│   └── src/
│       ├── lib.rs          # 7 public functions (create, deposit, submit, approve, cancel, get, count)
│       ├── types.rs        # VaultInfo, VaultStatus structs
│       ├── storage.rs      # Persistent + instance storage helpers
│       ├── error.rs        # ContractError enum (6 variants)
│       └── tests.rs        # 8 unit tests
└── frontend/               # Next.js 14 + TypeScript + Tailwind frontend
    ├── app/
    │   ├── page.tsx        # Landing — connect wallet
    │   └── dashboard/      # Main app (balance, send XLM, vault creation)
    ├── components/         # WalletBar, BalanceCard, SendXLMForm, CreateVaultForm ...
    ├── context/            # WalletContext — global wallet state
    └── lib/                # freighter.ts, stellar.ts, contracts.ts
```

---

## Quickstart

### Prerequisites

| Tool | Version |
|---|---|
| Rust | stable (rustup) |
| `wasm32v1-none` target | `rustup target add wasm32v1-none` |
| Stellar CLI | `cargo install --locked stellar-cli --features opt` |
| Node.js | ≥ 18 |
| Freighter wallet | Browser extension |

### 1 — Run contract tests

```bash
cargo test -p workvault-vault
```

### 2 — Build contract WASM

```bash
cargo build -p workvault-vault --target wasm32v1-none --release
```

Output: `target/wasm32v1-none/release/workvault_vault.wasm`

### 3 — Deploy to Testnet

```bash
# Fund a new testnet identity (one-time)
stellar keys generate --global deployer --network testnet --fund

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/workvault_vault.wasm \
  --source deployer \
  --network testnet

# Copy the printed Contract ID into frontend/.env.local
```

### 4 — Run the frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local → paste your Contract ID
npm install
npm run dev
```

Visit: http://localhost:3000

---

## Contract Functions

| Function | Access | Description |
|---|---|---|
| `create_vault(client, freelancer, token, amount)` | Client | Creates vault, returns vault_id |
| `deposit_funds(vault_id, client)` | Client | Locks tokens into contract |
| `submit_deliverable(vault_id, freelancer, proof_url)` | Freelancer | Submits proof, sets InReview |
| `approve_and_release(vault_id, client)` | Client | Releases funds to freelancer |
| `cancel_vault(vault_id, client)` | Client (pre-fund) | Cancels vault, no refund needed |
| `get_vault(vault_id)` | Public | Returns VaultInfo |
| `get_vault_count()` | Public | Returns total vaults created |

---

## Level 1 Checklist ✅

- [x] Freighter wallet connected on Stellar Testnet
- [x] Wallet connect / disconnect
- [x] XLM balance displayed
- [x] Send XLM transaction → success/failure + tx hash shown
- [x] Error handling: wallet missing, tx rejected, network mismatch

## Level 2 Checklist ✅

- [x] 3 error types: `WalletNotConnected`, `TransactionRejected`, `ContractCallFailed`
- [x] Contract deployed on Testnet (see deployed ID below)
- [x] Contract called from frontend (`create_vault`)
- [x] Transaction status visible (Pending → Success/Failed)
- [x] Multi-wallet: Freighter (sign) + Watch-only (any address)
- [x] Real-time: polls transaction status until finalised

---

## Deployed Contract

| Network | Contract ID |
|---|---|
| Testnet | `CCUDDA4BJABILGHSV4FDPM3575P7CAL4QAYSKR4N2LQ37F6EJJHQEK2B` |

[View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCUDDA4BJABILGHSV4FDPM3575P7CAL4QAYSKR4N2LQ37F6EJJHQEK2B)

---

## On-chain Proof

Live transaction calling the deployed contract — verifiable on Stellar Explorer:

| | |
|---|---|
| Function | `create_vault(client, freelancer, token, amount)` |
| Transaction hash | `d33f6990178296046853554007e74b3a7f941f7ec8e6dc7373a95f725a00f8a7` |
| Ledger | 4089944 |
| Time | 2026-08-11 17:53:21 UTC |

- [StellarExpert — transaction](https://stellar.expert/explorer/testnet/tx/d33f6990178296046853554007e74b3a7f941f7ec8e6dc7373a95f725a00f8a7)
- [Horizon — transaction](https://horizon-testnet.stellar.org/transactions/d33f6990178296046853554007e74b3a7f941f7ec8e6dc7373a95f725a00f8a7)

---

## Wallet Options

Four wallets are supported — Freighter, xBull, Albedo, and Rabet — with automatic detection of installed extensions.

![Wallet options](frontend/public/wallet-options.png)

---

## Commit History

```
chore: scaffold Next.js + Tailwind frontend
feat: add WorkVault Soroban vault contract
test: cover vault contract with unit tests and snapshots
feat: add Stellar testnet deploy script
feat: add Stellar SDK helpers for balance, sends, and tx polling
feat: integrate Freighter, xBull, Albedo, and Rabet wallets
feat: add wallet connect/disconnect with session-aware context
feat: call WorkVault contract from the frontend
feat: add escrow action forms (send, create, deposit, deliverable, release)
feat: stream contract events in real time
feat: build dashboard and landing experience with shared UI primitives
docs: document project, decisions, and agent rules
chore: ignore frontend build artifacts and env files
```

---

## See Also

- [DECISIONS.md](./DECISIONS.md) — design choices and reasoning
- [Stellar Docs](https://developers.stellar.org/)
- [Soroban SDK Docs](https://docs.rs/soroban-sdk)
- [Freighter API Docs](https://docs.freighter.app/)
