use anchor_lang::prelude::*;
use anchor_spl::{token::{TokenAccount}};

use crate::{constants::MONO_DATA, state::FeatureDataAccount, errors::MonoError};

#[derive(Accounts)]
pub struct SubmitRequest<'info>
{
    #[account(mut)]
    pub creator: SystemAccount<'info>,

    #[account()]
    pub submitter: Signer<'info>,

    #[account(
        token::mint = feature_data_account.funds_mint,
        token::authority = submitter,
    )]
    pub payout_account: Account<'info, TokenAccount>,

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


pub fn handler(ctx: Context<SubmitRequest>, ) -> Result<()>
{
    let feature_data_account = &mut ctx.accounts.feature_data_account;

    require!(!feature_data_account.request_submitted, MonoError::PendingRequestAlreadySubmitted);
    for submitter in feature_data_account.approved_submitters
    {
        if submitter.key() == ctx.accounts.submitter.key()
        {
            feature_data_account.request_submitted = true;
            feature_data_account.payout_account = ctx.accounts.payout_account.key();
            feature_data_account.current_submitter = ctx.accounts.submitter.key();
        }
    }
    msg!("feature data account = {}", &ctx.accounts.feature_data_account.key());

    Ok(())
}