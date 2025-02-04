"use client";

import { useSession } from "next-auth/react";
import {
  QuoteTokenCreate,
  QuoteTokenFaucet,
  InitPlayerMint,
  UpdateProjectionOracle,
  CreateTeam,
  CloseMintAccounts,
  FinishCreatingMarket,
  VaultsList,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";

export default function MarketAdmin() {
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
    <div className="w-full">
      <div className=" w-full">
        <div className="flex flex-col gap-4">
          <QuoteTokenCreate />
          <QuoteTokenFaucet />
          <CreateTeam />
          <InitPlayerMint />
          <UpdateProjectionOracle />
          <CloseMintAccounts />
          <FinishCreatingMarket />
          <VaultsList />
        </div>
      </div>
    </div>
  );
}
