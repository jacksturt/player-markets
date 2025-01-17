"use client";

import {
  QuoteTokenCreate,
  QuoteTokenFaucet,
  InitPlayerMint,
  UpdateProjectionOracle,
} from "./web-ui";
import { PublicKey } from "@solana/web3.js";

export default function MarketAdmin() {
  return (
    <div className="w-full">
      <div className=" w-full">
        <div className="flex flex-col gap-4">
          <QuoteTokenCreate />
          <QuoteTokenFaucet />
          <InitPlayerMint />
          <UpdateProjectionOracle />
        </div>
      </div>
    </div>
  );
}
