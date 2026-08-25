# Stellar WorkVault
### Trustless Escrow for the Global Freelance Economy

---

## Slide 1 — The Problem

**$1.5 trillion** global freelance economy. **$9.9 billion** platform market (2026).

Freelancers and clients face:
- **Platform fees** — Up to 20% cut from Upwork, Fiverr, Toptal
- **Payment delays** — 14-30 day holding periods
- **Trust gaps** — No escrow, no dispute resolution, no guarantees
- **Centralized control** — Platforms can freeze accounts, hold funds arbitrarily

> *"I completed a $5,000 project and waited 21 days to get paid. The platform took $1,000 in fees."*
> — Freelancer feedback

---

## Slide 2 — The Solution

**Stellar WorkVault** — A decentralized escrow platform built on Stellar Soroban smart contracts.

- **Zero platform fees** — Only Stellar network transaction costs (~$0.0001)
- **Instant settlement** — Funds release in seconds, not weeks
- **Trustless escrow** — Smart contract holds funds until both parties agree
- **Milestone-based payments** — Break projects into verifiable deliverables
- **Dispute resolution** — Built-in raise_dispute path for conflicts

---

## Slide 3 — How It Works

```
Client Creates Vault → Sets Milestones → Deposits XLM
         ↓
Freelancer Submits Deliverable (URL proof)
         ↓
Client Reviews → Approves Release → Funds Sent
         ↓
   OR Raise Dispute → Resolution
```

**Three clicks to escrow. Zero trust required.**

---

## Slide 4 — Smart Contract Architecture

**16 on-chain functions, 28 passing tests**

| Function | Purpose |
|---|---|
| `create_vault` | Initialize escrow with client, freelancer, amount, token |
| `set_milestones` | Define project phases with individual amounts |
| `fund_vault` | Deposit XLM into the escrow contract |
| `submit_deliverable` | Freelancer submits proof of work (URL) |
| `approve_and_release` | Client releases funds to freelancer |
| `approve_milestone` | Per-milestone approval and partial release |
| `update_milestone` | Edit milestone details before funding |
| `raise_dispute` | Initiate conflict resolution |
| `cancel_vault` | Cancel unfunded vault, return funds |
| `get_vault` / `get_vault_count` | Read vault state from chain |

**Built on Soroban SDK v27 · Rust · Stellar Testnet**

---

## Slide 5 — Product Demo

**Two-panel dashboard** with role-based access:

- **Client Panel** — Create vault, set milestones, deposit funds, approve releases
- **Freelancer Panel** — Submit deliverables, raise disputes
- **Vault List** — Filtered by role, auto-refreshes every 15s
- **Activity Feed** — Real-time on-chain event stream
- **Role Toggle** — Seamless client/freelancer switching

**Wallet Integration:**
- Freighter, xBull, Rabet
- localStorage persistence across sessions
- Auto-reconnect on page reload

---

## Slide 6 — Market Opportunity

| Metric | Value |
|---|---|
| Total Freelance Economy | **$1.5 Trillion** |
| Platform Market (2026) | **$9.9 Billion** |
| CAGR (2026-2030) | **18.6%** |
| Global Freelancers | **1.57 Billion** by 2030 |
| Blockchain in Freelancing | **$3.7 Billion** by 2028 |

**Stellar WorkVault targets the intersection of DeFi and freelance work — a $3.7B opportunity with no dominant player.**

---

## Slide 7 — Competitive Advantage

| Feature | Upwork | Fiverr | Stellar WorkVault |
|---|---|---|---|
| Platform Fee | 10-20% | 20% | **0%** |
| Payment Speed | 14-30 days | 14 days | **Seconds** |
| Escrow | Centralized | Centralized | **Smart Contract** |
| Dispute Resolution | Platform decides | Platform decides | **On-chain** |
| Milestone Payments | ✅ | ❌ | **✅** |
| Open Source | ❌ | ❌ | **✅** |
| Decentralized | ❌ | ❌ | **✅** |

---

## Slide 8 — Traction & Metrics

| Metric | Status |
|---|---|
| Smart Contract | ✅ Deployed on Stellar Testnet |
| Functions | 16 on-chain functions |
| Test Coverage | 28 passing tests |
| Testnet Vaults | 55+ created |
| User Feedback | 14 responses, **5/5 avg rating** |
| Vault Creation Rate | **95%** success |
| Would Use for Real Work | **80%** of respondents |
| CI/CD | GitHub Actions — lint, test, build |
| Deployment | Vercel (auto-deploy from main) |

---

## Slide 9 — Technology Stack

**Smart Contract**
- Stellar Soroban SDK v27
- Rust with `soroban-sdk`
- Persistent storage for vault data
- Instance storage for global counters

**Frontend**
- Next.js 16.3 (React 19)
- TypeScript
- Stellar JS SDK v15+
- Tailwind CSS

**Infrastructure**
- Vercel (frontend hosting)
- Stellar Testnet (contract deployment)
- GitHub Actions (CI/CD pipeline)
- Stellar Expert (on-chain verification)

---

## Slide 10 — Roadmap

| Phase | Timeline | Deliverables |
|---|---|---|
| **L3 — Production** | Aug 18-23 | Milestones, disputes, refunds, CI, mobile |
| **L4 — Polish** | Aug 24-28 | Analytics, health endpoint, skeletons, error pages |
| **L5 — Ecosystem** | Aug 29-31 | Two-panel dashboard, role system, user onboarding |
| **L6 — Advanced** | Aug 29-31 | Multi-sig vault, security audit, growth metrics |
| **L7 — Scale** | Post-Aug 31 | 50+ mainnet users, 50+ followers, blog/tutorial |

---

## Slide 11 — The Vision

**Stellar WorkVault** is building the **trustless employment layer** for the decentralized web.

Short-term: Replace platform escrow with smart contracts
Mid-term: Multi-sig approvals, cross-chain payments, reputation system
Long-term: DAO-based arbitration, custom token support, global freelance marketplace

> *"We're not building another freelancing platform. We're building the infrastructure that makes platforms obsolete."*

---

## Slide 12 — Call to Action

**Stellar WorkVault** is live on Testnet.

- **Contract:** `CAQ6QWRDHIF54ECVHAFIZF3CULKDFG6UXZMOYH577HZQODJPDQ7NV2WS`
- **Demo:** [workvault-liart.vercel.app](https://workvault-liart.vercel.app)
- **Code:** [github.com/Prajwal471/Workvault](https://github.com/Prajwal471/Workvault)
- **Video:** [YouTube Demo](https://youtu.be/NGgDidEXL7s)

**Let's build the future of work — together.**

---

*Built with Stellar Soroban · RiseIn Web3 Bootcamp · August 2026*
