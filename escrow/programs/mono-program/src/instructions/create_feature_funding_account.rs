use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, TokenAccount, Token}, associated_token::AssociatedToken};

use crate::{constants::MONO_DATA, state::FeatureDataAccount};


#[derive(Accounts)]
#[instruction(unix_timestamp: String)]
pub struct CreateFeatureFundingAccount<'info>
{
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account()]
    pub funds_mint: Account<'info, Mint>,

    #[account(
        init, 
        payer = creator, 
        seeds = [
            MONO_DATA.as_bytes(),
            unix_timestamp.as_ref(),
            creator.key.as_ref(),
        ],
        bump,
        space = FeatureDataAccount::space(&unix_timestamp),
    )]
    pub feature_data_account: Account<'info, FeatureDataAccount>,

    #[account(
        init, 
        payer = creator,
        seeds = [
            MONO_DATA.as_bytes(),
            unix_timestamp.as_bytes(),
            creator.key.as_ref(),
            funds_mint.key().as_ref(),        
        ],
        bump,
        token::mint = funds_mint,
        token::authority = program_authority,
    )]
    pub feature_token_account: Account<'info, TokenAccount>,

    ///CHECK: PDA Authority
    #[account(
        seeds = [
            MONO_DATA.as_bytes(),
        ],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(        
    ctx: Context<CreateFeatureFundingAccount>,
    unix_timestamp: String,
)  -> Result<()> {
    msg!("feature data account = {}", ctx.accounts.feature_data_account.key());
    msg!("program authority = {}", ctx.accounts.program_authority.key());
    let feature_data_account = &mut ctx.accounts.feature_data_account;
    msg!("size = {}", FeatureDataAccount::space(&unix_timestamp));
    feature_data_account.unix_timestamp = String::from(unix_timestamp);
    feature_data_account.no_of_submitters = 0;
    feature_data_account.request_submitted = false;
    feature_data_account.funder_cancel = false;
    feature_data_account.payout_cancel = false;
    feature_data_account.funds_token_account = ctx.accounts.feature_token_account.key();
    feature_data_account.current_submitter = Pubkey::default();
    feature_data_account.creator = ctx.accounts.creator.key();
    feature_data_account.funds_mint = ctx.accounts.funds_mint.key();
    feature_data_account.payout_account = Pubkey::default();
    feature_data_account.funds_data_account_bump = *ctx.bumps.get("feature_data_account").unwrap();
    feature_data_account.funds_token_account_bump = *ctx.bumps.get("feature_token_account").unwrap();
    feature_data_account.program_authority_bump = *ctx.bumps.get("program_authority").unwrap();


    Ok(())
}