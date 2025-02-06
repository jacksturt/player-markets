"use client";

import { useState } from "react";
// import { useFiltersStore } from "@/lib/zustand";
import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { NFL_POSITIONS } from "@/lib/constants";
import { Button } from "../ui/button";
import { Trade } from "../web/web-ui";
import { useQuery } from "@tanstack/react-query";
import { readMarket } from "@/server/api/routers/market/read";

enum CardView {
  FRONT = "front",
  BACK = "back",
}

export default function PlayerCard({ market }: { market: any }) {
  // const { bookmarkedPlayers, setBookmarkedPlayers } = useFiltersStore();

  const [cardView, setCardView] = useState<CardView>(CardView.FRONT);
  const [selectedOrderType, setSelectedOrderType] = useState<
    "buy" | "sell" | undefined
  >(undefined);

  const handleFlip = () => {
    setCardView(cardView === CardView.FRONT ? CardView.BACK : CardView.FRONT);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="w-[251px] h-[311px] relative [perspective:1000px]">
        <div
          className={`w-full h-full absolute transition-all duration-500 [transform-style:preserve-3d] rounded-xl overflow-hidden
            ${cardView === CardView.BACK ? "[transform:rotateY(180deg)]" : ""}`}
        >
          {/* Front of card */}
          <div className="w-full h-full absolute [backface-visibility:hidden]">
            <Link
              href={`/markets/${market.publicKey.toBase58()}`}
              className="block h-full"
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${playerData.imageUrl})`,
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
                    {playerData.name}
                  </h3>
                  <p className="text-[9px] leading-[9px]">
                    {
                      NFL_POSITIONS[
                        playerData.position as keyof typeof NFL_POSITIONS
                      ]
                    }
                  </p>
                </div>
                <div className="flex flex-col gap-3 pb-12">
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                      <p className="text-[9px] leading-[9px]">
                        Projected Total
                      </p>
                      <p className="text-[13px] leading-[13px] font-clashSemiBold">
                        {playerData.projectedTotal} pts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            <div className="absolute bottom-6 left-4 right-4 z-20">
              <div className="flex items-center gap-[7px]">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlayerMarket(playerData.name);
                    setSelectedOrderType("buy");
                    handleFlip();
                  }}
                  className="w-full h-[29px] bg-[#D0FFD9] hover:bg-[#D0FFD9]/80 text-[#181818] flex items-center justify-center gap-2 font-clashGroteskMed uppercase text-[11px] leading-[11px]"
                >
                  <TrendingUp size={12} color="#39DE5A" />
                  Long
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderType("sell");
                    handleFlip();
                  }}
                  className="w-full h-[29px] bg-[#FFCCCC] hover:bg-[#FFCCCC]/80 text-[#181818] flex items-center justify-center gap-2 font-clashGroteskMed uppercase text-[11px] leading-[11px]"
                >
                  <TrendingDown size={12} color="#F57272" />
                  Short
                </Button>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="w-full h-full absolute [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <Trade defaultOrderType={selectedOrderType} />
          </div>
        </div>
      </div>
      {/* <div className="w-full flex items-center justify-between px-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1">
            <Comments size={20} />
            <p className="text-xs">{playerData.numComments}</p>
          </div>
          <div className="flex items-center gap-1">
            <Volume size={20} />
            <p className="text-xs">{playerData.volume}</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (bookmarkedPlayers.includes(playerData.name)) {
              setBookmarkedPlayers(
                bookmarkedPlayers.filter((player) => player !== playerData.name)
              );
            } else {
              setBookmarkedPlayers([...bookmarkedPlayers, playerData.name]);
            }
          }}
        >
          <Bookmark
            size={20}
            strokeWidth={1.5}
            fill={
              bookmarkedPlayers.includes(playerData.name)
                ? "#000"
                : "transparent"
            }
          />
        </button>
      </div> */}
    </div>
  );
}
