use anchor_lang::prelude::*;

#[account]
pub struct PlayerMintConfig {
    pub config_bump: u8,
    pub player_token_bump: u8,
    pub minting_enabled: bool,
    pub payout_enabled: bool,
    pub total_deposited_amount: u64,
    pub quote_token_mint: Pubkey,
    pub player_token_mint: Pubkey,
    pub timestamp: String,
    pub player_id: String,
}

impl Space for PlayerMintConfig {
    const INIT_SPACE: usize = 8 + 1 + 1 + 1 + 1 + 8 + 32 + 32 + (4 + 8) + (4 + 13);
}
