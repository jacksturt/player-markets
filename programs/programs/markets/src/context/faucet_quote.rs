use crate::state::quote::QuoteMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{mint_to, MintTo},
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
pub struct FaucetQuote<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        // seeds = [b"quote"],
        // bump,
        mint::authority = quote_token_mint,
    )]
    pub quote_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        seeds = [b"quoteConfig"],
        bump,
    )]
    pub config: Account<'info, QuoteMintConfig>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = quote_token_mint,
        associated_token::authority = payer,
    )]
    pub destination: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> FaucetQuote<'info> {
    pub fn faucet_quote(&mut self, quantity: u64) -> Result<()> {
        let seeds = &["quote".as_bytes(), &[self.config.quote_token_bump]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    authority: self.quote_token_mint.to_account_info(),
                    to: self.destination.to_account_info(),
                    mint: self.quote_token_mint.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }
}
