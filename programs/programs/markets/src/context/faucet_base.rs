use crate::state::base::BaseMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{mint_to, MintTo},
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
pub struct FaucetBase<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        // seeds = [b"base"],
        // bump,
        mint::authority = base_token_mint,
    )]
    pub base_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        seeds = [b"baseConfig"],
        bump,
    )]
    pub config: Account<'info, BaseMintConfig>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = base_token_mint,
        associated_token::authority = payer,
    )]
    pub destination: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> FaucetBase<'info> {
    pub fn faucet_base(&mut self, quantity: u64) -> Result<()> {
        let seeds = &["base".as_bytes(), &[self.config.base_token_bump]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    authority: self.base_token_mint.to_account_info(),
                    to: self.destination.to_account_info(),
                    mint: self.base_token_mint.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }
}
