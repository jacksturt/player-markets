use anchor_lang::prelude::*;

#[account]
pub struct PayoutConfig {
    pub config_bump: u8,
    pub payout_rate: u64,
    pub market_key: Pubkey,
}

impl Space for PayoutConfig {
    const INIT_SPACE: usize = 8 + 1 + 8 + 32;
}
