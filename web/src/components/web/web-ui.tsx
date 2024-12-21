"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useWebProgram, useWebProgramAccount } from "./web-data-access";
import {
  useBaseToken,
  useMarkets,
  usePlayerMarket,
} from "./market-data-access";

export function BaseTokenCreate() {
  const { initialize } = useBaseToken();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync()}
      disabled={initialize.isPending}
    >
      Create Base Token {initialize.isPending && "..."}
    </button>
  );
}

export function BaseTokenFaucet() {
  const { faucetBase, baseTokenBalance } = useBaseToken();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => faucetBase.mutateAsync()}
      disabled={faucetBase.isPending}
    >
      Faucet Base Token (balance: {baseTokenBalance.data ?? 0}){" "}
      {faucetBase.isPending && "..."}
    </button>
  );
}

export function InitPlayerMarket() {
  const { initialize } = useMarkets();
  const playerId = "LAMAR";

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync(playerId)}
      disabled={initialize.isPending}
    >
      Initialize Player Market ({playerId}) {initialize.isPending && "..."}
    </button>
  );
}

export function MintPlayerTokens() {
  const { mint } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => mint.mutateAsync()}
      disabled={mint.isPending}
    >
      Mint Player Tokens {mint.isPending && "..."}
    </button>
  );
}

export function CreateMarket() {
  const { createMarket } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => createMarket.mutateAsync()}
      disabled={createMarket.isPending}
    >
      Create Market {createMarket.isPending && "..."}
    </button>
  );
}

export function DepositBase() {
  const { depositBase } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => depositBase.mutateAsync(100)}
      disabled={depositBase.isPending}
    >
      Deposit Base {depositBase.isPending && "..."}
    </button>
  );
}

export function DepositQuote() {
  const { depositQuote } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => depositQuote.mutateAsync(100)}
      disabled={depositQuote.isPending}
    >
      Deposit Quote {depositQuote.isPending && "..."}
    </button>
  );
}

export function Buy() {
  const { buy } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => buy.mutateAsync(10)}
      disabled={buy.isPending}
    >
      Buy {buy.isPending && "..."}
    </button>
  );
}

export function Sell() {
  const { sell } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => sell.mutateAsync(10)}
      disabled={sell.isPending}
    >
      Sell {sell.isPending && "..."}
    </button>
  );
}

export function WithdrawAll() {
  const { withdrawAll } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => withdrawAll.mutateAsync()}
      disabled={withdrawAll.isPending}
    >
      Withdraw All {withdrawAll.isPending && "..."}
    </button>
  );
}
export function PrintMarket() {
  const { printMarket } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => printMarket.mutateAsync()}
      disabled={printMarket.isPending}
    >
      Print Market {printMarket.isPending && "..."}
    </button>
  );
}

export function InitPayout() {
  const { initPayout } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initPayout.mutateAsync()}
      disabled={initPayout.isPending}
    >
      Init Payout {initPayout.isPending && "..."}
    </button>
  );
}

export function Payout() {
  const { payout } = usePlayerMarket(
    "LAMAR",
    "1734806520656",
    new PublicKey("7LpfB6CKHbCXofLT64KeJrfrhvk98U9jUcAHCdZiSqdL")
  );

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => payout.mutateAsync()}
      disabled={payout.isPending}
    >
      Payout {payout.isPending && "..."}
    </button>
  );
}
