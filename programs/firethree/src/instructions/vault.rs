use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constraints::{is_authority_for_vault_depositor, is_token_mint_for_vault};
use crate::cpi::TokenTransferCPI;
use crate::errors::FirethreeError;

use crate::{
    state::{CreateVaultArgs, Vault},
    VaultDepositor,
};

// TODO: add constraints to ensure the vault is created by the correct authority

#[derive(Accounts)]
#[instruction(args: CreateVaultArgs)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(init, payer = signer, space = Vault::SPACE, seeds = [Vault::PREFIX_SEED.as_ref(), args.name.as_ref()], bump)]
    pub vault: Account<'info, Vault>,

    pub payer_token_mint: Account<'info, Mint>,

    #[account(
        init,
        seeds = [Vault::PREFIX_SEED_VAULT_TOKEN_ACCOUNT.as_ref(), vault.key().as_ref()],
        bump,
        payer = signer,
        token::mint = payer_token_mint,
        token::authority = vault,
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub triad_signer: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn create_vault(ctx: Context<CreateVault>, args: CreateVaultArgs) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    vault.bump = *ctx.bumps.get("vault").unwrap();
    vault.authority = *ctx.accounts.signer.key;
    vault.name = args.name;
    vault.token_account = *ctx.accounts.token_account.to_account_info().key;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateVaultDepositor<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub vault: Account<'info, Vault>,

    #[account(init, payer = signer, space = Vault::SPACE_VAULT_DEPOSITOR, seeds = [Vault::PREFIX_SEED_VAULT_DEPOSITOR.as_ref(), vault.key().as_ref(), signer.key().as_ref()], bump)]
    pub vault_depositor: Account<'info, VaultDepositor>,

    pub system_program: Program<'info, System>,
}

pub fn create_vault_depositor(ctx: Context<CreateVaultDepositor>) -> Result<()> {
    let vault_depositor = &mut ctx.accounts.vault_depositor;

    vault_depositor.bump = *ctx.bumps.get("vault_depositor").unwrap();
    vault_depositor.authority = ctx.accounts.signer.key();
    vault_depositor.vault = ctx.accounts.vault.key();
    vault_depositor.total_deposit = 0;
    vault_depositor.total_withdrawal = 0;
    vault_depositor.net_deposit = 0;
    vault_depositor.lp_shares = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED_VAULT_DEPOSITOR.as_ref(), vault.key().as_ref(), signer.key.as_ref()],
        bump,
        constraint = is_authority_for_vault_depositor(&depositor, &signer)?,
    )]
    pub depositor: Account<'info, VaultDepositor>,

    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED_VAULT_TOKEN_ACCOUNT.as_ref(), vault.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::authority = depositor.authority,
        token::mint = vault_token_account.mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn deposit<'info>(ctx: Context<'_, '_, '_, 'info, Deposit<'info>>, amount: u64) -> Result<()> {
    let depositor = &mut ctx.accounts.depositor;

    if depositor.authority != *ctx.accounts.signer.key {
        return Err(FirethreeError::InvalidAccount.into());
    }

    if !is_token_mint_for_vault(
        &ctx.accounts.vault_token_account.mint,
        &ctx.accounts.user_token_account.mint,
    )? {
        return Err(FirethreeError::InvalidMintAddress.into());
    }

    ctx.token_transfer(amount)?;

    Ok(())
}

impl<'info> TokenTransferCPI for Context<'_, '_, '_, 'info, Deposit<'info>> {
    fn token_transfer(&self, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.accounts.user_token_account.to_account_info().clone(),
            to: self.accounts.vault_token_account.to_account_info().clone(),
            authority: self.accounts.signer.to_account_info().clone(),
        };
        let token_program = self.accounts.token_program.to_account_info().clone();
        let cpi_context = CpiContext::new(token_program, cpi_accounts);

        token::transfer(cpi_context, amount)?;

        Ok(())
    }
}
