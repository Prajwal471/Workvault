#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String,
};

use crate::types::{MilestoneStatus, VaultStatus};
use crate::{WorkVaultContract, WorkVaultContractClient};

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
fn setup_contract(env: &Env) -> (Address, WorkVaultContractClient<'_>) {
    let id = env.register(WorkVaultContract, ());
    let client = WorkVaultContractClient::new(env, &id);
    (id, client)
}

/// Build a soroban_sdk::Vec<i128> from a slice.
fn i128_vec(env: &Env, vals: &[i128]) -> soroban_sdk::Vec<i128> {
    let mut v = soroban_sdk::Vec::new(env);
    for val in vals {
        v.push_back(*val);
    }
    v
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

// ══════════════════════════════════════════════════════════════════════════
// Milestone tests
// ══════════════════════════════════════════════════════════════════════════

// ── Test 9: Set milestones on a vault ────────────────────────────────────

#[test]
fn test_set_milestones() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design mockups"));
    descriptions.push_back(String::from_str(&env, "Frontend build"));
    descriptions.push_back(String::from_str(&env, "Backend API"));

    let amounts = i128_vec(&env, &[1_000, 1_000, 1_000]);

    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);

    let milestones = contract.get_milestones(&vault_id);
    assert_eq!(milestones.len(), 3);
    assert_eq!(milestones.get(0).unwrap().status, MilestoneStatus::Pending);
    assert_eq!(milestones.get(1).unwrap().status, MilestoneStatus::Pending);
    assert_eq!(milestones.get(2).unwrap().status, MilestoneStatus::Pending);
}

// ── Test 10: Set milestones with wrong sum fails ─────────────────────────

#[test]
fn test_set_milestones_wrong_sum_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));
    descriptions.push_back(String::from_str(&env, "Build"));

    let amounts = i128_vec(&env, &[1_000, 1_000]); // Sum = 2000, but vault is 3000

    let result = contract.try_set_milestones(&vault_id, &client_addr, &descriptions, &amounts);
    assert!(
        result.is_err(),
        "Milestone amounts must sum to vault amount"
    );
}

// ── Test 11: Set milestones on funded vault fails ────────────────────────

#[test]
fn test_set_milestones_after_funding_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));

    let amounts = i128_vec(&env, &[3_000]);

    let result = contract.try_set_milestones(&vault_id, &client_addr, &descriptions, &amounts);
    assert!(result.is_err(), "Cannot set milestones after funding");
}

// ── Test 12: Submit milestone deliverable ────────────────────────────────

#[test]
fn test_submit_milestone_deliverable() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));
    descriptions.push_back(String::from_str(&env, "Build"));

    let amounts = i128_vec(&env, &[1_500, 1_500]);

    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);
    contract.deposit_funds(&vault_id, &client_addr);

    let proof = String::from_str(&env, "https://figma.com/design-abc");
    contract.submit_milestone_deliverable(&vault_id, &1, &freelancer_addr, &proof);

    let milestones = contract.get_milestones(&vault_id);
    assert_eq!(
        milestones.get(0).unwrap().status,
        MilestoneStatus::Submitted
    );
    assert_eq!(milestones.get(1).unwrap().status, MilestoneStatus::Pending);
}

// ── Test 13: Approve milestone releases funds ────────────────────────────

#[test]
fn test_approve_milestone_releases_funds() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (contract_addr, contract) = setup_contract(&env);
    let token = TokenClient::new(&env, &token_addr);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));
    descriptions.push_back(String::from_str(&env, "Build"));

    let amounts = i128_vec(&env, &[1_500, 1_500]);

    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);
    contract.deposit_funds(&vault_id, &client_addr);
    assert_eq!(token.balance(&contract_addr), 3_000);

    // Submit and approve first milestone
    let proof = String::from_str(&env, "https://figma.com/design-abc");
    contract.submit_milestone_deliverable(&vault_id, &1, &freelancer_addr, &proof);
    contract.approve_milestone(&vault_id, &1, &client_addr);

    // Freelancer got 1500, contract holds 1500
    assert_eq!(token.balance(&freelancer_addr), 1_500);
    assert_eq!(token.balance(&contract_addr), 1_500);

    // Submit and approve second milestone
    let proof2 = String::from_str(&env, "https://github.com/pr/99");
    contract.submit_milestone_deliverable(&vault_id, &2, &freelancer_addr, &proof2);
    contract.approve_milestone(&vault_id, &2, &client_addr);

    // Vault completed, freelancer got all funds
    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Completed);
    assert_eq!(token.balance(&freelancer_addr), 3_000);
    assert_eq!(token.balance(&contract_addr), 0);
}

// ── Test 14: Submit milestone for nonexistent ID fails ───────────────────

