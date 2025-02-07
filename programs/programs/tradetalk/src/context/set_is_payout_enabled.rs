use anchor_lang::prelude::*;

use crate::{state::PlayerMintConfig, OracleError, ADMIN_PUBKEY};

#[derive(Accounts)]
pub struct SetIsPayoutEnabled<'info> {
    #[account(
        mut,
        seeds = [b"config", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
    )]
    pub config: Account<'info, PlayerMintConfig>,
    pub authority: Signer<'info>,
}

impl<'info> SetIsPayoutEnabled<'info> {
    pub fn set_is_payout_enabled(&mut self, is_payout_enabled: bool) -> Result<()> {
        if self.config.payout_enabled != is_payout_enabled {
            require!(
                self.authority.key().to_string() == ADMIN_PUBKEY,
                OracleError::AdminOnlyUnlock
            );
            msg!("Setting payout_enabled to {}", is_payout_enabled);
            self.config.payout_enabled = is_payout_enabled;
        }

        Ok(())
    }
}
