"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  useMarkets,
  usePlayerMarket,
  useQuoteToken,
} from "./market-data-access";
import { Payout, Trade, WithdrawAll, QuoteTokenFaucet } from "./web-ui";
import { FillLogResult } from "manifest/src";
import toast from "react-hot-toast";
import { capsule } from "@/lib/capsule";
import ChartComponent from "@/components/player-data/chart";
import { PlaceOrderLogResult } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/trpc/react";
import DataTablesPlayer from "../player-data/data-tables-player";

const PlayerCard = () => (
  <div className="w-full flex items-end justify-between px-[50px]">
    <div className="flex items-center gap-4">
      <Image
        src="/player-temp/diggs.webp"
        alt="player"
        className="rounded-full w-[100px] h-[100px] overflow-hidden object-cover"
        width={100}
        height={100}
      />
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-clashSemiBold">Stefon Diggs</p>
        <p className="text-[60px] leading-[58px] font-clashMed bg-chiefs-gradient-text text-transparent bg-clip-text">
          $1.04
        </p>
      </div>
    </div>
    <div className="flex flex-col">
      <p className="text-sm font-clashGroteskMed">Projected Total</p>
      <p className="text-[21px] leading-[21px] font-clashSemiBold">20.4pts</p>
    </div>
  </div>
);

