"use client";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import styles from "@/styles/Navbar.module.scss";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathname } from "next/navigation";
import { UserProfileWithMetadata } from "@/types/db-client";
import { getCurrentUser, getUser } from "@/server/user";
import { createClient } from "@/lib/supabase/client";
import { joinWithInvite } from "@/server/invite";
import { useToast } from "../ui/use-toast";
import { Loader2 } from "lucide-react";
import { OnboardingFollow } from "./onboarding-follow";
import { TopTradesUser } from "@/types/queries";
import { getFollowSuggestions } from "@/server/user";

export function Join() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<TopTradesUser[]>([]);

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const invite = await joinWithInvite(inviteCode);
    if (invite === null) {
      setLoading(false);
      toast({ title: "Invalid invite code", variant: "destructive" });
      return;
    }
    const users = await getFollowSuggestions();
    setSuggestedUsers(users);

    toast({
      title: "Invite accepted",
      description: "Welcome to Banger",
      duration: 10000,
    });
    setLoading(false);
    setIsOpen(false);
    setShowOnboarding(true);
  }

  return (
    <div className="relative">
      {!isOpen && !showOnboarding && (
        <button
          className={styles.feedbackButton}
          onClick={() => setIsOpen(true)}
        >
          Join
        </button>
      )}
      {isOpen && !showOnboarding && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-[500px] relative z-50">
            <CardHeader>
              <CardTitle>Join Banger</CardTitle>
            </CardHeader>
            <form onSubmit={handleJoinSubmit}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-3">
                    <Label htmlFor="join">Invite Code</Label>
                    <Input
                      id="join"
                      placeholder="Enter a valid invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-gray-100 hover:text-black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#f2c1fb] hover:bg-[#e0a5e8]"
                  disabled={inviteCode.length === 0 || loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Join
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
      {showOnboarding && (
        <OnboardingFollow
          initialSuggestedUsers={suggestedUsers}
          onComplete={() => window.location.reload()}
        />
      )}
    </div>
  );
}
