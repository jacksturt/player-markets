use crate::state::base::BaseMintConfig;
use crate::state::mint::PlayerMintConfig;
use crate::state::payout::PayoutConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{burn, mint_to, Burn, Mint, MintTo, TokenAccount},
};

#[derive(Accounts)]
pub struct Payout<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"base"],
        mint::authority = base_token_mint,
        mint::decimals = 6,
        bump,
    )]
    pub base_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = base_token_mint,
        associated_token::authority = payer,
    )]
    pub payer_base_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        // seeds = [b"player"],
        // bump,
    )]
    pub player_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = player_token_mint,
        associated_token::authority = payer,
    )]
    pub payer_player_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        seeds = [b"payout", mint_config.key().as_ref()],
        bump,
    )]
    pub payout_config: Box<Account<'info, PayoutConfig>>,
    #[account(
        seeds = [b"config", mint_config.player_id.as_bytes(), mint_config.timestamp.as_bytes()],
        bump,
    )]
    pub mint_config: Box<Account<'info, PlayerMintConfig>>,
    #[account(
        seeds = [b"baseConfig"],
        bump,
    )]
    pub base_config: Box<Account<'info, BaseMintConfig>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Payout<'info> {
    pub fn payout(&mut self) -> Result<()> {
        self.mint_base_tokens(
            self.payer_player_token_account.amount * self.payout_config.payout_rate,
        )?;
        self.burn_player_tokens()?;
        Ok(())
    }

    pub fn mint_base_tokens(&self, amount: u64) -> Result<()> {
        let seeds = &["base".as_bytes(), &[self.base_config.base_token_bump]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    authority: self.base_token_mint.to_account_info(),
                    to: self.payer_base_token_account.to_account_info(),
                    mint: self.base_token_mint.to_account_info(),
                },
                &signer,
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn burn_player_tokens(&self) -> Result<()> {
        let cpi_accounts = Burn {
            mint: self.player_token_mint.to_account_info(),
            from: self.payer_player_token_account.to_account_info(),
            authority: self.payer.to_account_info(),
        };

        let ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        burn(ctx, self.payer_player_token_account.amount)
    }
}
