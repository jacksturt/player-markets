"use client";

import React from "react";
import PlayerCard from "./player-card";
import { Player } from "@/app/home/page";
import { useFiltersStore } from "@/lib/zustand";

export default function PlayersList({ playerData }: { playerData: Player[] }) {
  const { activeFilters, showBookmarked, bookmarkedPlayers } =
    useFiltersStore();

  const currentPlayerList = playerData.filter((player) =>
    showBookmarked
      ? bookmarkedPlayers.includes(player.name)
      : activeFilters.length === 0 || activeFilters.includes(player.position)
  );
  return (
    <div className="w-fit mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[23px] mb-20">
      {currentPlayerList.length > 0 ? (
        currentPlayerList.map((player) => (
          <div key={player.name}>
            <PlayerCard playerData={player} />
          </div>
        ))
      ) : (
        <div className="text-center text-lg">No players found</div>
      )}
    </div>
  );
}
