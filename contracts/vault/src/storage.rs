use soroban_sdk::{contracttype, Env};

use crate::error::ContractError;
use crate::types::{Milestone, VaultInfo};

/// Storage keys used across instance and persistent storage.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    /// Monotonic vault counter stored in instance storage.
    VaultCounter,
    /// Per-vault record stored in persistent storage.
    Vault(u64),
    /// Per-vault milestone list stored in persistent storage.
    Milestones(u64),
}

// ── Counter ────────────────────────────────────────────────────────────────

/// Returns the current vault counter value, defaulting to 0.
pub fn read_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::VaultCounter)
        .unwrap_or(0u64)
}

/// Increments the vault counter and returns the new value.
/// This is the vault ID assigned to each new vault.
pub fn bump_counter(env: &Env) -> u64 {
    let next = read_counter(env) + 1;
    env.storage().instance().set(&DataKey::VaultCounter, &next);
    next
}

// ── Vault ──────────────────────────────────────────────────────────────────

/// Persists a vault to ledger storage.
pub fn write_vault(env: &Env, vault: &VaultInfo) {
    env.storage()
        .persistent()
        .set(&DataKey::Vault(vault.id), vault);
}

/// Reads a vault from ledger storage. Returns `VaultNotFound` if missing.
pub fn read_vault(env: &Env, vault_id: u64) -> Result<VaultInfo, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Vault(vault_id))
        .ok_or(ContractError::VaultNotFound)
}

// ── Milestones ─────────────────────────────────────────────────────────────

/// Persists a milestone list for a vault.
pub fn write_milestones(env: &Env, vault_id: u64, milestones: &soroban_sdk::Vec<Milestone>) {
    env.storage()
        .persistent()
        .set(&DataKey::Milestones(vault_id), milestones);
}

/// Reads milestones for a vault. Returns empty vec if none stored.
pub fn read_milestones(env: &Env, vault_id: u64) -> soroban_sdk::Vec<Milestone> {
    env.storage()
        .persistent()
        .get(&DataKey::Milestones(vault_id))
        .unwrap_or_else(|| soroban_sdk::Vec::new(env))
}
