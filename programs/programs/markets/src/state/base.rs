use anchor_lang::prelude::*;

#[account]
pub struct BaseMintConfig {
    pub config_bump: u8,
    pub base_token_bump: u8,
}

impl Space for BaseMintConfig {
    const INIT_SPACE: usize = 1 + 1 + 8;
}
