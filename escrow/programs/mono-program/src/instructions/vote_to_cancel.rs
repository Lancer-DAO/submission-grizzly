use anchor_lang::prelude::*;

use crate::{constants::MONO_DATA, state::FeatureDataAccount, errors::MonoError};

#[derive(Accounts)]
pub struct VoteToCancel<'info>
{
    #[account(mut)]
    pub creator: SystemAccount<'info>,

    #[account(mut)]
    pub voter: Signer<'info>,// could be creator or submitter

    #[account(
        mut,
        seeds = [
            MONO_DATA.as_bytes(),
            feature_data_account.unix_timestamp.as_ref(),
            creator.key.as_ref(),
        ],
        bump = feature_data_account.funds_data_account_bump,
        constraint = feature_data_account.creator == creator.key() @ MonoError::NotTheCreator,
    )]
    pub feature_data_account: Account<'info, FeatureDataAccount>,
}

pub fn handler(ctx: Context<VoteToCancel>, is_cancel: bool) -> Result<()>
{
    let feature_data_account = &mut ctx.accounts.feature_data_account;

    if ctx.accounts.voter.key() == feature_data_account.creator.key()
    {
        feature_data_account.funder_cancel = is_cancel;
    }
    else if ctx.accounts.voter.key() == feature_data_account.current_submitter.key() &&
            is_cancel == true
    {
        feature_data_account.payout_cancel = is_cancel;
        feature_data_account.current_submitter = Pubkey::default();
        feature_data_account.payout_account = Pubkey::default();
        feature_data_account.request_submitted = false;
    }
    else if ctx.accounts.voter.key() == feature_data_account.current_submitter.key() &&
            is_cancel == false
    {
        feature_data_account.payout_cancel = is_cancel;
    }

    Ok(())
}