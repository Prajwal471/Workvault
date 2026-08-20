# Stellar WorkVault — Roadmap

Feature milestones for the Stellar WorkVault freelance escrow platform.

---

## Level 3 — Production Escrow (Aug 18–23) ✅

**Goal:** Production-ready escrow with milestones, dispute flow, and on-chain proof.

### Smart Contract
- [x] Milestone-based vault (split payment across deliverables)
- [x] `set_escrow` function for configurable escrow terms
- [x] Cross-contract calls for token transfers
- [x] Dispute event emission
- [x] Negative-path test coverage (unauthorized, invalid state, zero amount)
- [x] Snapshot regeneration for all test changes

### Frontend
- [x] Milestone creation form
- [x] Dispute submission form
- [x] Mobile-responsive layout pass
- [x] Component tests with Vitest

### Infrastructure
- [x] CI pipeline (GitHub Actions): Rust lint/test + Next.js lint/build
- [x] Redeploy contract to testnet with new ABI
- [x] On-chain proof: transaction hash + ledger link

---

## Level 4 — Hardened UX (Aug 24–28)

**Goal:** Production polish, env hardening, analytics, and user feedback loop.

### Frontend
- [ ] Health endpoint (`/api/health`)
- [ ] Vercel Analytics integration
- [ ] Env config hardening (validate required vars at startup)
- [ ] Loading state audit (skeletons, optimistic updates)
- [ ] Top UX improvement from user feedback (vault history, faster polling, etc.)

### Documentation
- [ ] L4 screenshot gallery
- [ ] User feedback summary
- [ ] README update with L4 materials

---

## Level 5 — Community & Ecosystem (Aug 29–31)

**Goal:** Ecosystem contribution, community building, and mainnet readiness.

### Smart Contract
- [ ] Multi-sig vault (two-party release approval)
- [ ] Multi-sig negative-path tests

### Infrastructure
- [ ] Mainnet deploy script
- [ ] Mainnet account funding

### Community
- [ ] Twitter launch thread
- [ ] Blog / tutorial (ecosystem contribution)
- [ ] User onboarding guide

---

## Level 6 — Advanced Feature (Aug 29–31)

**Goal:** Advanced feature demonstration with full documentation.

### Smart Contract
- [ ] Two-party release approval (multi-sig)
- [ ] SECURITY.md

### Documentation
- [ ] Monthly growth report
- [ ] README update (all L5–L6 materials)
- [ ] Pitch deck

---

## Out of Scope (Post-Aug 31)

- L7: 50+ new mainnet users + 50+ followers (aspirational, requires sustained growth)
- Full multi-sig wallet (beyond two-party approval)
- DAO-based arbitration
- Custom token deployment

---

## Commit Targets

| Window | Commits | Running Total |
|---|---|---|
| Aug 18–23 (L3) | 10 | 45 |
| Aug 24–28 (L4) | 6 | 51 |
| Aug 29–31 (L5/L6) | 5 | 56 |
| **August total** | | **~56** |

---

## Key Decisions

See [DECISIONS.md](./DECISIONS.md) for architecture and design rationale.
