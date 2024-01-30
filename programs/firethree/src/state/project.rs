use anchor_lang::prelude::*;

#[account]
pub struct Project {
    pub ts: i64, // timestamp
    pub name: [u8; 32],
    pub bump: u8,
    pub shdw: Pubkey,
    pub authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateProjectArgs {
    pub name: [u8; 32],
    pub shdw: Pubkey,
}

impl Project {
    /// static prefix seed string used to derive the PDAs
    pub const PREFIX_SEED: &[u8] = b"project";

    /// total on-chain space needed to allocate the account
    pub const SPACE: usize =
        // anchor descriminator + all static variables
        8 + std::mem::size_of::<Self>();
}