#[test]
fn test_submit_nonexistent_milestone_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));

    let amounts = i128_vec(&env, &[3_000]);

    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);
    contract.deposit_funds(&vault_id, &client_addr);

    let proof = String::from_str(&env, "https://figma.com/x");
    let result =
        contract.try_submit_milestone_deliverable(&vault_id, &99, &freelancer_addr, &proof);
    assert!(result.is_err(), "Nonexistent milestone ID should fail");
}

// ── Test 15: Non-freelancer cannot submit milestone ─────────────────────

#[test]
fn test_submit_milestone_wrong_person_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let attacker = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &3_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));

    let amounts = i128_vec(&env, &[3_000]);

    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);
    contract.deposit_funds(&vault_id, &client_addr);

    let proof = String::from_str(&env, "https://figma.com/x");
    let result = contract.try_submit_milestone_deliverable(&vault_id, &1, &attacker, &proof);
    assert!(result.is_err(), "Non-freelancer submission should fail");
}

// ══════════════════════════════════════════════════════════════════════════
// Dispute tests
// ══════════════════════════════════════════════════════════════════════════

// ── Test 16: Client can raise dispute on funded vault ────────────────────

#[test]
fn test_raise_dispute_by_client() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let reason = String::from_str(&env, "Deliverable does not match specs");
    contract.raise_dispute(&vault_id, &client_addr, &reason);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Disputed);
}

// ── Test 17: Freelancer can raise dispute on in-review vault ─────────────

#[test]
fn test_raise_dispute_by_freelancer() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let proof = String::from_str(&env, "https://github.com/pr/1");
    contract.submit_deliverable(&vault_id, &freelancer_addr, &proof);

    let reason = String::from_str(&env, "Client not responding");
    contract.raise_dispute(&vault_id, &freelancer_addr, &reason);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Disputed);
}

// ── Test 18: Third party cannot raise dispute ────────────────────────────

#[test]
fn test_raise_dispute_by_third_party_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let outsider = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let reason = String::from_str(&env, "I want to disrupt");
    let result = contract.try_raise_dispute(&vault_id, &outsider, &reason);
    assert!(result.is_err(), "Third party cannot raise dispute");
}

// ── Test 19: Empty dispute reason fails ──────────────────────────────────

#[test]
fn test_raise_dispute_empty_reason_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let reason = String::from_str(&env, "");
    let result = contract.try_raise_dispute(&vault_id, &client_addr, &reason);
    assert!(result.is_err(), "Empty dispute reason should fail");
}

// ── Test 20: Dispute on created (unfunded) vault fails ──────────────────

#[test]
fn test_raise_dispute_on_unfunded_vault_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);

    let reason = String::from_str(&env, "Changed my mind");
    let result = contract.try_raise_dispute(&vault_id, &client_addr, &reason);
    assert!(result.is_err(), "Dispute on unfunded vault should fail");
}

// ══════════════════════════════════════════════════════════════════════════
// Refund tests
// ══════════════════════════════════════════════════════════════════════════

// ── Test 21: Refund after dispute returns funds to client ────────────────

#[test]
fn test_refund_after_dispute() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (contract_addr, contract) = setup_contract(&env);
    let token = TokenClient::new(&env, &token_addr);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);
    assert_eq!(token.balance(&contract_addr), 2_000);

    let reason = String::from_str(&env, "Unhappy with work");
    contract.raise_dispute(&vault_id, &client_addr, &reason);

    contract.refund(&vault_id, &client_addr);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Cancelled);
    assert_eq!(vault.amount, 0);
    assert_eq!(token.balance(&client_addr), 5_000);
    assert_eq!(token.balance(&contract_addr), 0);
}

// ── Test 22: Refund on non-disputed vault fails ──────────────────────────

#[test]
fn test_refund_on_non_disputed_vault_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let result = contract.try_refund(&vault_id, &client_addr);
    assert!(result.is_err(), "Refund on non-disputed vault should fail");
}

// ── Test 23: Non-client cannot refund ────────────────────────────────────

#[test]
fn test_refund_by_non_client_fails() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let outsider = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &2_000);
    contract.deposit_funds(&vault_id, &client_addr);

    let reason = String::from_str(&env, "Dispute");
    contract.raise_dispute(&vault_id, &client_addr, &reason);

    let result = contract.try_refund(&vault_id, &outsider);
    assert!(result.is_err(), "Non-client cannot refund");
}

// ══════════════════════════════════════════════════════════════════════════
// Full milestone lifecycle integration
// ══════════════════════════════════════════════════════════════════════════

// ── Test 24: Full milestone lifecycle — create → milestones → fund → submit → approve ─

