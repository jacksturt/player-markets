use crate::errors::AmmError;
use crate::state::MarketConfig;
use crate::{assert_non_zero, assert_not_expired, assert_not_locked};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked};

use constant_product_curve::{ConstantProduct, LiquidityPair};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint_x: Box<InterfaceAccount<'info, Mint>>,
    pub mint_y: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_x,
        associated_token::authority = user
    )]
    pub user_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_y,
        associated_token::authority = user
    )]
    pub user_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = auth
    )]
    pub vault_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = auth
    )]
    pub vault_y: Box<InterfaceAccount<'info, TokenAccount>>,
    ///CHECKED: This is not dangerous. It's just used for signing.
    #[account(seeds = [b"auth"], bump = config.auth_bump)]
    pub auth: UncheckedAccount<'info>,
    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [
            b"config",
            config.seed.to_le_bytes().as_ref()
        ],
        bump = config.config_bump,
    )]
    pub config: Account<'info, MarketConfig>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Swap<'info> {
    pub fn swap(&mut self, is_x: bool, amount: u64, min: u64, expiration: i64) -> Result<()> {
        assert_not_locked!(self.config.locked);
        assert_not_expired!(expiration);
        assert_non_zero!([amount]);

        let mut curve = ConstantProduct::init(
            self.vault_x.amount,
            self.vault_y.amount,
            self.vault_x.amount,
            self.config.fee,
            None,
        )
        .map_err(AmmError::from)?;

        let p = match is_x {
            true => LiquidityPair::X,
            false => LiquidityPair::Y,
        };

        let res = curve.swap(p, amount, min).map_err(AmmError::from)?;

        assert_non_zero!([res.deposit, res.withdraw]);
        self.deposit_token(is_x, res.deposit)?;
        self.withdraw_token(is_x, res.withdraw)?;
        Ok(())
    }

    pub fn deposit_token(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (
                self.user_x.to_account_info(),
                self.vault_x.to_account_info(),
            ),
            false => (
                self.user_y.to_account_info(),
                self.vault_y.to_account_info(),
            ),
        };

        let accounts = TransferChecked {
            from,
            to,
            authority: self.user.to_account_info(),
            mint: match is_x {
                true => self.mint_x.to_account_info(),
                false => self.mint_y.to_account_info(),
            },
        };

        let ctx = CpiContext::new(self.token_program.to_account_info(), accounts);

        transfer_checked(
            ctx,
            amount,
            match is_x {
                true => self.mint_x.decimals,
                false => self.mint_y.decimals,
            },
        )
    }

    pub fn withdraw_token(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (
                self.vault_y.to_account_info(),
                self.user_y.to_account_info(),
            ),
            false => (
                self.vault_x.to_account_info(),
                self.user_x.to_account_info(),
            ),
        };

        let accounts = TransferChecked {
            from,
            to,
            authority: self.auth.to_account_info(),
            mint: match is_x {
                true => self.mint_y.to_account_info(),
                false => self.mint_x.to_account_info(),
            },
        };

        let seeds = &[&b"auth"[..], &[self.config.auth_bump]];

        let signer_seeds = &[&seeds[..]];

        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        transfer_checked(
            ctx,
            amount,
            match is_x {
                true => self.mint_y.decimals,
                false => self.mint_x.decimals,
            },
        )
    }
}
