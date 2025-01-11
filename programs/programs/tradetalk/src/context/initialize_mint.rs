use crate::state::mint::PlayerMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
#[instruction(cost: u64, player_id: String, timestamp: String)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub quote_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = quote_token_mint,
        associated_token::authority = config
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = payer,
        seeds = [b"config", player_id.as_bytes(), timestamp.as_bytes()],
        bump,
        space = PlayerMintConfig::INIT_SPACE,
    )]
    pub config: Account<'info, PlayerMintConfig>,
    #[account(
        init,
        payer = payer,
        seeds = [b"mint", player_id.as_bytes(), timestamp.as_bytes()],
        bump,
        mint::authority = player_token_mint,
        mint::decimals = 6,
    )]
    pub player_token_mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializeMint<'info> {
    pub fn initialize_mint(
        &mut self,
        cost: u64,
        player_id: String,
        timestamp: String,
        bumps: &InitializeMintBumps,
    ) -> Result<()> {
        let (config_bump, player_token_bump) = (bumps.config, bumps.player_token_mint);

        self.config.set_inner(PlayerMintConfig {
            config_bump,
            player_token_bump,
            quote_token_mint: self.quote_token_mint.key(),
            player_token_mint: self.player_token_mint.key(),
            cost,
            timestamp,
            player_id,
        });
        Ok(())
    }
}
