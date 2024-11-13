use anchor_lang::prelude::*;
pub mod constants;
pub mod context;
pub mod errors;
pub mod helpers;
pub mod state;

use crate::constants::*;
use crate::context::*;
use crate::errors::*;

declare_id!("9WtCZEPUy4W2xzB7c215k36urLP57Cu8HWo85gV5dZ5o");

#[program]
pub mod markets {
    use super::*;

    pub fn init_base(ctx: Context<InitializeBase>) -> Result<()> {
        ctx.accounts.initialize_base(&ctx.bumps).unwrap();
        Ok(())
    }

    pub fn faucet_base(ctx: Context<FaucetBase>, quantity: u64) -> Result<()> {
        ctx.accounts.faucet_base(quantity).unwrap();
        Ok(())
    }

    pub fn init_mint(
        ctx: Context<InitializeMint>,
        cost: u64,
        player_id: String,
        timestamp: String,
    ) -> Result<()> {
        ctx.accounts
            .initialize_mint(cost, player_id, timestamp, &ctx.bumps)
            .unwrap();
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
        ctx.accounts.mint_tokens(quantity).unwrap();
        Ok(())
    }

    pub fn init_market(
        ctx: Context<InitMarket>,
        seed: u64,
        fee: u16,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        ctx.accounts
            .init_market(&ctx.bumps, seed, fee, authority)
            .unwrap();
        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
        max_x: u64,
        max_y: u64,
        expiration: i64,
    ) -> Result<()> {
        ctx.accounts
            .deposit(amount, max_x, max_y, expiration)
            .unwrap();
        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
        max_x: u64,
        max_y: u64,
        expiration: i64,
    ) -> Result<()> {
        ctx.accounts
            .withdraw(amount, max_x, max_y, expiration)
            .unwrap();
        Ok(())
    }

    pub fn swap(
        ctx: Context<Swap>,
        is_x: bool,
        amount: u64,
        min: u64,
        expiration: i64,
    ) -> Result<()> {
        ctx.accounts.swap(is_x, amount, min, expiration).unwrap();
        Ok(())
    }

    pub fn init_payout(ctx: Context<InitializePayout>, payout_rate: u64) -> Result<()> {
        ctx.accounts
            .initialize_payout(&ctx.bumps, payout_rate)
            .unwrap();
        Ok(())
    }

    pub fn payout(ctx: Context<Payout>) -> Result<()> {
        ctx.accounts.payout().unwrap();
        Ok(())
    }
}
