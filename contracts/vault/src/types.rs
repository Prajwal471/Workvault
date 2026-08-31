use soroban_sdk::{contracttype, Address, String};

/// Lifecycle state of an escrow vault.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VaultStatus {
    /// Vault created, awaiting client deposit.
    Created,
    /// Client has locked funds into the contract.
    Funded,
    /// Freelancer submitted deliverables; awaiting client approval.
    InReview,
    /// Both parties have requested/approved release; funds pending transfer.
    PendingRelease,
    /// All milestones approved, funds released.
    Completed,
    /// Vault cancelled before funding.
    Cancelled,
    /// Dispute raised by either party.
    Disputed,
}

/// Lifecycle state of a single milestone.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    /// Awaiting freelancer submission.
    Pending,
    /// Freelancer submitted proof; awaiting client review.
    Submitted,
    /// Client approved; funds for this milestone released.
    Approved,
    /// Milestone disputed by either party.
    Disputed,
}

/// A single milestone within an escrow vault.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u64,
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
    pub proof_url: String,
}

/// On-chain record of an escrow vault.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultInfo {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    /// Token used for payment (native XLM or SAC address).
    pub token: Address,
    /// Total locked amount in stroops (or token smallest unit).
    pub amount: i128,
    pub status: VaultStatus,
    /// Optional proof URL submitted by the freelancer (legacy single-milestone).
    pub proof_url: String,
    /// Milestones for this vault (empty = single-deliverable mode).
    pub milestones: soroban_sdk::Vec<Milestone>,
    /// Client has approved release (multi-sig).
    pub client_approved_release: bool,
    /// Freelancer has approved release (multi-sig).
    pub freelancer_approved_release: bool,
}
