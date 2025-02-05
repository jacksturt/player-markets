// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import TradetalkIDL from "../target/idl/tradetalk.json";
import type { Tradetalk } from "../target/types/tradetalk";

// Re-export the generated IDL and type
export { Tradetalk, TradetalkIDL };

// The programId is imported from the program IDL.
export const TRADETALK_PROGRAM_ID = new PublicKey(TradetalkIDL.address);

// This is a helper function to get the Web Anchor program.
export function getTradetalkProgram(
  provider: AnchorProvider,
  address?: PublicKey
) {
  return new Program(
    {
      ...TradetalkIDL,
      address: address ? address.toBase58() : TradetalkIDL.address,
    } as Tradetalk,
    provider
  );
}

// This is a helper function to get the program ID for the Web program depending on the cluster.
export function getTradetalkProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
    case "mainnet-beta":
    default:
      return TRADETALK_PROGRAM_ID;
  }
}
