use crate::{state::mint::PlayerMintConfig, ADMIN_PUBKEY};
use anchor_lang::{prelude::*, solana_program::pubkey::Pubkey};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked},
};

use crate::errors::OracleError;

#[derive(Accounts)]
pub struct AdminEmptyVault<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub quote_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = quote_token_mint,
        associated_token::authority = payer,
    )]
    pub payer_quote_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"config", mint_config.player_id.as_bytes(), mint_config.timestamp.as_bytes()],
        bump,
    )]
    pub mint_config: Box<Account<'info, PlayerMintConfig>>,
    #[account(mut,
        associated_token::mint = quote_token_mint,
        associated_token::authority = mint_config
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> AdminEmptyVault<'info> {
    pub fn empty_vault(&mut self) -> Result<()> {
        require!(
            self.payer.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
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
        let amount_due: u64 = self.vault.amount;
        transfer_checked(cpi_ctx, amount_due, self.quote_token_mint.decimals)?;

        Ok(())
    }
}
