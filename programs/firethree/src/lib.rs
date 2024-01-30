use anchor_lang::prelude::*;

use instructions::*;
use state::*;

mod cpi;
mod errors;
mod instructions;
mod state;

declare_id!("Fire3T9ABT33UYoVJZwWUnbPR3rgoVw98y82UgHZ8Bm");

#[program]
pub mod firethree {

    use super::*;

    pub fn create_project(ctx: Context<CreateProject>, args: CreateProjectArgs) -> Result<()> {
        instructions::create_project(ctx, args)
    }

    pub fn delete_project(ctx: Context<DeleteProject>) -> Result<()> {
        instructions::delete_project(ctx)
    }

    pub fn create_vault(ctx: Context<CreateVault>, args: CreateVaultArgs) -> Result<()> {
        instructions::create_vault(ctx, args)
    }

    pub fn deposit<'info>(
        ctx: Context<'_, '_, '_, 'info, Deposit<'info>>,
        amount: u64,
    ) -> Result<()> {
        instructions::deposit(ctx, amount)
    }

    pub fn create_vault_depositor(ctx: Context<CreateVaultDepositor>) -> Result<()> {
        instructions::create_vault_depositor(ctx)
    }
}
