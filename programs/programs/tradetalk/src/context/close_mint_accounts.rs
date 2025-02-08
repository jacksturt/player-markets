use crate::{
    state::{mint::PlayerMintConfig, PlayerStats},
    ADMIN_PUBKEY,
};
use anchor_lang::{prelude::*, solana_program::pubkey::Pubkey};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{close_account, CloseAccount, Mint, TokenAccount},
};

use crate::errors::OracleError;

#[derive(Accounts)]
pub struct CloseMintAccounts<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub quote_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub mint_config: Box<Account<'info, PlayerMintConfig>>,
    #[account(mut,
        associated_token::mint = quote_token_mint,
        associated_token::authority = mint_config
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        seeds = [b"player_stats", mint_config.player_id.as_ref(), mint_config.timestamp.as_ref()],
        bump,
    )]
    pub player_stats: Option<Account<'info, PlayerStats>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> CloseMintAccounts<'info> {
    pub fn close_accounts(&mut self) -> Result<()> {
        require!(
            self.admin.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        if self.mint_config.total_deposited_amount == 0 {
            let signer_seed: [&[&[u8]]; 1] = [&[
                b"config",
                self.mint_config.player_id.as_ref(),
                self.mint_config.timestamp.as_ref(),
                &[self.mint_config.config_bump],
            ]];

            let close_account_ctx = CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                CloseAccount {
                    account: self.vault.to_account_info(),
                    destination: self.admin.to_account_info(),
                    authority: self.mint_config.to_account_info(),
                },
                &signer_seed,
            );
            close_account(close_account_ctx)?;

            match &self.player_stats {
                Some(player_stats) => {
                    player_stats.close(self.admin.to_account_info())?;
                }
                None => {
                    msg!("Player stats not found");
                }
            }
            self.mint_config.close(self.admin.to_account_info())?;
        }
        Ok(())
    }
}
