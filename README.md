# Stellar WorkVault

[![CI](https://github.com/Prajwal471/Workvault/actions/workflows/ci.yml/badge.svg)](https://github.com/Prajwal471/Workvault/actions/workflows/ci.yml)

> Freelance escrow with portable, on-chain reputation — built on Stellar Soroban.

A client locks milestone payments into a Soroban vault; a freelancer submits proof
of work; the client approves and funds release instantly. Every completed contract
builds a verifiable, portable work-history record the freelancer owns — not the platform.

---

## Live Demo

[workvault-liart.vercel.app](https://workvault-liart.vercel.app/) — deployed on Vercel (Stellar Testnet)

---

## Screenshots

### Mobile Responsive UI

<!-- Replace with your screenshot: open site in browser → DevTools → toggle device toolbar → select iPhone/Android → screenshot -->
<img width="375" alt="Mobile responsive UI" src="https://github.com/user-attachments/assets/857955a3-02d6-49ec-83d2-cecde233f7bd" />

### CI/CD Pipeline

<!-- Replace with your screenshot: GitHub Actions → show green checkmarks on all jobs -->
<img width="700" alt="CI/CD pipeline passing" src="https://github.com/user-attachments/assets/334d2dd7-f915-4ec8-8a3b-c44821e1e3f1" />

### Test Output

<!-- Replace with your screenshot: terminal showing `cargo test` (24 passed) + `npx vitest run` (28 passed) -->
<img width="700" alt="Test output showing 52 passing tests" src="https://github.com/user-attachments/assets/0a0e68d8-b124-474e-bbfd-202924eab190" />



<img width="700" alt="Test output showing 52 passing tests" src="https://github.com/user-attachments/assets/006cb2b3-4aa8-43fe-b577-105f60570cae" />

### Demo Video

<!-- Replace with your video link: record 1-2 min walkthrough of connect → create vault → deposit → submit → approve → release -->
🎬 [Watch the demo video](PLACEHOLDER_VIDEO_LINK)

---

## Tools & Technologies

| Category | Technology |
|---|---|
| Smart contract | Rust · Soroban SDK (Stellar's WASM smart-contract platform) |
| Contract tooling | Stellar CLI (`stellar contract`), Stellar RPC, Soroban token interface |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS |
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
└── frontend/               # Next.js 16 + TypeScript + Tailwind frontend
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

- [x] 4 error types: `WalletNotConnected`, `TransactionRejected`, `InsufficientBalance`, `ContractCallFailed`
- [x] Contract deployed on Testnet (see deployed ID below)
- [x] Contract called from frontend (`create_vault`)
- [x] Transaction status visible (Pending → Success/Failed)
- [x] Multi-wallet: Freighter (sign) + Watch-only (any address)
- [x] Real-time: polls transaction status until finalised

## Level 3 Checklist ✅

- [x] Advanced smart contract: milestones, disputes, refunds, multi-role auth
- [x] Inter-contract communication: `token::Client::transfer` for token-agnostic escrow
- [x] Event streaming: 9 event types + frontend ActivityFeed with 6s polling
- [x] CI/CD pipeline: GitHub Actions (Rust fmt/clippy/test + Frontend lint/build)
- [x] Deployment workflow: `deploy.sh` with fresh deploy + update modes
- [x] Mobile responsive: all 7 form components with `@media` breakpoints
- [x] Error handling: 11 contract error variants + TxStepper + form error banners
- [x] Tests: 24 Rust tests + 28 frontend tests (Vitest)
- [x] Architecture: types.rs / error.rs / storage.rs separation, frontend lib/ split
- [x] Documentation: README, ROADMAP, DECISIONS, CI badge

---

## Deployed Contract

| Network | Contract ID |
|---|---|
| Testnet | `CAQ6QWRDHIF54ECVHAFIZF3CULKDFG6UXZMOYH577HZQODJPDQ7NV2WS` |

[View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CAQ6QWRDHIF54ECVHAFIZF3CULKDFG6UXZMOYH577HZQODJPDQ7NV2WS)

---

## On-chain Proof

Live transaction calling the deployed contract — verifiable on Stellar Explorer:

| | |
|---|---|
| Function | `create_vault(client, freelancer, token, amount)` |
| Vault ID | `13` |
| Transaction hash | `5cc3cf6db36b028710c2e6b5304d8abe662b20c5ec8f73f4bb80610139092bd4` |
| Ledger | 4124772 |
| Time | 2026-08-13 18:20:09 UTC |

- [StellarExpert — transaction](https://stellar.expert/explorer/testnet/tx/5cc3cf6db36b028710c2e6b5304d8abe662b20c5ec8f73f4bb80610139092bd4)
- [Horizon — transaction](https://horizon-testnet.stellar.org/transactions/5cc3cf6db36b028710c2e6b5304d8abe662b20c5ec8f73f4bb80610139092bd4)

---

## Wallet Options

Four wallets are supported — Freighter, xBull, Albedo, and Rabet — with automatic detection of installed extensions.


<img width="545" height="587" alt="image" src="https://github.com/user-attachments/assets/a68dd21d-efcd-4d0e-807c-9674a4777f05" />

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



<img width="429" height="761" alt="image" src="" />
<img width="1919" height="654" alt="image" src="" />
<img width="1007" height="822" alt="image" src="" />
<img width="1507" height="347" alt="image" src="https://github.com/user-attachments/assets/f6218c85-ae6e-41cd-8b6e-1be52535bd03" />





- [ROADMAP.md](./ROADMAP.md) — project milestones and commit targets
- [DECISIONS.md](./DECISIONS.md) — design choices and reasoning
- [Stellar Docs](https://developers.stellar.org/)
- [Soroban SDK Docs](https://docs.rs/soroban-sdk)
- [Freighter API Docs](https://docs.freighter.app/)
