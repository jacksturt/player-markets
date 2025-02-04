"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  useMarkets,
  usePlayerMarket,
  useQuoteToken,
} from "./market-data-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TrendDownIcon from "../icons/trend-down";
import TrendUpIcon from "../icons/trend-up";

export function QuoteTokenCreate() {
  const { initialize } = useQuoteToken();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync()}
      disabled={initialize.isPending}
    >
      Create Quote Token {initialize.isPending && "..."}
    </button>
  );
}

export function QuoteTokenFaucet() {
  const { faucetQuote, quoteTokenBalance } = useQuoteToken();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => faucetQuote.mutateAsync()}
      disabled={faucetQuote.isPending}
    >
      Faucet Quote Token (balance: {quoteTokenBalance.data ?? 0}){" "}
      {faucetQuote.isPending && "..."}
    </button>
  );
}

export function CreateTeam() {
  const { createTeam } = useMarkets();
  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        createTeam.mutateAsync({
          teamName: "Philadelphia Eagles",
          teamImage:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Washington_Commanders_logo.svg/1200px-Washington_Commanders_logo.svg.png",
          teamSportsdataId: "PHI",
        })
      }
    >
      Create Team
    </button>
  );
}

export function InitPlayerMint() {
  const { initialize } = useMarkets();
  const playerId = "21831";

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync(playerId)}
      disabled={initialize.isPending}
    >
      Initialize Player Mint ({playerId}) {initialize.isPending && "..."}
    </button>
  );
}

export function UpdateProjectionOracle() {
  const { updateProjectionOracle } = useMarkets();
  const playerId = "21831";
  const projection = 0.02351;
  const timestamp = "1738637430169";
  const isProjected = false;
  const setMintingDisabled = false;
  const setPayoutEnabled = true;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        updateProjectionOracle.mutateAsync({
          playerId,
          timestamp,
          projection,
          isProjected,
          setMintingDisabled,
          setPayoutEnabled,
        })
      }
      disabled={updateProjectionOracle.isPending}
    >
      Update Projection Oracle {updateProjectionOracle.isPending && "..."}
    </button>
  );
}

export function CloseMintAccounts() {
  const { closeMintAccounts } = useMarkets();
  const playerId = "21831";
  const timestamp = "1738637430169";

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        closeMintAccounts.mutateAsync({
          playerId,
          timestamp,
        })
      }
      disabled={closeMintAccounts.isPending}
    >
      Close Mint Accounts {closeMintAccounts.isPending && "..."}
    </button>
  );
}

export function MintPlayerTokens() {
  const { mint } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => mint.mutateAsync()}
      disabled={mint.isPending}
    >
      Mint Player Tokens {mint.isPending && "..."}
    </button>
  );
}

export function DepositBase() {
  const { depositBase } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => depositBase.mutateAsync()}
      disabled={depositBase.isPending}
    >
      Deposit Player Tokens {depositBase.isPending && "..."}
    </button>
  );
}

export function DepositQuote() {
  const { depositQuote } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => depositQuote.mutateAsync()}
      disabled={depositQuote.isPending}
    >
      Deposit Quote Tokens {depositQuote.isPending && "..."}
    </button>
  );
}

export function WithdrawAll() {
  const { withdrawAll } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => withdrawAll.mutateAsync()}
      disabled={withdrawAll.isPending}
    >
      Withdraw All {withdrawAll.isPending && "..."}
    </button>
  );
}
export function PrintMarket() {
  const { printMarket } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => printMarket.mutateAsync()}
      disabled={printMarket.isPending}
    >
      Print Market {printMarket.isPending && "..."}
    </button>
  );
}

export function Payout() {
  const { payout } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => payout.mutateAsync()}
      disabled={payout.isPending}
    >
      Payout {payout.isPending && "..."}
    </button>
  );
}

