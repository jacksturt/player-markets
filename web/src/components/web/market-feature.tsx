"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useMarkets,
  usePlayerMarket,
  useQuoteToken,
} from "./market-data-access";
import {
  InitPlayerMint,
  MintPlayerTokens,
  Payout,
  DepositBase,
  DepositQuote,
  Trade,
  WithdrawAll,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";
import { minimizePubkey } from "@/utils/web3";
import { useEffect, useState } from "react";
import SendbirdChat from "@sendbird/chat";
import {
  OpenChannelModule,
  SendbirdOpenChat,
} from "@sendbird/chat/openChannel";
import { UserMessage } from "@sendbird/chat/message";
import { FillLogResult } from "manifest/src";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { capsule } from "@/lib/capsule";
import ChartComponent from "@/components/player-data/chart";

const sb = SendbirdChat.init({
  appId: "434D4E2C-4EEF-41DB-AE99-30D00B5AFF1D",
  modules: [new OpenChannelModule()],
}) as SendbirdOpenChat;

export default function MarketFeature({
  marketAddress,
}: {
  marketAddress: string;
}) {
  const [username, setUsername] = useState<string>("");
  const [messages, setMessages] = useState<
    {
      message: string;
      sender: string;
    }[]
  >([]);
  const { bids, asks, balances, playerTokenBalance, trades } =
    usePlayerMarket();
  const { quoteTokenBalance } = useQuoteToken();

  useEffect(() => {
    async function checkCapsuleSession() {
      const isActive = await capsule.isSessionActive();
    }
    checkCapsuleSession();
  }, []);

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
      const fill: FillLogResult = JSON.parse(message.data);
      console.log("fill", fill);
      if (fill.market !== marketAddress) {
        console.log("market not match");
        return;
      }
      console.log("market match", fill);
    };
  }, [marketAddress]);

  const connectToChat = async () => {
    const user = await sb.connect(username);
    const open_channel_params = {
      channelUrl: "market",
      name: "Market",
    };
    // const channel = await sb.openChannel.createChannel(open_channel_params);
    sb.openChannel.getChannel("market").then(async (channel) => {
      channel.enter();
      const chat_params = {
        // UserMessageCreateParams can be imported from @sendbird/chat/message.
        message: "Hello2",
      };
      const params = {
        prevResultSize: 100,
        nextResultSize: 100,
      };
      const ts = Date.now() - 1000 * 60 * 60 * 24;
      const messages = await channel.getMessagesByTimestamp(ts, params);
      setMessages(
        messages.map((message) => {
          const sender = message.isUserMessage() ? message.sender : null;
          const senderName = sender
            ? sender.nickname !== ""
              ? sender.nickname
              : sender.userId
            : null;
          return {
            message: message.message,
            sender: senderName ?? "Market",
          };
        })
      );

      channel
        .sendUserMessage(chat_params)
        .onPending((message) => {
          // The pending message for the message being sent has been created.
          // The pending message has the same reqId value as the corresponding failed/succeeded message.
        })
        .onFailed((err, message) => {
          console.log(err);
        })
        .onSucceeded((message) => {
          // The message is successfully sent to the channel.
          // The current user can receive messages from other users through the onMessageReceived() method of an event handler.
        });
    });
  };

  const isAdmin = true;
  return (
    <div className="w-screen px-[10%] flex items-center justify-center">
      <div className="w-full grid grid-cols-2 gap-4 mt-20">
        <div>
          <h1>Your Balances</h1>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-4 items-center">
              <div>Quote Token</div>
              <div>{quoteTokenBalance.data?.toString()}</div>
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div>Quote Token Withdrawable</div>
              <div>
                {balances.data?.quoteWithdrawableBalanceTokens.toString()}
              </div>
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div>Quote Token On Open Orders</div>
              <div>
                {balances.data?.quoteOpenOrdersBalanceTokens.toString()}
              </div>
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div>Player Token</div>
              <div>{playerTokenBalance.data?.toString()}</div>
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div>Player Token Withdrawable</div>
              <div>
                {balances.data?.baseWithdrawableBalanceTokens.toString()}
              </div>
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div>Player Token On Open Orders</div>
              <div>{balances.data?.baseOpenOrdersBalanceTokens.toString()}</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Trades</h1>
          <h2 className="text-lg font-bold">Bids</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <>
              <h3 key="trader">Trader</h3>
              <h3 key="price">Price</h3>
              <h3 key="quantity">Quantity</h3>
            </>
            {bids.data?.map((bid) => (
              <>
                <div key={"trader-" + bid.trader.toBase58()}>
                  {minimizePubkey(bid.trader.toBase58())}
                </div>
                <div key={"price-" + bid.trader.toBase58()}>
                  {bid.tokenPrice.toFixed(6)}
                </div>
                <div key={"quantity-" + bid.trader.toBase58()}>
                  {bid.numBaseTokens.toString()}
                </div>
              </>
            ))}
          </div>
          <h2 className="text-lg font-bold">Asks</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <>
              <h3>Trader</h3>
              <h3>Price</h3>
              <h3>Quantity</h3>
            </>
            {asks.data?.map((ask) => (
              <>
                <div key={"trader-" + ask.trader.toBase58()}>
                  {minimizePubkey(ask.trader.toBase58())}
                </div>
                <div key={"price-" + ask.trader.toBase58()}>
                  {ask.tokenPrice.toFixed(6)}
                </div>
                <div key={"quantity-" + ask.trader.toBase58()}>
                  {ask.numBaseTokens.toString()}
                </div>
              </>
            ))}
          </div>
          <h1 className="text-2xl font-bold">Trades</h1>
          <div>
            <input
              type="text"
              className="border border-gray-300 rounded-md p-2 bg-gray-100"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={connectToChat}>Connect</button>
          </div>
          <div>
            {messages.map((message, index) => (
              <div key={"message-" + index} className="flex flex-row">
                <div>{message.sender}</div>
                <div>{message.message}</div>
              </div>
            ))}
          </div>
          {trades && trades.data && (
            <ChartComponent
              data={trades.data?.map((trade) => ({
                date: parseInt(trade.baseMint.timestamp),
                price: Number(trade.price),
              }))}
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <MintPlayerTokens />
          <DepositBase />
          <DepositQuote />
          <Trade />
          <WithdrawAll />
          <Payout />
        </div>
      </div>
    </div>
  );
}
