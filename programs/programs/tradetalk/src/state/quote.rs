use anchor_lang::prelude::*;

#[account]
pub struct QuoteMintConfig {
    pub config_bump: u8,
    pub quote_token_bump: u8,
}

impl Space for QuoteMintConfig {
    const INIT_SPACE: usize = 1 + 1 + 8;
}
