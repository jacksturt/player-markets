use crate::state::base::BaseMintConfig;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::Token, token_interface::Mint};

#[derive(Accounts)]
pub struct InitializeBase<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [b"base"],
        mint::authority = base_token_mint,
        mint::decimals = 6,
        bump,
    )]
    pub base_token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = payer,
        seeds = [b"baseConfig"],
        space = BaseMintConfig::INIT_SPACE,
        bump,
    )]
    pub config: Account<'info, BaseMintConfig>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializeBase<'info> {
    pub fn initialize_base(&mut self, bumps: &InitializeBaseBumps) -> Result<()> {
        let (config_bump, base_token_bump) = (bumps.config, bumps.base_token_mint);

        self.config.set_inner(BaseMintConfig {
            config_bump,
            base_token_bump,
        });
        Ok(())
    }
}
