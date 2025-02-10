import React from "react";
import { usePlayerMarket, usePlayerToken } from "../web/market-data-access";
import { BN } from "bn.js";
import { OrderHistoryItem, TradeHistoryItem } from "../web/web-ui";

const MarketOrders: React.FC = () => {
  const { bids, asks } = usePlayerMarket();

  return (
    <div className="w-full flex flex-col gap-5">
      <p className="text-2xl text-white font-clashMed">Long Orders</p>
      <div className="w-full flex flex-col gap-2">
        {bids.data?.map((bid) => (
          <OrderHistoryItem order={bid} key={bid.id} />
        ))}
      </div>
      <p className="text-2xl text-white font-clashMed">Short Orders</p>

      <div className="w-full flex flex-col gap-2">
        {asks.data?.map((ask) => (
          <OrderHistoryItem order={ask} key={ask.id} />
        ))}
      </div>
    </div>
  );
};

export default MarketOrders;
