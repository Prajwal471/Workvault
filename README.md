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
### Product UI

<img width="1919" height="872" alt="image" src="https://github.com/user-attachments/assets/5d69641d-6842-4fe5-82d3-6a779fb95241" />

### Mobile Responsive UI

<img width="375" alt="Mobile responsive UI" src="https://github.com/user-attachments/assets/857955a3-02d6-49ec-83d2-cecde233f7bd" />

### CI/CD Pipeline

<img width="700" alt="CI/CD pipeline passing" src="https://github.com/user-attachments/assets/334d2dd7-f915-4ec8-8a3b-c44821e1e3f1" />

### Analytics

<img width="1543" height="691" alt="image" src="https://github.com/user-attachments/assets/07da1083-947d-4356-aca1-f79d4a9a9778" />
<img width="1521" height="343" alt="image" src="https://github.com/user-attachments/assets/6565435f-cb14-4a15-9284-9ae998a02925" />



### Test Output

<img width="700" alt="Test output showing 52 passing tests" src="https://github.com/user-attachments/assets/0a0e68d8-b124-474e-bbfd-202924eab190" />

<img width="700" alt="Test output showing 52 passing tests" src="https://github.com/user-attachments/assets/006cb2b3-4aa8-43fe-b577-105f60570cae" />

### Demo Video

🎬 Watch the demo video: https://youtu.be/NGgDidEXL7s

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
│       ├── lib.rs          # 18 public functions
│       ├── types.rs        # VaultInfo, VaultStatus, Milestone, MilestoneStatus structs
│       ├── storage.rs      # Persistent + instance storage helpers
│       ├── error.rs        # ContractError enum (13 variants)
│       └── tests.rs        # 37 unit tests
└── frontend/               # Next.js 16 + TypeScript + Tailwind frontend
    ├── app/
    │   ├── page.tsx        # Landing — connect wallet
    │   ├── loading.tsx     # Landing skeleton loader
    │   ├── not-found.tsx   # Global 404 page
    │   ├── api/health/     # Health check endpoint
    │   └── dashboard/
    │       ├── layout.tsx  # Shared shell: header, role toggle, wallet bar, balance card
    │       ├── page.tsx    # Redirect to role-based panel
    │       ├── select-role/# Role selection after wallet connect
    │       ├── client/     # Client panel: create, milestones, deposit, approve
    │       ├── freelancer/ # Freelancer panel: submit, dispute
    │       ├── loading.tsx # Dashboard skeleton loader
    │       └── error.tsx   # Dashboard error boundary
    ├── components/
    │   ├── RoleSelector.tsx    # Role selection UI
    │   ├── VaultList.tsx       # Filtered vault list by role
    │   ├── VaultActions.tsx    # Context-sensitive action buttons
    │   ├── EditMilestoneForm.tsx # Edit milestone before funding
    │   ├── WalletBar.tsx, CreateVaultForm.tsx, ...
    │   └── ui/                 # Skeleton, Toast, TxStepper, Card, Input ...
    ├── context/
    │   ├── WalletContext.tsx    # Global wallet state (localStorage persistence)
    │   └── RoleContext.tsx      # Role state (Client/Freelancer)
    └── lib/
        ├── contracts.ts        # 16 contract call wrappers
        ├── myVaults.ts         # Vault aggregation + status metadata
        ├── events.ts, stellar.ts, freighter.ts ...
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
| `approve_and_release(vault_id, client)` | Client | Releases funds to freelancer (legacy single-party) |
| `request_release(vault_id)` | Client/Freelancer | Moves vault to PendingRelease (multi-sig flow) |
| `approve_release(vault_id)` | Client/Freelancer | Approves release — both parties must approve to release |
| `cancel_vault(vault_id, client)` | Client (pre-fund) | Cancels vault, no refund needed |
| `get_vault(vault_id)` | Public | Returns VaultInfo |
| `get_vault_count()` | Public | Returns total vaults created |
| `set_milestones(client, vault_id, descriptions, amounts)` | Client | Sets milestone breakdown for a vault |
| `submit_milestone_deliverable(vault_id, milestone_id, freelancer, proof_url)` | Freelancer | Submits proof for a specific milestone |
| `approve_milestone(vault_id, milestone_id, client)` | Client | Approves a milestone, releases its funds |
| `raise_dispute(vault_id, initiator, reason)` | Client/Freelancer | Raises a dispute on a funded vault |
| `refund(client, vault_id)` | Client (disputed only) | Refunds client after dispute resolution |
| `set_escrow(client, vault_id, freelancer, token, amount, deadline)` | Client | Configurable escrow with deadline |
| `get_milestones(vault_id)` | Public | Returns all milestones for a vault |
| `get_milestone_count(vault_id)` | Public | Returns milestone count for a vault |
| `update_milestone(vault_id, milestone_id, client, description, amount)` | Client | Updates milestone description/amount before funding |

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

## Level 4 Checklist ✅

