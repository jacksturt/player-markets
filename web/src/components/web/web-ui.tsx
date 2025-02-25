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
  useLivePlays,
  useParaWallet,
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
import { api, type RouterOutputs } from "@/trpc/react";
import { RestingOrder } from "manifest/src";
import { BN, ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { bignum } from "@metaplex-foundation/beet";
import { Decimal } from "@prisma/client/runtime/library";
import { ChevronDown, ChevronUp } from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";
import { Edit2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { updateUsername } from "@/server/api/routers/user/update";
import { useRouter } from "next/navigation";

export const Trade = () => {
  const { playerStatsAccount, market, lastTradePrice } = usePlayerMarket();
  const { liveProjectedScore } = useLivePlays();

  const [orderType, setOrderType] = useState("buy");
  const [price, setPrice] = useState(
    `$${parseFloat(
      (liveProjectedScore.data ?? lastTradePrice.data ?? 0.0).toFixed(4)
    )}`
  );
  const [safePrice, setSafePrice] = useState(
    liveProjectedScore.data ?? lastTradePrice.data ?? 0
  );
  const [quantity, setQuantity] = useState(1.0);
  const [useDepositedTokens, setUseDepositedTokens] = useState(true);
  const [actualCost, setActualCost] = useState(0);
  const [playerTokenUseable, setPlayerTokenUseable] = useState(0);
  const [quoteTokenWithdrawable, setQuoteTokenWithdrawable] = useState(0);
  const [useLiveProjection, setUseLiveProjection] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [alreadyDepositedMessage, setAlreadyDepositedMessage] = useState("");
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
        numBaseTokens: quantity,
        tokenPrice: safePrice,
      });
    } else {
      maybeMintDepositAndSell.mutateAsync({
        numBaseTokens: quantity,
        tokenPrice: safePrice,
      });
    }
  };

  useEffect(() => {
    console.log("balances", balances.data?.quoteWithdrawableBalanceTokens);
    const withdrawableQuoteTokens =
      balances.data?.quoteWithdrawableBalanceTokens ?? 0;
    if (orderType === "buy" && quantity > 0 && safePrice > 0) {
      if (withdrawableQuoteTokens > 0) {
        setQuoteTokenWithdrawable(withdrawableQuoteTokens);
      }
    }
  }, [balances.data, orderType]);

  useEffect(() => {
    console.log("playerTokenBalance", balances.data);
    const playerTokens = parseInt(playerTokenBalance.data ?? "0") / 10 ** 6;
    const withdrawableTokens =
      balances.data?.baseWithdrawableBalanceTokens ?? 0;
    console.log("players", playerTokens, withdrawableTokens);
    const useableTokens = playerTokens + withdrawableTokens;
    if (orderType === "sell" && quantity > 0 && safePrice > 0) {
      if (useableTokens > 0) {
        setPlayerTokenUseable(useableTokens);
      }
    }
  }, [playerTokenBalance.data, balances.data, orderType]);

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
                <div className="!h-[62px] text-white text-center w-full bg-transparent border-none !text-[50px] !leading-[50px] font-clashGroteskMed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                  {`$${(safePrice * quantity).toFixed(4)}`}
                </div>
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
              {!showAdvancedOptions && (
                <div className="flex items-center justify-between w-full  gap-2">
                  <p className="text-white font-clashGroteskMed text-[12px] leading-[12px]">
                    <span className="text-[#676767]">Place order at </span>
                    {useLiveProjection
                      ? "current live projection"
                      : "last trade price"}
                  </p>
                  <Switch
                    id="useDepositedTokens"
                    checked={useLiveProjection}
                    onCheckedChange={(checked) => {
                      setUseLiveProjection(checked);
                      if (checked) {
                        setPrice(
                          "$" + (liveProjectedScore.data?.toFixed(2) ?? "0.00")
                        );
                      } else {
                        setPrice(
                          "$" + (lastTradePrice.data?.toFixed(2) ?? "0.00")
                        );
                      }
                    }}
                  />
                </div>
              )}
              <div className="w-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAdvancedOptions(!showAdvancedOptions);
                  }}
                  className="w-full flex items-center gap-2 cursor-pointer hover:opacity-80"
                >
                  <div className="h-[1px] flex-1 bg-[#676767]" />
                  <div className="flex items-center gap-1">
                    <span className="text-[#676767] text-sm">Advanced </span>
                    {showAdvancedOptions ? (
                      <ChevronUp size={16} color="#676767" />
                    ) : (
                      <ChevronDown size={16} color="#676767" />
                    )}
                  </div>
                  <div className="h-[1px] flex-1 bg-[#676767]" />
                </button>
              </div>
              {showAdvancedOptions && (
                <>
                  <div className="!h-[62px] flex flex-row justify-between items-center text-white text-center w-full bg-[#232323]  rounded-lg border-[#313131] px-4">
                    <div className="flex flex-col items-start ">
                      <span className="text-[#676767] text-sm">
                        {orderType === "buy" ? "Long # of" : "Short # of"}{" "}
                        {market.data?.baseMint.symbol}
                      </span>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step="0.0001"
                        pattern="^\d*\.?\d{0,2}$"
                        value={quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value.includes(".") &&
                            value.split(".")[1].length > 4
                          ) {
                            return;
                          }

                          setQuantity(parseFloat(e.target.value));
                        }}
                        className=" text-white !text-md border-none p-0 m-0 h-6 focus:border-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="1.0"
                        required
                      />
                    </div>
                    <div className="rounded-full text-lg bg-[#313131] px-4 py-2">
                      {market.data?.baseMint.symbol}
                    </div>
                  </div>
                  <div className="!h-[62px] flex flex-row justify-between items-center text-white text-center w-full bg-[#232323]  rounded-lg border-[#313131] px-4">
                    <div className="flex flex-col items-start ">
                      <span className="text-[#676767] text-sm">
                        Set Price Of Token
                      </span>
                      <Input
                        id="quantity"
                        min="0"
                        value={price}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value.includes(".") &&
                            value.split(".")[1].length > 4
                          ) {
                            return;
                          }

                          setPrice(
                            `${e.target.value.startsWith("$") ? "" : "$"}${
                              e.target.value
                            }`
                          );
                        }}
                        className=" text-white !text-md border-none p-0 m-0 h-6 focus:border-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="1.0"
                        required
                      />
                    </div>
                    <div className="rounded-full text-lg bg-[#313131] px-4 py-2">
                      USDC
                    </div>
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
            {orderType === "buy" && quoteTokenWithdrawable > 0 && (
              <p className="text-[#6A6A6A] text-[11px] leading-[11px]  mx-auto text-center">
                You will use{" "}
                <span className="text-white">
                  {quoteTokenWithdrawable.toFixed(4)} USDC deposited to place
                  this order.
                </span>
              </p>
            )}
            {orderType === "sell" && playerTokenUseable > 0 && (
              <p className="text-[#6A6A6A] text-[11px] leading-[11px]  mx-auto text-center">
                You will also use{" "}
                <span className="text-white">
                  {playerTokenUseable.toFixed(4)} {market.data?.baseMint.symbol}
                </span>{" "}
                deposited to place this order.
              </p>
            )}
            {actualCost > 0 && (
              <p className="text-[#6A6A6A] text-[11px] leading-[11px] max-w-[254px] mx-auto text-center">
                Actual Cost to place order:
                <span className="text-white"> ${actualCost.toFixed(4)}</span>
              </p>
            )}
            {quantity * safePrice > 0 && (
              <p className="text-[#6A6A6A] text-[11px] leading-[11px] max-w-[254px] mx-auto text-center">
                Total Order value:
                <span className="text-white">
                  {" "}
                  ${(quantity * safePrice).toFixed(4)}
                </span>
              </p>
            )}

            {/* TODO: dynamic player and projection data */}
            <p className="text-[#6A6A6A] text-[11px] leading-[11px] max-w-[254px] mx-auto text-center">
              Make money if {market?.data?.player?.name} scores{" "}
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