export const Trade = () => {
  const [orderType, setOrderType] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const { buy, sell } = usePlayerMarket();

  // TODO: use actual balanaces
  const TEMP_BALANCE = 1000;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (orderType === "buy") {
      buy.mutateAsync({
        numBaseTokens: parseFloat(quantity),
        tokenPrice: parseFloat(price),
      });
    } else {
      sell.mutateAsync({
        numBaseTokens: parseFloat(quantity),
        tokenPrice: parseFloat(price),
      });
    }
  };

  return (
    <Card className="w-full bg-black/50 border-[#2B2B2B] rounded-[30px] !p-0">
      <CardHeader className="!p-0">
        <CardTitle className="sr-only text-2xl font-bold text-center">
          Place Order
        </CardTitle>
      </CardHeader>
      <CardContent className="!p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* buy/sell switch */}
          <div className="flex items-end justify-center h-[62px] w-full border-b border-[#2B2B2B]">
            <div className="flex items-start h-[37px] justify-center gap-4">
              <button
                className={`h-full flex items-center gap-2 text-white font-clashGroteskMed uppercase px-6 border-b-2 ${
                  orderType === "buy"
                    ? "border-[#CCCCCC]"
                    : "border-transparent"
                }`}
                type="button"
                onClick={() => setOrderType("buy")}
              >
                <TrendUpIcon size={16} />
                Buy
              </button>
              <button
                className={`h-full flex items-center gap-2 text-white font-clashGroteskMed uppercase px-6 border-b-2 ${
                  orderType === "sell"
                    ? "border-[#CCCCCC]"
                    : "border-transparent"
                }`}
                type="button"
                onClick={() => setOrderType("sell")}
              >
                <TrendDownIcon size={16} />
                Sell
              </button>
            </div>
          </div>

          <div className="w-full h-full flex flex-col gap-6 items-center px-[17.5px] pb-[33px]">
            <div className="w-full flex items-center justify-center gap-1">
              {/* from token */}
              <div className="h-[42px] w-[152px] flex items-center justify-center gap-1.5 bg-[#232323] rounded-full">
                <Image
                  src="/player-temp/diggs.webp"
                  alt="player"
                  width={29}
                  height={29}
                  className="rounded-full object-cover"
                />
                <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
                  FROM TOKEN
                </p>
              </div>
              {/* arrow */}
              <div className="py-2.5 px-2">
                <svg
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8.91493 14.6683C8.36169 14.1151 8.36169 13.2181 8.91493 12.6649L12.1632 9.41659L1.41667 9.41658C0.634265 9.41658 2.45819e-06 8.78232 2.52659e-06 7.99992C2.59499e-06 7.21751 0.634265 6.58325 1.41667 6.58325L12.1632 6.58325L8.91493 3.33499C8.36169 2.78174 8.36169 1.88476 8.91493 1.33152C9.46818 0.778275 10.3652 0.778275 10.9184 1.33152L16.5851 6.99819C17.1383 7.55143 17.1383 8.44841 16.5851 9.00165L10.9184 14.6683C10.3652 15.2216 9.46818 15.2216 8.91493 14.6683Z"
                    fill="white"
                  />
                </svg>
              </div>
              {/* to token */}
              <div className="h-[42px] w-[152px] flex items-center justify-center gap-1.5 bg-[#232323] rounded-full">
                <Image
                  src="/player-temp/diggs.webp"
                  alt="player"
                  width={29}
                  height={29}
                  className="rounded-full object-cover"
                />
                <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
                  TO TOKEN
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative flex flex-col items-center gap-3">
                {/* <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white font-clashGroteskMed text-[50px] leading-[50px]">
                  $
                </span> */}
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="!h-[62px] text-white text-center w-full bg-transparent border-none !text-[50px] !leading-[50px] font-clashGroteskMed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="420.69"
                  required
                />
                <p className="text-white font-clashGroteskMed text-[13px] leading-[12px]">
                  $1256 <span className="text-[#676767]">available</span>
                </p>
              </div>

              <div className="w-full flex items-center gap-2 justify-between">
                <button
                  className="h-[42px] w-full flex items-center justify-center gap-1.5 bg-[#232323] text-white rounded-full"
                  type="button"
                  onClick={() => {
                    const spend = 0.25 * TEMP_BALANCE;
                    const quantity = spend / parseFloat(price);
                    setQuantity(quantity.toString());
                  }}
                >
                  25%
                </button>
                <button
                  className="h-[42px] w-full flex items-center justify-center gap-1.5 bg-[#232323] text-white rounded-full"
                  type="button"
                  onClick={() => {
                    const spend = 0.5 * TEMP_BALANCE;
                    const quantity = spend / parseFloat(price);
                    setQuantity(quantity.toString());
                  }}
                >
                  50%
                </button>
                <button
                  className="h-[42px] w-full flex items-center justify-center gap-1.5 bg-[#232323] text-white rounded-full"
                  type="button"
                  onClick={() => {
                    const spend = TEMP_BALANCE;
                    const quantity = spend / parseFloat(price);
                    setQuantity(quantity.toString());
                  }}
                >
                  MAX
                </button>
              </div>

              {price && quantity && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-lg font-medium">
                    Total: $
                    {(parseFloat(price) * parseFloat(quantity)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className={`w-full h-[58px] ${
                orderType === "buy"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              } text-black font-medium rounded-[9.5px] transition-colors`}
            >
              {orderType === "buy" ? "Long" : "Short"}
            </Button>

            {/* TODO: dynamic player and projection data */}
            <p className="text-[#6A6A6A] text-[11px] leading-[11px] max-w-[254px] mx-auto text-center">
              Make money if Patrick Mahomes scores more than{" "}
              <span className="text-white">20.4 fantasy points</span>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
