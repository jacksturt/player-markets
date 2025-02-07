"use client";

import { Suspense } from "react";
import "./globals.css";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="h-screen bg-[url('/background.png')] bg-cover bg-center bg-fixed">
        {/* Dark overlay */}
        <SessionProvider>
          <ReactQueryProvider>
            <SolanaProvider>
              <TRPCReactProvider>
                <Toaster />
                <Suspense
                  fallback={
                    <div className="text-center my-32">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  }
                >
                  <main className="relative max-w-screen min-h-screen">
                    {children}
                  </main>
                </Suspense>
              </TRPCReactProvider>
            </SolanaProvider>
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
