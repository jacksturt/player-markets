use crate::{errors::AmmError, state::MarketConfig};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct InitMarket<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub mint_x: Box<InterfaceAccount<'info, Mint>>,
    pub mint_y: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        seeds = [b"lp", config.key.as_ref()],
        payer = initializer,
        bump,
        mint::decimals = 6,
        mint::authority = auth
    )]
    pub mint_lp: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint_x,
        associated_token::authority = auth,
    )]
    pub vault_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint_y,
        associated_token::authority = auth,
    )]
    pub vault_y: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: This is safe because it's just used to sign
    #[account(seeds = [b"auth"], bump)]
    pub auth: UncheckedAccount<'info>,
    #[account(
        init,
        payer = initializer,
        seeds = [b"config", seed.to_le_bytes().as_ref()],
        bump,
        space = MarketConfig::LEN
    )]
    pub config: Box<Account<'info, MarketConfig>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitMarket<'info> {
    pub fn init_market(
        &mut self,
        bumps: &InitMarketBumps,
        seed: u64,
        fee: u16,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        // Don't charge >100.00% as a fee
        require!(fee <= 10000, AmmError::InvalidFee);
        msg!("Initializing market with bump: {}", bumps.mint_lp);
        self.config.init(
            seed,
            authority,
            self.mint_x.key(),
            self.mint_y.key(),
            fee,
            bumps.auth,
            bumps.config,
            bumps.mint_lp,
        );
        Ok(())
    }
}
