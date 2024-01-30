use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub bump: u8,
    pub authority: Pubkey,
    pub name: [u8; 32],
    pub token_account: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateVaultArgs {
    pub name: [u8; 32],
}

#[account]
pub struct VaultDepositor {
    pub bump: u8,
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub total_deposit: u64,
    pub total_withdrawal: u64,
    pub net_deposit: i64,
    pub lp_shares: u64,
}

impl Vault {
    /// static prefix seed string used to derive the PDAs
    pub const PREFIX_SEED: &[u8] = b"vault";

    /// total on-chain space needed to allocate the account
    pub const SPACE: usize =
        // anchor descriminator + all static variables
        8 + std::mem::size_of::<Self>();

    pub const PREFIX_SEED_VAULT_TOKEN_ACCOUNT: &[u8] = b"vault_token_account";

    pub const SPACE_VAULT_DEPOSITOR: usize =
        // anchor descriminator + all static variables
        8 + std::mem::size_of::<VaultDepositor>();

    pub const PREFIX_SEED_VAULT_DEPOSITOR: &[u8] = b"vault_depositor";
}