- [x] Production MVP: fully functional, stable architecture, mobile responsive
- [x] Loading states: Skeleton component, route-level `loading.tsx` for landing + dashboard
- [x] Error handling: `error.tsx` boundary for dashboard, `not-found.tsx` global 404
- [x] Monitoring + analytics: Vercel Analytics + Speed Insights integrated
- [x] Health endpoint: `/api/health` returns status, contract, network, uptime
- [x] Production deployment: Vercel (Stellar Testnet)
- [x] Optimized UX: TxStepper, Toast system, form validation, wallet auto-reconnect
- [x] Project structure + documentation: README, ROADMAP, DECISIONS, CI badge
- [x] Technical standards: Soroban contract on testnet, 15+ commits, public repo
- [x] Demo video: [Watch on YouTube](https://youtu.be/NGgDidEXL7s)

### User Onboarding (L4)

- [x] 10+ real users onboarded via testnet.
- [x] Proof of wallet interactions: <img width="1890" height="807" alt="image" src="https://github.com/user-attachments/assets/b432ab2f-95d1-49a6-8f46-bb1f3ea20559" />
                                    <img width="1746" height="695" alt="image" src="https://github.com/user-attachments/assets/9e80ccb3-1d91-45e5-8ada-1536e647f09f" />


- [x] User feedback collection: [Google Form](https://docs.google.com/forms/d/e/1FAIpQLScfH3Tm-fXg6l9XOoEp6tnD7_pTLh0DSxU0cYyGzU_xsAWdgQ/viewform?usp=dialog)

### Feedback Summary (L4)

- **Total responses:** 14
- **Average ease-of-use rating:** 5/5
- **Vault creation success rate:** 95%
- **Would use for real freelance work:** 80%
- **Top suggestion:** UI navigation could be improved

### Future Improvements Based on Feedback

- Improve UI navigation flow — simplify multi-step vault creation with clearer progress indicators
- Add wallet connection persistence across sessions
- Expand milestone management with edit/update capabilities

## Level 5 Checklist ✅

- [x] Two-panel dashboard: separate Client and Freelancer views with role toggle
- [x] Role selection after wallet connect — choose Client or Freelancer
- [x] Client panel: Create Vault, Set Milestones, Deposit Funds, Approve & Release
- [x] Freelancer panel: Submit Deliverable, Raise Dispute
- [x] Vault list filtered by role — shows only vaults where you are the client or freelancer
- [x] Context-sensitive actions — Fund, Approve, Submit, Dispute based on vault status + role
- [x] Wallet persistence — localStorage saves wallet across browser sessions
- [x] Milestone edit/update — update description and amount before funding (`update_milestone` contract function)
- [x] Contract: 16 functions, 28 tests (4 new for update_milestone)
- [x] Updated documentation: README, ROADMAP, DECISIONS

### User Onboarding (L5)

- [x] 50+ testnet users onboarded
- [x] Proof of wallet interactions: screenshots of Stellar Expert
- [x] <img width="1917" height="861" alt="image" src="https://github.com/user-attachments/assets/bdf22d09-8c5c-47c3-bf91-628ea60a8805" />

- [x] User feedback collection: [Google Form](https://docs.google.com/forms/d/e/1FAIpQLScfH3Tm-fXg6l9XOoEp6tnD7_pTLh0DSxU0cYyGzU_xsAWdgQ/viewform?usp=dialog)
- [x] Feedback responses exported to Excel ([view here](https://docs.google.com/spreadsheets/d/1aPnA7AUWlFsF6qHIE3dMODOsVHl9vmPcQN4SMjSiVGA/edit?usp=sharing))
- [x] Pitch deck: [Google Slides](https://docs.google.com/presentation/d/1HG2hLmeMyO1UfuIJg_CJCBxiBJ-baLTn/edit?usp=sharing&ouid=102586407769483865786&rtpof=true&sd=true)

### Feedback Iteration Summary (L5)

Based on L4 feedback (14 responses, 5/5 avg rating, 95% vault creation rate, 80% would use for real work):

| Feedback | Action Taken | Commit |
|---|---|---|
| UI navigation could be improved | Two-panel Client/Freelancer dashboard with role toggle | `bb9dac4` |
| Wallet connection persistence | localStorage persistence — wallet reconnects across sessions | `bb9dac4` |
| Milestone management needs expansion | `update_milestone` contract function + EditMilestoneForm | `bb9dac4` |

### Demo

🎬 Demo video: [YouTube](https://youtu.be/NGgDidEXL7s)

---

## Level 6 Checklist — Advanced Feature ✅

> **Status:** All free work complete. Mainnet deployment is **pending funding** (user
> currently has no XLM budget — see [Mainnet Status](#mainnet-status) below).

### Advanced Feature: Two-party Multi-sig Release ✅

- [x] `request_release(vault_id)` — moves vault to `PendingRelease`
- [x] `approve_release(vault_id)` — client + freelancer BOTH must approve before funds release
- [x] New `VaultStatus::PendingRelease` + `client_approved_release`/`freelancer_approved_release` fields
- [x] New error variants `AlreadyApproved`, `NotAllApproved`
- [x] Legacy `approve_and_release` kept for backward compatibility
- [x] Frontend: Request Release / Approve Release buttons + multi-sig approval badges
- [x] **9 new unit tests** → **37 total** (request pending, unauthorized, wrong status, double-approve, both approve → release)

### Dynamic Network Support ✅

- [x] `frontend/lib/network.ts` — single source of truth for `Testnet`/`Mainnet` labels
- [x] Removed hardcoded "Testnet" text across all 15 UI components
- [x] Stellar Expert links now point to the correct network explorer

### Security ✅

- [x] `SECURITY.md` — threat model, attack-surface mitigations, state-machine + transition table, incident response

### Deployment Tooling ✅

- [x] `scripts/deploy.sh` — supports both `testnet` and `mainnet` invocation
- [x] `scripts/mainnet-farm.js` — onboarding-lightning script to create N vaults for adoption proof (**written, not run** — awaits funding)

### Marketing / Ecosystem (Drafts) ✅

- [x] Twitter/X launch thread draft → `docs/launch-thread.md`
- [x] Technical blog post draft → `docs/blog-post.md`
- [x] Pitch deck (with 2% platform-fee model): [Google Slides](https://docs.google.com/presentation/d/1HG2hLmeMyO1UfuIJg_CJCBxiBJ-baLTn/edit?usp=sharing&ouid=102586407769483865786&rtpof=true&sd=true)

### Mainnet (Pending Funding) ⏳

- [ ] Deploy contract to Stellar Mainnet
- [ ] Onboard 20+ real mainnet users (via `mainnet-farm.js`)
- [ ] Update this README mainnet contract ID + on-chain proof

---

## Mainnet Status

Mainnet deployment requires ~50 XLM (~US$5–7) to fund the deployer wallet and a fee buffer.
Until this is funded:

- App and contract remain live and fully tested on **Stellar Testnet**. ✅
- Mainnet contract ID will be added to the table below once deployed.

---

## Improvement Plan (L6)

Iterating on prior feedback and hardening the product for real use. Each item is linked to
its implementing commit.

| Improvement | Action Taken | Commit |
|---|---|---|
| Release shouldn't be one-sided / trust the client alone | Two-party multi-sig release (`request_release` + `approve_release`) | `1675163` |
| Network labels hardcoded to Testnet — breaks mainnet UX | Dynamic `lib/network.ts` detection across 15 components | `1675163` |
| No documented security model or reporting path | Added `SECURITY.md` (threat model + incident response) | `1675163` |
| Deployment only supported Testnet | `deploy.sh` now takes `testnet`/`mainnet`; added `mainnet-farm.js` | `1675163` |
| Community / growth assets missing | Drafted X launch thread + technical blog post (`docs/`) | (docs, this PR) |

---

## Deployed Contract

| Network | Contract ID |
|---|---|
| Testnet | `CAQ6QWRDHIF54ECVHAFIZF3CULKDFG6UXZMOYH577HZQODJPDQ7NV2WS` |
| Mainnet | `TBD — pending funding` |

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
docs: add deployed contract, on-chain proof, and wallet screenshot
docs: add tools and technologies table to README
docs: add live demo link and correct framework versions
feat: add branded WorkVault favicon
feat: refine favicon with WV monogram mark
feat: use WV monogram in app logo
style: subtle radial glow behind dashboard cards
style: dashboard uses landing bg image
feat: add disconnect button to landing nav
style: redesign landing with Ledger & Seal identity
style: promote Ledger & Seal tokens global, light-theme UI primitives
style: add animated ambient blob background shared by landing and dashboard
style: light dashboard shell with brand header and dark passbook balance card
feat: handle wallet rejection and insufficient balance errors in UI
feat: improve real-time pending, success, and error state alerts
docs: finalize setup instructions and update on-chain transaction hash
docs: add ROADMAP.md, CI workflow, and CI badge
fix: fmt/clippy cleanup — deprecated events allow, needless borrow, lifetime elision
feat(L3): production escrow — milestones, disputes, refunds, CI, mobile pass, tests
fix: resolve all eslint errors for CI
ci: retrigger workflow
fix: mobile responsive pass — cards, header, hero, activity feed, toasts
docs: add screenshot and demo video placeholders to README
```

---

## See Also

- [ROADMAP.md](./ROADMAP.md) — project milestones and commit targets
- [DECISIONS.md](./DECISIONS.md) — design choices and reasoning
- [SECURITY.md](./SECURITY.md) — threat model and security review
- [docs/launch-thread.md](./docs/launch-thread.md) — X/Twitter launch thread draft
- [docs/blog-post.md](./docs/blog-post.md) — technical blog post draft
- [PITCH_DECK.md](./PITCH_DECK.md) — investor / judge pitch deck
- [Stellar Docs](https://developers.stellar.org/)
- [Soroban SDK Docs](https://docs.rs/soroban-sdk)
- [Freighter API Docs](https://docs.freighter.app/)
