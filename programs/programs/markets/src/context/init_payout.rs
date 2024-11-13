use crate::state::base::BaseMintConfig;
use crate::state::mint::PlayerMintConfig;
use crate::state::payout::PayoutConfig;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::Token, token_interface::Mint};

#[derive(Accounts)]
pub struct InitializePayout<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [b"payout", mint_config.key().as_ref()],
        space = PayoutConfig::INIT_SPACE,
        bump,
    )]
    pub payout_config: Account<'info, PayoutConfig>,
    #[account(
        seeds = [b"config", mint_config.player_id.as_bytes(), mint_config.timestamp.as_bytes()],
        bump,
    )]
    pub mint_config: Account<'info, PlayerMintConfig>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializePayout<'info> {
    pub fn initialize_payout(
        &mut self,
        bumps: &InitializePayoutBumps,
        payout_rate: u64,
    ) -> Result<()> {
        let config_bump = bumps.payout_config;

        self.payout_config.set_inner(PayoutConfig {
            config_bump,
            payout_rate,
            market_key: self.mint_config.key(),
        });
        Ok(())
    }
}
