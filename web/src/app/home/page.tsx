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

const playerData: Player[] = [
  {
    imageUrl: "/player-temp/mahomes.png",
    name: "Patrick Mahomes",
    position: "QB",
    projectedTotal: 325,
    pctChange: -12.5,
    numComments: 156,
    volume: 2450,
    bookmarked: true,
  },
  {
    imageUrl: "/player-temp/allen.jpg",
    name: "Josh Allen",
    position: "QB",
    projectedTotal: 310,
    pctChange: 8.2,
    numComments: 134,
    volume: 2100,
    bookmarked: false,
  },
  {
    imageUrl: "/player-temp/mccaffrey.png",
    name: "Christian McCaffrey",
    position: "RB",
    projectedTotal: 245,
    pctChange: 15.3,
    numComments: 189,
    volume: 2800,
    bookmarked: true,
  },
  {
    imageUrl: "/player-temp/jefferson.webp",
    name: "Justin Jefferson",
    position: "WR",
    projectedTotal: 205,
    pctChange: -3.2,
    numComments: 98,
    volume: 1650,
    bookmarked: true,
  },
  {
    imageUrl: "/player-temp/hill.png",
    name: "Tyreek Hill",
    position: "WR",
    projectedTotal: 190,
    pctChange: 8.9,
    numComments: 145,
    volume: 1950,
    bookmarked: false,
  },
  {
    imageUrl: "/player-temp/kittle.webp",
    name: "George Kittle",
    position: "TE",
    projectedTotal: 160,
    pctChange: 3.4,
    numComments: 76,
    volume: 1200,
    bookmarked: true,
  },
  {
    imageUrl: "/player-temp/herbert.jpg",
    name: "Justin Herbert",
    position: "QB",
    projectedTotal: 280,
    pctChange: 5.6,
    numComments: 112,
    volume: 1850,
    bookmarked: false,
  },
  {
    imageUrl: "/player-temp/chubb.jpg",
    name: "Nick Chubb",
    position: "RB",
    projectedTotal: 195,
    pctChange: -1.8,
    numComments: 89,
    volume: 1450,
    bookmarked: true,
  },
  {
    imageUrl: "/player-temp/diggs.webp",
    name: "Stefon Diggs",
    position: "WR",
    projectedTotal: 175,
    pctChange: 6.3,
    numComments: 123,
    volume: 1750,
    bookmarked: false,
  },
];

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
