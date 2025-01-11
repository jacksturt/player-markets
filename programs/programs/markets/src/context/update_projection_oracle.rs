use anchor_lang::prelude::*;

use crate::{state::PlayerStats, OracleError, ADMIN_PUBKEY};

#[derive(Accounts)]
pub struct UpdateProjectionOracle<'info> {
    #[account(mut)]
    pub player_stats: Account<'info, PlayerStats>,

    pub authority: Signer<'info>,
}

impl<'info> UpdateProjectionOracle<'info> {
    pub fn update_projection_oracle(&mut self, player_data: PlayerStats) -> Result<()> {
        require!(
            self.authority.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );

        // Update player statistics
        self.player_stats.player_id = player_data.player_id.clone();
        self.player_stats.name = player_data.name;
        self.player_stats.position = player_data.position;
        self.player_stats.projected_yards = player_data.projected_yards;
        self.player_stats.projected_touchdowns = player_data.projected_touchdowns;
        self.player_stats.projected_receptions = player_data.projected_receptions;
        self.player_stats.projected_targets = player_data.projected_targets;
        self.player_stats.projected_rush_attempts = player_data.projected_rush_attempts;
        self.player_stats.projected_pass_attempts = player_data.projected_pass_attempts;
        self.player_stats.projected_kicking_points = player_data.projected_kicking_points;
        self.player_stats.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}
