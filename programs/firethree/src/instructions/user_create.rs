use crate::Project;

use anchor_lang::prelude::*;
use std::mem;

#[account]
pub struct User {
    pub ts: i64, // timestamp
    pub pubkey: Pubkey,
    pub authority: Pubkey,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct UserCreate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, payer = payer, space = 8 + mem::size_of::<User>(), seeds = [b"user", project.name.as_ref(), user.key().as_ref()], bump)]
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
        let user: &mut Account<User> = &mut ctx.accounts.user;

        user.pubkey = *user.to_account_info().key;
        user.authority = *ctx.accounts.payer.key;
        user.bump = *ctx.bumps.get("user").unwrap();

        Ok(())
    }
}
