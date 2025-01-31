"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useMarkets, usePlayerMarket } from "./market-data-access";
import { minimizePubkey } from "@/utils/web3";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export default function Markets() {
  const { publicKey } = useWallet();
  const { markets } = useMarkets();

  return publicKey ? (
    <div className="w-full grid grid-cols-6 gap-4 py-10 px-10">
      {markets.data?.map((market) => (
        <Link
          key={market.account.timestamp}
          href={`/markets/${market.publicKey.toBase58()}`}
          className="flex flex-col p-2 rounded-sm border-purple-700 border"
        >
          <div>{market.account.playerId}</div>
          <div>{timeAgo(parseInt(market.account.timestamp))}</div>
          <div>{minimizePubkey(market.publicKey.toBase58())}</div>
        </Link>
      ))}
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
