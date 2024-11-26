import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GiftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
// import { handleClaimRewards } from "@/lib/on-chain/claim";
import { Wallet } from "@coral-xyz/anchor";
import { useToast } from "../ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

function ClaimBox({
  claimableBalance,
  twitterId,
}: {
  claimableBalance: number;
  twitterId: string;
}) {
  const { toast } = useToast();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <GiftIcon className="h-[1.8rem] w-[1.8rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <GiftIcon className="absolute h-[1.8rem] w-[1.8rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-90" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Rewards</DialogTitle>
          <DialogDescription>
            Available rewards to be claimed: {claimableBalance} SOL
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={async () => {
              // const signature = await handleClaimRewards(twitterId, wallet, anchorWallet as Wallet, toast);
              // if (signature) {
              //   toast({
              //     title: "Transaction successful",
              //     action: (
              //       <ToastAction altText="View Transaction on Explorer" onClick={() => {
              //         window.open(`https://solscan.io/tx/${signature}`, "_blank");
              //       }}>View Transaction</ToastAction>
              //     ),
              //   });
              // }
            }}
          >
            Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ClaimBox };