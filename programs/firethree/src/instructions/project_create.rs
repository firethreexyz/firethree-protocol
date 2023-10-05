use anchor_lang::prelude::*;
use std::mem;

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

// https://github.com/Squads-Protocol/v4/blob/04482cb0d0c4ad13d39d411cb33cfb8ebf1bbd97/programs/squads_multisig_program/src/state/multisig.rs#L238
#[derive(AnchorDeserialize, AnchorSerialize, InitSpace, Eq, PartialEq, Clone)]
pub struct Member {
    pub key: Pubkey,
    pub permissions: Permissions,
}

#[derive(Clone, Copy)]
pub enum Permission {
    Initiate = 1 << 0,
    Vote = 1 << 1,
    Execute = 1 << 2,
}

/// Bitmask for permissions.
#[derive(
    AnchorSerialize, AnchorDeserialize, InitSpace, Eq, PartialEq, Clone, Copy, Default, Debug,
)]
pub struct Permissions {
    pub mask: u8,
}

// https://github.com/Squads-Protocol/v4/blob/04482cb0d0c4ad13d39d411cb33cfb8ebf1bbd97/programs/squads_multisig_program/src/state/multisig.rs#L10C1-L39C2
#[account]
pub struct Multisig {
    /// Key that is used to seed the multisig PDA.
    pub create_key: Pubkey,
    /// The authority that can change the multisig config.
    /// This is a very important parameter as this authority can change the members and threshold.
    ///
    /// The convention is to set this to `Pubkey::default()`.
    /// In this case, the multisig becomes autonomous, so every config change goes through
    /// the normal process of voting by the members.
    ///
    /// However, if this parameter is set to any other key, all the config changes for this multisig
    /// will need to be signed by the `config_authority`. We call such a multisig a "controlled multisig".
    pub config_authority: Pubkey,
    /// Threshold for signatures.
    pub threshold: u16,
    /// How many seconds must pass between transaction voting settlement and execution.
    pub time_lock: u32,
    /// Last transaction index. 0 means no transactions have been created.
    pub transaction_index: u64,
    /// Last stale transaction index. All transactions up until this index are stale.
    /// This index is updated when multisig config (members/threshold/time_lock) changes.
    pub stale_transaction_index: u64,
    /// Reserved for future use.
    pub _reserved: u8,
    /// Bump for the multisig PDA seed.
    pub bump: u8,
    /// Members of the multisig.
    pub members: Vec<Member>,
}

#[derive(Accounts)]
#[instruction(args: Project)]
pub struct ProjectCreate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, payer = payer, space = 8 + mem::size_of::<Project>(), seeds = [b"project", args.name.as_ref()], bump)]
    pub project: Account<'info, Project>,

    pub multisig: Account<'info, Multisig>,

    pub system_program: Program<'info, System>,
}

impl ProjectCreate<'_> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }

    #[access_control(ctx.accounts.validate())]
    pub fn project_create(ctx: Context<ProjectCreate>, args: Project) -> Result<()> {
        let project: &mut Account<Project> = &mut ctx.accounts.project;

        project.name = args.name;
        project.shdw = args.shdw;
        project.multisig_key = *ctx.accounts.multisig.to_account_info().key;
        project.users = 0;
        project.bump = *ctx.bumps.get("project").unwrap();
        project.pubkey = *project.to_account_info().key;
        project.authority = *ctx.accounts.payer.key;

        let clock: Clock = Clock::get().unwrap();
        project.ts = clock.unix_timestamp;

        Ok(())
    }
}
