"use client";

import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import Footer from "@/components/ui/footer";
import { Toaster } from "react-hot-toast";
import Banner from "@/components/home/banner";
import Navbar from "@/components/shared/navbar";

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
    <html lang="en" className="bg-background">
      <body className="h-screen overflow-hidden bg-[url('/background.png')] bg-cover bg-center bg-fixed">
        {/* Dark overlay */}
        <SessionProvider>
          <ReactQueryProvider>
            <ClusterProvider>
              <SolanaProvider>
                <TRPCReactProvider>
                  <Toaster />
                  <main className="relative max-w-screen h-full flex flex-col">
                    <Banner />
                    <div className="flex-1 overflow-y-auto">{children}</div>
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
