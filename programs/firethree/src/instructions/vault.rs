use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constraints::{
    is_authority_for_vault_depositor, is_depositor_for_vault, is_token_mint_for_vault,
};
use crate::cpi::TokenTransferCPI;
use crate::declare_vault_seeds;
use crate::errors::FirethreeError;

use crate::{
    state::{CreateVaultArgs, Vault},
    VaultDepositor,
};

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

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn create_vault(ctx: Context<CreateVault>, args: CreateVaultArgs) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    if args.max_tokens == 0 {
        return Err(FirethreeError::InvalidMaxTokens.into());
    }

    if args.profit_share > 100 {
        return Err(FirethreeError::InvalidProfitShare.into());
    }

    vault.bump = *ctx.bumps.get("vault").unwrap();
    vault.authority = *ctx.accounts.signer.key;
    vault.name = args.name;
    vault.token_account = *ctx.accounts.token_account.to_account_info().key;
    vault.delegate = *ctx.accounts.signer.key;
    vault.max_tokens = args.max_tokens;
    vault.total_deposits = 0;
    vault.total_withdraws = 0;
    vault.init_ts = Clock::get()?.unix_timestamp;
    vault.min_deposit_amount = args.min_deposit_amount;
    vault.net_deposits = 0;
    vault.total_shares = 0;
    vault.profit_share = args.profit_share;

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
    vault_depositor.total_deposits = 0;
    vault_depositor.total_withdraws = 0;
    vault_depositor.net_deposits = 0;
    vault_depositor.lp_shares = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut, constraint = is_depositor_for_vault(&vault_depositor, &vault.key())?)]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED_VAULT_DEPOSITOR.as_ref(), vault.key().as_ref(), signer.key.as_ref()],
        bump,
        constraint = is_authority_for_vault_depositor(&vault_depositor, &signer)?,
    )]
    pub vault_depositor: Account<'info, VaultDepositor>,

    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED_VAULT_TOKEN_ACCOUNT.as_ref(), vault.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::authority = vault_depositor.authority,
        token::mint = vault_token_account.mint,
        constraint = is_token_mint_for_vault(&vault_token_account.mint, &user_token_account.mint)?,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn deposit<'info>(ctx: Context<'_, '_, '_, 'info, Deposit<'info>>, amount: u64) -> Result<()> {
    let vault_depositor = &mut ctx.accounts.vault_depositor;
    let vault = &mut ctx.accounts.vault;

    if vault_depositor.authority != *ctx.accounts.signer.key {
        return Err(FirethreeError::InvalidAccount.into());
    }

    if amount < vault.min_deposit_amount {
        return Err(FirethreeError::InvalidDepositAmount.into());
    }

    if amount > vault.max_tokens.saturating_add(vault.total_deposits) {
        return Err(FirethreeError::InvalidDepositAmount.into());
    }

    vault_depositor.total_deposits = vault_depositor.total_deposits.saturating_add(amount);
    vault_depositor.net_deposits = vault_depositor.net_deposits.saturating_add(1);
    vault_depositor.lp_shares = vault_depositor.lp_shares.saturating_add(amount);

    vault.total_deposits = vault.total_deposits.saturating_add(amount);
    vault.net_deposits = vault.net_deposits.saturating_add(1);

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

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut, constraint = is_depositor_for_vault(&vault_depositor, &vault.key())?)]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED_VAULT_DEPOSITOR.as_ref(), vault.key().as_ref(), signer.key.as_ref()],
        bump,
        constraint = is_authority_for_vault_depositor(&vault_depositor, &signer)?,
    )]
    pub vault_depositor: Account<'info, VaultDepositor>,

    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED_VAULT_TOKEN_ACCOUNT.as_ref(), vault.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::authority = vault_depositor.authority,
        token::mint = vault_token_account.mint,
        constraint = is_token_mint_for_vault(&vault_token_account.mint, &user_token_account.mint)?,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw<'info>(
    ctx: Context<'_, '_, '_, 'info, Withdraw<'info>>,
    amount: u64,
) -> Result<()> {
    let vault_depositor = &mut ctx.accounts.vault_depositor;
    let vault = &mut ctx.accounts.vault;

    if vault_depositor.authority != *ctx.accounts.signer.key {
        return Err(FirethreeError::InvalidAccount.into());
    }

    if amount > vault_depositor.lp_shares {
        return Err(FirethreeError::InvalidWithdrawAmount.into());
    }

    vault_depositor.total_withdraws = vault_depositor.total_withdraws.saturating_add(amount);
    vault_depositor.net_withdraws = vault_depositor.net_withdraws.saturating_add(1);
    vault_depositor.lp_shares = vault_depositor.lp_shares.saturating_sub(amount);

    vault.total_withdraws = vault.total_withdraws.saturating_add(amount);
    vault.net_withdraws = vault.net_withdraws.saturating_add(1);

    ctx.token_transfer(amount)?;

    Ok(())
}

impl<'info> TokenTransferCPI for Context<'_, '_, '_, 'info, Withdraw<'info>> {
    fn token_transfer(&self, amount: u64) -> Result<()> {
        declare_vault_seeds!(&self.accounts.vault, seeds);

        let cpi_accounts = Transfer {
            from: self.accounts.vault_token_account.to_account_info().clone(),
            to: self.accounts.user_token_account.to_account_info().clone(),
            authority: self.accounts.vault.to_account_info().clone(),
        };
        let token_program = self.accounts.token_program.to_account_info().clone();
        let cpi_context = CpiContext::new_with_signer(token_program, cpi_accounts, seeds);

        token::transfer(cpi_context, amount)?;

        Ok(())
    }
}
