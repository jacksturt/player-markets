"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useWebProgram, useWebProgramAccount } from "./web-data-access";
import {
  useMarkets,
  usePlayerMarket,
  useQuoteToken,
} from "./market-data-access";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

export function InitPlayerMint() {
  const { initialize } = useMarkets();
  const playerId = "LAMAR";

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
  const playerId = "LAMAR";
  const timestamp = "1735857860574";
  const projection = 23.54;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() =>
        updateProjectionOracle.mutateAsync({
          playerId,
          timestamp,
          projection,
        })
      }
      disabled={updateProjectionOracle.isPending}
    >
      Update Projection Oracle {updateProjectionOracle.isPending && "..."}
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

export function CreateMarket() {
  const { createMarket } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => createMarket.mutateAsync()}
      disabled={createMarket.isPending}
    >
      Create Market {createMarket.isPending && "..."}
    </button>
  );
}

export function DepositBase() {
  const { depositBase } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => depositBase.mutateAsync(10000)}
      disabled={depositBase.isPending}
    >
      Deposit Base {depositBase.isPending && "..."}
    </button>
  );
}

export function DepositQuote() {
  const { depositQuote } = usePlayerMarket();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => depositQuote.mutateAsync(5000)}
      disabled={depositQuote.isPending}
    >
      Deposit Quote {depositQuote.isPending && "..."}
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
