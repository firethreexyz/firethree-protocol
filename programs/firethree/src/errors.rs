use anchor_lang::prelude::*;

#[error_code]
pub enum FirethreeError {
    #[msg("Unauthorized to delete the project")]
    UnauthorizedToDeleteProject,
}
