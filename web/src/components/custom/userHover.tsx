"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { higherResImage } from "@/lib/utils";
import { getUser } from "@/server/user";
import React from "react";

interface UserData {
  name: string | null;
  username: string;
  image: string | null;
  createdAt: string;
}

const UserHover = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const username = React.isValidElement(children)
          ? children.props.children
          : (children as string);
        const data = await getUser(username);
        if (data) {
          setUserData({
            username: data.username || "",
            image: data.image,
            createdAt: data.createdAt.toISOString(),
            name: data.name,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [children]);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span> {children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {userData ? (
          <div className="flex  space-x-4">
            <Avatar>
              <AvatarImage src={higherResImage(userData.image) || ""} />
              <AvatarFallback>
                {userData.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-lg font-semibold">{userData.name}</h4>
              <h4 className="text-sm font-semibold">@{userData.username}</h4>
              <div className="flex items-center pt-2">
                <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
                <span className="text-xs text-muted-foreground">
                  Joined{" "}
                  {new Date(userData.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default UserHover;
