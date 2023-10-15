use crate::Project;

use anchor_lang::prelude::*;

#[account]
pub struct User {}

#[derive(Accounts)]
pub struct UserCreate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, payer = payer, space = 0, seeds = [b"user", project.name.as_ref(), user.key().as_ref()], bump)]
    pub user: Account<'info, User>,

    #[account(mut)]
    pub project: Account<'info, Project>,

    pub system_program: Program<'info, System>,
}

impl UserCreate<'_> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }

    #[access_control(ctx.accounts.validate())]
    pub fn user_create(ctx: Context<UserCreate>) -> Result<()> {
        Ok(())
    }
}
