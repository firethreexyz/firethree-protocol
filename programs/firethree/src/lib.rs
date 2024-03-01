use anchor_lang::prelude::*;

use instructions::*;
use state::*;

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
}