#[test]
fn test_full_milestone_lifecycle() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 10_000);

    let (contract_addr, contract) = setup_contract(&env);
    let token = TokenClient::new(&env, &token_addr);

    // Create vault
    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &4_000);

    // Set 2 milestones
    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design phase"));
    descriptions.push_back(String::from_str(&env, "Build phase"));

    let amounts = i128_vec(&env, &[1_500, 2_500]);

    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);

    // Fund
    contract.deposit_funds(&vault_id, &client_addr);
    assert_eq!(token.balance(&contract_addr), 4_000);

    // Submit milestone 1
    let proof1 = String::from_str(&env, "https://figma.com/design-v2");
    contract.submit_milestone_deliverable(&vault_id, &1, &freelancer_addr, &proof1);

    // Approve milestone 1
    contract.approve_milestone(&vault_id, &1, &client_addr);
    assert_eq!(token.balance(&freelancer_addr), 1_500);
    assert_eq!(token.balance(&contract_addr), 2_500);

    // Vault still InReview (milestone 2 pending)
    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::InReview);

    // Submit milestone 2
    let proof2 = String::from_str(&env, "https://github.com/pr/full-app");
    contract.submit_milestone_deliverable(&vault_id, &2, &freelancer_addr, &proof2);

    // Approve milestone 2 — vault completes
    contract.approve_milestone(&vault_id, &2, &client_addr);

    let vault = contract.get_vault(&vault_id);
    assert_eq!(vault.status, VaultStatus::Completed);
    assert_eq!(token.balance(&freelancer_addr), 4_000);
    assert_eq!(token.balance(&contract_addr), 0);

    // Check milestone statuses
    let milestones = contract.get_milestones(&vault_id);
    assert_eq!(milestones.get(0).unwrap().status, MilestoneStatus::Approved);
    assert_eq!(milestones.get(1).unwrap().status, MilestoneStatus::Approved);
}

// ── Test 25: update_milestone — happy path ─────────────────────────────────

#[test]
fn test_update_milestone_happy_path() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &4_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design phase"));
    descriptions.push_back(String::from_str(&env, "Build phase"));

    let amounts = i128_vec(&env, &[1_500, 2_500]);
    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);

    // Update milestone 1 description only (keep amount at 1500 so sum stays 4000)
    let new_desc = String::from_str(&env, "Updated design phase");
    contract.update_milestone(&vault_id, &1, &client_addr, &new_desc, &1_500);

    let milestones = contract.get_milestones(&vault_id);
    assert_eq!(
        milestones.get(0).unwrap().description,
        String::from_str(&env, "Updated design phase")
    );
    assert_eq!(milestones.get(0).unwrap().amount, 1_500);

    // Verify other milestone unchanged
    assert_eq!(milestones.get(1).unwrap().amount, 2_500);
}

// ── Test 26: update_milestone — unauthorized ───────────────────────────────

#[test]
fn test_update_milestone_unauthorized() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let stranger = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &4_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));
    let amounts = i128_vec(&env, &[4_000]);
    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);

    // Stranger tries to update — should fail (Unauthorized)
    let new_desc = String::from_str(&env, "Hacked");
    let result = contract.try_update_milestone(&vault_id, &1, &stranger, &new_desc, &4_000);
    assert!(result.is_err(), "Non-client update should be rejected");
}

// ── Test 27: update_milestone — after funding (invalid status) ─────────────

#[test]
fn test_update_milestone_after_funding() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &4_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));
    let amounts = i128_vec(&env, &[4_000]);
    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);

    // Fund the vault
    contract.deposit_funds(&vault_id, &client_addr);

    // Try to update after funding — should fail (InvalidStatus)
    let new_desc = String::from_str(&env, "Too late");
    let result = contract.try_update_milestone(&vault_id, &1, &client_addr, &new_desc, &4_000);
    assert!(result.is_err(), "Update after funding should be rejected");
}

// ── Test 28: update_milestone — amounts no longer sum to total ─────────────

#[test]
fn test_update_milestone_wrong_sum() {
    let env = setup_env();
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let admin = Address::generate(&env);
    let token_addr = setup_token(&env, &admin, &client_addr, 5_000);

    let (_, contract) = setup_contract(&env);

    let vault_id = contract.create_vault(&client_addr, &freelancer_addr, &token_addr, &4_000);

    let mut descriptions = soroban_sdk::Vec::new(&env);
    descriptions.push_back(String::from_str(&env, "Design"));
    descriptions.push_back(String::from_str(&env, "Build"));
    let amounts = i128_vec(&env, &[1_500, 2_500]);
    contract.set_milestones(&vault_id, &client_addr, &descriptions, &amounts);

    // Update milestone 1 to 3000 — now sum = 3000 + 2500 = 5500 != 4000
    let new_desc = String::from_str(&env, "Expensive design");
    let result = contract.try_update_milestone(&vault_id, &1, &client_addr, &new_desc, &3_000);
    assert!(result.is_err(), "Mismatched sum should be rejected");
}
