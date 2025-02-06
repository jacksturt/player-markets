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
        mint_enabled: bool,
        payout_enabled: bool,
    ) -> Result<()> {
        require!(
            self.authority.key().to_string() == UPDATE_PLAYER_PROJECTIONS_PUBKEY
                || self.authority.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        msg!("mint_enabled: {}", mint_enabled);
        msg!("payout_enabled: {}", payout_enabled);

        if self.config.minting_enabled != mint_enabled {
            require!(
                self.authority.key().to_string() == ADMIN_PUBKEY,
                OracleError::AdminOnlyUnlock
            );
            msg!("Setting minting_enabled to {}", mint_enabled);
            self.config.minting_enabled = mint_enabled;
        }

        if self.config.payout_enabled != payout_enabled {
            require!(
                self.authority.key().to_string() == ADMIN_PUBKEY,
                OracleError::AdminOnlyUnlock
            );
            msg!("Setting payout_enabled to {}", payout_enabled);
            self.config.payout_enabled = payout_enabled;
        }

        // Update player statistics
        if is_projected {
            msg!("Setting projected_points to {}", points);
            self.player_stats.projected_points = points;
        } else {
            msg!("Setting actual_points to {}", points);
            self.player_stats.actual_points = points;
        }
        self.player_stats.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}
