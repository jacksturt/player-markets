use anchor_lang::error_code;

#[error_code]
pub enum OracleError {
    #[msg("DefaultError")]
    DefaultError,
    #[msg("Unauthorized update.")]
    UnauthorizedUpdate,
    #[msg("Unauthorized authority.")]
    UnauthorizedAuthority,
    #[msg("Tokens can only be minted before the game starts.")]
    MintingNotEnabled,
    #[msg("Payout can only happen after the game ends.")]
    PayoutNotEnabled,
    #[msg("Admin can only lock and unlock minting/payout.")]
    AdminOnlyUnlock,
}
