#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String,
};

use crate::{WorkVaultContract, WorkVaultContractClient};
use crate::types::VaultStatus;

// ── Helpers ────────────────────────────────────────────────────────────────

fn setup_env() -> Env {
    let env = Env::default();
    env.mock_all_auths();
    env
}

/// Deploy a mock Stellar Asset Contract, mint `balance` to `user`, return token address.
fn setup_token(env: &Env, admin: &Address, user: &Address, balance: i128) -> Address {
    let token_addr = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    StellarAssetClient::new(env, &token_addr).mint(user, &balance);
    token_addr
}

/// Register the WorkVault contract and return a client.
fn setup_contract(env: &Env) -> (Address, WorkVaultContractClient) {
    let id = env.register(WorkVaultContract, ());
    let client = WorkVaultContractClient::new(env, &id);
    (id, client)
}

// ── Test 1: Vault creates with correct default state ───────────────────────

#[test]
fn test_create_vault_default_state() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    // Non-try variant returns u64 directly (panics on contract error)
    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &1_000);

    assert_eq!(vault_id, 1u64, "First vault should have ID 1");

    // Non-try variant returns VaultInfo directly
    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Created);
    assert_eq!(vault.amount, 1_000);
    assert_eq!(vault.client, client_addr);
    assert_eq!(vault.freelancer, freelancer_addr);
}

// ── Test 2: Deposit moves status to Funded and transfers tokens ────────────

#[test]
fn test_deposit_funds_transfers_tokens_and_updates_status() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (contract_addr, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);

    contract.deposit_funds(&vault_id, &client_addr);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Funded);

    // Tokens should have moved from client to contract
    let token = TokenClient::new(&env, &token_addr);
    assert_eq!(token.balance(&client_addr), 3_000);
    assert_eq!(token.balance(&contract_addr), 2_000);
}

// ── Test 3: Non-client deposit fails (Unauthorized) ───────────────────────

#[test]
fn test_deposit_by_non_client_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let attacker = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &1_000);

    // try_* variants return Result — use these for error-path assertions
    let result = contract.try_deposit_funds(&vault_id, &attacker);
    assert!(result.is_err(), "Non-client deposit should fail");
}

// ── Test 4: Cancel after funding fails (InvalidStatus) ────────────────────

#[test]
fn test_cancel_funded_vault_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &1_500);

    contract.deposit_funds(&vault_id, &client_addr);

    // Attempting to cancel a funded vault must fail
    let result = contract.try_cancel_vault(&vault_id, &client_addr);
    assert!(result.is_err(), "Cancelling a funded vault should fail");
}

// ── Test 5: Fetching non-existent vault returns VaultNotFound ─────────────

#[test]
fn test_get_nonexistent_vault_fails() {
    let env = setup_env();
    let (_, contract) = setup_contract(&env);

    let result = contract.try_get_vault(&999u64);
    assert!(result.is_err(), "Fetching unknown vault should fail");
}

// ── Test 6: Invalid amount (zero) fails on create ─────────────────────────

#[test]
fn test_create_vault_zero_amount_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let result = contract.try_create_vault(&client_addr, &freelancer_addr, &token_addr, &0);
    assert!(result.is_err(), "Zero-amount vault should be rejected");
}

// ── Test 7: Double-fund returns AlreadyFunded ─────────────────────────────

#[test]
fn test_double_deposit_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &1_000);

    contract.deposit_funds(&vault_id, &client_addr);

    let result = contract.try_deposit_funds(&vault_id, &client_addr);
    assert!(result.is_err(), "Funding twice should fail");
}

// ── Test 8: Full flow — create → fund → submit → approve → complete ────────

#[test]
fn test_full_vault_lifecycle() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (contract_addr, contract) = setup_contract(&env);
    let token = TokenClient::new(&env, &token_addr);

    // Create
    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);

    // Fund
    contract.deposit_funds(&vault_id, &client_addr);
    assert_eq!(token.balance(&contract_addr), 2_000);

    // Submit deliverable
    let proof = String::from_str(&env, "https://github.com/example/pr/42");
    contract.submit_deliverable(&vault_id, &freelancer_addr, &proof);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::InReview);

    // Approve and release
    contract.approve_and_release(&vault_id, &client_addr);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Completed);

    // Freelancer received funds, contract is empty
    assert_eq!(token.balance(&freelancer_addr), 2_000);
    assert_eq!(token.balance(&contract_addr), 0);
}
