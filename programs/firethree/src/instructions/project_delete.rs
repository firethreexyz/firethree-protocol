use anchor_lang::prelude::*;

use crate::constraints::is_authority_for_project;
use crate::errors::*;
use crate::state::Project;

#[derive(Accounts)]
pub struct DeleteProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, close = authority, constraint = is_authority_for_project(&project, &authority)?)]
    pub project: Account<'info, Project>,
}

pub fn delete_project(ctx: Context<DeleteProject>) -> Result<()> {
    let project: &mut Account<Project> = &mut ctx.accounts.project;

    if project.authority != *ctx.accounts.authority.key {
        return Err(FirethreeError::UnauthorizedToDeleteProject.into());
    }

    Ok(())
}
