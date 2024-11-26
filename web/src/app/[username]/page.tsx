import styles from "@/styles/Profile.module.scss";
import { Navbar } from "@/components/navbar";
import { getCurrentUser, getUser } from "@/server/user";
import { redirect } from "next/navigation";
import { ProfileContent } from "./content";

async function Profile({ params }: { params: { username: string } }) {
  const user = await getUser(params.username);
  const currentUser = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.content}>
        <ProfileContent data={user} currentUser={currentUser} />
      </div>
    </div>
  );
}

export default Profile;