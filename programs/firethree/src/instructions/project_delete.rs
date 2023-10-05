use crate::errors::*;
use crate::Project;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ProjectDelete<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, close = payer)]
    pub project: Account<'info, Project>,
}

impl ProjectDelete<'_> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }

    #[access_control(ctx.accounts.validate())]
    pub fn project_delete(ctx: Context<ProjectDelete>) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;

        if project.authority != *ctx.accounts.payer.key {
            return Err(FirethreeError::UnauthorizedToDeleteProject.into());
        }

        Ok(())
    }
}
