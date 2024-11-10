use crate::state::mint::PlayerMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{mint_to, MintTo},
    token_interface::{Mint, TokenAccount},
};

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"mint", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
        mint::authority = player_token_mint,
    )]
    pub player_token_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"config", config.player_id.as_ref(), config.timestamp.as_ref()],
        bump,
    )]
    pub config: Account<'info, PlayerMintConfig>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = player_token_mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> MintTokens<'info> {
    pub fn mint_tokens(&mut self, quantity: u64) -> Result<()> {
        let seeds = &[
            "mint".as_bytes(),
            &self.config.player_id.as_bytes(),
            &self.config.timestamp.as_bytes(),
            &[self.config.player_token_bump],
        ];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    authority: self.player_token_mint.to_account_info(),
                    to: self.destination.to_account_info(),
                    mint: self.player_token_mint.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }
}
