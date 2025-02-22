"use client";
import DashboardFeature from "@/components/dashboard/dashboard-feature";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/home`);
    return null;
  } else {
    router.push(`/home`);
    return null;
  }
}
