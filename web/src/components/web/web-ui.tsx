"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  useMarkets,
  useMarketAdmin,
  usePlayerMarket,
  useQuoteToken,
  useMyMarket,
  usePlayerToken,
  useManifestClient,
} from "./market-data-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TrendDownIcon from "../icons/trend-down";
import TrendUpIcon from "../icons/trend-up";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePlayerMarketCardStore } from "@/lib/zustand";
import { Switch } from "@/components/ui/switch";
import { type RouterOutputs } from "@/trpc/react";
import { RestingOrder } from "manifest/src";
import { BN, ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { bignum } from "@metaplex-foundation/beet";
import { Decimal } from "@prisma/client/runtime/library";
export const Trade = () => {
  const { playerStatsAccount, market } = usePlayerMarket();

  const [orderType, setOrderType] = useState("buy");
  const [price, setPrice] = useState(
    `$${playerStatsAccount.data?.projectedPoints?.toString() ?? ""}`
  );
  const [safePrice, setSafePrice] = useState(0.0);
  const [quantity, setQuantity] = useState(0.0);
  const [useDepositedTokens, setUseDepositedTokens] = useState(true);
  const [actualCost, setActualCost] = useState(0);
  const [playerTokenUseable, setPlayerTokenUseable] = useState(0);
  const [quoteTokenWithdrawable, setQuoteTokenWithdrawable] = useState(0);
  const { quoteTokenBalance } = useQuoteToken();
  const quoteTokenBalanceSafe =
    ((quoteTokenBalance.data?.valueOf() as number) ?? 0) / 10 ** 6;
  const { depositAndPlaceBuyOrder, maybeMintDepositAndSell, balances } =
    useMyMarket();
  const { playerTokenBalance } = usePlayerToken();
  const [placeOrderError, setPlaceOrderError] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("placing order");
    if (orderType === "buy") {
      depositAndPlaceBuyOrder.mutateAsync({
        numBaseTokens:
          quantity +
          (useDepositedTokens ? quoteTokenWithdrawable * safePrice : 0),
        tokenPrice: safePrice,
      });
    } else {
      maybeMintDepositAndSell.mutateAsync({
        numBaseTokens: quantity + (useDepositedTokens ? playerTokenUseable : 0),
        tokenPrice: safePrice,
      });
    }
  };

  useEffect(() => {
    console.log("balances", balances.data?.quoteWithdrawableBalanceTokens);
    setQuoteTokenWithdrawable(
      balances.data?.quoteWithdrawableBalanceTokens ?? 0
    );
  }, [balances.data]);

  useEffect(() => {
    console.log("playerTokenBalance", balances.data);
    const playerTokens = parseInt(playerTokenBalance.data ?? "0") / 10 ** 6;
    const withdrawableTokens =
      balances.data?.baseWithdrawableBalanceTokens ?? 0;
    console.log("players", playerTokens, withdrawableTokens);
    setPlayerTokenUseable(playerTokens + withdrawableTokens);
  }, [playerTokenBalance.data, balances.data]);

  useEffect(() => {
    setSafePrice(parseFloat(price.replace("$", "")));
  }, [price]);

  useEffect(() => {
    if (orderType === "buy") {
      if (
        quoteTokenBalance.data &&
        quantity * safePrice * 10 ** 6 >
          parseFloat(quoteTokenBalance.data) +
            balances.data?.quoteWithdrawableBalanceTokens!
      ) {
        setPlaceOrderError("Insufficient quote tokens");
      } else {
        console.log(
          balances.data?.quoteWithdrawableBalanceTokens,
          quantity,
          playerStatsAccount.data?.projectedPoints
        );
        setActualCost(
          quantity * safePrice - balances.data?.quoteWithdrawableBalanceTokens!
        );
        setPlaceOrderError("");
      }
    } else {
      const playerTokenBalanceSafe = playerTokenBalance.data ?? "0";

      const playerTokensHeld = parseInt(playerTokenBalanceSafe) / 10 ** 6;
      const amountToMint =
        quantity -
        balances.data?.baseWithdrawableBalanceTokens! -
        playerTokensHeld;
      if (market.data?.hasGameStarted && amountToMint > 0) {
        setPlaceOrderError("Minting Is Disabled");
      }
      if (
        quoteTokenBalance.data &&
        2.5 * playerStatsAccount.data?.projectedPoints! * quantity * 10 ** 6 >
          parseFloat(quoteTokenBalance.data)
      ) {
        setPlaceOrderError("Insufficient quote tokens");
      } else {
        setPlaceOrderError("");
        console.log(
          balances.data?.baseWithdrawableBalanceTokens,
          quantity,
          playerStatsAccount.data?.projectedPoints
        );
        setActualCost(
          2.5 *
            playerStatsAccount.data?.projectedPoints! *
            (quantity -
              balances.data?.baseWithdrawableBalanceTokens! -
              playerTokensHeld)
        );
      }
    }
  }, [
    quoteTokenBalance.data,
    quantity,
    safePrice,
    orderType,
    playerStatsAccount.data,
    balances.data,
    playerTokenBalance.data,
    market.data,
  ]);

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
                Long
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
                Short
              </button>
            </div>
          </div>

          <div className="w-full h-full flex flex-col gap-6 items-center px-[17.5px] pb-[33px]">
            <div className="w-full flex items-center justify-center gap-1">
              {/* from token */}
              <div className="h-[42px] w-[152px] flex items-center justify-center gap-1.5 bg-[#232323] rounded-full">
                <Image
                  src={
                    orderType === "buy"
                      ? "/logos/USDC.svg"
                      : market.data?.baseMint.image ?? "/player-temp/diggs.webp"
                  }
                  alt="player"
                  width={29}
                  height={29}
                  className="rounded-full object-cover w-[28px] h-[28px]"
                />
                <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
                  {orderType === "buy" ? "USDC" : market.data?.baseMint.symbol}
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
                  src={
                    orderType === "buy"
                      ? market.data?.baseMint.image ?? "/player-temp/diggs.webp"
                      : "/logos/USDC.svg"
                  }
                  alt="player"
                  width={29}
                  height={29}
                  className="rounded-full object-cover w-[28px] h-[28px]"
                />
                <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
                  {orderType === "buy" ? market.data?.baseMint.symbol : "USDC"}
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
                  type="text"
                  min="0"
                  prefix="$"
                  value={price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes("$")) {
                      setPrice(value);
                    } else {
                      setPrice(`$${value}`);
                    }
                  }}
                  className="!h-[62px] text-white text-center w-full bg-transparent border-none !text-[50px] !leading-[50px] font-clashGroteskMed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="$420.69"
                  required
                />
                <p className="text-white font-clashGroteskMed text-[13px] leading-[12px]">
                  ${quoteTokenBalanceSafe.toFixed(2)}{" "}
                  <span className="text-[#676767]">available</span>
                </p>
              </div>

              <div className="w-full flex items-center gap-2 justify-between">
                <button
                  className="h-[42px] w-full flex items-center justify-center gap-1.5 bg-[#232323] text-white rounded-full"
                  type="button"
                  onClick={() => {
                    if (orderType === "buy") {
                      const spend = 0.25 * quoteTokenBalanceSafe;
                      const quantity = spend / safePrice;
                      const truncatedQuantity = parseFloat(quantity.toFixed(2));
                      setQuantity(truncatedQuantity);
                    } else {
                      const spend = 0.25 * quoteTokenBalanceSafe;
                      const quantity =
                        spend / 2.5 / playerStatsAccount.data?.projectedPoints!;
                      const truncatedQuantity = parseFloat(quantity.toFixed(2));
                      setQuantity(truncatedQuantity);
                    }
                  }}
                >
                  25%
                </button>
                <button
                  className="h-[42px] w-full flex items-center justify-center gap-1.5 bg-[#232323] text-white rounded-full"
                  type="button"
                  onClick={() => {
                    if (orderType === "buy") {
                      const spend = 0.5 * quoteTokenBalanceSafe;
                      const quantity = spend / safePrice;
                      const truncatedQuantity = parseFloat(quantity.toFixed(2));
                      setQuantity(truncatedQuantity);
                    } else {
                      const spend = 0.5 * quoteTokenBalanceSafe;
                      const quantity =
                        spend / 2.5 / playerStatsAccount.data?.projectedPoints!;
                      const truncatedQuantity = parseFloat(quantity.toFixed(2));
                      setQuantity(truncatedQuantity);
                    }
                  }}
                >
                  50%
                </button>
                <button
                  className="h-[42px] w-full flex items-center justify-center gap-1.5 bg-[#232323] text-white rounded-full"
                  type="button"
                  onClick={() => {
                    if (orderType === "buy") {
                      const spend = quoteTokenBalanceSafe;
                      const quantity = spend / safePrice;
                      const truncatedQuantity = parseFloat(quantity.toFixed(2));
                      setQuantity(truncatedQuantity);
                    } else {
                      const spend = quoteTokenBalanceSafe;
                      const quantity =
                        spend / 2.5 / playerStatsAccount.data?.projectedPoints!;
                      const truncatedQuantity = parseFloat(quantity.toFixed(2));
                      setQuantity(truncatedQuantity);
                    }
                  }}
                >
                  MAX
                </button>
              </div>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                pattern="^\d*\.?\d{0,2}$"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes(".") && value.split(".")[1].length > 2) {
                    return;
                  }

                  setQuantity(parseFloat(e.target.value));
                }}
                className="!h-[62px] text-white text-center w-full bg-transparent border-none !text-[50px] !leading-[50px] font-clashGroteskMed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="1.0"
                required
              />

              {useDepositedTokens && (
                <div className="!h-[62px] text-white text-center w-full bg-transparent border-none !text-[50px] !leading-[50px] font-clashGroteskMed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                  <p>
                    +
                    {orderType === "buy"
                      ? quoteTokenWithdrawable
                      : playerTokenUseable}{" "}
                    Tokens
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg gap-2">
                <Label
                  htmlFor="useDepositedTokens"
                  className="text-lg font-medium"
                >
                  Use {orderType === "buy" ? "Deposited" : "Owned"} Tokens
                </Label>
                <Switch
                  id="useDepositedTokens"
                  checked={useDepositedTokens}
                  onCheckedChange={(checked) => setUseDepositedTokens(checked)}
                />
              </div>

              {orderType === "buy" && safePrice && quantity && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-lg font-medium">
                    Total: ${(safePrice * quantity).toFixed(2)}
                  </p>
                </div>
              )}

              {orderType === "sell" && safePrice && quantity && (
                <>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-lg font-medium">
                      Mint Cost: $
                      {(
                        playerStatsAccount.data?.projectedPoints! * quantity
                      ).toFixed(2)}
                    </p>
                    <p className="text-lg font-medium">
                      Collateral: $
                      {(
                        1.5 *
                        playerStatsAccount.data?.projectedPoints! *
                        quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-lg font-medium">
                      Total: $
                      {(
                        2.5 *
                        playerStatsAccount.data?.projectedPoints! *
                        quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>
            {placeOrderError && (
              <p className="text-red-500">{placeOrderError}</p>
            )}

            <Button
              type="submit"
              className={`w-full h-[58px] ${
                orderType === "buy"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              } text-black font-medium rounded-[9.5px] transition-colors`}
              disabled={placeOrderError !== ""}
            >
              {orderType === "buy" ? "Long" : "Short"}
            </Button>

            {/* TODO: dynamic player and projection data */}
            <p className="text-[#6A6A6A] text-[11px] leading-[11px] max-w-[254px] mx-auto text-center">
              Make money if Patrick Mahomes scores{" "}
              {orderType === "buy" ? "more" : "less"} than{" "}
              <span className="text-white">
                {playerStatsAccount.data?.projectedPoints.toFixed(2)} fantasy
                points
              </span>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const Trade2 = () => {
  const [orderType, setOrderType] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [actualCost, setActualCost] = useState(0);
  const { quoteTokenBalance } = useQuoteToken();
  const { playerStatsAccount, market } = usePlayerMarket();
  const { depositAndPlaceBuyOrder, maybeMintDepositAndSell, balances } =
    useMyMarket();
  const { playerTokenBalance } = usePlayerToken();
  const [placeOrderError, setPlaceOrderError] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("placing order");
    if (orderType === "buy") {
      depositAndPlaceBuyOrder.mutateAsync({
        numBaseTokens: parseFloat(quantity),
        tokenPrice: parseFloat(price),
      });
    } else {
      maybeMintDepositAndSell.mutateAsync({
        numBaseTokens: parseFloat(quantity),
        tokenPrice: parseFloat(price),
      });
    }
  };

  useEffect(() => {
    if (orderType === "buy") {
      if (
        quoteTokenBalance.data &&
        parseFloat(quantity) * parseFloat(price) * 10 ** 6 >
          parseFloat(quoteTokenBalance.data) +
            balances.data?.quoteWithdrawableBalanceTokens!
      ) {
        setPlaceOrderError("Insufficient quote tokens");
      } else {
        console.log(
          balances.data?.quoteWithdrawableBalanceTokens,
          parseFloat(quantity),
          playerStatsAccount.data?.projectedPoints
        );
        setActualCost(
          parseFloat(quantity) * parseFloat(price) -
            balances.data?.quoteWithdrawableBalanceTokens!
        );
        setPlaceOrderError("");
      }
    } else {
      console.log("playerTokenBalance.data", playerTokenBalance.data);
      const playerTokenBalanceSafe = playerTokenBalance.data ?? "0";

      const playerTokensHeld = parseInt(playerTokenBalanceSafe) / 10 ** 6;
      console.log("market.data?.hasGameStarted", market.data?.hasGameStarted);
      console.log(
        "balances.data?.baseWithdrawableBalanceTokens",
        balances.data?.baseWithdrawableBalanceTokens
      );
      const amountToMint =
        parseFloat(quantity) -
        balances.data?.baseWithdrawableBalanceTokens! -
        playerTokensHeld;
      console.log("amountToMint", amountToMint);
      if (market.data?.hasGameStarted && amountToMint > 0) {
        setPlaceOrderError("Minting Is Disabled");
      }
      if (
        quoteTokenBalance.data &&
        2.5 *
          playerStatsAccount.data?.projectedPoints! *
          parseFloat(quantity) *
          10 ** 6 >
          parseFloat(quoteTokenBalance.data)
      ) {
        setPlaceOrderError("Insufficient quote tokens");
      } else {
        setPlaceOrderError("");
        console.log(
          balances.data?.baseWithdrawableBalanceTokens,
          parseFloat(quantity),
          playerStatsAccount.data?.projectedPoints
        );
        setActualCost(
          2.5 *
            playerStatsAccount.data?.projectedPoints! *
            (parseFloat(quantity) -
              balances.data?.baseWithdrawableBalanceTokens! -
              playerTokensHeld)
        );
      }
    }
  }, [
    quoteTokenBalance.data,
    quantity,
    price,
    orderType,
    playerStatsAccount.data,
    balances.data,
    playerTokenBalance.data,
    market.data,
  ]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Place Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
            <Label htmlFor="order-type" className="text-lg font-medium">
              {orderType === "buy" ? "Buy" : "Sell"}
            </Label>
            <Switch
              id="order-type"
              checked={orderType === "sell"}
              onCheckedChange={(checked) =>
                setOrderType(checked ? "sell" : "buy")
              }
              className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-green-500"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="price" className="block mb-2">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.000001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full"
                placeholder="Enter price"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="block mb-2">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.000001"
                min="0.000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full"
                placeholder="Enter quantity"
                required
              />
            </div>

            {price && quantity && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-lg font-medium">
                  Total: $
                  {(parseFloat(price) * parseFloat(quantity)).toFixed(4)}
                </p>
                {actualCost > 0 && !isNaN(actualCost) && (
                  <p className="text-lg font-medium">
                    Actual Cost: ${actualCost.toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className={`w-full ${
              placeOrderError
                ? "bg-gray-500 hover:bg-gray-600"
                : orderType === "buy"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
          >
            {placeOrderError
              ? placeOrderError
              : orderType === "buy"
              ? "Place Buy Order"
              : "Place Sell Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
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
  const { createTeam } = useMarketAdmin();
  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        createTeam.mutateAsync({
          teamName: "San Francisco 49ers",
          teamImage:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Washington_Commanders_logo.svg/1200px-Washington_Commanders_logo.svg.png",
          teamSportsdataId: "SF",
        })
      }
    >
      Create Team
    </button>
  );
}

export function InitTeamMint() {
  const { initializeTeamMint } = useMarketAdmin();
  const teamId = "DET";
  const mintSymbol = "LIONS";
  const season = "2023POST";
  const week = "3";
  const network = "MAINNET";
  const projection = 23;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        initializeTeamMint.mutateAsync({
          teamId,
          mintSymbol,
          season,
          week,
          network,
          projection,
        })
      }
      disabled={initializeTeamMint.isPending}
    >
      Initialize Team Mint ({teamId}) {initializeTeamMint.isPending && "..."}
    </button>
  );
}

export function InitPlayerMint() {
  const { initialize } = useMarketAdmin();
  const playerId = "24423";
  const playerName = "Jake Moody";
  const playerImage =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Washington_Commanders_logo.svg/1200px-Washington_Commanders_logo.svg.png";
  const playerPosition = "K";
  // SF
  const teamId = "cm6shjtv90004mrscl6knr8xt";
  const mintSymbol = "JAKE";
  const season = "2023POST";
  const week = "3";
  const network = "MAINNET";
  const projection = 9.22;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        initialize.mutateAsync({
          playerId,
          playerName,
          playerImage,
          playerPosition,
          teamId,
          mintSymbol,
          season,
          week,
          network,
          projection,
        })
      }
      disabled={initialize.isPending}
    >
      Initialize Player Mint ({playerId}) {initialize.isPending && "..."}
    </button>
  );
}

export function FinishCreatingMarket() {
  const { finishCreatingMarket } = useMarketAdmin();
  const playerId = "19063";
  const playerName = "George Kittle";
  const playerImage =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Washington_Commanders_logo.svg/1200px-Washington_Commanders_logo.svg.png";
  const playerPosition = "TE";
  // SF
  const teamId = "cm6shjtv90004mrscl6knr8xt";
  const mintSymbol = "George";
  const season = "2023POST";
  const week = "3";
  const network = "MAINNET";
  const projection = 12.88;
  const timestamp = "1738795137840";
  const marketAddress = "4KCNsaKKvFSqroMwk1iAhdLtmX954hhvC98STCeEcKCA";
  const mintAddress = "9nqdVyXub3rp5LXLYy1EkzxRVqafZcvwbe38RhtEyASt";
  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        finishCreatingMarket.mutateAsync({
          playerId,
          playerName,
          marketAddress,
          mintAddress,
          mintTimestamp: timestamp,
          season,
          week,
          projection,
        })
      }
      disabled={finishCreatingMarket.isPending}
    >
      Finish Creating Market ({playerId}){" "}
      {finishCreatingMarket.isPending && "..."}
    </button>
  );
}

export function VaultsList() {
  const { vaults } = useMarkets();
  return (
    <div>
      {vaults.data?.map((vault) => (
        <div key={vault.address.toString()}>
          {vault.address.toString()}, {vault.amount.toString()}
        </div>
      ))}
    </div>
  );
}

export function UpdateProjectionOracle() {
  const { updateProjectionOracle } = useMarketAdmin();
  const projection = 30.5;
  const isProjected = true;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        updateProjectionOracle.mutateAsync({
          projection,
          isProjected,
        })
      }
      disabled={updateProjectionOracle.isPending}
    >
      Update Projection Oracle {updateProjectionOracle.isPending && "..."}
    </button>
  );
}

export function CancelAllOrders() {
  const { cancelAllOrders } = useMyMarket();
  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => cancelAllOrders.mutateAsync()}
      disabled={cancelAllOrders.isPending}
    >
      Cancel All Orders {cancelAllOrders.isPending && "..."}
    </button>
  );
}

export function SetMintingEnabled() {
  const { setMintingEnabled } = useMarketAdmin();
  const { market } = usePlayerMarket();
  const marketId = market?.data?.baseMint.symbol;
  const isMintingEnabled = false;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        setMintingEnabled.mutateAsync({
          isMintingEnabled,
        })
      }
      disabled={setMintingEnabled.isPending}
    >
      Set Minting {isMintingEnabled ? "Enabled" : "Disabled"} for {marketId}
      {setMintingEnabled.isPending && "..."}
    </button>
  );
}

export function SetPayoutEnabled() {
  const { setPayoutEnabled } = useMarketAdmin();
  const { market } = usePlayerMarket();
  const marketId = market?.data?.baseMint.symbol;
  const isPayoutEnabled = true;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        setPayoutEnabled.mutateAsync({
          isPayoutEnabled,
        })
      }
      disabled={setPayoutEnabled.isPending}
    >
      Set Payout {isPayoutEnabled ? "Enabled" : "Disabled"} for {marketId}
      {setPayoutEnabled.isPending && "..."}
    </button>
  );
}

export function CloseMintAccounts() {
  const { closeMintAccounts } = useMarketAdmin();
  const { vault } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => closeMintAccounts.mutateAsync()}
      disabled={closeMintAccounts.isPending}
    >
      Close Mint Accounts {vault?.data?.address.toString()}{" "}
      {closeMintAccounts.isPending && "..."}
    </button>
  );
}

export function ClaimSeat() {
  const { claimSeat } = useManifestClient();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => claimSeat.mutateAsync()}
      disabled={claimSeat.isPending}
    >
      Claim Seat {claimSeat.isPending && "..."}
    </button>
  );
}

export function WithdrawAll() {
  const { withdrawAll } = useMyMarket();

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

export function Payout() {
  const { payout } = useMyMarket();

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

export function CashoutAll() {
  const { cancelAndWithdrawAllToPayout } = useMyMarket();

  return (
    <button
      className="w-full h-[58.36px] bg-[#2B2B2B] hover:bg-[#3B3B3B] text-white"
      onClick={() => cancelAndWithdrawAllToPayout.mutateAsync()}
      disabled={cancelAndWithdrawAllToPayout.isPending}
    >
      Cashout Balance {cancelAndWithdrawAllToPayout.isPending && "..."}
    </button>
  );
}

export const ProfileCard = () => {
  return (
    <Card className="w-[450px] bg-black/50 border-[#2B2B2B] rounded-[30px] !p-0">
      <CardHeader>
        <CardTitle className="sr-only text-2xl font-bold text-center">
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8">
        {/* user data */}
        <div className="flex flex-col items-center">
          <Image
            src="/player-temp/diggs.webp"
            alt="player"
            width={100}
            height={100}
            className="rounded-full object-cover w-[100px] h-[100px]"
          />
          <p className="text-white font-clashGroteskMed text-[19px] leading-[19px] mt-[15px]">
            matt.sol
          </p>
        </div>
        {/* my team */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
            My Team
          </p>
          <p className="text-[#6A6A6A] text-[11px] leading-[11px]">
            TODO: NFL team dropdown
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const UserStats = () => {
  const balanceData = {
    "24h_pct_change": 10,
    "24h_amount_change": 100,
  };
  return (
    <div className="w-full h-[215px] flex items-center gap-[9px]">
      <div className="w-full rounded-[53.75px] bg-[#232323] h-full flex flex-col items-center justify-center">
        <p className="text-[#B8B5B5] text-lg">Volume</p>
        <p className="text-white font-clashMed text-[36px] leading-[36px]">
          $13669.02
        </p>
      </div>
      <div className="w-full rounded-[53.75px] bg-[#232323] h-full flex flex-col items-center justify-center">
        <p className="text-[#B8B5B5] text-lg">P&L</p>
        <p
          className={`font-clashMed text-[36px] leading-[36px] ${
            balanceData["24h_amount_change"] > 0
              ? "text-[#44E865]"
              : "text-red-500"
          }`}
        >
          {`${balanceData["24h_amount_change"] > 0 ? "+" : "-"}$${
            balanceData["24h_amount_change"]
          }`}
        </p>
      </div>
      <div className="w-full rounded-[53.75px] bg-[#232323] h-full flex flex-col items-center justify-center">
        <p className="text-[#B8B5B5] text-lg">Avg. Trade Size</p>
        <p className="text-[#676767] font-clashMed text-[36px] leading-[36px]">
          $369.12
        </p>
      </div>
    </div>
  );
};

export type MarketRouterObject =
  RouterOutputs["market"]["readAllMarkets"][number];

export const Position = ({
  shortPositionPayout,
  shortPositionMinted,
  longPositionPayout,
  longPositionHeld,
  marketInfo,
}: {
  shortPositionPayout: number;
  shortPositionMinted: number;
  longPositionPayout: number;
  longPositionHeld: number;
  marketInfo: MarketRouterObject;
}) => {
  const ticker = marketInfo.baseMint.symbol;
  return (
    <div className="w-full h-[41px] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={marketInfo.baseMint.image} />
          <AvatarFallback>
            <Image
              src="/player-temp/diggs.webp"
              alt="player"
              width={40}
              height={40}
            />
          </AvatarFallback>
        </Avatar>
        <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
          {ticker}
        </p>
      </div>
      {shortPositionMinted > 0 && (
        <p className="text-white font-clashMed text-[20px] leading-[20px]">
          Shorted {shortPositionMinted} pays out ${shortPositionPayout}
        </p>
      )}
      {longPositionHeld > 0 && (
        <p className="text-white font-clashMed text-[20px] leading-[20px]">
          Longed {longPositionHeld} pays out ${longPositionPayout}
        </p>
      )}
    </div>
  );
};

export type OrderRouterObject =
  RouterOutputs["order"]["readOrdersForMarket"][number];

export type MyOrderRouterObject =
  RouterOutputs["order"]["getAllMyOpenOrders"][number] & {
    isMyOrder: boolean;
  };

export type AskOrBidType = RestingOrder &
  OrderRouterObject & { isMyOrder: boolean } & {
    numBaseTokens: Decimal | BN;
  };

export const OrderHistoryItem = ({
  order,
}: {
  order?: AskOrBidType | MyOrderRouterObject;
}) => {
  const { cancelOrder, maybeMintDepositAndSell, depositAndPlaceBuyOrder } =
    useMyMarket();
  if (!order) return null;
  const { price, numBaseTokens, user, market, createdAt, isBid, baseMint } =
    order;
  const ticker = baseMint?.symbol ?? "";
  const image = user.image ?? "/player-temp/diggs.webp";
  const tokenPrice = order.hasOwnProperty("tokenPrice")
    ? (order as AskOrBidType).tokenPrice
    : parseFloat(order.price.toString());
  const priceFloat = parseFloat(tokenPrice.toFixed(2));
  const formattedPrice = priceFloat.toFixed(2);
  const quantityFloat = parseFloat(numBaseTokens.toString());
  const formattedQuantity = quantityFloat.toFixed(2);
  const formattedCost = (priceFloat * quantityFloat).toFixed(2);
  return (
    <div className="w-full h-[44px] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={image} />
          <AvatarFallback>
            <Image
              src="/player-temp/diggs.webp"
              alt="player"
              width={40}
              height={40}
            />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-clashGroteskMed text-[15px] leading-[15px] uppercase">
              {isBid ? "Bought" : "Sold"}
            </p>
            <p className="bg-chiefs-gradient-text text-transparent bg-clip-text font-clashGroteskMed text-[15px] leading-[15px]">
              {ticker}
            </p>
          </div>
          <p className="text-[#6a6a6a] font-clashGroteskMed text-[13px] leading-[13px]">
            {createdAt.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <p
            className={`font-clashGroteskMed text-[15px] leading-[15px] ${
              isBid ? "text-[#44E865]" : "text-[#FF4646]"
            }`}
          >
            {`${isBid ? "+" : "-"}${formattedQuantity} ${ticker}`}
          </p>
        </div>
        <p className="text-[#6a6a6a] font-clashGroteskMed text-[13px] leading-[13px]">
          {`${isBid ? "-" : "+"}$${formattedCost}`}
        </p>
      </div>
      {order.isMyOrder ? (
        <button
          onClick={() => {
            cancelOrder.mutate({
              clientOrderId: order.clientOrderId,
            });
          }}
        >
          Cancel
        </button>
      ) : (
        <button
          onClick={() => {
            order.isBid
              ? maybeMintDepositAndSell.mutate({
                  numBaseTokens: parseFloat(order.numBaseTokens.toString()),
                  tokenPrice,
                })
              : depositAndPlaceBuyOrder.mutate({
                  numBaseTokens: parseFloat(order.numBaseTokens.toString()),
                  tokenPrice,
                });
          }}
        >
          Fill
        </button>
      )}
    </div>
  );
};

export type TradeRouterObject = RouterOutputs["trade"]["readForMarket"][number];

export const TradeHistoryItem = ({ trade }: { trade: TradeRouterObject }) => {
  const { price, quantity, seller, buyer, player, team, baseMint, createdAt } =
    trade;
  const ticker = baseMint?.symbol ?? "";
  const sellerImage = seller.image ?? "/player-temp/diggs.webp";
  const buyerImage = buyer.image ?? "/playerImages/Patrick-Mahomes.png";
  const priceFloat = parseFloat(price.toString());
  const formattedPrice = priceFloat.toFixed(2);
  const quantityFloat = parseFloat(quantity.toString()) / 10 ** 6;
  const formattedQuantity = quantityFloat.toFixed(2);
  const formattedCost = (priceFloat * quantityFloat).toFixed(2);

  return (
    <div className="w-full h-[44px] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={sellerImage} />
          <AvatarFallback>
            <Image
              src="/player-temp/diggs.webp"
              alt="player"
              width={40}
              height={40}
            />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-clashGroteskMed text-[15px] leading-[15px] uppercase">
              {"Sold "}
            </p>
            <p className="bg-chiefs-gradient-text text-transparent bg-clip-text font-clashGroteskMed text-[15px] leading-[15px]">
              {ticker}
            </p>
            <p className="text-white font-clashGroteskMed text-[15px] leading-[15px] uppercase">
              {" TO"}
            </p>
          </div>

          <p className="text-[#6a6a6a] font-clashGroteskMed text-[13px] leading-[13px]">
            AT ${formattedPrice}
          </p>
        </div>

        <Avatar>
          <AvatarImage src={buyerImage} />
          <AvatarFallback>
            <Image
              src="/playerImages/Patrick-Mahomes.png"
              alt="player"
              width={40}
              height={40}
            />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <p
            className={`font-clashGroteskMed text-[15px] leading-[15px] ${"text-[#44E865]"}`}
          >
            {`${formattedQuantity} ${ticker}`}
          </p>
        </div>
        <p className="text-[#6a6a6a] font-clashGroteskMed text-[13px] leading-[13px]">
          {`$${formattedCost}`}
        </p>
      </div>
    </div>
  );
};
