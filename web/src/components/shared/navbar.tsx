import React from "react";
import Image from "next/image";
import HomeIcon from "../icons/home";
import WalletIcon from "../icons/wallet";
import TrendUpIcon from "../icons/trend-up";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default function Navbar() {
  return (
    <div className="relative w-full flex items-center justify-between px-8">
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
        <Link href="/" className="flex items-center gap-2">
          <HomeIcon className="w-4 h-4 text-white" />
          <p className="">Place Bets</p>
        </Link>
        <Link href="/leaderboard" className="flex items-center gap-2">
          <TrendUpIcon size={16} color="white" />
          <p className="">Leaderboard</p>
        </Link>
        <Link href="/wallet" className="flex items-center gap-2">
          <WalletIcon className="w-4 h-4 text-white" />
          <p className="">My Bags</p>
        </Link>
      </div>
      {/* login/logout */}
      <div className="flex items-center gap-2">
        <LogOut className="w-4 h-4 text-white" />
        <p className="text-white text-sm font-clashGroteskMed">Logout</p>
      </div>
    </div>
  );
}
