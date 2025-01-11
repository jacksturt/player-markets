use anchor_lang::prelude::*;

use crate::state::PlayerStats;
use crate::OracleError;
use crate::ADMIN_PUBKEY;
#[derive(Accounts)]
#[instruction(player_id: String)]
pub struct InitializeProjectionOracle<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 200, // Adjust space as needed
        seeds = [b"player_stats", player_id.as_bytes()],
        bump
    )]
    pub player_stats: Account<'info, PlayerStats>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeProjectionOracle<'info> {
    pub fn initialize_projection_oracle(
        &mut self,
        player_id: String,
        name: String,
        position: String,
    ) -> Result<()> {
        require!(
            self.authority.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        let player_stats = &mut self.player_stats;
        player_stats.player_id = player_id;
        player_stats.name = name;
        player_stats.position = position;
        player_stats.projected_yards = 0;
        player_stats.projected_touchdowns = 0;
        player_stats.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}
