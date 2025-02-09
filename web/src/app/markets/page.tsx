import Markets from "@/components/web/markets";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/markets`);
    return null;
  }

  return <Markets />;
}
