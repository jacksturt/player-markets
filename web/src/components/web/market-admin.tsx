"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useQuoteToken } from "./market-data-access";
import {
  QuoteTokenCreate,
  QuoteTokenFaucet,
  InitPlayerMint,
  MintPlayerTokens,
  CreateMarket,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";

export default function MarketAdmin() {
  const { publicKey } = useWallet();

  return publicKey ? (
    <div className="w-full">
      <div className=" w-full">
        <div className="flex flex-col gap-4">
          <QuoteTokenCreate />
          <QuoteTokenFaucet />
          <InitPlayerMint />
          <MintPlayerTokens />
          <CreateMarket />
        </div>
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
