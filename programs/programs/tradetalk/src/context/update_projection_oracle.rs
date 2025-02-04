use anchor_lang::prelude::*;

use crate::{
    state::{PlayerMintConfig, PlayerStats},
    OracleError, ADMIN_PUBKEY, UPDATE_PLAYER_PROJECTIONS_PUBKEY,
};

#[derive(Accounts)]
pub struct UpdateProjectionOracle<'info> {
    #[account(
        mut,
        seeds = [b"config", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
    )]
    pub config: Account<'info, PlayerMintConfig>,
    #[account(mut,
        seeds = [b"player_stats", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
    )]
    pub player_stats: Account<'info, PlayerStats>,
    pub authority: Signer<'info>,
}

impl<'info> UpdateProjectionOracle<'info> {
    pub fn update_projection_oracle(
        &mut self,
        points: f64,
        is_projected: bool,
        set_mint_disabled: bool,
        set_payout_enabled: bool,
    ) -> Result<()> {
        require!(
            self.authority.key().to_string() == UPDATE_PLAYER_PROJECTIONS_PUBKEY
                || self.authority.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        msg!("set_mint_disabled: {}", set_mint_disabled);
        msg!("set_payout_enabled: {}", set_payout_enabled);

        if set_mint_disabled {
            require!(
                self.authority.key().to_string() == ADMIN_PUBKEY,
                OracleError::AdminOnlyUnlock
            );
            msg!("Disabling minting");
            self.config.minting_enabled = false;
        }

        if set_payout_enabled {
            require!(
                self.authority.key().to_string() == ADMIN_PUBKEY,
                OracleError::AdminOnlyUnlock
            );
            self.config.payout_enabled = true;
        }

        // Update player statistics
        if is_projected {
            self.player_stats.projected_points = points;
        } else {
            self.player_stats.actual_points = points;
        }
        self.player_stats.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}
