use std::collections::HashMap;

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PlayerStats {
    pub player_id: String,
    pub name: String,
    pub position: String,
    pub projected_yards: i32,
    pub projected_touchdowns: i32,
    pub projected_receptions: Option<i32>,
    pub projected_targets: Option<i32>,
    pub projected_rush_attempts: Option<i32>,
    pub projected_pass_attempts: Option<i32>,
    pub projected_kicking_points: Option<i32>,
    pub last_updated: i64,
}

#[account]
pub struct ProjectionOracleState {
    pub authority: Pubkey,
    pub player_stats: HashMap<String, PlayerStats>,
    pub last_update: i64,
}
