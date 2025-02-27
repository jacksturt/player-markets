"use client";
import React from "react";
import TrendDown from "@/components/icons/trend-down";
import TrendUp from "@/components/icons/trend-up";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import {
  Position,
  ProfileCard,
  UserStats,
  TradeHistoryItem,
  OrderHistoryItem,
} from "@/components/web/web-ui";
import { useMyBags } from "@/components/web/market-data-access";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const balanceData = {
  "24h_pct_change": 10,
  "24h_amount_change": 100,
};

export default function WalletPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/home/wallet`);
    return null;
  }

  return <WalletPageContent />;
}

function WalletPageContent() {
  const { myTrades, myOpenOrders, myPositions } = useMyBags();

  return (
    <div className="w-full min-h-screen overflow-y-auto flex flex-col flex-1 gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black text-white pt-5">
      <Navbar />
      {/* two columns */}
      <div className="w-full h-full flex items-start gap-[70px] px-[120px] pt-8 max-h-[85vh] overflow-y-scroll">
        {/* left column - balance, stats, positions etc */}
        <div className="w-full flex flex-col gap-[58px] pb-20">
          {/* current positions */}
          <div className="w-full flex flex-col max-h-[250px] overflow-y-scroll">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-2xl text-white font-clashMed">Positions</p>
                <p className="text-[#6A6A6A] text-[13px]">
                  These are your active positions. You can sell or cash out at
                  any time.
                </p>
              </div>
            </div>
            {/* TODO: positions.map */}
            <div className="w-full h-full overflow-y-auto flex flex-col gap-2 mt-5">
              {myPositions.data?.map((position) => (
                <Position
                  key={position.marketInfo?.baseMint.id}
                  shortPositionPayout={position.shortPositionPayout}
                  shortPositionMinted={position.shortPositionMinted}
                  longPositionPayout={position.longPositionPayout}
                  longPositionHeld={position.longPositionHeld}
                  marketInfo={position.marketInfo!}
                />
              ))}
            </div>
          </div>
          {/* open orders */}
          <div className="w-full flex flex-col max-h-[250px] overflow-y-scroll">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-2xl text-white font-clashMed">Open Orders</p>
                <p className="text-[#6A6A6A] text-[13px]">
                  Here are your buy and sell orders that are currently
                  outstanding.
                </p>
              </div>
            </div>
            <div className="w-full h-full overflow-y-auto flex flex-col gap-2 mt-5">
              {myOpenOrders.data && myOpenOrders.data.length > 0 ? (
                myOpenOrders.data.map((order) => (
                  <OrderHistoryItem
                    key={order.id}
                    order={{ ...order, isMyOrder: true }}
                  />
                ))
              ) : (
                <div className="w-full flex flex-col gap-2 pt-7">
                  <p className="text-white text-center">No open orders</p>
                </div>
              )}
            </div>
          </div>
          {/* trade history */}
          <div className="w-full flex flex-col max-h-[250px]">
            <div className="flex flex-col gap-2">
              <p className="text-2xl text-white font-clashMed">Trade History</p>
              <p className="text-[#6A6A6A] text-[13px]">
                These are your past trades. Embarrassed yet?
              </p>
            </div>
            <div className="w-full h-full overflow-y-auto flex flex-col gap-2 mt-5">
              {myTrades.data && myTrades.data.length > 0 ? (
                myTrades.data.map((trade) => (
                  <TradeHistoryItem key={trade.id} trade={trade} />
                ))
              ) : (
                <p className="text-white">No trades yet</p>
              )}
            </div>
          </div>
        </div>
        <ProfileCard />
      </div>

      {/* </div>
      <div className="px-5">
        <PnL />
      </div>
      <DataTablesUser /> */}
    </div>
  );
}
