# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.x (Testnet) | ✅ |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Please report security issues by emailing the maintainers privately. Include:

- A description of the vulnerability
- Steps to reproduce
- Impact assessment
- Any suggested fix (optional)

We aim to acknowledge all reports within 48 hours and provide a fix timeline within 7 days.

---

## Threat Model

WorkVault holds funds in trust for a client and freelancer. The core security
guarantee is: **money can only leave the escrow contract through an explicitly
authorized code path.** This document enumerates the attack surface, the
protections in place, and the known limitations.

### Assets

| Asset | Location |
|---|---|
| Client escrow deposit | Contract balance (`token` contract) |
| Vault state (status, milestones, proof) | Contract persistent storage |
| Milestone state | Contract persistent storage |

### Trust Assumptions

1. The **client** is the authorized party to create, fund, cancel, and approve vaults.
2. The **freelancer** is the authorized party to submit deliverables and approve release.
3. In the **multi-sig release flow**, **both** the client and freelancer must approve before funds are released.
4. The **token contract** behaves correctly (standard Stellar Asset Contract semantics).

### Attack Surface

| Attack Vector | Mitigation |
|---|---|
| Unauthorized vault read/modification | `require_auth()` on every write function; `client` or `freelancer` address check |
| Re-entrancy during token transfer | Soroban executes single-threaded; token transfers are synchronous and non-reentrant by design |
| Integer overflow in amount arithmetic | All amounts stored as `i128`; overflow panics in debug/wrapped builds; checked in balance math |
| Double-approve of release | `AlreadyApproved` guard on `approve_release` |
| Premature fund release | Release only possible after `PendingRelease` status AND both `client_approved_release` AND `freelancer_approved_release` are true |
| Milestone amount mismatch | `set_milestones` / `update_milestone` enforce sum == vault total |
| Proof URL spoofing | `submit_deliverable` requires valid `Funded` status; proof URL is informational, not financial authority |
| Phishing a wallet | Out of scope — wallet auth is handled by Freighter/xBull/Rabet |
| Malicious token contract | Contract accepts any `token` address; deployer should use trusted SAC addresses |

---

## State Machine

```
Created ──(deposit_funds)──> Funded ──(submit_deliverable)──> InReview
   │                              │                              │
   └──(cancel_vault)──> Cancelled  │                              ├──(raise_dispute)──> Disputed
                                  │                              │                          │
                                  └──(raise_dispute)──> Disputed  │                          └──(refund)──> Cancelled
                                                                  └──(request_release)──> PendingRelease
                                                                                                │
                                                                                    (approve_release x2)──> Completed
```

### Valid Transitions

| From | To | Auth |
|---|---|---|
| Created | Funded | client |
| Created | Cancelled | client |
| Funded | InReview | freelancer |
| Funded | Disputed | client or freelancer |
| InReview | PendingRelease | client |
| InReview | Disputed | client or freelancer |
| PendingRelease | Completed (after both approve) | client + freelancer |
| Disputed | Cancelled (refund) | client |

---

## Security Reviews

### Identified Risks (with mitigations)

1. **Proof URL is informational only.** The contract does not validate URL
   structure or content. A malicious freelancer can submit any string. This is
   by design — the client verifies the deliverable before approving release.
   For stronger guarantees, integrate IPFS content-hashing in a future version.

2. **Single token address per vault.** The `token` is fixed at creation. If the
   client wants to switch payment token, they must create a new vault.

3. **No time-based auto-escalation.** A dispute stays `Disputed` until `refund`
   is called by the client. There is no arbiter/DAO role yet. This is a known
   limitation for real-world escrow disputes; future versions will add a
   neutral third party.

4. **Multi-sig is two-party (client + freelancer), not an independent party.**
   Both parties must approve release, which prevents unilateral fund release.
   This does NOT resolve client-vs-freelancer disputes — it only ensures both
   agree to release.

5. **Re-entrancy.** Soroban `token::Client::transfer` is synchronous. There is
   no callback into the contract, so re-entrancy is not exploitable in the
   current runtime.

6. **Access control.** Every mutating function calls `require_auth()` and
   checks the caller is the expected party. There is no admin-only privileged
   function (the `refund` path only lets the *client* recover funds post-dispute).

---

## Test Coverage

37 unit tests cover:

- Vault creation and default state
- Deposit (authorized, unauthorized, double-deposit)
- Cancel (authorized, on-funded-vault fails)
- Milestones (set, update, wrong sum, after funding)
- Deliverables (single + milestone, wrong person)
- Approval (single-release, milestone release)
- Request/approve release flow (multi-sig)
- Dispute (by client, by freelancer, empty reason, wrong status)
- Refund (post-dispute, unauthorized, non-disputed)

Run tests locally:

```bash
cd contracts/vault
cargo test
```

---

## Incident Response

If a critical vulnerability is discovered in the contract:

1. **Freeze** — Do not advertise new vaults; notify users to pause deposits.
2. **Assess** — Determine exploitability and fund exposure.
3. **Remediate** — Deploy patched contract; write migration if storage incompatible.
4. **Notify** — Report to affected users and the community.

---

## Responsible Disclosure

We are a student project (RiseIn bootcamp). We welcome security review by the
community and mentors. Please report findings privately so we can fix and
disclose responsibly.

---

*Last reviewed: August 2026*