export default function MarketFeatureNew({
  marketAddress,
}: {
  marketAddress: string;
}) {
  const [tradeData, setTradeData] = useState<{ date: number; price: number }[]>(
    []
  );
  const { trades } = usePlayerMarket();
  const { quoteTokenBalance } = useQuoteToken();
  const queryClient = useQueryClient();
  const utils = api.useUtils();
  useEffect(() => {
    async function checkCapsuleSession() {
      const isActive = await capsule.isSessionActive();
    }
    checkCapsuleSession();
  }, []);

  useEffect(() => {
    if (trades.data) {
      if (trades.data.length > tradeData.length) {
        setTradeData(
          trades.data.map((trade) => ({
            date: trade.createdAt.getTime(),
            price: Number(trade.price),
          }))
        );
      }
    }
  }, [trades.data]);

  useEffect(() => {
    const feedUrl = "wss://fillfeed-production.up.railway.app";
    if (!feedUrl) {
      toast.error("NEXT_PUBLIC_FEED_URL not set");
      throw new Error("NEXT_PUBLIC_FEED_URL not set");
    }
    const ws = new WebSocket(feedUrl);

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onclose = (event) => {
      console.log("Disconnected from server", event);
    };

    ws.onmessage = async (message): Promise<void> => {
      console.log("message", message);
      const event:
        | {
            type: "fill";
            data: FillLogResult;
          }
        | {
            type: "placeOrder";
            data: PlaceOrderLogResult;
          } = JSON.parse(message.data);
      if (event.type === "fill") {
        console.log("fill", event.data, Date.now());
        setTradeData((prevData) => [
          ...prevData,
          {
            date: Date.now(),
            price: Number(event.data.priceAtoms),
          },
        ]);
        queryClient.invalidateQueries({
          queryKey: ["market", "bids", { marketAddress }],
        });
        queryClient.invalidateQueries({
          queryKey: ["market", "asks", { marketAddress }],
        });
        utils.trade.readForMarket.invalidate({
          marketAddress: marketAddress,
        });
      } else if (event.type === "placeOrder") {
        queryClient.invalidateQueries({
          queryKey: ["market", "bids", { marketAddress }],
        });
        queryClient.invalidateQueries({
          queryKey: ["market", "asks", { marketAddress }],
        });
        utils.trade.readForMarket.invalidate({
          marketAddress: marketAddress,
        });
        console.log("placeOrder", event.data);
      }
    };

    // return () => {
    //   ws.close();
    // };
  }, [marketAddress, queryClient, utils]);

  const isAdmin = true;
  return (
    <div className="w-full flex flex-col gap-[79px] px-14 text-white mb-20">
      <div className="w-full flex items-start gap-10">
        <div className="w-full flex flex-col gap-10">
          <PlayerCard />
          <ChartComponent data={[]} />
          <DataTablesPlayer />
        </div>
        <div className="w-[450px]">
          <Trade />
        </div>
      </div>
    </div>
    // <div className="w-screen px-[10%] flex items-center justify-center">
    //   <div className="w-full grid grid-cols-3 gap-4 mt-20">
    //     <div>
    //       <h1>Your Balances</h1>
    //       <div className="flex flex-col gap-2">
    //         <div className="flex flex-row gap-4 items-center">
    //           <div>Quote Token</div>
    //           <div>{quoteTokenBalance.data?.toString()}</div>
    //         </div>
    //         <div className="flex flex-row gap-4 items-center">
    //           <div>Quote Token Withdrawable</div>
    //           <div>
    //             {balances.data?.quoteWithdrawableBalanceTokens.toString()}
    //           </div>
    //         </div>
    //         <div className="flex flex-row gap-4 items-center">
    //           <div>Quote Token On Open Orders</div>
    //           <div>
    //             {balances.data?.quoteOpenOrdersBalanceTokens.toString()}
    //           </div>
    //         </div>
    //         <div className="flex flex-row gap-4 items-center">
    //           <div>Player Token</div>
    //           <div>{playerTokenBalance.data?.toString()}</div>
    //         </div>
    //         <div className="flex flex-row gap-4 items-center">
    //           <div>Player Token Withdrawable</div>
    //           <div>
    //             {balances.data?.baseWithdrawableBalanceTokens.toString()}
    //           </div>
    //         </div>
    //         <div className="flex flex-row gap-4 items-center">
    //           <div>Player Token On Open Orders</div>
    //           <div>{balances.data?.baseOpenOrdersBalanceTokens.toString()}</div>
    //         </div>
    //       </div>
    //       <div>
    //         <h1>Current Price:</h1>

    //         {lastTradePrice.data && <h1>{lastTradePrice.data.toString()}</h1>}
    //       </div>
    //       <div>
    //         <h1>Current Projection:</h1>

    //         {playerStatsAccount.data && (
    //           <h1>{playerStatsAccount.data.projectedPoints.toString()}</h1>
    //         )}
    //       </div>
    //       <div>
    //         <h1>Current Actual:</h1>

    //         {playerStatsAccount.data && (
    //           <h1>{playerStatsAccount.data.actualPoints.toString()}</h1>
    //         )}
    //       </div>
    //       <h1 className="text-2xl font-bold">Trades</h1>
    //       <h2 className="text-lg font-bold">Bids</h2>
    //       <div className="grid grid-cols-3 gap-4 mb-4">
    //         <>
    //           <h3 key="trader">Trader</h3>
    //           <h3 key="price">Price</h3>
    //           <h3 key="quantity">Quantity</h3>
    //         </>
    //         {bids.data?.map((bid) => (
    //           <>
    //             <div key={"trader-" + bid.trader.toBase58()}>
    //               {minimizePubkey(bid.trader.toBase58())}
    //             </div>
    //             <div key={"price-" + bid.trader.toBase58()}>
    //               {bid.tokenPrice.toFixed(6)}
    //             </div>
    //             <div key={"quantity-" + bid.trader.toBase58()}>
    //               {bid.numBaseTokens.toString()}
    //             </div>
    //           </>
    //         ))}
    //       </div>
    //       <h2 className="text-lg font-bold">Asks</h2>
    //       <div className="grid grid-cols-3 gap-4 mb-4">
    //         <>
    //           <h3>Trader</h3>
    //           <h3>Price</h3>
    //           <h3>Quantity</h3>
    //         </>
    //         {asks.data?.map((ask) => (
    //           <>
    //             <div key={"trader-" + ask.trader.toBase58()}>
    //               {minimizePubkey(ask.trader.toBase58())}
    //             </div>
    //             <div key={"price-" + ask.trader.toBase58()}>
    //               {ask.tokenPrice.toFixed(6)}
    //             </div>
    //             <div key={"quantity-" + ask.trader.toBase58()}>
    //               {ask.numBaseTokens.toString()}
    //             </div>
    //           </>
    //         ))}
    //       </div>
    //     </div>
    //     <div>
    //       {trades && <ChartComponent data={tradeData} />}
    //       <h1 className="text-2xl font-bold">Chat</h1>
    //       <div>
    //         <input
    //           type="text"
    //           className="border border-gray-300 rounded-md p-2 bg-gray-100"
    //           placeholder="Username"
    //           value={username}
    //           onChange={(e) => setUsername(e.target.value)}
    //         />
    //         <button onClick={connectToChat}>Connect</button>
    //       </div>
    //       <div>
    //         {messages.map((message, index) => (
    //           <div key={"message-" + index} className="flex flex-row">
    //             <div>{message.sender}</div>
    //             <div>{message.message}</div>
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //     <div className="flex flex-col gap-4">
    //       <QuoteTokenFaucet />
    //       <MintPlayerTokens />
    //       <DepositBase />
    //       <DepositQuote />
    //       <Trade />
    //       <WithdrawAll />
    //       <Payout />
    //     </div>
    //   </div>
    // </div>
  );
}
