use crate::{state::PlayerStats, OracleError, ADMIN_PUBKEY};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClosePlayerStats<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub player_stats: Option<Account<'info, PlayerStats>>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClosePlayerStats<'info> {
    pub fn close_player_stats(&mut self) -> Result<()> {
        require!(
            self.payer.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        self.player_stats.close(self.payer.to_account_info())?;

        Ok(())
    }
}
