use anchor_lang::prelude::*;

use crate::{
    state::{PlayerMintConfig, PlayerStats},
    OracleError, ADMIN_PUBKEY,
};

#[derive(Accounts)]
pub struct UpdateProjectionOracle<'info> {
    #[account(
        seeds = [b"config", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
    )]
    pub config: Account<'info, PlayerMintConfig>,
    #[account(mut,
        seeds = [b"player_stats", config.player_id.as_ref()],
        bump,
    )]
    pub player_stats: Account<'info, PlayerStats>,
    pub authority: Signer<'info>,
}

impl<'info> UpdateProjectionOracle<'info> {
    pub fn update_projection_oracle(&mut self, projected_points: f64) -> Result<()> {
        require!(
            self.authority.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );

        // Update player statistics
        self.player_stats.projected_points = projected_points;
        self.player_stats.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}
