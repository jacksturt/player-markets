use anchor_lang::prelude::*;

#[account]
pub struct MintRecord {
    pub deposited_amount: u64,
    pub minted_amount: u64,
}

impl Space for MintRecord {
    const INIT_SPACE: usize = 8 + 8 + 8;
}
