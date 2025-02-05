"use client";

import {
  useMarkets,
  usePlayerMarket,
  useQuoteToken,
} from "./market-data-access";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { placeOrderInstructionDiscriminator } from "manifest/src/ui_wrapper";

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
          teamName: "Kansas City Chiefs",
          teamImage:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Washington_Commanders_logo.svg/1200px-Washington_Commanders_logo.svg.png",
          teamSportsdataId: "KC",
        })
      }
    >
      Create Team
    </button>
  );
}

export function InitPlayerMint() {
  const { initialize } = useMarkets();
  const playerId = "18890";
  const playerName = "Patrick Mahomes";
  const playerImage =
    "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";
  const playerPosition = "QB";
  const teamId = "cm6qtbj7c0000rcmm8v7l5132";
  const mintSymbol = "PATRICK";

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
  const playerId = "18890";
  const playerName = "Patrick Mahomes";

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        finishCreatingMarket.mutateAsync({
          playerId,
          playerName,
          mintAddress: "2ZJ3gjGJ5bYtnjGbfp2USuH1mpPGhRK9hzKJUhygmauQ",
          timestamp: "1738715534348",
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
  const playerId = "18890";
  const projection = 19.32;
  const timestamp = "1738716012254";
  const isProjected = true;
  const setMintingDisabled = false;
  const setPayoutEnabled = false;

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

export function CancelAllOrders() {
  const { cancelAllOrders } = usePlayerMarket();
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
                  {(parseFloat(price) * parseFloat(quantity)).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className={`w-full ${
              orderType === "buy"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
          >
            {orderType === "buy" ? "Place Buy Order" : "Place Sell Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const Trade2 = () => {
  const [orderType, setOrderType] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [mintCost, setMintCost] = useState(0);
  const { quoteTokenBalance } = useQuoteToken();
  const {
    depositAndPlaceBuyOrder,
    maybeMintDepositAndSell,
    playerStatsAccount,
  } = usePlayerMarket();
  const [placeOrderError, setPlaceOrderError] = useState("");
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

  useEffect(() => {
    console.log(
      quoteTokenBalance.data,
      playerStatsAccount.data?.projectedPoints!
    );
    console.log(
      parseFloat(quantity) * playerStatsAccount.data?.projectedPoints! * 2.5
    );
    if (orderType === "buy") {
      if (
        quoteTokenBalance.data &&
        parseFloat(quantity) * parseFloat(price) * 10 ** 6 >
          parseFloat(quoteTokenBalance.data)
      ) {
        setPlaceOrderError("Insufficient quote tokens");
      } else {
        setPlaceOrderError("");
      }
    } else {
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
        setMintCost(
          2.5 * playerStatsAccount.data?.projectedPoints! * parseFloat(quantity)
        );
      }
    }
  }, [quoteTokenBalance.data, quantity, price]);

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
                  {(parseFloat(price) * parseFloat(quantity)).toFixed(2)}
                </p>
                {orderType === "sell" && (
                  <p className="text-lg font-medium">
                    Mint Cost: ${mintCost.toFixed(2)}
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
