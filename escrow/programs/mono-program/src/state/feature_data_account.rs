use anchor_lang::prelude::*;

use crate::constants::MAX_NO_OF_SUBMITTERS;

#[account]
pub struct FeatureDataAccount 
{
    pub creator: Pubkey,// 32
    pub request_submitted: bool,// 1
    pub current_submitter: Pubkey,// 32
    pub approved_submitters: [Pubkey; MAX_NO_OF_SUBMITTERS],// 32 * 3 = 96    
    pub funds_mint: Pubkey,// 32 
    pub funds_token_account: Pubkey,// 32 
    pub payout_account: Pubkey,// 32
    pub funder_cancel: bool,// 1
    pub payout_cancel: bool,// 1
    pub no_of_submitters: u8, // 1
    pub funds_token_account_bump: u8, // 1
    pub funds_data_account_bump: u8, // 1
    pub program_authority_bump: u8, // 1
    pub unix_timestamp: String // 4 + unix_timestamp.len()
}

impl FeatureDataAccount
{ 
    pub fn space(unix_timestamp: &String) -> usize
    {
        8  +// Discriminator 
        1  +// request_submitted
        32 +// current_submitter
        (32 * 3) +// approved_submitters
        32 +// creator
        32 +// funds_mint
        32 +// funds_account
        32 +// payout_account
        1  +// funder_cancel
        1  +// payout_cancel
        1  +// no_of_submitters
        1  +// funds_token_account_bump
        1  +// funds_data_account_bump
        1  +// program_authority_bump    
        (4 + unix_timestamp.len()) // 
    }
}
