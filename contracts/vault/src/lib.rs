#![no_std]

mod error;
mod storage;
mod types;

#[cfg(test)]
mod tests;

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, String};

pub use error::ContractError;
pub use types::{Milestone, MilestoneStatus, VaultInfo, VaultStatus};

#[contract]
pub struct WorkVaultContract;

#[contractimpl]
#[allow(deprecated, clippy::needless_borrows_for_generic_args)]
impl WorkVaultContract {
    // ── Vault Lifecycle ────────────────────────────────────────────────────

    /// Create a new escrow vault between a client and freelancer.
    /// Emits: ("vault", "created") → (vault_id, client, freelancer, amount)
    pub fn create_vault(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
    ) -> Result<u64, ContractError> {
        client.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let vault_id = storage::bump_counter(&env);

        let vault = VaultInfo {
            id: vault_id,
            client: client.clone(),
            freelancer: freelancer.clone(),
            token,
            amount,
            status: VaultStatus::Created,
            proof_url: String::from_str(&env, ""),
            milestones: soroban_sdk::Vec::new(&env),
        };

        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("created")),
            (vault_id, client, freelancer, amount),
        );

        Ok(vault_id)
    }

    /// Set milestones on a vault that has not been funded yet.
    /// Each milestone has a description and an amount that sums to the vault total.
    /// Emits: ("vault", "milestones") → (vault_id, milestone_count)
    pub fn set_milestones(
        env: Env,
        vault_id: u64,
        client: Address,
        descriptions: soroban_sdk::Vec<String>,
        amounts: soroban_sdk::Vec<i128>,
    ) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Created {
            return Err(ContractError::CannotSetMilestonesAfterFunding);
        }

        if descriptions.is_empty() {
            return Err(ContractError::NoMilestones);
        }

        if descriptions.len() != amounts.len() {
            return Err(ContractError::InvalidAmount);
        }

        let total: i128 = amounts.iter().sum();
        if total != vault.amount {
            return Err(ContractError::MilestoneAmountExceedsBalance);
        }

        let mut milestones = soroban_sdk::Vec::new(&env);
        for i in 0..descriptions.len() {
            milestones.push_back(Milestone {
                id: i as u64 + 1,
                description: descriptions.get(i).unwrap(),
                amount: amounts.get(i).unwrap(),
                status: MilestoneStatus::Pending,
                proof_url: String::from_str(&env, ""),
            });
        }

        vault.milestones = milestones.clone();
        storage::write_vault(&env, &vault);
        storage::write_milestones(&env, vault_id, &milestones);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("ms_set")),
            (vault_id, milestones.len()),
        );

        Ok(())
    }

    /// Client locks funds into the contract.
    /// Emits: ("vault", "funded") → (vault_id, amount)
    pub fn deposit_funds(env: Env, vault_id: u64, client: Address) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        match vault.status {
            VaultStatus::Created => {}
            VaultStatus::Funded => return Err(ContractError::AlreadyFunded),
            _ => return Err(ContractError::InvalidStatus),
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(&client, &env.current_contract_address(), &vault.amount);

        vault.status = VaultStatus::Funded;
        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("funded")),
            (vault_id, vault.amount),
        );

        Ok(())
    }

    /// Freelancer submits proof-of-work URL.
    /// For single-deliverable vaults (no milestones set).
    /// Emits: ("vault", "review") → (vault_id, proof_url)
    pub fn submit_deliverable(
        env: Env,
        vault_id: u64,
        freelancer: Address,
        proof_url: String,
    ) -> Result<(), ContractError> {
        freelancer.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.freelancer != freelancer {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Funded {
            return Err(ContractError::InvalidStatus);
        }

        vault.status = VaultStatus::InReview;
        vault.proof_url = proof_url.clone();
        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("review")),
            (vault_id, proof_url),
        );

        Ok(())
    }

    /// Freelancer submits proof-of-work URL for a specific milestone.
    /// Emits: ("vault", "milestone_review") → (vault_id, milestone_id, proof_url)
    pub fn submit_milestone_deliverable(
        env: Env,
        vault_id: u64,
        milestone_id: u64,
        freelancer: Address,
        proof_url: String,
    ) -> Result<(), ContractError> {
        freelancer.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.freelancer != freelancer {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Funded && vault.status != VaultStatus::InReview {
            return Err(ContractError::InvalidStatus);
        }

        let mut milestones = storage::read_milestones(&env, vault_id);
        let mut found = false;

        for i in 0..milestones.len() {
            let mut ms = milestones.get(i).unwrap();
            if ms.id == milestone_id {
                if ms.status != MilestoneStatus::Pending {
                    return Err(ContractError::InvalidStatus);
                }
                ms.status = MilestoneStatus::Submitted;
                ms.proof_url = proof_url.clone();
                milestones.set(i, ms);
                found = true;
                break;
            }
        }

        if !found {
            return Err(ContractError::MilestoneNotFound);
        }

        vault.status = VaultStatus::InReview;
        storage::write_vault(&env, &vault);
        storage::write_milestones(&env, vault_id, &milestones);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("ms_review")),
            (vault_id, milestone_id, proof_url),
        );

        Ok(())
    }

    /// Client approves a milestone and releases its funds to the freelancer.
    /// Emits: ("vault", "done") → (vault_id, milestone_id, amount)
    pub fn approve_milestone(
        env: Env,
        vault_id: u64,
        milestone_id: u64,
        client: Address,
    ) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::InReview {
            return Err(ContractError::InvalidStatus);
        }

        let mut milestones = storage::read_milestones(&env, vault_id);
        let mut found = false;
        let mut approved_amount: i128 = 0;

        for i in 0..milestones.len() {
            let mut ms = milestones.get(i).unwrap();
            if ms.id == milestone_id {
                if ms.status != MilestoneStatus::Submitted {
                    return Err(ContractError::InvalidStatus);
                }
                approved_amount = ms.amount;
                ms.status = MilestoneStatus::Approved;
                milestones.set(i, ms);
                found = true;
                break;
            }
        }

        if !found {
            return Err(ContractError::MilestoneNotFound);
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(
            &env.current_contract_address(),
            &vault.freelancer,
            &approved_amount,
        );

        // Check if all milestones are approved
        let all_approved = milestones
            .iter()
            .all(|ms| ms.status == MilestoneStatus::Approved);
        if all_approved {
            vault.status = VaultStatus::Completed;
        }

        storage::write_vault(&env, &vault);
        storage::write_milestones(&env, vault_id, &milestones);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("done")),
            (vault_id, milestone_id, approved_amount),
        );

        Ok(())
    }

    /// Legacy: Client approves the deliverable and releases all funds.
    /// For single-deliverable vaults (no milestones set).
    /// Emits: ("vault", "done") → (vault_id, freelancer, amount)
    pub fn approve_and_release(
        env: Env,
        vault_id: u64,
        client: Address,
    ) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::InReview {
            return Err(ContractError::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(
            &env.current_contract_address(),
            &vault.freelancer,
            &vault.amount,
        );

        vault.status = VaultStatus::Completed;
        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("done")),
            (vault_id, vault.freelancer, vault.amount),
        );

        Ok(())
    }

    /// Cancel a vault that has not been funded yet.
    /// Emits: ("vault", "cancel") → vault_id
    pub fn cancel_vault(env: Env, vault_id: u64, client: Address) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Created {
            return Err(ContractError::InvalidStatus);
        }

        vault.status = VaultStatus::Cancelled;
        storage::write_vault(&env, &vault);

        env.events()
            .publish((symbol_short!("vault"), symbol_short!("cancel")), vault_id);

        Ok(())
    }

    /// Update a milestone's description and/or amount before funding.
    /// Only the client can call this, and only when vault is in Created status.
    /// Amounts must still sum to vault total after update.
    /// Emits: ("vault", "ms_updated") → (vault_id, milestone_id)
    pub fn update_milestone(
        env: Env,
        vault_id: u64,
        milestone_id: u64,
        client: Address,
        new_description: String,
        new_amount: i128,
    ) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Created {
            return Err(ContractError::InvalidStatus);
        }

        if new_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let mut milestones = storage::read_milestones(&env, vault_id);
        let mut found = false;
        let mut total: i128 = 0;

        for i in 0..milestones.len() {
            let mut ms = milestones.get(i).unwrap();
            total += if ms.id == milestone_id { new_amount } else { ms.amount };
            if ms.id == milestone_id {
                ms.description = new_description.clone();
                ms.amount = new_amount;
                milestones.set(i, ms);
                found = true;
            }
        }

        if !found {
            return Err(ContractError::MilestoneNotFound);
        }

        if total != vault.amount {
            return Err(ContractError::MilestoneAmountExceedsBalance);
        }

        vault.milestones = milestones.clone();
        storage::write_vault(&env, &vault);
        storage::write_milestones(&env, vault_id, &milestones);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("ms_upd")),
            (vault_id, milestone_id),
        );

        Ok(())
    }

    /// Raise a dispute on a funded or in-review vault.
    /// Either party (client or freelancer) can raise a dispute.
    /// Emits: ("vault", "disputed") → (vault_id, reporter, reason)
    pub fn raise_dispute(
        env: Env,
        vault_id: u64,
        reporter: Address,
        reason: String,
    ) -> Result<(), ContractError> {
        reporter.require_auth();

        if reason.is_empty() {
            return Err(ContractError::DisputeReasonRequired);
        }

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != reporter && vault.freelancer != reporter {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Funded && vault.status != VaultStatus::InReview {
            return Err(ContractError::InvalidStatus);
        }

        vault.status = VaultStatus::Disputed;
        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("disputed")),
            (vault_id, reporter, reason),
        );

        Ok(())
    }

    /// Refund remaining funds to the client (admin-only, post-dispute resolution).
    /// Emits: ("vault", "refunded") → (vault_id, amount)
    pub fn refund(env: Env, vault_id: u64, client: Address) -> Result<(), ContractError> {
        client.require_auth();

        let mut vault = storage::read_vault(&env, vault_id)?;

        if vault.client != client {
            return Err(ContractError::Unauthorized);
        }

        if vault.status != VaultStatus::Disputed {
            return Err(ContractError::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(
            &env.current_contract_address(),
            &vault.client,
            &vault.amount,
        );

        vault.amount = 0;
        vault.status = VaultStatus::Cancelled;
        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("refunded")),
            (vault_id, vault.amount),
        );

        Ok(())
    }

    // ── Read-only queries ──────────────────────────────────────────────────

    /// Retrieve a vault's current state.
    pub fn get_vault(env: Env, vault_id: u64) -> Result<VaultInfo, ContractError> {
        storage::read_vault(&env, vault_id)
    }

    /// Total number of vaults created.
    pub fn get_vault_count(env: Env) -> u64 {
        storage::read_counter(&env)
    }

    /// Retrieve milestones for a vault.
    pub fn get_milestones(env: Env, vault_id: u64) -> soroban_sdk::Vec<Milestone> {
        storage::read_milestones(&env, vault_id)
    }
}
