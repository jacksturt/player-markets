"use client";

import {
  QuoteTokenCreate,
  QuoteTokenFaucet,
  InitPlayerMint,
  UpdateProjectionOracle,
  CreateTeam,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";

export default function MarketAdmin() {
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
