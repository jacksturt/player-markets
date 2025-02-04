"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ChartComponent from "@/components/player-data/chart";
import BackArrow from "@/components/icons/back-arrow";
import PriceTrend from "@/components/player-data/price-trend";
import DataTablesPlayer from "@/components/player-data/data-tables-player";
import Navbar from "@/components/shared/navbar";
import Image from "next/image";

const PlayerCard = () => (
  <div className="w-full max-w-[627px] flex items-end justify-between">
    <div className="flex items-center gap-4">
      <Image
        src="/player-temp/diggs.webp"
        alt="player"
        className="rounded-full w-[100px] h-[100px] overflow-hidden object-cover"
        width={100}
        height={100}
      />
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-clashSemiBold">Stefon Diggs</p>
        <p className="text-[60px] leading-[58px] font-clashMed bg-gradient-to-r from-[#F92D37] via-[#F9D10A] to-[#F9D10A] text-transparent bg-clip-text">
          $1.04
        </p>
      </div>
    </div>
    <div className="flex flex-col">
      <p className="text-sm font-clashGroteskMed">Projected Total</p>
      <p className="text-[21px] leading-[21px] font-clashSemiBold">20.4pts</p>
    </div>
  </div>
);

export default function PlayerDetailsPage() {
  const { player } = useParams();
  // TODO: use tanstack query to fetch player data

  return (
    <div className="w-full h-full flex flex-col gap-5 bg-gradient-to-b from-[#1E1E1E] via-[#050505] to-black pt-5">
      <Navbar />
      <div className="w-full flex flex-col gap-[79px] px-14 text-white">
        <div className="w-full flex items-start gap-5">
          <div className="w-full flex flex-col gap-10">
            <PlayerCard />
            <ChartComponent data={[]} />
            <DataTablesPlayer />
          </div>
          {/* TODO: buy/sell card */}
          <p className="w-[400px]">BUY/SELL</p>
        </div>
      </div>
    </div>
  );
}
