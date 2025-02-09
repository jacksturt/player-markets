import React from "react";
import { Button } from "@/components/ui/button";
import { NFL_POSITIONS } from "@/lib/constants";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCurrentMarket, usePlayerMarket } from "../web/market-data-access";
import { CardView, usePlayerMarketCardStore } from "@/lib/zustand";
import { api } from "@/trpc/react";

export default function PlayerCardFront({
  marketAddress,
}: {
  marketAddress: string;
}) {
  const market = api.market.read.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
    }
  );
  const { setMarketAddress } = useCurrentMarket();
  const { setSelectedOrderType, setCardView, setActivePlayerMarket } =
    usePlayerMarketCardStore();

  const baseMint = market.data?.baseMint;
  const playerData = market.data?.player;
  const teamData = market.data?.team;

  // console.log("player data", playerData);
  return (
    <div className="w-full h-full absolute [backface-visibility:hidden] ">
      <Link href={`/home/players/${marketAddress}`} className="block h-full">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${baseMint?.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Add gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
        {/* Content overlay */}
        <div className="relative w-full h-full z-10 text-white px-4 py-6 flex flex-col justify-between">
          <div className="flex flex-col">
            <h3 className="text-[13px] leading-[13px] font-clashSemiBold">
              {playerData?.name}
            </h3>
            <p className="text-[9px] leading-[9px]">
              {
                NFL_POSITIONS[
                  playerData?.position as keyof typeof NFL_POSITIONS
                ]
              }
            </p>
          </div>
          <div className="flex flex-col gap-3 pb-12">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <p className="text-[9px] leading-[9px]">Projected Total</p>
                <p className="text-[13px] leading-[13px] font-clashSemiBold">
                  {playerData?.projections?.projectedFantasyPointsPpr ??
                    teamData?.stats?.projectedPoints.toString() ??
                    0}
                  pts
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="flex items-center gap-[7px]">
          <Button className="w-full h-[29px] bg-[#D0FFD9] hover:bg-[#D0FFD9]/80 text-[#181818] flex items-center justify-center gap-2 font-clashGroteskMed uppercase text-[11px] leading-[11px]">
            <TrendingUp size={12} color="#39DE5A" />
            Long
          </Button>
          <Button className="w-full h-[29px] bg-[#FFCCCC] hover:bg-[#FFCCCC]/80 text-[#181818] flex items-center justify-center gap-2 font-clashGroteskMed uppercase text-[11px] leading-[11px]">
            <TrendingDown size={12} color="#F57272" />
            Short
          </Button>
        </div>
      </div>
    </div>
  );
}
