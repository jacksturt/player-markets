"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useBaseToken, useMarkets } from "./market-data-access";
import {
  BaseTokenCreate,
  BaseTokenFaucet,
  InitPlayerMarket,
  MintPlayerTokens,
  InitPayout,
  Payout,
  CreateMarket,
  DepositBase,
  DepositQuote,
  Sell,
  Buy,
  PrintMarket,
  WithdrawAll,
} from "./web-ui";

export default function MarketFeature() {
  const { publicKey } = useWallet();
  const { baseToken } = useBaseToken();
  const { markets } = useMarkets();

  return publicKey ? (
    <div>
      <AppHero
        title="Web"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods (increment, decrement, set, and close).'
        }
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${baseToken}`}
            label={ellipsify(baseToken.toString())}
          />
        </p>
      </AppHero>
      <div className="flex flex-col gap-4">
        <BaseTokenCreate />
        <BaseTokenFaucet />
        <InitPlayerMarket />
        {/* {markets.data?.map((market) => (
          <div key={market.publicKey.toBase58()}>
            <ExplorerLink
              path={`account/${market.publicKey.toBase58()}`}
              label={market.publicKey.toBase58()}
            />
          </div>
        ))} */}
        <MintPlayerTokens />
        <CreateMarket />
        <DepositBase />
        <DepositQuote />
        <Buy />
        <Sell />
        <PrintMarket />
        <WithdrawAll />
        <InitPayout />
        <Payout />
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
