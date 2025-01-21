use anchor_lang::prelude::*;
pub mod constants;
pub mod context;
pub mod errors;
pub mod helpers;
pub mod state;

use crate::constants::*;
use crate::context::*;
use crate::errors::*;

declare_id!("D9DoDBNem1Lz4c8MEk2YhrTaBXSDTFjSBMezm9MwLyA3");

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
        player_id: String,
        timestamp: String,
    ) -> Result<()> {
        ctx.accounts
            .initialize_mint(player_id.clone(), timestamp, &ctx.bumps)
            .unwrap();
        Ok(())
    }

    pub fn init_projection_oracle(
        ctx: Context<InitializeProjectionOracle>,
        player_id: String,
        timestamp: String,
    ) -> Result<()> {
        ctx.accounts
            .initialize_projection_oracle(&ctx.bumps)
            .unwrap();
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
        ctx.accounts.mint_tokens(quantity).unwrap();
        Ok(())
    }

    pub fn payout(ctx: Context<Payout>) -> Result<()> {
        ctx.accounts.payout().unwrap();
        Ok(())
    }

    pub fn update_projection_oracle(
        ctx: Context<UpdateProjectionOracle>,
        projected_points: f64,
    ) -> Result<()> {
        ctx.accounts
            .update_projection_oracle(projected_points)
            .unwrap();
        Ok(())
    }
}
