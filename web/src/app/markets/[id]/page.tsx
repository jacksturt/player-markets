import styles from "@/styles/Markets.module.scss";
import { Navbar } from "@/components/navbar";
import { MarketContent } from "./content";
import { redirect } from "next/navigation";
import { getMarketData } from "@/server/markets";
import { getCurrentUser } from "@/server/user";
import { Metadata } from "next";
import { RESIZER_URL } from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const data = await getMarketData(id);

  if (!data) {
    return {
      title: "Market Not Found",
      description: "The market you are looking for does not exist.",
    };
  }

  return {
    title: `Market`,
    description: "Check out this market on Banger.lol",
    openGraph: {
      title: `Market`,
      description: "Check out this market on Banger.lol",
      url: `https://banger.lol/markets/${data.tweetId}`,
      images: [
        {
          url: data.media.imageUrl,
          alt: `Banger's Market Page`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Banger`,
      description: "Check out this market on Banger.lol",
      images: [
        {
          url: `${RESIZER_URL}/resize?url=${data.media.imageUrl}`,
          alt: `Banger's Market Page`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

async function Market({ params }: { params: { id: string } }) {
  const { id } = params;
  const data = await getMarketData(id);
  const currentUser = await getCurrentUser();

  if (!data) {
    redirect("/");
  }

  return (
    <div className={styles.main}>
      <Navbar wide={true} />
      <MarketContent initData={data} user={currentUser} />
    </div>
  );
}

export default Market;
