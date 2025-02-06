"use client";

import React from "react";
import PlayerCard from "./player-card";
import { useMarkets } from "../web/market-data-access";

export default function PlayersList() {
  const { markets } = useMarkets();

  return (
    <div className="w-fit mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[23px] mb-20">
      {markets.data?.map((market) => (
        <div key={market.account.timestamp}>
          <PlayerCard market={market} />
        </div>
      ))}
    </div>
  );
}
