use crate::state::{mint::PlayerMintConfig, MintRecord, PlayerStats};
use anchor_lang::{prelude::*, solana_program::pubkey::Pubkey};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{
        burn, close_account, transfer_checked, Burn, CloseAccount, Mint, TokenAccount,
        TransferChecked,
    },
};

use crate::errors::OracleError;

#[derive(Accounts)]
pub struct PayoutV2<'info> {
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
    pub mint_record: Option<Box<Account<'info, MintRecord>>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> PayoutV2<'info> {
    pub fn payout_v2(&mut self) -> Result<()> {
        if !self.mint_config.payout_enabled {
            return Err(OracleError::PayoutNotEnabled.into());
        }
        self.handle_minting_rewards()?;
        self.handle_player_tokens()?;
        self.close_mint_record()?;
        Ok(())
    }

    pub fn handle_minting_rewards(&mut self) -> Result<()> {
        match &mut self.mint_record {
            Some(mint_record) => {
                let vault_remaining = self.vault.amount
                    - (self.player_token_mint.supply as f64 * self.player_stats.actual_points)
                        as u64;
                if vault_remaining > 0 {
                    let percent_due;
                    // Percentage of the total deposited amount that is due to the minter

                    if self.mint_config.total_deposited_amount == 0 {
                        percent_due = 0.0;
                    } else {
                        percent_due = mint_record.deposited_amount as f64
                            / self.mint_config.total_deposited_amount as f64;
                    }

                    // How much is due to the minter
                    let minter_rewards = vault_remaining as f64 * percent_due;
                    msg!("minter_rewards: {}", minter_rewards);
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

                    let cpi_ctx =
                        CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
                    transfer_checked(
                        cpi_ctx,
                        minter_rewards as u64,
                        self.quote_token_mint.decimals,
                    )?;
                }

                self.mint_config.total_deposited_amount -= mint_record.deposited_amount;
                mint_record.deposited_amount = 0;
                Ok(())
            }
            None => {
                return Ok(());
            }
        }
    }

    pub fn handle_player_tokens(&mut self) -> Result<()> {
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
        let amount_due: u64;

        if self.player_token_mint.supply as f64 * self.player_stats.actual_points
            >= self.vault.amount as f64
        {
            let percent_due;
            if self.player_token_mint.supply == 0 {
                percent_due = 0.0;
            } else {
                percent_due = self.payer_player_token_account.amount as f64
                    / self.player_token_mint.supply as f64;
            }
            amount_due = (self.vault.amount as f64 * percent_due) as u64;
        } else {
            // How much is due based on player tokens the person owns
            amount_due = (self.player_stats.actual_points
                * self.payer_player_token_account.amount as f64) as u64;
        }
        transfer_checked(cpi_ctx, amount_due, self.quote_token_mint.decimals)?;
        let cpi_accounts = Burn {
            mint: self.player_token_mint.to_account_info(),
            from: self.payer_player_token_account.to_account_info(),
            authority: self.payer.to_account_info(),
        };

        let ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        burn(ctx, self.payer_player_token_account.amount)?;
        let close_account_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.payer_player_token_account.to_account_info(),
                destination: self.payer.to_account_info(),
                authority: self.payer.to_account_info(),
            },
        );
        close_account(close_account_ctx)?;
        Ok(())
    }

    pub fn close_mint_record(&mut self) -> Result<()> {
        self.mint_record.close(self.payer.to_account_info())?;
        Ok(())
    }
}
