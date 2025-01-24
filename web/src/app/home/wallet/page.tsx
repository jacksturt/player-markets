import BackArrow from "@/components/icons/back-arrow";
import DataTablesUser from "@/components/wallet/data-tables-user";
import Link from "next/link";
import React from "react";
import PnL from "./pnl";

export default async function WalletPage() {
  return (
    <div className="w-full h-screen flex flex-col gap-10">
      <Link href="/home" className="mt-5 px-5">
        <BackArrow size={20} />
      </Link>
      <div className="px-5">
        <p className="uppercase">Balance</p>
        <div className="flex items-end justify-between">
          <p className="text-[50px] leading-[50px] font-clashSemiBold">
            ${1920.08}
          </p>
        </div>
      </div>
      <div className="px-5">
        <PnL />
      </div>
      <DataTablesUser />
    </div>
  );
}
