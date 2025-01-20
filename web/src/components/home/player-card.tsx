import { useFiltersStore } from "@/lib/zustand";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import Comments from "../icons/comments";
import Volume from "../icons/volume";
import { NFL_POSITIONS } from "@/lib/constants";
import PriceTrend from "../charts/price-trend";

interface PlayerData {
  imageUrl: string;
  name: string;
  position: string;
  projectedTotal: number;
  pctChange: number;
  numComments: number;
  volume: number;
}

export default function PlayerCard({ playerData }: { playerData: PlayerData }) {
  const { bookmarkedPlayers, setBookmarkedPlayers } = useFiltersStore();
  return (
    <div className="w-[350px] mx-auto h-full flex flex-col gap-2">
      <Link href={`/home/${playerData.name}`}>
        <div className="w-full h-[500px] rounded-xl relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${playerData.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* Add gradient overlay */}
          {/* <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" /> */}
          {/* Content overlay */}
          <div className="relative w-full h-full z-10 text-white px-4 py-6 flex flex-col justify-between">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold">{playerData.name}</h3>
              <p className="text-xs">
                {
                  NFL_POSITIONS[
                    playerData.position as keyof typeof NFL_POSITIONS
                  ]
                }
              </p>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <p className="text-xs">Projected Total</p>
                <p className="text-xl font-bold">
                  {playerData.projectedTotal} pts
                </p>
              </div>
              <PriceTrend playerData={playerData} />
            </div>
          </div>
        </div>
      </Link>
      <div className="w-full flex items-center justify-between px-3">
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
      </div>
    </div>
  );
}
