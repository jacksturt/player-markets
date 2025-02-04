use anchor_lang::prelude::*;
pub mod constants;
pub mod context;
pub mod errors;
pub mod helpers;
pub mod state;

use crate::constants::*;
use crate::context::*;
use crate::errors::*;

declare_id!("AMNTpN6ykSqt6VUs5tnypD433naSCNbjS8fsEJLVHSsh");

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

    pub fn init_projection_oracle(ctx: Context<InitializeProjectionOracle>) -> Result<()> {
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
        points: f64,
        is_projected: bool,
        set_mint_disabled: bool,
        set_payout_enabled: bool,
    ) -> Result<()> {
        ctx.accounts
            .update_projection_oracle(points, is_projected, set_mint_disabled, set_payout_enabled)
            .unwrap();
        Ok(())
    }

    pub fn close_accounts(ctx: Context<CloseMintAccounts>) -> Result<()> {
        ctx.accounts.close_accounts().unwrap();
        Ok(())
    }
}
