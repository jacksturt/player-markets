"use client";
import styles from "@/styles/CreateMarket.module.scss";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createMarketAction } from "@/server/markets";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function LaunchMarketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tweet, setTweet] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateMarket() {
    if (!tweet) {
      toast({ title: "Please enter a tweet link" });
      return;
    }

    let tweetId = tweet.split("/")[tweet.split("/").length - 1];
    if (tweetId.includes("?")) {
      tweetId = tweetId.split("?")[0];
    }
    if (!/^\d+$/.test(tweetId)) {
      toast({ title: "Invalid tweet ID" });
      return;
    }

    setLoading(true);
    toast({ title: "Creating the market for this tweet" });

    try {
      const market = await createMarketAction(tweet);

      if (market.type !== "success") {
        toast({ title: "Error", description: market.message });
      } else {
        toast({ title: "Success", description: market.message });
        router.push(`/markets/${market.market?.tweetId}`);
        return;
      }

    } catch (error: any) {
      toast({ title: "Error", description: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.innerContent}>
          <h1 className={styles.heading}>Launch a new banger market</h1>
          <div className={styles.inputContainer}>
            <Input
              placeholder="Tweet Link"
              className={styles.tweetInput}
              value={tweet}
              onChange={(e) => setTweet(e.target.value)}
            />
            <Button disabled={loading || !tweet} onClick={handleCreateMarket}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <></>
              )}
              {loading ? "Launching" : "Launch"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LaunchMarketPage };
