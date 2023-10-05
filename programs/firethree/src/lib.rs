use anchor_lang::error;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use std::mem;

declare_id!("CMDqkbpJ6L4US5FXSFB23hwQGtPJAQrKqvBf2kaJN8BD");

#[program]
pub mod firethree {
    use super::*;

    pub fn setup_project(ctx: Context<SetupProject>, args: Project) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;

        project.name = args.name;
        project.shdw = args.shdw;
        project.multisig_key = args.multisig_key;
        project.users = 0;
        project.bump = *ctx.bumps.get("project").unwrap();
        project.pubkey = *project.to_account_info().key;
        project.authority = *ctx.accounts.payer.key;

        let clock: Clock = Clock::get().unwrap();
        project.ts = clock.unix_timestamp;

        Ok(())
    }

    pub fn create_user(ctx: Context<CreateUser>) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;
        let user: &mut Account<User> = &mut ctx.accounts.user;

        user.pubkey = *user.to_account_info().key;
        user.bump = *ctx.bumps.get("user").unwrap();

        project.users += 1;

        Ok(())
    }

    pub fn delete_project(ctx: Context<DeleteProject>) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;

        if project.authority != *ctx.accounts.payer.key {
            return Err(ErrorCode::Unauthorized.into());
        }

        Ok(())
    }
}

#[account]
pub struct Project {
    pub ts: i64, // timestamp
    pub name: [u8; 32],
    pub pubkey: Pubkey,
    pub users: u32,
    pub bump: u8,
    pub shdw: Pubkey,
    pub multisig_key: Pubkey,
    pub authority: Pubkey,
}

#[account]
pub struct User {
    pub ts: i64, // timestamp
    pub pubkey: Pubkey,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(args: Project)]
pub struct SetupProject<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = 8 + mem::size_of::<Project>(), seeds = [b"project", args.name.as_ref()], bump)]
    pub project: Account<'info, Project>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteProject<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, close = payer)]
    pub project: Account<'info, Project>,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = 8 + mem::size_of::<User>(), seeds = [b"user", project.name.as_ref(), user.key().as_ref()], bump)]
    pub user: Account<'info, User>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub project: Account<'info, Project>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
}
