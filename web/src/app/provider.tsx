"use client";
import posthog from 'posthog-js';
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster"
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { PostHogProvider } from 'posthog-js/react';
import "@solana/wallet-adapter-react-ui/styles.css";
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';


export function Providers({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    })
  }

  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <UnifiedWalletProvider
          wallets={[]}
          config={{
            autoConnect: true,
            env: "mainnet-beta",
            metadata: {
              name: "Banger",
              description: "Bet on memes",
              url: "https://banger.lol",
              iconUrls: ["https://banger.lol/favicon.ico"],
            },
            notificationCallback: {
              onConnect: props => {},
              onConnecting: props => {},
              onDisconnect: props => {},
              onNotInstalled: props => {},
            },
            walletlistExplanation: {
              href: "https://station.jup.ag/docs/additional-topics/wallet-list",
            },
            theme: "dark",
            lang: "en",
          }}
        >
          <Toaster />
          {children}
          <ProgressBar
            height="4px"
            color="#f2c1fb"
            options={{ showSpinner: false }}
            shallowRouting
          />
        </UnifiedWalletProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}