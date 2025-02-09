"use client";

import PlayersList from "@/components/home/players-list";
import Navbar from "@/components/shared/navbar";
import { usePlayerMarketCardStore, CardView } from "@/lib/zustand";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/home/players`);
    return null;
  }
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
      <div className="flex-1 overflow-y-scroll max-h-[85vh]">
        <PlayersList />
      </div>
    </div>
  );
}
