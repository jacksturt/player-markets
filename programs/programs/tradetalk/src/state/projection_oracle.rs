use anchor_lang::prelude::*;

#[account]
pub struct PlayerStats {
    pub player_id: String,
    pub projected_points: f64,
    pub last_updated: i64,
}

impl Space for PlayerStats {
    const INIT_SPACE: usize = 8 + 32 + 8 + 8;
}
