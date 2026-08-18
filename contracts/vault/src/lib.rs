#![no_std]

mod error;
mod storage;
mod types;

#[cfg(test)]
mod tests;

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, String};

pub use error::ContractError;
pub use types::{VaultInfo, VaultStatus};

#[contract]
pub struct WorkVaultContract;

#[contractimpl]
#[allow(deprecated)]
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
        };

        storage::write_vault(&env, &vault);

        // Emit event so the frontend activity feed picks it up
        env.events().publish(
            (symbol_short!("vault"), symbol_short!("created")),
            (vault_id, client, freelancer, amount),
        );

        Ok(vault_id)
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
        token_client.transfer(&client, env.current_contract_address(), &vault.amount);

        vault.status = VaultStatus::Funded;
        storage::write_vault(&env, &vault);

        env.events().publish(
            (symbol_short!("vault"), symbol_short!("funded")),
            (vault_id, vault.amount),
        );

        Ok(())
    }

    /// Freelancer submits proof-of-work URL.
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
            return Err(ContractError::NotFunded);
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

    /// Client approves the deliverable and releases funds to the freelancer.
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

    // ── Read-only queries ──────────────────────────────────────────────────

    /// Retrieve a vault's current state.
    pub fn get_vault(env: Env, vault_id: u64) -> Result<VaultInfo, ContractError> {
        storage::read_vault(&env, vault_id)
    }

    /// Total number of vaults created.
    pub fn get_vault_count(env: Env) -> u64 {
        storage::read_counter(&env)
    }
}
