"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useParaWallet } from "./market-data-access";
import Image from "next/image";
import SendbirdChat from "@sendbird/chat";
import {
  OpenChannelModule,
  SendbirdOpenChat,
} from "@sendbird/chat/openChannel";
import { BaseMessage } from "@sendbird/chat/message";
import { OpenChannelHandler } from "@sendbird/chat/openChannel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import MaximizeIcon from "../icons/maximize";
import { timestampToTime } from "@/utils/sendbird";
import { api } from "@/trpc/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const sb = SendbirdChat.init({
  appId: "434D4E2C-4EEF-41DB-AE99-30D00B5AFF1D",
  modules: [new OpenChannelModule()],
}) as SendbirdOpenChat;

interface FormattedMessage {
  message: string;
  sender: string;
  image: string;
  timestamp: string;
}

export default function ChatUI() {
  const { publicKey } = useWallet();
  const { paraPubkey } = useParaWallet();
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const myKey = publicKey ?? paraPubkey.data!;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user } = api.user.readUser.useQuery(
    {
      walletAddress: myKey?.toBase58(),
    },
    {
      enabled: !!myKey,
    }
  );

  const scrollToBottom = (item: HTMLDivElement | null, smooth: boolean) => {
    if (item?.parentElement) {
      item.parentElement.scrollTo({
        top: item.parentElement.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const channel = await sb.openChannel.getChannel("market");
      const userMessageParams = {
        message: message.trim(),
        data: JSON.stringify({
          profileUrl: user?.image ?? "/player-temp/allen.jpg",
        }),
        customType: "userMessage",
      };

      const userMessage = await channel.sendUserMessage(userMessageParams);

      setMessages((prev) => [
        ...prev,
        {
          message: message.trim(), // Use the message directly
          sender:
            myKey.toBase58().slice(0, 5) + "..." + myKey.toBase58().slice(-5),
          image: user?.image ?? "/player-temp/allen.jpg",
          timestamp: timestampToTime(Date.now()),
        },
      ]);

      scrollToBottom(messagesEndRef.current, false);

      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatMessages = (messages: BaseMessage[]) => {
    return messages.map((message) => {
      const sender = message.isUserMessage() ? message.sender : null;
      const senderName = sender
        ? sender.nickname !== ""
          ? sender.nickname
          : sender.userId
        : null;
      const timestamp = message.createdAt;
      let profileUrl = sender?.profileUrl ?? "";

      // Try to get profile URL from data field if it exists
      if (message.isUserMessage() && message.data) {
        try {
          const data = JSON.parse(message.data);
          profileUrl = data.profileUrl || profileUrl;
        } catch (e) {
          console.error("Error parsing message data:", e);
        }
      }

      return {
        message: message.message,
        sender: senderName ?? "Market",
        image: profileUrl || "/player-temp/allen.jpg",
        timestamp: timestampToTime(timestamp),
      };
    });
  };

  const connectToChat = async () => {
    const uniqueID = myKey.toBase58();
    const userNickname = uniqueID.slice(0, 5) + "..." + uniqueID.slice(-5);

    await sb.connect(uniqueID);
    await sb.updateCurrentUserInfo({
      nickname: userNickname,
      profileUrl: "/player-temp/allen.jpg",
    });

    // Add channel handler to listen for real-time updates
    const channelHandler = new OpenChannelHandler({
      onMessageReceived: (channel, message) => {
        // When new message arrives, update messages state
        const sender = message.isUserMessage() ? message.sender : null;
        const senderName = sender
          ? sender.nickname !== ""
            ? sender.nickname
            : sender.userId
          : null;
        const timestamp = message.createdAt;
        setMessages((prev) => [
          ...prev,
          {
            message: message.message,
            sender: senderName ?? "Market",
            image: sender?.profileUrl ?? "",
            timestamp: timestampToTime(timestamp),
          },
        ]);
      },
    });

    // Add the channel handler
    sb.openChannel.addOpenChannelHandler("UNIQUE_HANDLER_ID", channelHandler);

    // Get initial messages
    sb.openChannel.getChannel("market").then(async (channel) => {
      channel.enter();
      const params = {
        prevResultSize: 50,
        nextResultSize: 20,
      };
      const ts = Date.now() - 1000 * 60 * 60 * 24;
      const messages = await channel.getMessagesByTimestamp(ts, params);
      setMessages(formatMessages(messages));
      // Add a small delay to ensure the messages are rendered before scrolling
      setTimeout(() => {
        scrollToBottom(messagesEndRef.current, false);
      }, 100);
    });
  };

  // Clean up handler when component unmounts
  useEffect(() => {
    return () => {
      sb.openChannel.removeOpenChannelHandler("UNIQUE_HANDLER_ID");
    };
  }, []);

  useEffect(() => {
    if (myKey) {
      connectToChat();
    }
  }, [myKey]);

  useEffect(() => {
    scrollToBottom(messagesEndRef.current, false);
  }, [messages]);

  useEffect(() => {
    if (open && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(messagesEndRef.current, false);
      }, 100);
    }
  }, [open]);

  if (!myKey) return null;

  return (
    <div className="fixed bottom-[20px] right-[20px]">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <Button className="w-[51px] h-[51px] p-0 rounded-full bg-white flex items-center justify-center">
            <Image src="/icon.png" alt="chat" width={30.1} height={34.36} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          className="w-[350px] h-[600px] mr-[22px] mb-4 rounded-[22px] z-50 px-3 py-5 flex flex-col"
        >
          {/* header */}
          <div className="h-[51px] flex items-center justify-between px-[5px]">
            <div className="flex items-center gap-[26px]">
              {/* x button to close the dropdown */}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4" strokeWidth={4} color="#000" />
              </button>
              <p className="font-clashMedium">General Chat</p>
            </div>
            {/* TODO: function to open expanded chat (page?) */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <MaximizeIcon />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expand Chat Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="h-[1px] bg-black opacity-[.12] w-full" />
          {/* messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pt-[5.5px]">
            {messages.map((message, index) => {
              const isUserMessage =
                message.sender ===
                myKey.toBase58().slice(0, 5) +
                  "..." +
                  myKey.toBase58().slice(-5);

              // Check if next message is from the same sender (for avatar)
              const nextMessage =
                index < messages.length - 1 ? messages[index + 1] : null;
              const isPartOfGroup = nextMessage?.sender === message.sender;

              // Check if previous message is from the same sender (for name)
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isStartOfGroup = prevMessage?.sender !== message.sender;

              return (
                <div
                  key={"message-" + index}
                  className={`flex items-end gap-3 ${
                    isUserMessage
                      ? "flex-row-reverse "
                      : "flex-row justify-start"
                  }`}
                >
                  {/* Show avatar only if it's the last message in a group */}
                  {!isPartOfGroup && (
                    <Image
                      src={message.image}
                      alt="profile"
                      className="w-[28px] h-[28px] rounded-full"
                      width={28}
                      height={28}
                    />
                  )}
                  {/* Add placeholder div to maintain spacing when avatar is hidden */}
                  {isPartOfGroup && <div className="w-[28px]" />}
                  <div
                    className={`flex flex-col gap-1 ${
                      isUserMessage
                        ? "items-end justify-end"
                        : "items-start justify-start"
                    }`}
                  >
                    {/* Show sender name only if it's the first message in a group */}
                    {isStartOfGroup && (
                      <div className="text-xs font-bold">
                        {isUserMessage
                          ? "You"
                          : message.sender.length > 12
                          ? message.sender.slice(0, 12) + "..."
                          : message.sender}
                      </div>
                    )}
                    <div
                      className={`text-sm px-3 py-2 rounded-[16px] ${
                        !isUserMessage
                          ? "bg-[#EEEEEE] text-black"
                          : "bg-[#742DDD] text-white"
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                  <p
                    className={`text-xs text-black/50 ${
                      isUserMessage ? "mr-auto" : "ml-auto"
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-0" />
          </div>
          <div className="w-full pt-6">
            <input
              type="text"
              className="border border-[#DADADA] bg-white text-black rounded-full py-2 px-4 w-full h-[48px]"
              placeholder="Enter Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e)}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
