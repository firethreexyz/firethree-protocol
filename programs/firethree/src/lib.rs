use anchor_lang::prelude::*;

pub use instructions::*;

pub mod errors;
pub mod instructions;

declare_id!("CMDqkbpJ6L4US5FXSFB23hwQGtPJAQrKqvBf2kaJN8BD");

#[program]
pub mod firethree {

    use super::*;

    pub fn project_create(ctx: Context<ProjectCreate>, args: Project) -> Result<()> {
        ProjectCreate::project_create(ctx, args)
    }

    pub fn project_delete(ctx: Context<ProjectDelete>) -> Result<()> {
        ProjectDelete::project_delete(ctx)
    }

    pub fn user_create(ctx: Context<UserCreate>) -> Result<()> {
        UserCreate::user_create(ctx)
    }
}
