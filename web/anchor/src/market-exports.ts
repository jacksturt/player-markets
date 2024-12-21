// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import MarketsIDL from "../target/idl/markets.json";
import type { Markets } from "../target/types/markets";

// Re-export the generated IDL and type
export { Markets, MarketsIDL };

// The programId is imported from the program IDL.
export const MARKETS_PROGRAM_ID = new PublicKey(MarketsIDL.address);

// This is a helper function to get the Web Anchor program.
export function getMarketsProgram(
  provider: AnchorProvider,
  address?: PublicKey
) {
  return new Program(
    {
      ...MarketsIDL,
      address: address ? address.toBase58() : MarketsIDL.address,
    } as Markets,
    provider
  );
}

// This is a helper function to get the program ID for the Web program depending on the cluster.
export function getMarketsProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the Web program on devnet and testnet.
      return new PublicKey("trdtLkaq6ZsAa3XMWQDonaZN8JhurDoAwcVs9C8wYpM");
    case "mainnet-beta":
    default:
      return MARKETS_PROGRAM_ID;
  }
}