export function CreateTeam() {
  const { createTeam } = useMarketAdmin();
  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        createTeam.mutateAsync({
          teamName: "New England Patriots",
          teamImage: "/logos/new-england-patriots.svg",
          teamSportsdataId: "NE",
        })
      }
    >
      Create Team
    </button>
  );
}

export function InitPlayerMint() {
  const { initialize } = useMarketAdmin();
  const playerName = "New England Patriots";
  const playerImage = "/logos/new-england-patriots.svg";
  const playerPosition = "WR";
  // PHI
  const teamId = "cm7awyxag0004rcml8tetjba3";
  // KC
  // const teamId = "cm6qtbj7c0000rcmm8v7l5132";
  const teamSportsdataId = "NE";
  const mintSymbol = "PATRIOTS";
  const season = "2007POST";
  const week = "3";
  const network = "MAINNET";
  const projection = 34.5;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        initialize.mutateAsync({
          teamSportsdataId,
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
      Initialize Player Mint ({teamSportsdataId}){" "}
      {initialize.isPending && "..."}
    </button>
  );
}

export function InitPlayerMintBE() {
  const { initializeMintBE } = useMarketAdmin();

  const playerId = "21045";
  const playerName = "Marquise Brown";
  const playerImage = "/playerImages/Marquise-Brown.png";
  const playerPosition = "WR";
  // PHI
  // const teamId = "cm6l90r8j0000rcxnu1blil7n";
  // KC
  const teamId = "cm6qtbj7c0000rcmm8v7l5132";
  const mintSymbol = "HOLLYWOOD";
  const season = "2024POST";
  const week = "4";
  const network = "MAINNET";
  const projection = 6.95;

  const timestamp = "1739072626733";
  const baseMint = "DGCusGaGbg99cJbGEhB61L4ZGmh3qJRNfXcMadYMuPEx";
  const marketAddress = "5FXdMQ81QMaAWV5TSa9QNCch6vR8fMuAxDAxNjQZGS5G";

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        initializeMintBE.mutateAsync({
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
          timestamp,
          baseMint,
          marketAddress,
        })
      }
      disabled={initializeMintBE.isPending}
    >
      Initialize Player Mint BE({playerId}){" "}
      {initializeMintBE.isPending && "..."}
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

export function PlayerStatsList() {
  const { playerStats } = useMarkets();
  return (
    <div>
      {playerStats.data?.map((playerStat) => (
        <div key={playerStat.publicKey.toString()}>
          {playerStat.publicKey.toString()},{" "}
          <ClosePlayerStats playerStatsKey={playerStat.publicKey.toString()} />
        </div>
      ))}
    </div>
  );
}

export function CloseMintConfig({ mintConfigKey }: { mintConfigKey: string }) {
  const { closeMintConfig } = useMarketAdmin();
  const mintConfig = new PublicKey(mintConfigKey);

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => closeMintConfig.mutateAsync({ mintConfig })}
      disabled={closeMintConfig.isPending}
    >
      Close Mint Config {mintConfig.toString()}{" "}
      {closeMintConfig.isPending && "..."}
    </button>
  );
}

