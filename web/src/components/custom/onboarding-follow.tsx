"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { followUser, getCurrentUser, unfollowUser } from "@/server/user";
import { TopTradesUser } from "@/types/queries";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OnboardingFollowProps {
  initialSuggestedUsers: TopTradesUser[];
  onComplete?: () => void;
}

export function OnboardingFollow({
  initialSuggestedUsers,
  onComplete,
}: OnboardingFollowProps) {
  const { toast } = useToast();

  // Tracks temporary follows during onboarding
  const [tempFollowedUsers, setTempFollowedUsers] = useState<Set<string>>(
    new Set()
  );
  const [suggestedUsers] = useState<TopTradesUser[]>(initialSuggestedUsers);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  const supabase = createClient();

  // Add useEffect to automatically grant access if no suggested users
  useEffect(() => {
    async function grantAccessIfNoUsers() {
      if (!suggestedUsers || suggestedUsers.length === 0) {
        try {
          const user = await getCurrentUser();
          if (!user) throw new Error("User not found");

          const existingMetadata = user.metadata;
          const { error: alphaError } = await supabase
            .from("UserProfile")
            .update({
              metadata: {
                ...existingMetadata,
                alphaAccess: true,
                followRequirementMet: true,
              },
            })
            .match({ id: user?.id })
            .single();

          if (alphaError) throw alphaError;

          toast({
            title: "Welcome to Banger!",
            description: "You now have full access",
            duration: 5000,
          });

          onComplete?.();
          window.location.reload();
        } catch (error) {
          toast({
            title: "Error granting access",
            variant: "destructive",
          });
        }
      }
    }

    grantAccessIfNoUsers();
  }, [suggestedUsers, onComplete]); // Add dependencies

  async function handleFollowToggle(userId: string) {
    try {
      setFollowLoading(userId);

      if (tempFollowedUsers.has(userId)) {
        // Unfollow
        await unfollowUser(userId);
        setTempFollowedUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast({
          title: "Unfollowed user",
          variant: "default",
        });
      } else {
        // Follow
        await followUser(userId);
        setTempFollowedUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
        toast({
          title: "Successfully followed user",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: tempFollowedUsers.has(userId)
          ? "Failed to unfollow user"
          : "Failed to follow user",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(null);
    }
  }

  async function handleContinue() {
    if (tempFollowedUsers.size >= 3) {
      try {
        // First update alpha access
        const user = await getCurrentUser();
        if (!user) throw new Error("User not found");
        const existingMetadata = user.metadata;

        const { error: alphaError } = await supabase
          .from("UserProfile")
          .update({
            metadata: {
              ...existingMetadata,
              alphaAccess: true,
              followRequirementMet: true,
            },
          })
          .match({ id: user?.id })
          .single();

        if (alphaError) throw alphaError;

        toast({
          title: "Welcome to Banger!",
          description: "You now have full access",
          duration: 5000,
        });

        onComplete?.();
        window.location.reload();
      } catch (error) {
        toast({
          title: "Error granting access",
          variant: "destructive",
        });
      }
    }
  }

  // // Add early return with message if no users
  // if (!suggestedUsers || suggestedUsers.length === 0) {
  //   return (
  //     <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
  //       <div className="rounded-lg p-8 max-w-5xl w-full mx-4">
  //         <h1 className="text-4xl font-bold text-center mb-2 text-[#f2c1fb]">
  //           Welcome to Banger
  //         </h1>
  //         <h1 className="text-3xl font-bold text-center mb-4 text-[#f2c1fb]">
  //           Mint and burn tweets
  //         </h1>
  //         <div className="flex justify-center">
  //           <Loader2 className="h-8 w-8 animate-spin text-[#f2c1fb]" />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen flex flex-col">
        <div className="flex-none">
          <h1 className="text-3xl font-bold text-center mb-2">
            Welcome to Banger!
          </h1>
          <h2 className="text-xl text-center mb-4">
            Follow at least 3 users to continue
          </h2>
          <p className="text-center text-lg text-white mb-4">
            Following {tempFollowedUsers.size}/3 required users
          </p>
        </div>

        {suggestedUsers.length === 0 ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedUsers.map((item) => (
                  <Card key={item.user.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="flex-shrink-0 h-12 w-12">
                        <AvatarImage
                          src={item.user.image || ""}
                          onError={(e) => {
                            e.currentTarget.src = `https://source.boringavatars.com/beam/120/${item.user.username}?colors=F2C1FB,000000`;
                          }}
                        />
                        <AvatarFallback>
                          {item.user.username?.substring(0, 2).toUpperCase() ||
                            "UN"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-lg">
                          @{item.user.username}
                        </p>
                        <p className="text-base text-gray-500">
                          {item.tradeCount} trades this week
                        </p>
                      </div>
                      <Button
                        onClick={() => handleFollowToggle(item.user.id)}
                        disabled={followLoading === item.user.id}
                        variant={
                          tempFollowedUsers.has(item.user.id)
                            ? "secondary"
                            : "outline"
                        }
                        className={`flex-shrink-0 whitespace-nowrap text-base ${
                          tempFollowedUsers.has(item.user.id)
                            ? "bg-[#f2c1fb] text-black hover:bg-[#e0a5e8]"
                            : ""
                        }`}
                      >
                        {followLoading === item.user.id && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        {tempFollowedUsers.has(item.user.id)
                          ? "Following"
                          : "Follow"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex-none text-center pt-2">
              <Button
                onClick={handleContinue}
                disabled={tempFollowedUsers.size < 3}
                className="bg-[#f2c1fb] hover:bg-[#e0a5e8] disabled:opacity-50 text-xl p-8 cursor-pointer"
              >
                Go to Leaderboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
