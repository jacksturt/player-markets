use anchor_lang::prelude::*;

#[account]
pub struct Holding {
    pub bump: u8,
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
}

impl Space for Holding {
    const INIT_SPACE: usize = 1 + 32 + 32 + 8 + 8;
}

impl Holding {
    pub fn to_slice(&self) -> Vec<u8> {
        let mut s = self.mint.to_bytes().to_vec();
        s.extend_from_slice(&self.owner.to_bytes());
        s.extend_from_slice(&self.amount.to_le_bytes());
        s
    }
}
