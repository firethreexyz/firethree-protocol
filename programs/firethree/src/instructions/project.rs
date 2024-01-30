use anchor_lang::prelude::*;

use crate::errors::*;
use crate::state::{CreateProjectArgs, Project};

#[derive(Accounts)]
#[instruction(args: CreateProjectArgs)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(init, payer = signer, space = Project::SPACE, seeds = [Project::PREFIX_SEED.as_ref(), args.name.as_ref()], bump)]
    pub project: Account<'info, Project>,

    pub system_program: Program<'info, System>,
}

pub fn create_project(ctx: Context<CreateProject>, args: CreateProjectArgs) -> Result<()> {
    let project: &mut Account<Project> = &mut ctx.accounts.project;

    project.name = args.name;
    project.shdw = args.shdw.key();
    project.bump = *ctx.bumps.get("project").unwrap();
    project.authority = ctx.accounts.signer.key();

    let clock: Clock = Clock::get().unwrap();
    project.ts = clock.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct DeleteProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, close = authority)]
    pub project: Account<'info, Project>,
}

pub fn delete_project(ctx: Context<DeleteProject>) -> Result<()> {
    let project: &mut Account<Project> = &mut ctx.accounts.project;

    if project.authority != *ctx.accounts.authority.key {
        return Err(FirethreeError::UnauthorizedToDeleteProject.into());
    }

    Ok(())
}
