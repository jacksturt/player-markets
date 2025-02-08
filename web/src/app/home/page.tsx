"use client";

import PlayersList from "@/components/home/players-list";
import Navbar from "@/components/shared/navbar";
import { usePlayerMarketCardStore, CardView } from "@/lib/zustand";

export type Player = {
  imageUrl: string;
  name: string;
  position: string;
  projectedTotal: number;
  pctChange: number;
  numComments: number;
  volume: number;
  bookmarked: boolean;
};

export default function Home() {
  const { setCardView, setActivePlayerMarket } = usePlayerMarketCardStore();

  const handleClickOutside = () => {
    setCardView(CardView.FRONT);
    setActivePlayerMarket("");
  };

  return (
    <div
      className="relative h-full flex flex-col gap-5 justify-center pt-5"
      onClick={handleClickOutside}
    >
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <PlayersList />
      </div>
    </div>
  );
}
