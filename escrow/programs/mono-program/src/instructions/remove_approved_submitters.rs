use anchor_lang::prelude::*;

use crate::{constants::{MONO_DATA, MIN_NO_OF_SUBMITTERS, MAX_NO_OF_SUBMITTERS}, state::FeatureDataAccount, errors::MonoError};

#[derive(Accounts)]
pub struct RemoveApprovedSubmitters<'info>
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

pub fn handler(ctx: Context<RemoveApprovedSubmitters>, ) -> Result<()>
{
    let feature_data_account = &mut ctx.accounts.feature_data_account;
    msg!("num = {}", feature_data_account.no_of_submitters);

    require!(
        feature_data_account.no_of_submitters as usize  >= 
        MIN_NO_OF_SUBMITTERS, 
        MonoError::MinApprovedSubmitters
    );

    let mut submitter_index: usize = 0;
    let mut is_submitter_present: bool = false;
    
    for submitter in feature_data_account.approved_submitters{
        if submitter == ctx.accounts.submitter.key(){
            is_submitter_present = true;

            feature_data_account.no_of_submitters -= 1;
        }

        if is_submitter_present && submitter_index + 1 == MAX_NO_OF_SUBMITTERS  {
            feature_data_account.approved_submitters[submitter_index] = Pubkey::default();
            return Ok(());
        }
        else if is_submitter_present {
            feature_data_account.approved_submitters[submitter_index] = 
            feature_data_account.approved_submitters[submitter_index + 1];
        }

        submitter_index += 1;
    }    

    Ok(())
}