"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useMarkets, usePlayerMarket } from "./market-data-access";
import {
  InitPlayerMarket,
  MintPlayerTokens,
  InitPayout,
  Payout,
  CreateMarket,
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

const sb = SendbirdChat.init({
  appId: "434D4E2C-4EEF-41DB-AE99-30D00B5AFF1D",
  modules: [new OpenChannelModule()],
}) as SendbirdOpenChat;

export default function MarketFeature({
  params,
}: {
  params: { marketAddress: string };
}) {
  const { publicKey } = useWallet();
  const [username, setUsername] = useState<string>("");
  const [messages, setMessages] = useState<
    {
      message: string;
      sender: string;
    }[]
  >([]);
  const { bids, asks } = usePlayerMarket();

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
          console.log(sender);
          const senderName = sender
            ? sender.nickname !== ""
              ? sender.nickname
              : sender.userId
            : null;
          console.log(senderName);
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

  return publicKey ? (
    <div className="w-screen px-[10%] flex items-center justify-center">
      <div className="w-full grid grid-cols-2 gap-4 mt-20">
        <div>
          <h1 className="text-2xl font-bold">Trades</h1>
          <h2 className="text-lg font-bold">Bids</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <>
              <h3>Trader</h3>
              <h3>Price</h3>
              <h3>Quantity</h3>
            </>
            {bids.data?.map((bid) => (
              <>
                <div>{minimizePubkey(bid.trader.toBase58())}</div>
                <div>{bid.tokenPrice.toFixed(6)}</div>
                <div>{bid.numBaseTokens.toString()}</div>
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
                <div>{minimizePubkey(ask.trader.toBase58())}</div>
                <div>{ask.tokenPrice.toFixed(6)}</div>
                <div>{ask.numBaseTokens.toString()}</div>
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
              <div key={index} className="flex flex-row">
                <div>{message.sender}</div>
                <div>{message.message}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <DepositBase />
          <DepositQuote />
          <Trade />
          <WithdrawAll />
          {isAdmin && <InitPayout />}
          <Payout />
        </div>
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
