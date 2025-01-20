"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ChartComponent from "@/components/player-data/chart";
import BackArrow from "@/components/icons/back-arrow";
import PriceTrend from "@/components/player-data/price-trend";
import DataTables from "@/components/player-data/data-tables";

export default function PlayerDetailsPage() {
  const { player } = useParams();
  // TODO: use tanstack query to fetch player data

  return (
    <div className="w-full h-screen flex flex-col gap-5">
      <Link href="/home" className="mt-5 px-5">
        <BackArrow size={20} />
      </Link>
      <div className="px-5">
        <p>Patrick Mahomes</p>
        <div className="flex items-end justify-between">
          <p className="text-[50px] leading-[50px] font-bold">$1.08</p>
          <PriceTrend playerData={{ pctChange: 10 }} />
        </div>
      </div>
      <ChartComponent />
      {/* info categories / tabs */}
      <DataTables />
      <div className="mt-auto flex items-center justify-between gap-5 px-5 pb-5">
        <button className="bg-[#74FA8F] text-black border-2 border-black w-full py-4 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p>Long</p>
        </button>
        <button className="bg-destructive text-black border-2 border-black w-full py-4 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p>Short</p>
        </button>
      </div>
    </div>
  );
}
