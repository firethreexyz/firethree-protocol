use anchor_lang::error;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use std::mem;

declare_id!("CMDqkbpJ6L4US5FXSFB23hwQGtPJAQrKqvBf2kaJN8BD");

#[program]
pub mod firethree {
    use super::*;

    pub fn setup_project(ctx: Context<SetupProject>, params: Project) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;

        project.name = params.name;
        project.shdw = params.shdw;
        project.users = 0;
        project.bump = *ctx.bumps.get("project").unwrap();
        project.pubkey = *project.to_account_info().key;

        let clock: Clock = Clock::get().unwrap();
        project.ts = clock.unix_timestamp;

        Ok(())
    }

    // pub fn create_user(ctx: Context<User>, params: Project) -> Result<()> {
    //     Ok(())
    // }

    // pub fn update_user(ctx: ƒContext<User>, params: Project)

    // pub fn delete_user(ctx: Context<User>, params: Project) -> Result<()> {
    //     Ok(())
    // }
}

#[account]
pub struct Project {
    pub ts: i64, // timestamp
    pub name: [u8; 32],
    pub pubkey: Pubkey,
    pub users: u32,
    pub bump: u8,
    pub shdw: Pubkey,
}

#[account]
pub struct User {
    pub ts: i64,        // timestamp
    pub pubkey: Pubkey, // user public keyƒ
    pub nick: [u8; 32],
    pub bump: u8,
    pub project: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: Project)]
pub struct SetupProject<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, payer = user, space = 8 + mem::size_of::<Project>(), seeds = [b"project", params.name.as_ref()], bump)]
    pub project: Account<'info, Project>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}
