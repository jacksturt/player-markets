use anchor_lang::prelude::*;

use crate::{state::PlayerMintConfig, OracleError, ADMIN_PUBKEY};

#[derive(Accounts)]
pub struct SetIsMintEnabled<'info> {
    #[account(
        mut,
        seeds = [b"config", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
    )]
    pub config: Account<'info, PlayerMintConfig>,
    pub authority: Signer<'info>,
}

impl<'info> SetIsMintEnabled<'info> {
    pub fn set_is_mint_enabled(&mut self, is_mint_enabled: bool) -> Result<()> {
        if self.config.minting_enabled != is_mint_enabled {
            require!(
                self.authority.key().to_string() == ADMIN_PUBKEY,
                OracleError::AdminOnlyUnlock
            );
            msg!("Setting minting_enabled to {}", is_mint_enabled);
            self.config.minting_enabled = is_mint_enabled;
        }

        Ok(())
    }
}
