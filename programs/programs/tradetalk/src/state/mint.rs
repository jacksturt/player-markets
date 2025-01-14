use anchor_lang::prelude::*;

#[account]
pub struct PlayerMintConfig {
    pub config_bump: u8,
    pub quote_token_mint: Pubkey,
    pub player_token_mint: Pubkey,
    pub player_stats: Pubkey,
    pub player_token_bump: u8,
    pub timestamp: String,
    pub player_id: String,
    pub total_deposited_amount: u64,
}

impl Space for PlayerMintConfig {
    const INIT_SPACE: usize = 1 + 1 + 32 + 32 + 32 + 8 + (4 + 8) + (4 + 13) + 8;
}

impl PlayerMintConfig {
    pub fn to_slice(&self) -> Vec<u8> {
        let mut s = self.quote_token_mint.to_bytes().to_vec();
        s.extend_from_slice(&self.player_token_mint.to_bytes());
        s.extend_from_slice(&self.player_stats.to_bytes());
        s.extend_from_slice(&self.player_id.as_bytes());
        s.extend_from_slice(&self.timestamp.as_bytes());
        s.extend_from_slice(&self.total_deposited_amount.to_le_bytes());
        s
    }
}
