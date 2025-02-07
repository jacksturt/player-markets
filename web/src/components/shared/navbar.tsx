"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import HomeIcon from "../icons/home";
import WalletIcon from "../icons/wallet";
import TrendUpIcon from "../icons/trend-up";
import Link from "next/link";
import AccountButtons from "@/components/wallet/account-buttons";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  return (
    <div className="relative w-full h-[45px] flex items-center justify-between px-8">
      {/* logo */}
      <div className="flex items-center gap-2">
        <Image
          src="/icon.png"
          alt="tradetalk logo"
          width={37.26}
          height={27.79}
        />
        <p className="text-lg font-clashGroteskMed text-white">tradetalk</p>
      </div>
      {/* navigation */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-between gap-8 bg-black/50 rounded-full px-7 py-[11.5px] text-sm text-white font-clashGroteskMed">
        <Link href="/home" className="flex items-center gap-2">
          <HomeIcon
            className="w-4 h-4"
            gradient={pathname === "/home"}
            gradientStart="#F92D37"
            gradientEnd="#F9D10A"
          />
          <p>Place Bets</p>
        </Link>
        <Link href="/home/leaderboard" className="flex items-center gap-2">
          <TrendUpIcon
            size={16}
            color="white"
            gradient={pathname === "/home/leaderboard"}
            gradientStart="#F92D37"
            gradientEnd="#F9D10A"
          />
          <p className="">Leaderboard</p>
        </Link>
        <Link href="/home/wallet" className="flex items-center gap-2">
          <WalletIcon
            className="w-4 h-4"
            gradient={pathname === "/home/wallet"}
            gradientStart="#F92D37"
            gradientEnd="#F9D10A"
          />
          <p
            className={cn(
              pathname === "/home/wallet" && "text-chiefs-gradient"
            )}
          >
            My Bags
          </p>
        </Link>
      </div>
      {/* login/logout */}
      <div className="flex items-center gap-2">
        {/* <LogOut className="w-4 h-4 text-white" />
        <p className="text-white text-sm font-clashGroteskMed">Logout</p> */}
        <AccountButtons />
      </div>
    </div>
  );
}
