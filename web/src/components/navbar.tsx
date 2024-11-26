"use client";
import React from "react";
import styles from "@/styles/Navbar.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { createClient } from "@/lib/supabase/client";
import { useWindowSize } from "@react-hook/window-size";
import { OnboardingFollow } from "./custom/onboarding-follow";

// shadcn/ui components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// other components
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { SearchComponent } from "./custom/search";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { Feedback } from "./custom/feedback";
import { AuthErrorDialog } from "./custom/authError";
import { getCurrentUser, getFollowSuggestions } from "@/server/user";
import { TopTradesUser } from "@/types/queries";
import { Join } from "./custom/join";

const navLinks = [
  { name: "🏆Leaderboard", href: "/" },
  { name: "🔥Feed", href: "/feed" },
  { name: "🚀Launch", href: "/launch" },
  { name: "📜Info", href: "https://banger.gitbook.io", target: "_blank" },
];

function Navbar({ wide = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [width, _] = useWindowSize();
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hideNavLinks, setHideNavLinks] = useState(false);
  const [hideSearch, setHideSearch] = useState(false);
  const [hasAlphaAccess, setHasAlphaAccess] = useState(false);
  const [hasInvite, setHasInvite] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<TopTradesUser[]>([]);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestedUsers() {
      if (user && !hasAlphaAccess && hasInvite) {
        try {
          const users = await getFollowSuggestions();
          if (!users || users.length === 0) {
            console.error("No users returned from getFollowSuggestions");
          }
          setSuggestedUsers(users);
        } catch (error) {
          console.error("Error fetching suggested users:", error);
        }
      }
    }
    fetchSuggestedUsers();
  }, [user, hasAlphaAccess, hasInvite]);

  useEffect(() => {
    setIsClient(true);
    setHideNavLinks(width <= 1100);
    setHideSearch(width <= 700);
  }, [width]);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const currentUser = await getCurrentUser();
        setHasAlphaAccess(currentUser?.metadata?.alphaAccess || false);
        setHasInvite(!!currentUser?.inviteId);
        setUserLoading(false);
      }
    }
    fetchUser();
  }, [supabase]);

  const login = () => {
    const redirectUrl = `${
      typeof window !== "undefined" ? window.location.href : ""
    }`;
    supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${
          window.location.origin
        }/auth/callback?next=${encodeURIComponent(
          redirectUrl.replace(window.location.origin, "")
        )}`,
      },
    });
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={wide ? styles.wide : styles.content}>
          <div className={styles.leftSection}>
            <Link href="/" className={styles.logoLink}>
              <div className={styles.logo}>
                <img
                  src="/banger_logo_pink.png"
                  alt="banger logo"
                  width="33px"
                  height="33px"
                />
                <p>Banger</p>
              </div>
            </Link>

            {isClient && !hideNavLinks && (
              <div className={styles.links}>
                {navLinks.map((link, index) => (
                  <React.Fragment key={link.name}>
                    <Link
                      href={link.href}
                      {...(link.target && {
                        target: link.target,
                        rel: "noopener noreferrer",
                      })}
                      style={{
                        color: pathname === link.href ? "#F2C1FB" : "inherit",
                        fontSize: "1.2rem",
                        textDecoration:
                          pathname === link.href ? "underline" : "none",
                        textDecorationColor: "#F2C1FB",
                        textUnderlineOffset: "4px",
                        textDecorationThickness: "2px",
                      }}
                    >
                      {link.name}
                    </Link>
                    {index !== navLinks.length - 1 && <span>✧</span>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div className={styles.cta}>
            {isClient && !hideSearch && <SearchComponent />}
            {isClient && user && <Feedback />}

            {!user && (
              <Button variant="outline" onClick={login}>
                Login
              </Button>
            )}

            {user && (
              <div className="flex justify-between items-center">
                <div className="flex items-center mr-4">
                  <Link
                    href={`/${user.user_metadata.user_name}`}
                    className="transition-all duration-200 rounded-full"
                  >
                    <Avatar className="w-10 h-10 border-2 border-white hover:border-[#F2C1FB]">
                      <AvatarImage
                        src={user.user_metadata.avatar_url || ""}
                        onError={(e) => {
                          // When image fails to load, use boring avatars as fallback
                          e.currentTarget.src = `https://source.boringavatars.com/beam/120/${user.user_metadata.user_name}?colors=F2C1FB,000000`;
                        }}
                      />
                      <AvatarFallback>
                        {user.user_metadata.user_name
                          ?.toUpperCase()
                          .substring(0, 2) || "USER"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>

                {user && !hasAlphaAccess && !hasInvite && !userLoading && (
                  <Join />
                )}
                {user && !hasAlphaAccess && hasInvite && (
                  <OnboardingFollow
                    initialSuggestedUsers={suggestedUsers}
                    onComplete={() => window.location.reload()}
                  />
                )}
                {user && hasAlphaAccess && (
                  <div className={styles.walletButton}>
                    <UnifiedWalletButton />
                  </div>
                )}
              </div>
            )}

            {user && (
              <>
                <Link
                  href="https://t.me/bangerlolbot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BellIcon />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <AuthErrorDialog />
    </>
  );
}

export { Navbar };
