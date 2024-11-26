import { LaunchMarketPage } from "./content";
import { getCurrentUser } from "@/server/user";
import { Navbar } from "@/components/navbar";
import styles from "@/styles/Leaderboard.module.scss";

async function LaunchMarket() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className={styles.main}><Navbar />Login Required</div>;
  }

  const hasAlphaAccess = user?.metadata?.alphaAccess === true || false;
  if (!hasAlphaAccess) {
    return <div className={styles.main}><Navbar />Invite Required</div>;
  }
  return <LaunchMarketPage />;
}

export default LaunchMarket;