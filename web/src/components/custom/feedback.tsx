"use client";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import styles from "@/styles/Navbar.module.scss";
import * as React from "react";
import ScrollToTop from "./scroll-to-top";

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

export function Feedback() {
  const posthog = usePostHog();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  React.useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const currentUser = await getCurrentUser();
        setShowFeedback(!!currentUser?.metadata?.alphaAccess);
      }
    }
    fetchUser();
  }, [supabase]);

  if (!showFeedback) {
    return null;
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    posthog.capture("survey sent", {
      $survey_id: "019190de-50f3-0000-3b84-93e66650ec68",
      $survey_response: feedback,
    });
    setIsOpen(false);
    setFeedback("");
  };

  return (
    <div className="relative">
      {!isOpen && (
        <button
          className={styles.feedbackButton}
          onClick={() => setIsOpen(true)}
        >
          Feedback
        </button>
      )}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-[500px] relative z-50">
            <CardHeader>
              <CardTitle>How can we improve Banger?</CardTitle>
            </CardHeader>
            <form onSubmit={handleFeedbackSubmit}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-3">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Input
                      id="feedback"
                      placeholder="Enter your feedback here"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
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
                >
                  Send
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
