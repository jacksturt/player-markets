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

function SignInContent() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    let isMounted = true;

    const checkCapsuleSession = async () => {
      try {
        const isActive = await capsule.isSessionActive();
        if (isActive && isMounted) {
          await handleCapsuleSetup();
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkCapsuleSession();
  }, []);

  const handleCapsuleSetup = async () => {
    try {
      const { data } = await capsule.userSetupAfterLogin();

      const serializedSession = await capsule.exportSession();
      const email = capsule.getEmail();
      const publicKey = capsule.getAddress();
      const result = await signIn("capsule", {
        userId: (data as any).userId,
        email,
        publicKey,
        serializedSession,
        redirect: false,
      });
      if (result?.error) {
        console.error("NextAuth sign in failed:", result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error("Error during Capsule setup:", error);
    }
  };

  return (
    <div>
      <CapsuleModal
        capsule={capsule}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.push(callbackUrl);
        }}
        appName="Your App Name"
        oAuthMethods={[OAuthMethod.GOOGLE]}
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
