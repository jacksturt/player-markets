"use client";
import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { UiLayout } from "@/components/ui/ui-layout";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";

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
      <body className="bg-zinc-900">
        <SessionProvider>
          <ReactQueryProvider>
            <ClusterProvider>
              <SolanaProvider>
                <TRPCReactProvider>
                  <main className="mx-auto max-w-[430px] min-h-screen bg-background">
                    {children}
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
