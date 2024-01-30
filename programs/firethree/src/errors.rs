use anchor_lang::prelude::*;

#[error_code]
pub enum FirethreeError {
    #[msg("Unauthorized to delete the project")]
    UnauthorizedToDeleteProject,

    #[msg("Invalid shadow account")]
    InvalidShadowAccount,

    #[msg("Invalid account")]
    InvalidAccount,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid pass type")]
    InvalidPassType,

    #[msg("Invalid vault depositor authority")]
    InvalidVaultDepositorAuthority,

    #[msg("Invalid owner authority")]
    InvalidOwnerAuthority,

    #[msg("Invalid mint address")]
    InvalidMintAddress,
}