export function MintConfigList() {
  const { markets } = useMarkets();
  return (
    <div>
      {markets.data?.map((market) => (
        <div key={market.publicKey.toString()}>
          {market.publicKey.toString()},{" "}
          <CloseMintConfig mintConfigKey={market.publicKey.toString()} />
        </div>
      ))}
    </div>
  );
}

export function CloseMintRecord({ mintRecordKey }: { mintRecordKey: string }) {
  const { closeMintRecord } = useMarketAdmin();
  const mintRecord = new PublicKey(mintRecordKey);

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => closeMintRecord.mutateAsync({ mintRecord })}
      disabled={closeMintRecord.isPending}
    >
      Close Mint Record {mintRecord.toString()}{" "}
      {closeMintRecord.isPending && "..."}
    </button>
  );
}

export function MintRecordList() {
  const { mintRecords } = useMarkets();
  return (
    <div>
      {mintRecords.data?.map((mintRecord) => (
        <div key={mintRecord.publicKey.toString()}>
          {mintRecord.publicKey.toString()},{" "}
          <CloseMintRecord mintRecordKey={mintRecord.publicKey.toString()} />
        </div>
      ))}
    </div>
  );
}

export function UpdateProjectionOracle() {
  const { updateProjectionOracle } = useMarketAdmin();
  const projection = 0;
  const isProjected = false;

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

export function VaultInfo() {
  const { vault } = usePlayerMarket();
  return (
    <div>
      <p>Vault Address: {vault?.data?.address.toString()}</p>
      <p>Vault Amount: {vault?.data?.amount.toString()}</p>
    </div>
  );
}

export function SetPayoutEnabledAndMintingDisabled() {
  const { setPayoutEnabledAndMintingDisabled } = useMarketAdmin();
  const { market } = usePlayerMarket();
  const marketId = market?.data?.baseMint.symbol;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => setPayoutEnabledAndMintingDisabled.mutateAsync()}
      disabled={setPayoutEnabledAndMintingDisabled.isPending}
    >
      Set Payout Enabled and Minting Disabled for {marketId}
      {setPayoutEnabledAndMintingDisabled.isPending && "..."}
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

export function EmptyVault() {
  const { emptyVault } = useMarketAdmin();
  const { vault } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => emptyVault.mutateAsync()}
      disabled={emptyVault.isPending}
    >
      Empty Vault {vault?.data?.address.toString()}{" "}
      {emptyVault.isPending && "..."}
    </button>
  );
}

