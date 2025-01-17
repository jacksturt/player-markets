import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PlayerData {
  imageUrl: string;
  name: string;
  position: string;
  projectedTotal: number;
  pctChange: number;
}

export default function PlayerCard({ playerData }: { playerData: PlayerData }) {
  return (
    <div className="w-full max-w-sm mx-auto h-[500px] rounded-xl relative overflow-hidden">
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
          <p className="text-xs">{playerData.position}</p>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <p className="text-xs">Projected Total</p>
            <p className="text-xl font-bold">{playerData.projectedTotal} pts</p>
          </div>
          <div
            className={`flex items-center gap-1 py-1 px-2 rounded-xl ${
              playerData.pctChange > 0 ? "bg-accent" : "bg-destructive"
            }`}
          >
            {playerData.pctChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-accent-foreground" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive-foreground" />
            )}
            <p
              className={`text-sm ${
                playerData.pctChange > 0
                  ? "text-accent-foreground"
                  : "text-destructive-foreground"
              }`}
            >
              {playerData.pctChange.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
