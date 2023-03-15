use anchor_lang::prelude::*;

use crate::{constants::{MONO_DATA, MAX_NO_OF_SUBMITTERS}, state::FeatureDataAccount, errors::MonoError};

#[derive(Accounts)]
pub struct AddApprovedSubmitters<'info>
{
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account()]
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
    )]
    pub feature_data_account: Account<'info, FeatureDataAccount>,

}

pub fn handler(ctx: Context<AddApprovedSubmitters>, ) -> Result<()>
{
    let feature_data_account = &mut ctx.accounts.feature_data_account;
    msg!("num = {}", feature_data_account.no_of_submitters);

    let submitter_index: usize = feature_data_account.no_of_submitters as usize;
    require!(submitter_index < MAX_NO_OF_SUBMITTERS, MonoError::MaxApprovedSubmitters);
    feature_data_account.approved_submitters[submitter_index] = ctx.accounts.submitter.key();
    feature_data_account.no_of_submitters += 1;

    Ok(())
}