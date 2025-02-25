use crate::{state::MintRecord, OracleError, ADMIN_PUBKEY};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseMintRecord<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub mint_record: Account<'info, MintRecord>,
    pub system_program: Program<'info, System>,
}

impl<'info> CloseMintRecord<'info> {
    pub fn close_mint_record(&mut self) -> Result<()> {
        require!(
            self.payer.key().to_string() == ADMIN_PUBKEY,
            OracleError::UnauthorizedAuthority
        );
        self.mint_record.close(self.payer.to_account_info())?;

        Ok(())
    }
}
