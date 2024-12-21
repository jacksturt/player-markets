// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import WebIDL from '../target/idl/web.json'
import type { Web } from '../target/types/web'

// Re-export the generated IDL and type
export { Web, WebIDL }

// The programId is imported from the program IDL.
export const WEB_PROGRAM_ID = new PublicKey(WebIDL.address)

// This is a helper function to get the Web Anchor program.
export function getWebProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...WebIDL, address: address ? address.toBase58() : WebIDL.address } as Web, provider)
}

// This is a helper function to get the program ID for the Web program depending on the cluster.
export function getWebProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Web program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return WEB_PROGRAM_ID
  }
}
