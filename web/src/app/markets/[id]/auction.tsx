"use client";
import styles from "@/styles/Markets.module.scss";
import Countdown from 'react-countdown';
import { MarketPageData } from "@/types/queries";

function Renderer({ hours, minutes, seconds, completed }: {
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}) {
  "use client";
  if (completed) {
    // Render a completed state
    return <>Auction Completed</>;
  }
  // Render a countdown
  return (
    <div className={styles.countdown}>
      <div className={styles.countdownLabels}>
        <span>{hours}h</span>
      </div>
      <div className={styles.countdownLabels}>
        <span>{minutes}m</span>
      </div>
      <div className={styles.countdownLabels}>
        <span>{seconds}s</span>
      </div>
    </div>
  );
}

function AuctionContent({
  initData
}: {
  initData: MarketPageData;
}) {
  "use client";
  const timeLeft = new Date(new Date(initData.createdAt).getTime() + 24 * 60 * 60 * 1000);

  return (
    <div className={styles.auctionContent}>
      <div className={styles.auctionInnerContent}>
        <h1 className={styles.heading}>Auction</h1>

        <div className={styles.auctionDetails}>
          <Countdown date={timeLeft} renderer={Renderer} />
        </div>

      </div>
    </div>
  );
}

export { AuctionContent };