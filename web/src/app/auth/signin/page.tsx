"use client";
import { useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/solana/solana-provider";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    console.log("session", session);

    if (session?.user) {
      router.push(callbackUrl);
    }
    if (publicKey && session && !session.user) {
      debugger;

      const signInHandler = async () => {
        const res = await signIn("wallet", {
          publicKey,
        });
        if (res?.error) {
          console.error("Error signing in:", res.error);
        } else {
          router.push(callbackUrl);
        }
      };
      signInHandler();
    }
  }, [publicKey, session]);

  return (
    <div>
      <WalletButton />
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
