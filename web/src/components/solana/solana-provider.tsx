"use client";

import dynamic from "next/dynamic";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ReactNode, useCallback, useMemo } from "react";
import { useCluster } from "../cluster/cluster-data-access";
import {
  backpackWallet,
  CapsuleSolanaProvider,
  glowWallet,
  phantomWallet,
} from "@usecapsule/solana-wallet-connectors";
require("@solana/wallet-adapter-react-ui/styles.css");

export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
  }
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster();
  const endpoint = useMemo(() => cluster.endpoint, [cluster]);
  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);
  const solanaNetwork = WalletAdapterNetwork.Devnet;

  return (
    <CapsuleSolanaProvider
      endpoint={endpoint}
      wallets={[glowWallet, phantomWallet, backpackWallet]}
      chain={solanaNetwork}
      appIdentity={{
        name: "Your App Name",
        uri: `https://localhost:3000`,
      }}
    >
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </CapsuleSolanaProvider>
  );
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}
