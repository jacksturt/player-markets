"use client";

import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import Footer from "@/components/ui/footer";
import { Toaster } from "react-hot-toast";

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

                  <main className="relative  max-w-screen min-h-screen bg-background">
                    {children}
                    <Footer />
                  </main>
                </TRPCReactProvider>
              </SolanaProvider>
            </ClusterProvider>
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
