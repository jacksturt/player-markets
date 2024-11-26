import styles from "@/styles/Leaderboard.module.scss";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/server/user";
import { FeedContent } from "./content";

async function Feed() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className={styles.main}><Navbar />Login Required</div>;
  }

  const hasAlphaAccess = user?.metadata?.alphaAccess === true || false;
  if (!hasAlphaAccess) {
    return <div className={styles.main}><Navbar />Invite Required</div>;
  }

  return (
    <div className={styles.main}>
      <Navbar />
      <FeedContent />
    </div>
  );
}

export default Feed;