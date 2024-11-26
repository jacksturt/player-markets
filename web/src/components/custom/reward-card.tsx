// RewardsCard.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

interface RewardsCardProps {
  title: string;
  score?: number;
  claimable: number;
  onClaim: () => Promise<string | undefined>;
  loading: boolean;
}

const RewardsCard: React.FC<RewardsCardProps> = ({
  title,
  score,
  claimable,
  onClaim,
  loading,
}) => {
  // NEW: Track local loading state to prevent double clicks
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClaim = async () => {
    if (isProcessing) return; // Prevent double clicks

    try {
      setIsProcessing(true);
      const signature = await onClaim();

      if (signature) {
        // Show toast only after successful claim
        toast({
          title: "Claimed rewards!",
          action: (
            <ToastAction
              altText="View transaction"
              onClick={() => {
                window.open(`https://solscan.io/tx/${signature}`, "_blank");
              }}
            >
              View Transaction
            </ToastAction>
          ),
        });
      }
    } catch (error) {
      toast({
        title: "Failed to claim rewards",
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-[#f2c1fb] w-[430px] group hover:bg-[#f2c1fb] hover:text-black">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {score !== undefined && <p>Score: {score}</p>}
        <p>Claimable: {claimable} SOL</p>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button
          className="group-hover:bg-black group-hover:text-white"
          disabled={claimable <= 0 || loading || isProcessing}
          onClick={handleClaim}
        >
          {(loading || isProcessing) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {loading || isProcessing ? "Claiming..." : "Claim"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardsCard;
