use anchor_lang::prelude::*;

use crate::{
    state::{PlayerStats, ProjectionOracleState},
    OracleError,
};

#[derive(Accounts)]
pub struct UpdateProjectionOracle<'info> {
    #[account(mut)]
    pub oracle_account: Account<'info, ProjectionOracleState>,
    pub authority: Signer<'info>,
}

impl<'info> UpdateProjectionOracle<'info> {
    pub fn update_projection_oracle(&mut self, player_data: PlayerStats) -> Result<()> {
        let oracle_account = &mut self.oracle_account;
        require!(
            oracle_account.authority == self.authority.key(),
            OracleError::UnauthorizedUpdate
        );

        // Update player statistics
        oracle_account.player_stats.insert(
            player_data.player_id.clone(),
            PlayerStats {
                player_id: player_data.player_id.clone(),
                name: player_data.name,
                position: player_data.position,
                projected_yards: player_data.projected_yards,
                projected_touchdowns: player_data.projected_touchdowns,
                projected_receptions: player_data.projected_receptions,
                projected_targets: player_data.projected_targets,
                projected_rush_attempts: player_data.projected_rush_attempts,
                projected_pass_attempts: player_data.projected_pass_attempts,
                projected_kicking_points: player_data.projected_kicking_points,
                last_updated: Clock::get()?.unix_timestamp,
            },
        );

        oracle_account.last_update = Clock::get()?.unix_timestamp;
        Ok(())
    }
}
