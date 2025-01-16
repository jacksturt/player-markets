use crate::state::{mint::PlayerMintConfig, MintRecord, PlayerStats};
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
    #[account(mut,
        seeds = [b"player_stats", mint_config.player_id.as_ref(), mint_config.timestamp.as_ref()],
        bump,
    )]
    pub player_stats: Account<'info, PlayerStats>,
    #[account(mut,
        seeds = [b"mint_record", mint_config.key().as_ref(), payer.key().as_ref()],
        bump,
    )]
    pub mint_record: Box<Account<'info, MintRecord>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Payout<'info> {
    pub fn payout(&mut self) -> Result<()> {
        self.burn_player_tokens()?;
        self.transfer_quote_tokens()?;
        Ok(())
    }

    pub fn transfer_quote_tokens(&mut self) -> Result<()> {
        msg!("vault total: {}", self.vault.amount);
        msg!("player token supply: {}", self.player_token_mint.supply);
        let vault_remaining = self.vault.amount
            - (self.player_token_mint.supply as f64 * self.player_stats.projected_points) as u64;
        msg!("vault remaining: {}", vault_remaining);

        let percent_due = self.mint_record.deposited_amount as f64
            / self.mint_config.total_deposited_amount as f64;

        let minter_rewards = vault_remaining as f64 * percent_due;
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

        transfer_checked(
            cpi_ctx,
            amount + minter_rewards as u64,
            self.quote_token_mint.decimals,
        )?;
        self.mint_config.total_deposited_amount -= self.mint_record.deposited_amount;
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

    pub fn close_accounts(&mut self) -> Result<()> {
        self.payer_player_token_account
            .close(self.payer.to_account_info())?;
        self.mint_record.close(self.payer.to_account_info())?;
        if self.mint_config.total_deposited_amount == 0 {
            self.vault.close(self.payer.to_account_info())?;
            self.mint_config.close(self.payer.to_account_info())?;
            self.player_stats.close(self.payer.to_account_info())?;
        }
        Ok(())
    }
}
