use anchor_lang::prelude::*;

use crate::{constants::MONO_DATA, state::FeatureDataAccount, errors::MonoError};

#[derive(Accounts)]
pub struct DenyRequest<'info>
{
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub submitter: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            MONO_DATA.as_bytes(),
            feature_data_account.unix_timestamp.as_ref(),
            creator.key.as_ref(),
        ],
        bump = feature_data_account.funds_data_account_bump,
        constraint = feature_data_account.creator == creator.key() @ MonoError::NotTheCreator,
        constraint = feature_data_account.request_submitted == true @ MonoError::NoActiveRequest,
    )]
    pub feature_data_account: Account<'info, FeatureDataAccount>,
}

pub fn handler(ctx: Context<DenyRequest>, ) -> Result<()>
{
    let feature_data_account = &mut ctx.accounts.feature_data_account;

    feature_data_account.request_submitted = false;
    feature_data_account.payout_account = Pubkey::default();
    feature_data_account.current_submitter = Pubkey::default();
    msg!("feature data account = {}", &ctx.accounts.feature_data_account.key());
    Ok(())
}