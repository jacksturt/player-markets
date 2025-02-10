import React from "react";
import { usePlayerMarket, usePlayerToken } from "../web/market-data-access";
import { BN } from "bn.js";
import { TradeHistoryItem } from "../web/web-ui";

const MarketTrades: React.FC = () => {
  const { trades } = usePlayerMarket();

  return (
    <div className="w-full flex flex-col gap-5">
      <p className="text-2xl text-white font-clashMed">Trade History</p>
      <div className="w-full flex flex-col gap-4">
        {trades.data?.map((trade) => (
          <TradeHistoryItem trade={trade} key={trade.id} />
        ))}
      </div>
    </div>
  );
};

export default MarketTrades;
