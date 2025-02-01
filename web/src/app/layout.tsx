"use client";

import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import {
  SolanaProvider,
  WalletButton,
} from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import Footer from "@/components/ui/footer";
import { Toaster } from "react-hot-toast";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { capsule } from "@/lib/capsule";
import { Button } from "@/components/ui/button";
import { PublicKey } from "@solana/web3.js";
import { IconCopy } from "@tabler/icons-react";
import Link from "next/link";

const links: { label: string; path: string }[] = [
  { label: "Account", path: "/account" },
  { label: "Clusters", path: "/clusters" },
  { label: "Web Program", path: "/web" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background overflow-x-hidden">
      <body className="bg-zinc-900">
        <SessionProvider>
          <ReactQueryProvider>
            <ClusterProvider>
              <SolanaProvider>
                <TRPCReactProvider>
                  <Toaster />
                  <div className="navbar  text-neutral-content">
                    <div className="flex-1">
                      <Link
                        className="btn btn-ghost normal-case text-xl"
                        href="/"
                      >
                        {/* <img className="h-4 md:h-6" alt="Logo" src="/logo.png" /> */}
                        TRADETALK
                      </Link>
                    </div>
                    <div className="flex-none space-x-2">
                      <CapsuleAccountInfo />
                      <WalletButton />
                    </div>
                  </div>
                  <Suspense
                    fallback={
                      <div className="text-center my-32">
                        <span className="loading loading-spinner loading-lg"></span>
                      </div>
                    }
                  >
                    <main className="relative  max-w-screen min-h-screen bg-background">
                      {children}
                    </main>
                    <Footer />
                  </Suspense>
                </TRPCReactProvider>
              </SolanaProvider>
            </ClusterProvider>
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
function CapsuleAccountInfo() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    capsule.isSessionActive().then(setIsActive);
  }, [capsule]);

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
  const pk = new PublicKey(capsule.getAddress()!);
  return (
    <div
      className="btn btn-primary flex flex-row gap-2 h-full"
      onClick={() => {
        navigator.clipboard.writeText(pk.toBase58());
      }}
    >
      <IconCopy />
      {pk.toBase58().slice(0, 4)}...{pk.toBase58().slice(-4)}
    </div>
  );
}
