use crate::state::mint::PlayerMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use crate::state::PlayerStats;
use crate::OracleError;
use crate::ADMIN_PUBKEY;

#[derive(Accounts)]
#[instruction(player_id: String, timestamp: String)]
pub struct InitializeProjectionOracle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"config", player_id.as_bytes(), timestamp.as_bytes()],
        bump,
    )]
    pub config: Box<Account<'info, PlayerMintConfig>>,
    #[account(
        init,
        payer = payer,
        space = PlayerStats::INIT_SPACE,
        seeds = [b"player_stats", player_id.as_bytes(), timestamp.as_bytes()],
        bump
    )]
    pub player_stats: Box<Account<'info, PlayerStats>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializeProjectionOracle<'info> {
    pub fn initialize_projection_oracle(
        &mut self,
        bumps: &InitializeProjectionOracleBumps,
    ) -> Result<()> {
        require!(
            self.payer.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        let player_stats = &mut self.player_stats;
        player_stats.bump = bumps.player_stats;
        player_stats.projected_points = 0.0;
        player_stats.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }
}
