"use client";

import { Suspense } from "react";
import "./globals.css";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import ChatUI from "@/components/web/chat-ui";
import { ourFileRouter } from "./api/uploadthing/core";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="">
      <body className="min-h-screen bg-[url('/background.png')] bg-cover bg-center bg-fixed">
        {/* Dark overlay */}
        <SessionProvider>
          <ReactQueryProvider>
            <SolanaProvider>
              <TRPCReactProvider>
                <Toaster />
                <NextSSRPlugin
                  /**
                   * The `extractRouterConfig` will extract **only** the route configs
                   * from the router to prevent additional information from being
                   * leaked to the client. The data passed to the client is the same
                   * as if you were to fetch `/api/uploadthing` directly.
                   */
                  routerConfig={extractRouterConfig(ourFileRouter)}
                />
                <Suspense
                  fallback={
                    <div className="text-center my-32">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  }
                >
                  <main className="relative max-w-screen min-h-screen">
                    {children}
                    <ChatUI />
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
