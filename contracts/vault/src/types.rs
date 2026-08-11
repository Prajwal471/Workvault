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
    /// All milestones approved, funds released.
    Completed,
    /// Vault cancelled before funding.
    Cancelled,
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
    /// Optional proof URL submitted by the freelancer.
    pub proof_url: String,
}
