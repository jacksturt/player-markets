use anchor_lang::prelude::*;

#[account]
pub struct PlayerMintConfig {
    pub bump: u8,
    pub base_token_mint: Pubkey,
    pub player_token_mint: Pubkey,
    pub cost: u64,
    pub timestamp: String,
    pub player_id: String,
}

impl Space for PlayerMintConfig {
    const INIT_SPACE: usize = 1 + 32 + 32 + 8 + (4 + 8) + (4 + 13) + 8;
}

impl PlayerMintConfig {
    pub fn to_slice(&self) -> Vec<u8> {
        let mut s = self.base_token_mint.to_bytes().to_vec();
        s.extend_from_slice(&self.player_token_mint.to_bytes());
        s.extend_from_slice(&self.cost.to_le_bytes());
        s.extend_from_slice(&self.player_id.as_bytes());
        s.extend_from_slice(&self.timestamp.as_bytes());
        s
    }
}
