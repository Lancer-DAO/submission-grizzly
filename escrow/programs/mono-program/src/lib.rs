use anchor_lang::prelude::*;


mod constants;
mod errors;
mod state;
mod instructions;

use crate::instructions::*;


declare_id!("DYMY9uf1t4vvSnHxJZJor74xjb67v7fuMTWBCxcknXj8");


#[program]
pub mod mono_program {
    use super::*;

    pub fn create_feature_funding_account(
        ctx: Context<CreateFeatureFundingAccount>,
        unix_timestamp: String,
    ) -> Result<()> {
        create_feature_funding_account::handler(ctx, unix_timestamp)
    }

    pub fn fund_feature(ctx: Context<FundFeature>, amount: u64) -> Result<()>
    {
        fund_feature::handler(ctx, amount)
    }

    pub fn add_approved_submitters(ctx: Context<AddApprovedSubmitters>) -> Result<()>
    {
        add_approved_submitters::handler(ctx)
    }

    pub fn submit_request(ctx: Context<SubmitRequest>) -> Result<()>
    {
        submit_request::handler(ctx)
    }

    pub fn approve_request(ctx: Context<ApproveRequest>) -> Result<()>
    {
        approve_request::handler(ctx)
    }

    pub fn deny_request(ctx: Context<DenyRequest>) -> Result<()>
    {
        deny_request::handler(ctx)
    }

    pub fn vote_to_cancel(ctx: Context<VoteToCancel>, is_cancel: bool) -> Result<()>
    {
        vote_to_cancel::handler(ctx, is_cancel)
    }

    pub fn cancel_feature(ctx: Context<CancelFeature>) -> Result<()>
    {
        cancel_feature::handler(ctx)
    }

    pub fn remove_approved_submitters(ctx: Context<RemoveApprovedSubmitters>) -> Result<()>
    {
        remove_approved_submitters::handler(ctx)
    }
}



