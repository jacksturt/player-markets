"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useMarkets, usePlayerMarket } from "./market-data-access";
import {
  InitPlayerMarket,
  MintPlayerTokens,
  InitPayout,
  Payout,
  CreateMarket,
  DepositBase,
  DepositQuote,
  Trade,
  WithdrawAll,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";
import { minimizePubkey } from "@/utils/web3";
import { useEffect } from "react";

export default function MarketFeature({
  params,
}: {
  params: { marketAddress: string };
}) {
  const { publicKey } = useWallet();

  const { bids, asks, setPlayerMarket } = usePlayerMarket();
  const { marketAddress } = params;

  // useEffect(() => {
  //   setPlayerMarket(new PublicKey(marketAddress));
  // }, [marketAddress]);

  const isAdmin = true;

  return publicKey ? (
    <div className="w-screen px-[10%] flex items-center justify-center">
      <div className="w-full grid grid-cols-2 gap-4 mt-20">
        <div>
          <h1 className="text-2xl font-bold">Trades</h1>
          <h2 className="text-lg font-bold">Bids</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <>
              <h3>Trader</h3>
              <h3>Price</h3>
              <h3>Quantity</h3>
            </>
            {bids.data?.map((bid) => (
              <>
                <div>{minimizePubkey(bid.trader.toBase58())}</div>
                <div>{bid.tokenPrice.toFixed(6)}</div>
                <div>{bid.numBaseTokens.toString()}</div>
              </>
            ))}
          </div>
          <h2 className="text-lg font-bold">Asks</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <>
              <h3>Trader</h3>
              <h3>Price</h3>
              <h3>Quantity</h3>
            </>
            {asks.data?.map((ask) => (
              <>
                <div>{minimizePubkey(ask.trader.toBase58())}</div>
                <div>{ask.tokenPrice.toFixed(6)}</div>
                <div>{ask.numBaseTokens.toString()}</div>
              </>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <DepositBase />
          <DepositQuote />
          <Trade />
          <WithdrawAll />
          {isAdmin && <InitPayout />}
          <Payout />
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
