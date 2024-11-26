"use client";
import Image from "next/image";
import styles from "@/styles/Onboarding.module.scss";
import Banger from "@/assets/images/banger.svg";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserProfileWithMetadata } from "@/types/db-client";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { joinWithInvite } from "@/server/invite";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, getFollowSuggestions } from "@/server/user";
import { AuthErrorDialog } from "./authError";
import { TopTradesUser } from "@/types/queries";

function OnboardingPage({
  setShowOnboarding,
}: {
  setShowOnboarding?: (showOnboarding: boolean) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [user, setUser] = useState<UserProfileWithMetadata | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [suggestions, setSuggestions] = useState<TopTradesUser[]>([]);

  useEffect(() => {
    async function fetchUser() {
      setAuthLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser?.metadata?.alphaAccess && setShowOnboarding) {
          setShowOnboarding(false);
        } else if (currentUser?.metadata?.alphaAccess) {
          router.refresh();
        }
      }
      setAuthLoading(false);
    }
    fetchUser();
  }, [supabase, router]);

  useEffect(() => {
    async function fetchSuggestions() {
      const suggestions = await getFollowSuggestions();
      console.log("suggestions", suggestions);
      setSuggestions(suggestions);
    }
    fetchSuggestions();
  }, []);

  const login = () => {
    supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  async function join() {
    setLoading(true);
    const invite = await joinWithInvite(inviteCode);
    if (invite === null) {
      setLoading(false);
      toast({ title: "Invalid invite code", variant: "destructive" });
      return;
    }
    toast({
      title: "Invite accepted",
      description: "Welcome to Banger",
      duration: 10000,
    });
    setJoined(true);
    setLoading(false);
  }

  if (authLoading) {
    return (
      <div className={styles.main}>
        <div className={styles.content}>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.metadata?.alphaAccess) {
    return null;
  }

  return (
    <>
      <div className={styles.main}>
        <div className={styles.content}>
          <Image src={Banger} alt="banger" className={styles.mainImage} />
          {!user && (
            <Button className={styles.signInButton} onClick={login}>
              Sign in with Twitter / X
            </Button>
          )}
          {user && !joined && (
            <div>
              <p className={styles.inviteCode}>Enter an invite code to join</p>
              <Input
                placeholder="Invite Code"
                className={styles.input}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button
                className={styles.signInButton}
                onClick={join}
                disabled={inviteCode.length === 0 || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join
              </Button>
            </div>
          )}
          {joined && (
            <div>
              <p className={styles.inviteCode}>
                Welcome to Banger!
              </p>
              <Button
                onClick={() => window.location.reload()}
                className={styles.signInButton}
              >
                Go to Leaderboard
              </Button>
            </div>
          )}
        </div>
      </div>
      <AuthErrorDialog />
    </>
  );
}

export { OnboardingPage };
