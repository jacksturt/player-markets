"use client";

import { useSession } from "next-auth/react";
import {
  InitPlayerMint,
  CreateTeam,
  CloseMintAccounts,
  VaultsList,
} from "./web-ui";

export default function MarketAdminAll() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Loading...</div>;
  }

  if (
    !session.user.wallets.includes(
      "BuxU7uwwkoobF8p4Py7nRoTgxWRJfni8fc4U3YKGEXKs"
    )
  ) {
    return <div>You are not authorized to access this page</div>;
  }

  return (
    <div className="w-full bg-white">
      <div className=" w-full">
        <div className="flex flex-col gap-4">
          {/* <QuoteTokenCreate /> */}
          {/* <QuoteTokenFaucet /> */}
          <CreateTeam />
          <InitPlayerMint />
          <VaultsList />
          <CloseMintAccounts />
        </div>
      </div>
    </div>
  );
}
