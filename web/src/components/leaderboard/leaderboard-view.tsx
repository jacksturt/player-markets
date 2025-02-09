"use client";

import React, { useState } from "react";
import Image from "next/image";
import LeaderboardTableItem from "./leaderboard-table-item";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ListFilter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LargestPool, useLeaderboards } from "../web/market-data-access";
import { TradeHistoryItem } from "../web/web-ui";

const filterOptions = [
  {
    label: "Popular Markets",
    value: "popular_markets",
  },
  {
    label: "Current Payout",
    value: "current_payout",
  },
  {
    label: "Fantasy Points",
    value: "fantasy_points",
  },
];

export default function LeaderboardView() {
  const { biggestTrades, largestPools } = useLeaderboards();
  const [filter, setFilter] = useState("current_payout");
  return (
    <div className="w-full h-full flex flex-col items-center lg:flex-row lg:items-start gap-[70px] px-[120px] pt-8">
      {/* super MVP table UI, can upgrade to tanstack table later for more features */}
      {/* <div className="w-full flex flex-col gap-[15px]">
        <div className="flex items-center justify-between">
          <p className="text-2xl text-white font-clashMed">Leaderboard</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 bg-black/50 rounded-full h-[31px] px-3 py-2.5 border border-[#373737]/50 hover:bg-[#232323] hover:border-[#474747]"
              >
                <ListFilter size={16} className="text-[#CACACA]" />
                <p className="text-[#CACACA] font-clash text-[11px] leading-[11px]">
                  {
                    filterOptions.find((option) => option.value === filter)
                      ?.label
                  }
                </p>
                <ChevronDown size={16} className="text-[#CACACA]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border border-[#373737]/50 text-white font-clash text-[11px] leading-[11px]">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    setFilter(option.value);
                  }}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-full flex flex-col">
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
        </div>
      </div> */}
      <div className="w-full lg:w-auto flex flex-row gap-[25px]">
        <div className="flex flex-col gap-[25px] lg:w-[800px]">
          <p className="text-2xl text-white font-clashMed">Popular Markets</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[900px] overflow-y-scroll">
            {largestPools.data?.map((market) => (
              <PopularMarketCard
                key={market.config.publicKey.toBase58()}
                market={market}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[25px]">
          <p className="text-2xl text-white font-clashMed">Best Bets</p>
          <div className="w-full lg:w-[388px] flex flex-col items-center gap-3 max-h-[900px] overflow-y-scroll">
            {/* TODO: best bets.map */}
            {biggestTrades.data?.map((trade) => (
              <TradeHistoryItem key={trade.id} trade={trade} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PopularMarketCard({ market }: { market: LargestPool }) {
  if (!market.db) return <div>bad {market.config.account.playerId}</div>;
  const sellPercent =
    (market.shortPayout / (market.shortPayout + market.longPayout)) * 100;
  const buyPercent =
    (market.longPayout / (market.shortPayout + market.longPayout)) * 100;

  return (
    <div className="w-full bg-black/50 rounded-[20px] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 w-[250px] mr-4">
        <div className="flex flex-col w-full gap-2">
          <div className="flex flex-row items-center gap-2">
            <Image
              src={market.db?.baseMint.image ?? ""}
              alt="Player"
              className="w-[35px] h-[35px] rounded-full object-cover"
              width={35}
              height={35}
            />
            <div className="flex flex-col ">
              <span className="text-white text-xs">
                {market.db?.baseMint.symbol}
              </span>
              <span className="text-white text-md">
                ${market.db.lastTradePrice.toString()}
              </span>
            </div>
          </div>
          <VolumeBar
            buyPercent={buyPercent}
            sellPercent={sellPercent}
            longPayout={market.longPayout}
            shortPayout={market.shortPayout}
          />
        </div>
      </div>
      <div className="flex flex-col text-white">
        <div className="flex flex-col mb-2">
          <p className="text-[9px] leading-[9px] ">Total Payout</p>
          <p className="font-clashSemiBold text-sm leading-[20px] bg-chiefs-gradient-text text-transparent bg-clip-text">
            ${market.longPayout + market.shortPayout}
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-[9px] leading-[9px] ">Projected Total</p>
          <p className="font-clashSemiBold text-xs leading-[20px]">
            {market.playerStats?.account.projectedPoints.toFixed(2)} pts
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-[9px] leading-[9px]">Current Total</p>
          <p className="font-clashSemiBold text-xs leading-[20px]">
            {market.playerStats?.account.actualPoints.toFixed(2)} pts
          </p>
        </div>
      </div>
    </div>
  );
}
interface VolumeBarProps {
  buyPercent: number;
  sellPercent: number;
  longPayout: number;
  shortPayout: number;
}

const VolumeBar = ({
  buyPercent,
  sellPercent,
  longPayout,
  shortPayout,
}: VolumeBarProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Progress bar */}
      <div className="h-3 w-full bg-[#EC4545] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#44E865] rounded-full"
          style={{ width: `${buyPercent}%` }}
        />
      </div>

      {/* Volume badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 text-[12px] leading-[8px] border border-[#2f2f2f] rounded-full px-[11px] py-[2.5px]">
          <p className="text-[#44E865] font-sfProSemibold">
            ${longPayout.toFixed(4)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 text-[12px] leading-[8px] border border-[#2f2f2f] rounded-full px-[11px] py-[2.5px]">
          <p className="text-[#EC4545] font-sfProSemibold">
            ${shortPayout.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
};
