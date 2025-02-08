import React from "react";
import { usePlayerMarket, usePlayerToken } from "../web/market-data-access";
import { BN } from "bn.js";
import { TradeHistoryItem } from "../web/web-ui";

const MarketTrades: React.FC = () => {
  const { trades } = usePlayerMarket();

  return (
    <div className="w-full flex flex-col">
      <p className="text-2xl text-white font-clashMed">Trade History</p>

      {/* TODO: trade history.map */}
      <div className="w-full flex flex-col gap-2 pt-7">
        {trades.data?.map((trade) => (
          <TradeHistoryItem trade={trade} />
        ))}
      </div>
    </div>
  );
};

export default MarketTrades;
