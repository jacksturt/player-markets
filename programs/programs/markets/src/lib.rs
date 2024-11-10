use anchor_lang::prelude::*;
pub mod context;
pub mod state;

use crate::context::*;

declare_id!("9WtCZEPUy4W2xzB7c215k36urLP57Cu8HWo85gV5dZ5o");

#[program]
pub mod markets {
    use super::*;

    pub fn init_mint(
        ctx: Context<InitializeMint>,
        cost: u64,
        player_id: String,
        timestamp: String,
    ) -> Result<()> {
        ctx.accounts
            .initialize_mint(cost, player_id, timestamp, &ctx.bumps)
            .unwrap();
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}
