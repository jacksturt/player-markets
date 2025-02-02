use anchor_lang::prelude::*;

#[account]
pub struct PlayerStats {
    pub bump: u8,
    pub projected_points: f64,
    pub actual_points: f64,
    pub last_updated: i64,
}

impl Space for PlayerStats {
    const INIT_SPACE: usize = 8 + 1 + 8 + 8 + 8;
}