export function ClosePlayerStats({
  playerStatsKey,
}: {
  playerStatsKey: string;
}) {
  const { closePlayerStats } = useMarketAdmin();
  const playerStats = new PublicKey(playerStatsKey);

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => closePlayerStats.mutateAsync({ playerStats })}
      disabled={closePlayerStats.isPending}
    >
      Close Player Stats {playerStats.toString()}{" "}
      {closePlayerStats.isPending && "..."}
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
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const { publicKey } = useWallet();
  const { paraPubkey } = useParaWallet();
  const myKey = paraPubkey.data?.toString() ?? publicKey?.toString() ?? "";

  const { data: user, refetch: refetchUser } = api.user.readUser.useQuery({
    walletAddress: myKey,
  });

  const updateUsernameMutation = api.user.updateUsername.useMutation();
  const updateImageMutation = api.user.updateImage.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await updateUsernameMutation.mutateAsync({
        walletAddress: myKey,
        username: username,
      });
      await refetchUser();
      toast.success("Username updated");
    } catch (error) {
      toast.error("Error updating username");
    } finally {
      setIsEditing(false);
    }
  };

  const handleImageUpload = async (res: any) => {
    await updateImageMutation.mutateAsync({
      walletAddress: myKey,
      image: res[0].url,
    });
    await refetchUser();
    setIsEditing(false);
    toast.success("Profile image updated sucessfully");
  };

  // useEffect(() => {
  //   console.log("user", user);
  // }, [user]);

  return (
    <Card className="relative w-[450px] bg-black/50 border-[#2B2B2B] rounded-[30px] !p-6">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="absolute top-4 right-4"
      >
        <Edit2Icon className="w-4 h-4 text-white" />
      </button>
      <CardHeader className="sr-only">
        <CardTitle className="sr-only text-2xl font-bold text-center">
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 !p-0">
        {/* user data */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center">
            {isEditing ? (
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res: any) => {
                  handleImageUpload(res);
                }}
                onUploadError={(error: Error) => {
                  toast.error(`ERROR! ${error.message}`);
                }}
              />
            ) : (
              <Image
                src={user?.image ?? "/player-temp/diggs.webp"}
                alt="player"
                width={100}
                height={100}
                className="rounded-full object-cover w-[100px] h-[100px]"
              />
            )}
            {isEditing ? (
              <Input
                type="text"
                className="text-white font-clashGroteskMed text-[19px] leading-[19px] mt-[15px]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            ) : (
              <p className="text-white font-clashGroteskMed text-[19px] leading-[19px] mt-[15px]">
                {user?.username ?? myKey.slice(0, 6) + "..." + myKey.slice(-6)}
              </p>
            )}
            {isEditing && (
              <Button type="submit" variant="secondary" className="mt-2">
                Save
              </Button>
            )}
          </div>
        </form>
        {/* TODO: my team */}
        {/* <div className="flex flex-col items-center gap-1">
          <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
            My Team
          </p>
          <p className="text-[#6A6A6A] text-[11px] leading-[11px]">
            TODO: NFL team dropdown
          </p>
        </div> */}
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
  const router = useRouter();
  if (isNaN(shortPositionMinted) || isNaN(longPositionHeld)) return null;
  return (
    <div
      className="w-full h-[41px] flex items-center justify-between"
      onClick={() => {
        router.push(`/home/players/${marketInfo.address}`);
      }}
    >
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
          {longPositionHeld ?? "0"} {ticker}
        </p>
      </div>
      {shortPositionMinted > 0 && (
        <p className="font-clashMed text-[20px] leading-[20px] text-red-500">
          ${shortPositionPayout / 10 ** 6}
        </p>
      )}
      {longPositionHeld > 0 && (
        <p className="text-green-500 font-clashMed text-[20px] leading-[20px]">
          ${longPositionPayout}
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
  const priceFloat = parseFloat(tokenPrice.toFixed(4));
  const formattedPrice = priceFloat.toFixed(4);
  const quantityFloat = parseFloat(numBaseTokens.toString());
  const formattedQuantity = quantityFloat.toFixed(4);
  const formattedCost = (priceFloat * quantityFloat).toFixed(4);
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
              {isBid ? "Buying" : "Selling"}
            </p>
            <p className="bg-chiefs-gradient-text text-transparent bg-clip-text font-clashGroteskMed text-[15px] leading-[15px]">
              {ticker}
            </p>
          </div>
          <p className="text-[#6a6a6a] font-clashGroteskMed text-[13px] leading-[13px]">
            {createdAt.toLocaleString()} {formattedPrice}
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
              orderId: order.id,
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
                  isFill: true,
                  filledOrderId: order.id,
                })
              : depositAndPlaceBuyOrder.mutate({
                  numBaseTokens: parseFloat(order.numBaseTokens.toString()),
                  tokenPrice,
                  isFill: true,
                  filledOrderId: order.id,
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
  const formattedPrice = priceFloat.toFixed(4);
  const quantityFloat = parseFloat(quantity.toString()) / 10 ** 6;
  const formattedQuantity = quantityFloat.toFixed(4);
  const formattedCost = (priceFloat * quantityFloat).toFixed(4);

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
