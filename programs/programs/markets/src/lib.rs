use anchor_lang::prelude::*;
pub mod constants;
pub mod context;
pub mod errors;
pub mod helpers;
pub mod state;

use crate::constants::*;
use crate::context::*;
use crate::errors::*;

use crate::state::PlayerStats;

declare_id!("trdtLkaq6ZsAa3XMWQDonaZN8JhurDoAwcVs9C8wYpM");

#[program]
pub mod tradetalk {

    use super::*;

    pub fn init_quote(ctx: Context<InitializeQuote>) -> Result<()> {
        ctx.accounts.initialize_quote(&ctx.bumps).unwrap();
        Ok(())
    }

    pub fn faucet_quote(ctx: Context<FaucetQuote>, quantity: u64) -> Result<()> {
        ctx.accounts.faucet_quote(quantity).unwrap();
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

    pub fn init_projection_oracle(ctx: Context<InitializeProjectionOracle>) -> Result<()> {
        ctx.accounts.initialize_projection_oracle().unwrap();
        Ok(())
    }

    pub fn update_projection_oracle(
        ctx: Context<UpdateProjectionOracle>,
        player_data: PlayerStats,
    ) -> Result<()> {
        ctx.accounts.update_projection_oracle(player_data).unwrap();
        Ok(())
    }
}
