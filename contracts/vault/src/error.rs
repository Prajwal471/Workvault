use soroban_sdk::contracterror;

/// All errors the WorkVault contract can return.
/// Each variant maps to a distinct u32 error code exposed in the ABI.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// Caller is not the expected party for this operation.
    Unauthorized = 1,
    /// No vault exists with the given ID.
    VaultNotFound = 2,
    /// Amount must be greater than zero.
    InvalidAmount = 3,
    /// Vault is already funded — cannot fund twice.
    AlreadyFunded = 4,
    /// Vault is not yet funded — cannot perform this action.
    NotFunded = 5,
    /// Vault status transition is not permitted.
    InvalidStatus = 6,
}
