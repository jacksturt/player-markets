"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { para } from "@/lib/para";
import { shortenAddress } from "@/lib/utils";
import { IconCopy } from "@tabler/icons-react";
import { WalletButton } from "@/components/solana/solana-provider";

export default function AccountButtons() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey, wallet } = useWallet();
  const { data: session } = useSession();

  if (publicKey) {
    return <WalletButton />;
  }

  if (!session) {
    return (
      <Button
        onClick={() => {
          console.log("redirecting to signin");
          router.push(
            `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
          );
        }}
      >
        Sign in
      </Button>
    );
  }
}
