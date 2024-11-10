use anchor_lang::prelude::*;

declare_id!("9WtCZEPUy4W2xzB7c215k36urLP57Cu8HWo85gV5dZ5o");

#[program]
pub mod markets {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
