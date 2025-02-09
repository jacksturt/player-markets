import { Suspense } from "react";
import "./globals.css";
import ChatUI from "@/components/web/chat-ui";
import Providers from "./providers";

export const metadata = {
  title: "TradeTalk",
  description:
    "Trade, trash talk, and get paid. A new fantasy sports primitive launching at @mtndao for Superbowl LIX 🏈",
  metadataBase: new URL("https://tradetalk.fun"),
  openGraph: {
    title: "TradeTalk",
    description:
      "Trade, trash talk, and get paid. A new fantasy sports primitive launching at @mtndao for Superbowl LIX 🏈",
    images: [
      {
        url: "/og-image.png", // Add your OG image to public folder
        width: 1200,
        height: 630,
        alt: "TradeTalk Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeTalk",
    description:
      "Trade, trash talk, and get paid. A new fantasy sports primitive launching at @mtndao for Superbowl LIX 🏈",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="">
      <body className="min-h-screen bg-[url('/background.png')] bg-cover bg-center bg-fixed">
        {/* Dark overlay */}
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
