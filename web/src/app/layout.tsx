"use client";

import { Suspense } from "react";
import "./globals.css";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="h-screen bg-[url('/background.png')] bg-cover bg-center bg-fixed">
        {/* Dark overlay */}
        <SessionProvider>
          <ReactQueryProvider>
            <SolanaProvider>
              <TRPCReactProvider>
                <Toaster />
                <Suspense
                  fallback={
                    <div className="text-center my-32">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  }
                >
                  <main className="relative max-w-screen min-h-screen">
                    {children}
                  </main>
                </Suspense>
              </TRPCReactProvider>
            </SolanaProvider>
          </ReactQueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
<<<<<<< HEAD

function AccountButtons() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey, wallet } = useWallet();
  const { data: session } = useSession();

  useEffect(() => {
    capsule.isSessionActive().then(setIsActive);
  }, [setIsActive, session, publicKey]);

  useEffect(() => {
    if (
      session?.user.wallets &&
      session?.user.wallets[0] !== publicKey?.toBase58() &&
      pathname !== "/auth/signin"
    ) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [session, publicKey, router, pathname]);

  if (publicKey) {
    return <WalletButton />;
  }

  if (!session) {
    return (
      <Button
        onClick={() => {
          console.log("redirecting to signin");
          router.push(
            `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
          );
        }}
      >
        Sign in
      </Button>
    );
  }

  if (!isActive) {
    return (
      <Button
        onClick={() => {
          console.log("redirecting to signin");
          router.push(
            `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
          );
        }}
      >
        Sign in
      </Button>
    );
  }
  try {
    const pk = new PublicKey(capsule.getAddress()!);
  } catch (e) {
    return null;
  }

  const pk = new PublicKey(capsule.getAddress()!);
  return (
    <div
      className="btn btn-primary flex flex-row gap-2 h-full"
      onClick={() => {
        navigator.clipboard.writeText(pk.toBase58());
      }}
    >
      <IconCopy />
      {shortenAddress(pk)}
    </div>
  );
}
=======
>>>>>>> 578a3fd7aed4240adbee69d5383ee983859e968b
