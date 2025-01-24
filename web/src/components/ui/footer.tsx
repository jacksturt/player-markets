"use client";

import React from "react";
import HomeIcon from "../icons/home";
import Image from "next/image";
import WalletIcon from "../icons/wallet";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="z-20 fixed bottom-0 mx-auto left-0 right-0 max-w-[430px] h-16 rounded-t-[32px] bg-black">
      <div className="relative w-full h-full flex items-center justify-evenly">
        <Link href="/home">
          <HomeIcon size={36} />
        </Link>
        <HomeIcon size={36} className="invisible" />
        <Link href="/home/wallet">
          <WalletIcon size={36} />
        </Link>
        <Image
          src="/chat.png"
          alt="Main Chat"
          width={120}
          height={120}
          className="absolute -top-[6px] left-1/2 -translate-x-1/2"
        />
      </div>
    </footer>
  );
}
