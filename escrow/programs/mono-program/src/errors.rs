use anchor_lang::error_code;

#[error_code]
pub enum MonoError
{
    #[msg("This Creator is Invalid")]
    NotTheCreator,

    #[msg("This mint is not valid")]
    InvalidMint,

    #[msg("Max Number of Approved Submitters already reached")]
    MaxApprovedSubmitters,

    #[msg("Max Number of Approved Submitters already reached")]
    MinApprovedSubmitters,

    #[msg("There is an active request already present")]
    PendingRequestAlreadySubmitted,

    #[msg("No Request Submitted yet")]
    NoActiveRequest,

    #[msg("Cannot Cancel Feature")]
    CannotCancelFeature
}