"use client";

import { useSession } from "next-auth/react";
import {
  QuoteTokenCreate,
  QuoteTokenFaucet,
  InitPlayerMint,
  UpdateProjectionOracle,
  CreateTeam,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";

export default function MarketAdmin() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Loading...</div>;
  }

  if (session.user.email !== "jack@sturt.io") {
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
        </div>
      </div>
    </div>
  );
}
