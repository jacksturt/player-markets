use anchor_lang::prelude::*;

#[account]
pub struct MintRecordV2 {
    pub deposited_amount: u64,
    pub minted_amount: u64,
}

impl Space for MintRecordV2 {
    const INIT_SPACE: usize = 8 + 8 + 8;
}
