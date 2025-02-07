"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCapsuleWallet } from "./market-data-access";
import Image from "next/image";
import SendbirdChat from "@sendbird/chat";
import { OpenChannelModule } from "@sendbird/chat/openChannel";
import { SendbirdOpenChat } from "node_modules/@sendbird/chat/lib/__definition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

const sb = SendbirdChat.init({
  appId: "434D4E2C-4EEF-41DB-AE99-30D00B5AFF1D",
  modules: [new OpenChannelModule()],
}) as SendbirdOpenChat;

export default function ChatUI() {
  const { publicKey } = useWallet();
  const { capsulePubkey } = useCapsuleWallet();
  const [messages, setMessages] = useState<
    {
      message: string;
      sender: string;
      image: string;
    }[]
  >([]);
  const [username, setUsername] = useState<string>("temp");
  const myKey = publicKey ?? capsulePubkey.data!;

  const connectToChat = async () => {
    const uniqueID = myKey.toBase58();
    await sb.connect(uniqueID);
    await sb.updateCurrentUserInfo({
      nickname:
        myKey.toBase58().slice(0, 5) + "..." + myKey.toBase58().slice(-5),
      profileUrl: "/player-temp/allen.jpg",
    });
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
            image: sender?.profileUrl ?? "",
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

  useEffect(() => {
    if (myKey) {
      connectToChat();
    }
  }, [myKey]);

  return (
    <div className="fixed bottom-[20px] right-[20px]">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button className="w-[51px] h-[51px] p-0 rounded-full bg-white flex items-center justify-center">
            <Image src="/icon.png" alt="chat" width={30.1} height={34.36} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          className="w-[350px] h-[600px] mr-[22px] mb-4 rounded-[22px] z-50 px-3 py-5"
        >
          {/* <div>
            <input
              type="text"
              className="border border-gray-300 rounded-md p-2 bg-gray-100"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={connectToChat}>Connect</button>
          </div> */}
          {/* <div> */}
          <div className="h-full overflow-y-auto flex flex-col gap-3">
            {messages.map((message, index) => (
              <div key={"message-" + index} className="flex items-end gap-3">
                <Image
                  src={message.image}
                  alt="profile"
                  className="w-[28px] h-[28px] rounded-full"
                  width={28}
                  height={28}
                />
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-bold">{message.sender}</div>
                  <div className="text-sm px-3 py-2 rounded-[16px] bg-[#EEEEEE]">
                    {message.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* </div> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
