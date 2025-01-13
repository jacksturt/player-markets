use anchor_lang::prelude::*;

#[account]
pub struct PlayerStats {
    pub player_id: String,
    pub name: String,
    pub position: String,
    pub projected_points: f64,
    pub last_updated: i64,
}
