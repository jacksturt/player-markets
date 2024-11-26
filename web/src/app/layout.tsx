import "@/styles/globals.scss";
import { Providers } from "./provider";
import { Rubik } from "next/font/google";
import { Feedback } from "@/components/custom/feedback";
import type { Metadata } from "next";

const rubik = Rubik({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Banger",
    template: `Banger - %s`,
  },
  description: "Buy and Sell tweets",
  openGraph: {
    title: "Banger",
    description: "Buy and Sell tweets",
    siteName: "Banger",
    images: [
      {
        url: "https://i.imgur.com/UuzXklS.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
    locale: "en_US",
    url: "https://banger.lol",
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "https://i.imgur.com/UuzXklS.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={rubik.className} suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}