"use client";
import styles from "@/styles/Leaderboard.module.scss";
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { LeaderboardContent } from "./content";
import { OnboardingPage } from "@/components/custom/onboarding";
import { UserProfileWithMetadata } from "@/types/db-client";
import { Collector, Creator } from "@/types/table";

function LeaderboardGatedContent({
  user,
  creators,
  collectors,
}: {
  user: UserProfileWithMetadata | null;
  creators: Creator[];
  collectors: Collector[];
}) {
  /*
  const [showOnboarding, setShowOnboarding] = useState(user === null);

  if (showOnboarding) {
    return <OnboardingPage setShowOnboarding={setShowOnboarding} />;
  }
  */

  return (
    <div className={styles.main}>
      <Navbar />
      <LeaderboardContent
        creators={creators}
        collectors={collectors}
      />
    </div>
  );
}

export default LeaderboardGatedContent;