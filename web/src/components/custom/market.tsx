import { FetchedMarkets } from "@/types/queries";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import styles from "@/styles/Leaderboard.module.scss";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "../ui/button";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type SolanaPrice = {
  solana: {
    usd: number;
  };
};

function MarketComponent({
  data,
  showBangersOwned,
  solPrice,
}: {
  data: FetchedMarkets;
  showBangersOwned?: boolean;
  solPrice: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded(!expanded);
  };

  const checkOverflow = () => {
    const imageWrapper = imageWrapperRef.current;
    if (imageWrapper) {
      setHasOverflow(imageWrapper.scrollHeight > imageWrapper.offsetHeight);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      checkOverflow();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (image) {
      if (image.complete) {
        checkOverflow();
      } else {
        image.onload = checkOverflow;
      }
    }
  }, []);

  const formatUSD = (solAmount: number) => {
    if (!solPrice) return null;
    const usdAmount = solAmount * solPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdAmount);
  };

  const bangersOwned = data.ownedBangers || {
    total: 0,
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  return (
    <Link href={`/markets/${data.tweetId}`} className={styles.marketCardParent}>
      <Card className={styles.marketCard}>
        <CardHeader className="pb-0 pt-1.5">
          {showBangersOwned && (
            <p className={styles.marketValue}>
              Net Worth : {(data.buyPrice * bangersOwned.total).toFixed(5)} SOL&nbsp;
              <span>
                {solPrice &&
                  `(${formatUSD(
                    Number(data.buyPrice.toFixed(5)) * bangersOwned.total
                  )})`}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Info className="ml-2 h-4 w-4 hover:text-[#000]" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="p-3">
                    <div className="space-y-2">
                      <p className="font-semibold">Liquidation Value:</p>
                      <p>
                        {bangersOwned.total > 0
                          ? Array.from({ length: bangersOwned.total })
                              .reduce<number>((total, _, index) => {
                                const positionInCurve = data.supply - index;
                                const sellPrice =
                                  Math.pow(positionInCurve, 2) / 32000;
                                return total + sellPrice;
                              }, 0)
                              .toFixed(5)
                          : "0.00000"}{" "}
                        SOL
                        {solPrice && (
                          <span className="text-sm text-muted-foreground mt-1 px-1">
                            (
                            {formatUSD(
                              bangersOwned.total > 0
                                ? Array.from({
                                    length: bangersOwned.total,
                                  }).reduce<number>((total, _, index) => {
                                    const positionInCurve = data.supply - index;
                                    const sellPrice =
                                      Math.pow(positionInCurve, 2) / 32000;
                                    return total + sellPrice;
                                  }, 0)
                                : 0
                            )}
                            )
                          </span>
                        )}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-1 pb-1">
          <div
            className={`${styles.marketImageWrapper} ${
              expanded ? styles.expanded : ""
            }`}
            ref={imageWrapperRef}
          >
            <img
              ref={imageRef}
              className={styles.marketImage}
              src={data.media.imageUrl}
              alt="banger"
            />
          </div>
          {hasOverflow && (
            <Button
              className={styles.expand}
              onClick={toggleExpand}
              data-prevent-nprogress={true}
            >
              {expanded ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardContent>
        <CardFooter className={styles.marketCardDetails}>
          {showBangersOwned && (
            <div className="flex flex-col items-start">
              <p className="text-lg mb-0">
                Amount: {bangersOwned.total}
              </p>
              <div className="flex space-x-2">
                <p className="text-[#c0c0c0]">{bangersOwned.common}</p>
                <p>+</p>
                <p className="text-[#0070DD]">{bangersOwned.rare}</p>
                <p>+</p>
                <p className="text-[#A335EE]">{bangersOwned.epic}</p>
                <p>+</p>
                <p className="text-[#FF8000]">{bangersOwned.legendary}</p>
              </div>
            </div>
          )}
          <div className="flex flex-col space-y-0">
            <p className={styles.marketValue}>
              Price: {data.buyPrice.toFixed(5)} SOL&nbsp;
              <span>
                {solPrice && `(${formatUSD(Number(data.buyPrice.toFixed(5)))})`}
              </span>
            </p>
            <p className={styles.marketValue}>
              <span
                className={
                  data.priceChange24h === null
                    ? styles.neutral
                    : data.priceChange24h > 0
                    ? styles.positive
                    : styles.negative
                }
              >
                (
                {data.priceChange24h === null
                  ? "-"
                  : data.priceChange24h.toFixed(2)}
                %)
              </span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { MarketComponent };
