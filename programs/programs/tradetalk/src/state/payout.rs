use anchor_lang::prelude::*;

#[account]
pub struct PayoutConfig {
    pub config_bump: u8,
    pub market_key: Pubkey,
    pub player_stats: Pubkey,
}

impl Space for PayoutConfig {
    const INIT_SPACE: usize = 8 + 1 + 32 + 32;
}
