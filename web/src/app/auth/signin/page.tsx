// src/pages/auth/signin.tsx
"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { capsule } from "@/lib/capsule";
import "@usecapsule/react-sdk/styles.css";
import { OAuthMethod } from "@usecapsule/react-sdk";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
const CapsuleModal = dynamic(
  () => import("@usecapsule/react-sdk").then((mod) => mod.CapsuleModal),
  { ssr: false }
);

export default function SignIn() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/");
      return;
    }

    let isMounted = true;

    const checkCapsuleSession = async () => {
      debugger;
      try {
        console.log("checkCapsuleSession");
        const isActive = await capsule.isSessionActive();
        console.log("isActive", isActive);
        if (isActive && isMounted) {
          console.log("handleCapsuleSetup");
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
      console.log("handleCapsuleSetup");
      const { data } = await capsule.userSetupAfterLogin();

      const serializedSession = await capsule.exportSession();
      console.log("serializedSession", serializedSession);
      const email = capsule.getEmail();
      const publicKey = capsule.getAddress();
      const result = await signIn("capsule", {
        userId: (data as any).userId,
        email,
        publicKey,
        serializedSession,
        redirect: false,
      });
      console.log("result", result);
      if (result?.error) {
        console.error("NextAuth sign in failed:", result.error);
      } else if (result?.ok) {
        router.push("/");
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
          router.push("/");
        }}
        appName="Your App Name"
        oAuthMethods={[OAuthMethod.GOOGLE]}
      />
    </div>
  );
}
