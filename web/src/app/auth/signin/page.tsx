// src/pages/auth/signin.tsx
"use client";
import { useEffect, useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { para } from "@/lib/para";
import "@getpara/react-sdk/styles.css";
import { OAuthMethod } from "@getpara/react-sdk";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
const ParaModal = dynamic(
  () => import("@getpara/react-sdk").then((mod) => mod.ParaModal),
  { ssr: false }
);
import { ExternalWallet } from "@getpara/react-sdk";
import { useWallet } from "@solana/wallet-adapter-react";

function SignInContent() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const handleparaSetup = async () => {
    try {
      const userId = await para.getUserId();
      console.log("userId", userId);

      const serializedSession = await para.exportSession();
      const email = para.getEmail();
      const paraPublicKey = para.getAddress();
      if (!!publicKey || !!paraPublicKey) {
        const signInKey = publicKey ?? paraPublicKey;
        const result = await signIn("para", {
          email: email,
          publicKey: signInKey,
          paraUserId: userId ?? "undefined",
          serializedSession,
          redirect: false,
        });
        if (result?.error) {
          console.error("NextAuth sign in failed:", result.error);
        } else if (result?.ok) {
          if (callbackUrl === "/") {
            return;
          } else {
            router.push(callbackUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error during para setup:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkparaSession = async () => {
      try {
        const isActive = await para.isSessionActive();
        console.log("isActive", isActive, isMounted);
        if (isActive && isMounted) {
          await handleparaSetup();
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkparaSession();
  }, [publicKey]);

  return (
    <div>
      <ParaModal
        para={para}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          handleparaSetup();
          router.push(callbackUrl);
        }}
        appName="Your App Name"
        oAuthMethods={[OAuthMethod.GOOGLE]}
        externalWallets={[
          ExternalWallet.PHANTOM,
          ExternalWallet.GLOW,
          ExternalWallet.BACKPACK,
        ]}
      />
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
