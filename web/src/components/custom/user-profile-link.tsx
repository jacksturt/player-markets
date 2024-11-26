// components/UserProfileLink.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next-nprogress-bar";

interface UserProfileLinkProps {
  username: string | null;
  image?: string | null;
}



export const UserProfileLink = ({
  username,
  image,
}: UserProfileLinkProps) => {
  const router = useRouter();

  return (
    <Link
      href={`/${username}`}
      className="flex items-center justify-center cursor-pointer hover:text-[#F2C1FB]"
      onClick={(e) => {
        e.stopPropagation();
        router.prefetch(`/${username}`); // Prefetch the route
      }}
    >
      {image && (
        <Image
          src={image}
          alt={`${username}'s avatar`}
          width={24}
          height={24}
          className="rounded-full mr-2"
        />
      )}
      <span>{username}</span>
    </Link>
  );
};
