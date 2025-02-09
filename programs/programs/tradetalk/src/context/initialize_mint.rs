use crate::state::{mint::PlayerMintConfig, PlayerStats};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
#[instruction(player_id: String, timestamp: String)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub quote_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = quote_token_mint,
        associated_token::authority = config
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init,
        payer = payer,
        seeds = [b"config", player_id.as_bytes(), timestamp.as_bytes()],
        bump,
        space = PlayerMintConfig::INIT_SPACE,
    )]
    pub config: Box<Account<'info, PlayerMintConfig>>,
    #[account(
        init,
        payer = payer,
        seeds = [b"mint", player_id.as_bytes(), timestamp.as_bytes()],
        bump,
        mint::authority = player_token_mint,
        mint::decimals = 6,
    )]
    pub player_token_mint: Box<InterfaceAccount<'info, Mint>>,
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

impl<'info> InitializeMint<'info> {
    pub fn initialize_mint(
        &mut self,
        player_id: String,
        timestamp: String,
        projected_points: f64,
        bumps: &InitializeMintBumps,
    ) -> Result<()> {
        let (config_bump, player_token_bump, player_stats_bump) =
            (bumps.config, bumps.player_token_mint, bumps.player_stats);

        self.config.set_inner(PlayerMintConfig {
            config_bump,
            player_token_bump,
            minting_enabled: true,
            payout_enabled: false,
            quote_token_mint: self.quote_token_mint.key(),
            player_token_mint: self.player_token_mint.key(),
            timestamp,
            player_id,
            total_deposited_amount: 0,
        });

        self.player_stats.set_inner(PlayerStats {
            bump: player_stats_bump,
            projected_points,
            actual_points: 0.0,
            last_updated: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
