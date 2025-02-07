"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  useMarkets,
  usePlayerMarket,
  usePlayerMarketWithParams,
  useQuoteToken,
} from "./market-data-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TrendDownIcon from "../icons/trend-down";
import TrendUpIcon from "../icons/trend-up";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Switch } from "@/components/ui/switch";

export const Trade = ({
  defaultOrderType = "buy",
}: {
  defaultOrderType?: "buy" | "sell";
}) => {
  const [orderType, setOrderType] = useState(defaultOrderType);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const { depositAndPlaceBuyOrder, maybeMintDepositAndSell } =
    usePlayerMarketWithParams();

  // TODO: use actual balanaces
  const TEMP_BALANCE = 1000;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
                  className="rounded-full object-cover w-[28px] h-[28px]"
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
                  className="rounded-full object-cover w-[28px] h-[28px]"
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

export const Trade2 = () => {
  const [orderType, setOrderType] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [actualCost, setActualCost] = useState(0);
  const { quoteTokenBalance } = useQuoteToken();
  const {
    depositAndPlaceBuyOrder,
    maybeMintDepositAndSell,
    playerStatsAccount,
    balances,
    playerTokenBalance,
    market,
  } = usePlayerMarketWithParams();
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
  const { createTeam } = useMarkets();
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
  const { initializeTeamMint } = useMarkets();
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
  const { initialize } = useMarkets();
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
  const { finishCreatingMarket } = useMarkets();
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
  const { updateProjectionOracle } = useMarkets();
  const playerId = "DET";
  const projection = 30.5;
  const timestamp = "1738892110488";
  const isProjected = true;
  const isMintingEnabled = true;
  const isPayoutEnabled = false;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        updateProjectionOracle.mutateAsync({
          playerId,
          timestamp,
          projection,
          isProjected,
          isMintingEnabled,
          isPayoutEnabled,
        })
      }
      disabled={updateProjectionOracle.isPending}
    >
      Update Projection Oracle {updateProjectionOracle.isPending && "..."}
    </button>
  );
}

export function CancelAllOrders() {
  const { cancelAllOrders } = usePlayerMarketWithParams();
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

export function CloseMintAccounts() {
  const { closeMintAccounts } = useMarkets();
  const playerId = "18890";
  const timestamp = "1738715534348";

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

export function WithdrawAll() {
  const { withdrawAll } = usePlayerMarketWithParams();

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
  const { payout } = usePlayerMarketWithParams();

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
        {/* network */}
        <div className="flex items-center gap-5 justify-center">
          <p className="text-white font-clashGroteskMed text-[22px] leading-[21px]">
            139 <span className="text-[#B8B5B5] text-xs">Followers</span>
          </p>
          <p className="text-white font-clashGroteskMed text-[22px] leading-[21px]">
            139 <span className="text-[#B8B5B5] text-xs">Following</span>
          </p>
        </div>
        {/* actions */}
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex gap-2">
            <Button className="w-1/2 h-[58.36px] bg-[#2B2B2B] hover:bg-[#3B3B3B] text-white">
              Cancel Orders
            </Button>
            <Button className="w-1/2 h-[58.36px] bg-[#2B2B2B] hover:bg-[#3B3B3B] text-white">
              Close All Trades
            </Button>
          </div>
          <Button className="w-full h-[58.36px] bg-[#2B2B2B] hover:bg-[#3B3B3B] text-white">
            Cashout Balance
          </Button>
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

export const Position = ({
  image,
  ticker,
  amount,
  usdValue,
}: {
  image: string;
  ticker: string;
  amount: number;
  usdValue: number;
}) => {
  return (
    <div className="w-full h-[41px] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={image} />
          <AvatarFallback>
            <Image
              src="/player-temp/diggs.webp"
              alt="player"
              width={30}
              height={30}
            />
          </AvatarFallback>
        </Avatar>
        <p className="text-white font-clashGroteskMed text-[15px] leading-[15px]">
          <span className="font-clashGroteskMed text-[#6A6A6A]">{amount}</span>{" "}
          {ticker}
        </p>
      </div>
      <p className="text-white font-clashMed text-[20px] leading-[20px]">
        ${usdValue}
      </p>
    </div>
  );
};
