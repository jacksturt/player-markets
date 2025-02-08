"use client";

import React from "react";
import PlayerCard from "./player-card";
import { useMarkets } from "../web/market-data-access";
import { MarketRouterObject } from "../web/web-ui";

export default function PlayersList() {
  const { allMarkets } = useMarkets();

  return (
    <div className="w-fit mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[23px] mb-20">
      {allMarkets.data?.map((market) => (
        <div key={market.address}>
          <PlayerCard market={market} />
        </div>
      ))}
    </div>
  );
}
