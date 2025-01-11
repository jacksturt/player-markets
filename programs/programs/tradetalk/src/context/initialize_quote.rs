use crate::state::quote::QuoteMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::Token, token_interface::Mint};

#[derive(Accounts)]
pub struct InitializeQuote<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [b"quote"],
        mint::authority = quote_token_mint,
        mint::decimals = 6,
        bump,
    )]
    pub quote_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = payer,
        seeds = [b"quoteConfig"],
        space = QuoteMintConfig::INIT_SPACE,
        bump,
    )]
    pub config: Account<'info, QuoteMintConfig>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializeQuote<'info> {
    pub fn initialize_quote(&mut self, bumps: &InitializeQuoteBumps) -> Result<()> {
        let (config_bump, quote_token_bump) = (bumps.config, bumps.quote_token_mint);

        self.config.set_inner(QuoteMintConfig {
            config_bump,
            quote_token_bump,
        });
        Ok(())
    }
}
