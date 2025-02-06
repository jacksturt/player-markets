// src/pages/auth/signin.tsx
"use client";
import { useEffect, useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { capsule } from "@/lib/capsule";
import "@usecapsule/react-sdk/styles.css";
import { OAuthMethod } from "@usecapsule/react-sdk";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
const CapsuleModal = dynamic(
  () => import("@usecapsule/react-sdk").then((mod) => mod.CapsuleModal),
  { ssr: false }
);
import { ExternalWallet } from "@usecapsule/react-sdk";
import { useWallet } from "@solana/wallet-adapter-react";

function SignInContent() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const handleCapsuleSetup = async () => {
    try {
      const { data } = await capsule.userSetupAfterLogin();

      const serializedSession = await capsule.exportSession();
      const email = capsule.getEmail();
      const capsulePublicKey = capsule.getAddress();
      if (!!publicKey || !!capsulePublicKey) {
        const signInKey = publicKey ?? capsulePublicKey;
        const result = await signIn("capsule", {
          email: email,
          publicKey: signInKey,
          capsuleUserId: (data as any).userId ?? "undefined",
          serializedSession,
          redirect: false,
        });
        if (result?.error) {
          console.error("NextAuth sign in failed:", result.error);
        } else if (result?.ok) {
          router.push(callbackUrl);
        }
      }
    } catch (error) {
      console.error("Error during Capsule setup:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkCapsuleSession = async () => {
      try {
        const isActive = await capsule.isSessionActive();
        console.log("isActive", isActive, isMounted);
        if (isActive && isMounted) {
          await handleCapsuleSetup();
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkCapsuleSession();
  }, [publicKey]);

  return (
    <div>
      <CapsuleModal
        capsule={capsule}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          handleCapsuleSetup();
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
