import { Activity } from "@/types/queries";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import styles from "@/styles/Leaderboard.module.scss";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

function ActivityComponent({ data, solPrice }: { data: Activity; solPrice: number | null }) {
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

  function returnType(type: Activity["activityType"]) {
    switch (type) {
      case "MINT":
        return "minted";
      case "BURN":
        return "burned";
      case "AUTHOR":
        return "authored";
      case "LAUNCH":
        return "launched";
    }
  }

  return (
    <Link
      href={`/markets/${data.market.tweetId}`}
      className={styles.marketCardParent}
    >
      <Card className={styles.marketCard}>
        <CardHeader
          className={`${styles.activityDetails} flex flex-row justify-between items-center`}
        >
            {data.activityType === "LAUNCH" ? (
              <p>
                @{data.user.username} launched @{data.market.authorUsername}&apos;s tweet
              </p>
            ) : (
              <p>
                @{data.user.username} {returnType(data.activityType)}
              </p>
            )}
            <p className={styles.smallText}>
              {data.createdAt.toLocaleString()}
            </p>
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
              src={data.market.media.imageUrl}
              alt="banger"
            />
          </div>
          {hasOverflow && (
            <Button
              className={styles.activityExpand}
              onClick={toggleExpand}
              data-prevent-nprogress={true}
            >
              {expanded ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="4-4 w-4" />
              )}
            </Button>
          )}
        </CardContent>
        <CardFooter className={styles.marketCardDetails}>
          <div className="flex flex-col space-y-0">
            <p className={styles.marketValue}>
              <span>
                Price: {data.market.buyPrice}{" "}
                ({formatUSD(Number(data.market.buyPrice))})
              </span>
            </p>
            <p className={styles.marketValue}>
            <span
                className={
                  data.market.priceChange24h === null
                    ? styles.neutral
                    : data.market.priceChange24h > 0
                    ? styles.positive
                    : styles.negative
                }
              >
                (
                {data.market.priceChange24h === null
                  ? "-"
                  : data.market.priceChange24h.toFixed(2)}
                %)
              </span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { ActivityComponent };
