"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { capsule } from "@/lib/capsule";
import { shortenAddress } from "@/lib/utils";
import { IconCopy } from "@tabler/icons-react";
import { WalletButton } from "@/components/solana/solana-provider";

export default function AccountButtons() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey, wallet } = useWallet();
  const { data: session } = useSession();

  useEffect(() => {
    capsule.isSessionActive().then(setIsActive);
  }, [setIsActive, session, publicKey]);

  useEffect(() => {
    if (
      session?.user.wallets &&
      session?.user.wallets[0] !== publicKey?.toBase58() &&
      pathname !== "/auth/signin"
    ) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [session, publicKey, router, pathname]);

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

  if (!isActive) {
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
  try {
    const pk = new PublicKey(capsule.getAddress()!);
  } catch (e) {
    return null;
  }

  const pk = new PublicKey(capsule.getAddress()!);
  return (
    <div
      className="btn btn-primary flex flex-row gap-2 h-full"
      onClick={() => {
        navigator.clipboard.writeText(pk.toBase58());
      }}
    >
      <IconCopy />
      {shortenAddress(pk)}
    </div>
  );
}
