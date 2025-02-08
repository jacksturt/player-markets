import React from "react";
import { usePlayerMarket, usePlayerToken } from "../web/market-data-access";
import { BN } from "bn.js";
import { OrderHistoryItem, TradeHistoryItem } from "../web/web-ui";

const MarketOrders: React.FC = () => {
  const { bids, asks } = usePlayerMarket();

  return (
    <div className="w-full flex flex-col">
      <p className="text-2xl text-white font-clashMed">Long Orders</p>

      {/* TODO: trade history.map */}
      <div className="w-full flex flex-col gap-2 pt-7">
        {bids.data?.map((bid) => (
          <OrderHistoryItem order={bid} />
        ))}
      </div>
      <p className="text-2xl text-white font-clashMed">Short Orders</p>

      {/* TODO: trade history.map */}
      <div className="w-full flex flex-col gap-2 pt-7">
        {asks.data?.map((ask) => (
          <OrderHistoryItem order={ask} />
        ))}
      </div>
    </div>
  );
};

export default MarketOrders;
