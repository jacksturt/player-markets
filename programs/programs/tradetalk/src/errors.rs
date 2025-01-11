use anchor_lang::error_code;

#[error_code]
pub enum OracleError {
    #[msg("DefaultError")]
    DefaultError,
    #[msg("Unauthorized update.")]
    UnauthorizedUpdate,
    #[msg("Unauthorized authority.")]
    UnauthorizedAuthority,
}
