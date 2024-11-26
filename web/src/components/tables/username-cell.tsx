"use client";
import { useRouter } from "next/navigation";
// import UserHover from "@/components/custom/userHover";

function UsernameCell({ username }: { username: string }) {
  const router = useRouter();
  return (
    // <UserHover>
      <span
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          router.push(`/${username}`);
        }}
      >
        {username}
      </span>
    // </UserHover>
  );
}

export { UsernameCell };