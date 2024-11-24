/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet';
import * as web3 from '@solana/web3.js';

/**
 * @category Instructions
 * @category ClaimSeatUnused
 * @category generated
 */
export const ClaimSeatUnusedStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number;
}>([['instructionDiscriminator', beet.u8]], 'ClaimSeatUnusedInstructionArgs');
/**
 * Accounts required by the _ClaimSeatUnused_ instruction
 *
 * @property [] manifestProgram
 * @property [_writable_, **signer**] owner
 * @property [_writable_] market
 * @property [_writable_, **signer**] payer
 * @property [_writable_] wrapperState
 * @category Instructions
 * @category ClaimSeatUnused
 * @category generated
 */
export type ClaimSeatUnusedInstructionAccounts = {
  manifestProgram: web3.PublicKey;
  owner: web3.PublicKey;
  market: web3.PublicKey;
  systemProgram?: web3.PublicKey;
  payer: web3.PublicKey;
  wrapperState: web3.PublicKey;
};

export const claimSeatUnusedInstructionDiscriminator = 1;

/**
 * Creates a _ClaimSeatUnused_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category ClaimSeatUnused
 * @category generated
 */
export function createClaimSeatUnusedInstruction(
  accounts: ClaimSeatUnusedInstructionAccounts,
  programId = new web3.PublicKey('UMnFStVeG1ecZFc2gc5K3vFy3sMpotq8C91mXBQDGwh'),
) {
  const [data] = ClaimSeatUnusedStruct.serialize({
    instructionDiscriminator: claimSeatUnusedInstructionDiscriminator,
  });
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.manifestProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.owner,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.market,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.wrapperState,
      isWritable: true,
      isSigner: false,
    },
  ];

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  });
  return ix;
}
