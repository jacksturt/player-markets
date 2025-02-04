"use client";

import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import {
  SolanaProvider,
  WalletButton,
} from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider, useSession } from "next-auth/react";
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
import { useWallet } from "@solana/wallet-adapter-react";

const links: { label: string; path: string }[] = [
  { label: "Account", path: "/account" },
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
                    <AccountButtons />
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
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

function AccountButtons() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { data: session } = useSession();

  useEffect(() => {
    capsule.isSessionActive().then(setIsActive);
  }, [setIsActive, session, publicKey]);

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
      {pk.toBase58().slice(0, 4)}...{pk.toBase58().slice(-4)}
    </div>
  );
}
