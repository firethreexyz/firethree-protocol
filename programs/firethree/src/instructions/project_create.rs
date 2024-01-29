use anchor_lang::prelude::*;
use std::mem;

#[account]
pub struct Project {
    pub ts: i64, // timestamp
    pub name: [u8; 32],
    pub bump: u8,
    pub shdw: Pubkey,
    pub authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProjectArgs {
    pub name: [u8; 32],
    pub shdw: Pubkey,
}

#[derive(Accounts)]
#[instruction(args: ProjectArgs)]
pub struct ProjectCreate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, payer = payer, space = 8 + mem::size_of::<Project>(), seeds = [b"project", args.name.as_ref()], bump)]
    pub project: Account<'info, Project>,

    pub system_program: Program<'info, System>,
}

impl ProjectCreate<'_> {
    pub fn project_create(ctx: Context<ProjectCreate>, args: ProjectArgs) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;

        project.name = args.name;
        project.shdw = args.shdw.key();
        project.bump = *ctx.bumps.get("project").unwrap();
        project.authority = ctx.accounts.payer.key();

        let clock: Clock = Clock::get().unwrap();
        project.ts = clock.unix_timestamp;

        Ok(())
    }
}
