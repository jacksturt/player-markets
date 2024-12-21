#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod web {
    use super::*;

  pub fn close(_ctx: Context<CloseWeb>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.web.count = ctx.accounts.web.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.web.count = ctx.accounts.web.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeWeb>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.web.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeWeb<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Web::INIT_SPACE,
  payer = payer
  )]
  pub web: Account<'info, Web>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseWeb<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub web: Account<'info, Web>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub web: Account<'info, Web>,
}

#[account]
#[derive(InitSpace)]
pub struct Web {
  count: u8,
}
