# Building a Trustless Freelance Escrow on Stellar Soroban — WorkVault

> Status: DRAFT — technical blog / ecosystem contribution for the RiseIn program.
> Intended for dev.to or the Stellar Community Blog.

---

## The problem

Freelance platforms insert themselves as the trusted middleman between a client and a
freelancer. That works — until it doesn't. Funds sit in custodial accounts, payouts are
delayed, disputes are opaque, and reputation is locked inside a single platform's walled
garden.

WorkVault removes the middleman with a smart contract. A client and a freelancer agree
directly on-chain; the client locks payments into a Soroban vault; the freelancer submits
verifiable proof of work; and the client approves the release. Payment is instant and
un-takebackable, and every completed contract becomes a portable work-history record the
freelancer owns.

## Why Stellar Soroban?

- **Near-zero, predictable fees** — escrow micro-payments are only viable when fees are tiny.
- **Fast finality (~5 seconds)** — both parties want money to move, not to wait for a slow chain.
- **Rust smart contracts** — memory-safe, auditable, and a great fit for financial logic.
- **Stellar Asset Contract (SAC)** — we're token-agnostic out of the box. `create_vault`
  takes any token address, and deposits move through the standard `token::Client::transfer`
  interface.

## Architecture

```
contracts/vault/
  lib.rs      # 16+ public functions (create, deposit, submit, approve, dispute, refund...)
  types.rs    # VaultInfo, VaultStatus, Milestone, MilestoneStatus
  storage.rs  # persistent + instance helpers
  error.rs    # ContractError enum
  tests.rs    # 37 unit tests + snapshots

frontend/
  Next.js 16 + React 19 + TypeScript
  Freighter / xBull / Albedo / Rabet wallet support
  lib/contracts.ts  # typed wrappers over the Soroban RPC
  lib/network.ts    # dynamic testnet/mainnet detection
```

## The two-party multi-sig release

The feature we're most excited about is **two-party release approval**.

Single-party release means the client can unilaterally pay out — or withhold — a milestone.
WorkVault's new `request_release` / `approve_release` flow makes it a real negotiation:

1. Either party calls `request_release(vault_id)`, moving the vault to `PendingRelease`.
2. The **client** calls `approve_release(vault_id)` and the **freelancer** calls the same.
3. Funds only move once **both** have approved.

The release stops being a one-sided power move and becomes an agreement enforced by the
contract — not by a platform's support team.

## Security model

Because the contract moves real money, we treat security as a first-class concern:
- **Access control** on every mutating function (`require_client`, `require_freelancer`).
- **Explicit state machine** — a vault can only move through valid transitions; invalid
  ones revert with a typed `ContractError`.
- **No re-entrancy surface** — cross-contract token calls are finalized before any state
  is mutated in ways that could be exploited.
- **Negative-path tests** — 37 tests cover unauthorized, invalid-state, double-approve, and
  zero-amount cases.

See [SECURITY.md](https://github.com/Prajwal471/Workvault/blob/main/SECURITY.md) for the
full threat model and state-transition table.

## What's next

Mainnet deployment is the next milestone — it needs a small amount of XLM to fund the
deployer and onboard the first real users. Until that funding lands, the full app is live
and thoroughly tested on Testnet.

## Try it

- Live demo (Testnet): https://workvault-liart.vercel.app
- Source: https://github.com/Prajwal471/Workvault

*WorkVault is an independent project built for the Stellar RiseIn program. It is not an
official Stellar project.*
