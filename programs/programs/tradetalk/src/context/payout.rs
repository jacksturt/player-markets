use crate::state::{mint::PlayerMintConfig, PlayerStats};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{burn, transfer_checked, Burn, Mint, TokenAccount, TransferChecked},
};

#[derive(Accounts)]
pub struct Payout<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"quote"],
        mint::authority = quote_token_mint,
        mint::decimals = 6,
        bump,
    )]
    pub quote_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = quote_token_mint,
        associated_token::authority = payer,
    )]
    pub payer_quote_token_account: InterfaceAccount<'info, TokenAccount>,
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
        seeds = [b"config", mint_config.player_id.as_bytes(), mint_config.timestamp.as_bytes()],
        bump,
    )]
    pub mint_config: Box<Account<'info, PlayerMintConfig>>,
    #[account(mut,
        associated_token::mint = quote_token_mint,
        associated_token::authority = mint_config
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        seeds = [b"player_stats", mint_config.player_id.as_ref()],
        bump,
    )]
    pub player_stats: Account<'info, PlayerStats>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Payout<'info> {
    pub fn payout(&mut self) -> Result<()> {
        self.transfer_quote_tokens()?;
        self.burn_player_tokens()?;
        Ok(())
    }

    pub fn transfer_quote_tokens(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let bump = self.mint_config.config_bump;

        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.payer_quote_token_account.to_account_info(),
            authority: self.mint_config.to_account_info(),
            mint: self.quote_token_mint.to_account_info(),
        };

        let seeds = &[
            "config".as_bytes(),
            &self.mint_config.player_id.as_bytes(),
            &self.mint_config.timestamp.as_bytes(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        let amount = (self.player_stats.projected_points
            * self.payer_player_token_account.amount as f64) as u64;

        transfer_checked(cpi_ctx, amount, self.quote_token_mint.decimals)?;
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
