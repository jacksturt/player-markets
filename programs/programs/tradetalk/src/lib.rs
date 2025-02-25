use anchor_lang::prelude::*;
pub mod constants;
pub mod context;
pub mod errors;
pub mod helpers;
pub mod state;

use crate::constants::*;
use crate::context::*;
use crate::errors::*;

declare_id!("A13hqcQX4g2o57dW4vRQKem5G7YykugzPGyvda5YXijV");

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
    ) -> Result<()> {
        ctx.accounts
            .update_projection_oracle(points, is_projected)
            .unwrap();
        Ok(())
    }

    pub fn set_is_mint_enabled(
        ctx: Context<SetIsMintEnabled>,
        is_mint_enabled: bool,
    ) -> Result<()> {
        ctx.accounts.set_is_mint_enabled(is_mint_enabled).unwrap();
        Ok(())
    }

    pub fn set_is_payout_enabled(
        ctx: Context<SetIsPayoutEnabled>,
        is_payout_enabled: bool,
    ) -> Result<()> {
        ctx.accounts
            .set_is_payout_enabled(is_payout_enabled)
            .unwrap();
        Ok(())
    }

    pub fn test_mint_rewards_only(ctx: Context<Payout>) -> Result<()> {
        ctx.accounts.handle_minting_rewards().unwrap();
        Ok(())
    }

    pub fn test_payout_player_tokens(ctx: Context<Payout>) -> Result<()> {
        ctx.accounts.handle_player_tokens().unwrap();
        Ok(())
    }

    pub fn close_accounts(ctx: Context<CloseMintAccounts>) -> Result<()> {
        ctx.accounts.close_accounts().unwrap();
        Ok(())
    }

    pub fn close_player_stats(ctx: Context<ClosePlayerStats>) -> Result<()> {
        ctx.accounts.close_player_stats().unwrap();
        Ok(())
    }

    pub fn empty_vault(ctx: Context<AdminEmptyVault>) -> Result<()> {
        ctx.accounts.empty_vault().unwrap();
        Ok(())
    }

    pub fn close_mint_config(ctx: Context<CloseMintConfig>) -> Result<()> {
        ctx.accounts.close_mint_config().unwrap();
        Ok(())
    }

    pub fn close_mint_record(ctx: Context<CloseMintRecord>) -> Result<()> {
        ctx.accounts.close_mint_record().unwrap();
        Ok(())
    }
}
