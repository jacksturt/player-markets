"use client";
import styles from "@/styles/Markets.module.scss";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  MintTabTrigger,
  BurnTabTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  CLUSTER_URL,
  BANGER_FEE_PCT,
  CREATOR_FEE_PCT,
  CURATOR_FEE_PCT,
} from "@/lib/on-chain/constants";
import { MarketPageData, RarityBalance } from "@/types/queries";
import { createClient } from "@/lib/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { ToastAction } from "../ui/toast";
import { buyBanger, sellBanger } from "@/lib/on-chain/buySell";
import { Wallet } from "@coral-xyz/anchor";
import clsx from "clsx";
import Decimal from "decimal.js";
import {
  getCollectionSupply,
  getTokensByCollection,
} from "@/lib/on-chain/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { TradeSettings } from "./trade-settings";

function TradeBox({
  data,
  rarityBalance,
  userStatus
}: {
  data: MarketPageData;
  rarityBalance: RarityBalance;
  userStatus: string;
}) {
  const [tab, setTab] = useState<string>("mint");
  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [bangerBalance, setBangerBalance] = useState(0);
  const [raritySelected, setRaritySelected] = useState<
    "common" | "rare" | "epic" | "legendary"
  >("common");
  const rarityColors = {
    common: "#c0c0c0",
    rare: "#0070DD",
    epic: "#A335EE",
    legendary: "#FF8000",
  };

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isInitialFetch, setIsInitialFetch] = useState(true);

  const wallet = useWallet();

  const [collectionSupply, setCollectionSupply] = useState(0);
  const [prices, setPrices] = useState<Decimal[]>([]);
  const [totalPrice, setTotalPrice] = useState(new Decimal(0));

  // const [slippage, setSlippage] = useState("5");
  const [amount, setAmount] = useState("1");

  const [user, setUser] = useState<User | null>(null);
  // Add state for settings with safe initialization
  const [tradeSettings, setTradeSettings] = useState<{ priority: string; slippage: string }>(() => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      return {
        priority: localStorage.getItem('tradePriority') || 'Ultra',
        slippage: localStorage.getItem('tradeSlippage') || '5'
      };
    }
    // Default values for server-side rendering
    return {
      priority: 'Ultra',
      slippage: '5'
    };
  });

  const { publicKey } = useWallet();

  const supabase = createClient();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [supabase]);

  const { toast } = useToast();
  const handleSettingsChange = (newSettings: { priority: string; slippage: string }) => {
    setTradeSettings(newSettings);
  };


  const amountAsNumber = parseInt(amount || "0", 10);
  const slippageAsNumber = parseInt(tradeSettings.slippage || "0", 10);

  const creator_fee = totalPrice.mul(new Decimal(CREATOR_FEE_PCT / 10000));
  const banger_fee = totalPrice.mul(new Decimal(BANGER_FEE_PCT / 10000));
  const curator_fee = totalPrice.mul(new Decimal(CURATOR_FEE_PCT / 10000));
  const fees = creator_fee.plus(banger_fee).plus(curator_fee);

  const buyTotal = new Decimal(1)
    .plus(new Decimal(slippageAsNumber).div(new Decimal(100)))
    .mul(totalPrice.plus(fees))
    .toNumber();
  const sellTotal = new Decimal(1)
    .minus(new Decimal(slippageAsNumber).div(new Decimal(100)))
    .mul(totalPrice.minus(fees))
    .toNumber();

  useEffect(() => {
    async function fetchSupply() {
      if (!data) return;
      try {
        // Only show loading on initial fetch
        if (isInitialFetch) {
          setIsLoadingInitialData(true);
        }

        const supply = await getCollectionSupply(
          new PublicKey(data.collectionPublicKey)
        );
        console.log("Supply: ", supply);
        setCollectionSupply(supply);
      } catch (error) {
        console.error("Error fetching supply:", error);
      } finally {
        // Turn off loading and mark initial fetch as complete
        if (isInitialFetch) {
          setIsLoadingInitialData(false);
          setIsInitialFetch(false);
        }
      }
    }

    fetchSupply();
    const interval = setInterval(fetchSupply, 10000);
    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    if (!data || isLoadingInitialData) return;
    const prices = Array.from({ length: amountAsNumber }, (_, i) => {
      const supply = new Decimal(collectionSupply + 1);
      const index = new Decimal(tab === "mint" ? i : -(i + 1));
      return supply.plus(index).pow(2).dividedBy(new Decimal(32000));
    });
    setPrices(prices);
    const totalPrice = prices.reduce(
      (prev, curr) => prev.plus(curr),
      new Decimal(0)
    );
    setTotalPrice(totalPrice);
  }, [data, amount, tab, collectionSupply, isLoadingInitialData]);

  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey) return;
      const connection = new Connection(CLUSTER_URL, {
        commitment: "processed",
      });
      const solBalance = await connection.getBalance(publicKey);
      const formattedBalance = solBalance / LAMPORTS_PER_SOL;
      setSolBalance(formattedBalance);
    }
    fetchBalances();
  }, [publicKey, data, user]);

  useEffect(() => {
    async function fetchRarityBalance() {
      if (!user || !wallet.publicKey) return;
      if (isInitialLoad) {
        // Find the rarity with the highest balance
        const highestBalanceRarity = Object.entries(rarityBalance)
          .filter(([key]) => key !== "total")
          .reduce((a, b) => (b[1] > a[1] ? b : a))[0] as
          | "common"
          | "rare"
          | "epic"
          | "legendary";

        // Set the default rarity to the one with the highest balance
        setRaritySelected(highestBalanceRarity);
        setBangerBalance(rarityBalance[highestBalanceRarity]);
        setIsInitialLoad(false);
      } else {
        setBangerBalance(rarityBalance[raritySelected]);
      }
    }
    fetchRarityBalance();
  }, [publicKey, data, user, isInitialLoad, raritySelected]);

  const handleBuy = useCallback(async () => {
    if (publicKey && wallet && user) {
      setLoading(true);
      const connection = new Connection(CLUSTER_URL, {
        commitment: "processed",
      });
      const collectionPublicKey = new PublicKey(data.collectionPublicKey);
      try {
        console.log(
          "prices",
          prices.map((p) => p.toNumber())
        );
        const subtotal = prices
          .reduce((prev, curr) => prev.plus(curr), new Decimal(0))
          .toNumber();
        const total = subtotal * (1 + slippageAsNumber / 100);

        const creator_fee = subtotal * (CREATOR_FEE_PCT / 10000);
        const banger_fee = subtotal * (BANGER_FEE_PCT / 10000);
        const curator_fee = subtotal * (CURATOR_FEE_PCT / 10000);
        const fees = creator_fee + banger_fee + curator_fee;

        console.log("subtotal", subtotal);
        console.log("total", total);
        console.log("fees", fees);

        const max_sol_in = total + fees;
        const max_lamports_in = max_sol_in * LAMPORTS_PER_SOL;
        console.log("MAX LAMPORTS IN", max_lamports_in);

        toast({
          title: "Approve transaction",
          description:
            "Please review and approve the transaction in your wallet",
        });

        const { signature, assets, type } = await buyBanger(
          connection,
          wallet as unknown as Wallet,
          max_lamports_in,
          amountAsNumber,
          collectionPublicKey,
          new PublicKey(data.lookupTableAddress),
          data.metadataURL,
          data.tweetId,
          tradeSettings.priority as "Fast" | "Turbo" | "Ultra"
        );
        console.log("signature", signature);
        console.log("type", type);

        if (!signature) {
          if (type == "user rejected") {
            toast({
              title: "Transaction failed",
              description: "User rejected transaction",
            });
          } else if (type == "timeout") {
            toast({
              title: "Transaction failed",
              description: "Transaction timed out",
            });
          } else {
            toast({
              title: "Transaction failed",
              description: "Something went wrong",
              variant: "destructive",
            });
          }
          setLoading(false);
          throw new Error("Failed to mint banger onchain");
        }

        console.log("Signature: ", signature);
        console.log("Assets minted: ", assets);

        toast({
          title: "Transaction successful",
          action: (
            <ToastAction
              altText="View Transaction on Explorer"
              onClick={() => {
                window.open(`https://solscan.io/tx/${signature}`, "_blank");
              }}
            >
              View Transaction
            </ToastAction>
          ),
        });

        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      toast({
        title: "Please connect your wallet and sign in ",
        description:
          "You need to connect your wallet and sign in to mint bangers",
      });
    }
  }, [amount, prices, data, publicKey, wallet, user]);

  const handleSell = useCallback(async () => {
    if (publicKey && wallet.publicKey && user) {
      setLoading(true);

      const connection = new Connection(CLUSTER_URL, {
        commitment: "processed",
      });
      const collectionPublicKey = new PublicKey(data.collectionPublicKey);

      try {
        console.log("supply", collectionSupply);
        console.log(
          "prices",
          prices.map((p) => p.toNumber())
        );
        const subtotal = prices
          .reduce((prev, curr) => prev.plus(curr), new Decimal(0))
          .toNumber();
        const total = subtotal * (1 - slippageAsNumber / 100);
        const creator_fee = subtotal * (CREATOR_FEE_PCT / 10000);
        const banger_fee = subtotal * (BANGER_FEE_PCT / 10000);
        const curator_fee = subtotal * (CURATOR_FEE_PCT / 10000);
        const fees = creator_fee + banger_fee + curator_fee;
        const min_lamports_out = (total - fees) * LAMPORTS_PER_SOL;

        console.log("MIN LAMPORTS OUT", min_lamports_out);

        const assets = await getTokensByCollection(
          wallet.publicKey,
          new PublicKey(data.collectionPublicKey),
          raritySelected
        );
        const assetsToBurn = assets.slice(0, amountAsNumber);
        console.log("tokens to burn", assetsToBurn);

        toast({
          title: "Approve transaction",
          description:
            "Please review and approve the transaction in your wallet",
        });

        const { signature, type } = await sellBanger(
          connection,
          wallet as unknown as Wallet,
          min_lamports_out,
          amountAsNumber,
          collectionPublicKey,
          assetsToBurn,
          tradeSettings.priority as "Fast" | "Turbo" | "Ultra"
        );
        if (!signature) {
          if (type == "user rejected") {
            toast({
              title: "Transaction failed",
              description: "User rejected transaction",
            });
          } else if (type == "timeout") {
            toast({
              title: "Transaction failed",
              description: "Transaction timed out",
            });
          } else {
            toast({
              title: "Transaction failed",
              description: "Something went wrong",
              variant: "destructive",
            });
          }
          setLoading(false);
          throw new Error("Failed to burn banger onchain");
        }
        console.log(signature);

        toast({
          title: "Transaction successful",
          action: (
            <ToastAction
              altText="View Transaction on Explorer"
              onClick={() => {
                window.open(`https://solscan.io/tx/${signature}`, "_blank");
              }}
            >
              View Transaction
            </ToastAction>
          ),
        });

        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      toast({
        title: "Please connect your wallet and sign in ",
        description:
          "You need to connect your wallet and sign in to sell bangers",
      });
    }
  }, [amount, prices, data, publicKey, wallet, user]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const subtotal = prices.reduce(
    (prev, curr) => prev.plus(curr),
    new Decimal(0)
  );
  const feeAmount = creator_fee.plus(banger_fee).plus(curator_fee).toNumber();
  const total =
    tab === "mint" ? subtotal.plus(feeAmount) : subtotal.minus(feeAmount);
  const slippageAmount = total.mul(slippageAsNumber / 100);
  const maxMinAmount =
    tab === "mint" ? total.plus(slippageAmount) : total.minus(slippageAmount);

  const TradeInfo = () => {
    if (isLoadingInitialData) {
      return (
        <div className={styles.tradeInfo}>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading market data...</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tradeInfo}>
        <p>Subtotal: {subtotal.toString()} SOL</p>
        <p>Fee: {fees.toString()} SOL</p>
        <p>Total: {total.toString()} SOL</p>
        <p>
          {tab === "mint" ? "Max SOL Spent" : "Min SOL Received"}:{" "}
          {maxMinAmount.toString()} SOL
        </p>
      </div>
    );
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value)}
      className={clsx(styles.tradeBoxParent)}
    >
      <TabsList className="w-full flex justify-around">
        <MintTabTrigger className="w-1/2" value="mint">
         Buy
        </MintTabTrigger>
        <BurnTabTrigger className="w-1/2" value="burn">
          Sell
        </BurnTabTrigger>
      </TabsList>

      <TabsContent value="mint">
        <Card className="border-2 border-[#f2c1fb] mt-4">
          <CardHeader className="relative justify-between flex-row pt-4">
            <div className="space-y-1.5">
              <CardTitle>Buy</CardTitle>
              <CardDescription>
                Balance: {solBalance.toString()} SOL
              </CardDescription>
            </div>
            <TradeSettings onSettingsChange={handleSettingsChange} />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-3">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex space-x-2">
                {["1", "2", "3"].map((value) => (
                  <Button
                    key={value}
                    variant={amount === value ? "default" : "outline"}
                    onClick={() => handleAmountChange(value)}
                    className="flex-1"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
            <TradeInfo />
          </CardContent>
          <CardFooter className="pb-5">
            {userStatus === "Login Required" && (
              <Button className="w-full text-lg" disabled>
                Login Required
              </Button>
            )}
            {userStatus === "Invite Required" && (
              <Button className="w-full text-lg" disabled>
                Invite Required
              </Button>
            )}
            {userStatus === "Good" && (
              <>
                {amountAsNumber == 0 ? (
                  <Button className="w-full text-lg" disabled>
                    Enter an amount
                  </Button>
                ) : isLoadingInitialData ? (
                  <Button className="w-full text-lg" disabled>
                    Buy
                  </Button>
                ) : solBalance < buyTotal ? (
                  <Button className="w-full text-lg" disabled>
                    Insufficient SOL
                  </Button>
                ) : (
                  <Button
                    className="w-full text-lg font-bold hover:bg-[#f2c1fb]"
                    onClick={handleBuy}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <></>
                    )}
                    {loading ? "Buying" : "Buy"}
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="burn">
        <Card className="border-2 border-[#f2c1fb] mt-4">
          <CardHeader className="relative flex justify-between flex-row pt-4">
            <div className="space-y-1.5">
              <CardTitle>Sell</CardTitle>
              <CardDescription>
                Balance:{" "}
                <span style={{ color: rarityColors[raritySelected] }}>
                  {bangerBalance}
                </span>
              </CardDescription>
            </div>
            <div className={styles.selectTab}>
              <Select
                onValueChange={(v) => {
                  setRaritySelected(
                    v as "common" | "rare" | "epic" | "legendary"
                  );
                  setBangerBalance(
                    rarityBalance[v as "common" | "rare" | "epic" | "legendary"]
                  );
                }}
                value={raritySelected}
              >
                <SelectTrigger
                  className="w-[120px] border-2 border-[#f2c1fb] text-sm"
                  style={{
                    color:
                      rarityColors[raritySelected as keyof typeof rarityColors],
                  }}
                >
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent className="w-[150px] border-2 border-[#f2c1fb] text-sm">
                  <SelectItem value="common" className="text-[#c0c0c0]">
                    Common
                  </SelectItem>
                  <SelectItem value="rare" className="text-[#0070DD]">
                    Rare
                  </SelectItem>
                  <SelectItem value="epic" className="text-[#A335EE]">
                    Epic
                  </SelectItem>
                  <SelectItem value="legendary" className="text-[#FF8000]">
                    Legendary
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TradeSettings onSettingsChange={handleSettingsChange} />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-3">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex space-x-2">
                {["1", "2", "3"].map((value) => (
                  <Button
                    key={value}
                    variant={amount === value ? "default" : "outline"}
                    onClick={() => handleAmountChange(value)}
                    className="flex-1"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
            <div className={styles.tradeInfo}>
              <p>Subtotal: {subtotal.toString()} SOL</p>
              <p>Fee: {fees.toString()} SOL</p>
              <p>Total: {total.toString()} SOL</p>
              <p>Min SOL Received: {maxMinAmount.toString()} SOL</p>
            </div>
          </CardContent>
          <CardFooter className="pb-5">
            {userStatus === "Login Required" && (
              <Button className="w-full text-lg" disabled>
                Login Required
              </Button>
            )}
            {userStatus === "Invite Required" && (
              <Button className="w-full text-lg" disabled>
                Invite Required
              </Button>
            )}
            {userStatus === "Good" && (
              <>
                {amountAsNumber == 0 ? (
                  <Button
                    className="w-full text-lg bg-[#f2c1fb] text-white"
                    disabled
                  >
                    Enter an amount
                  </Button>
                ) : bangerBalance < amountAsNumber ? (
                  <Button className="w-full text-lg" disabled>
                    Insufficient Bangers
                  </Button>
                ) : (
                  <Button
                    className="w-full text-lg font-bold hover:bg-[#f2c1fb]"
                    onClick={handleSell}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <></>
                    )}
                    {loading ? "Selling" : "Sell"}
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export { TradeBox };