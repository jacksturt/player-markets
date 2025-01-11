use anchor_lang::prelude::*;

use crate::state::ProjectionOracleState;

#[derive(Accounts)]
pub struct InitializeProjectionOracle<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8)]
    pub oracle_account: Account<'info, ProjectionOracleState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeProjectionOracle<'info> {
    pub fn initialize_projection_oracle(&mut self) -> Result<()> {
        let oracle_account = &mut self.oracle_account;
        oracle_account.authority = self.authority.key();
        oracle_account.last_update = Clock::get()?.unix_timestamp;
        Ok(())
    }
}
