"use client";

import { getMarketsProgram, getMarketsProgramId } from "@project/anchor";
import { BN } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  Cluster,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMarketTX } from "manifest/instructions/createMarket";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { ManifestClient } from "manifest/src/client";
// import {
//   ManifestClient,
//   Wrapper,
//   manifest,
//   wrapper,
// } from "@cks-systems/manifest-sdk";
// const {
//   createCreateWrapperInstruction,
//   PROGRAM_ID: WRAPPER_PROGRAM_ID,
//   createClaimSeatInstruction,
// } = wrapper;
// manifest;
import { FIXED_WRAPPER_HEADER_SIZE } from "manifest/src/constants";
import { OrderType } from "manifest/src/manifest";
import { Market } from "manifest/src";

export function useBaseToken() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getMarketsProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getMarketsProgram(provider, programId),
    [provider, programId]
  );

  const accounts = useQuery({
    queryKey: ["markets", "all", { cluster }],
    queryFn: () => program.account.marketConfig.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  let baseTokenMint = PublicKey.findProgramAddressSync(
    [Buffer.from("base")],
    program.programId
  )[0];
  const baseConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("baseConfig")],
    program.programId
  )[0];

  const initialize = useMutation({
    mutationKey: ["base-token", "initialize", { cluster }],
    mutationFn: () =>
      program.methods
        .initBase()
        .accountsStrict({
          payer: provider.publicKey,
          baseTokenMint,
          config: baseConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  const baseTokenAccount = useQuery({
    queryKey: ["base-token-account", { cluster }],
    queryFn: () => getAssociatedTokenAddress(baseTokenMint, provider.publicKey),
  });

  const baseTokenBalance = useQuery({
    queryKey: ["base-token-balance", { cluster, baseTokenAccount }],
    queryFn: async () => {
      try {
        if (!baseTokenAccount.data) return "loading...";
        const account = await getAccount(connection, baseTokenAccount.data);

        return account.amount.toString();
      } catch (error) {
        console.error(error);
        return 0;
      }
    },
  });

  const faucetBase = useMutation({
    mutationKey: ["base-token", "faucet", { cluster }],
    mutationFn: () =>
      program.methods
        .faucetBase(new BN(100000000000))
        .accountsStrict({
          payer: provider.publicKey,
          baseTokenMint,
          config: baseConfig,
          destination: baseTokenAccount.data!,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
    baseToken: baseTokenMint,
    baseTokenAccount,
    faucetBase,
    baseTokenBalance,
  };
}

export function useMarkets() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts, baseToken } = useBaseToken();
  const provider = useAnchorProvider();

  const markets = useQuery({
    queryKey: ["markets", "fetch", { cluster }],
    queryFn: async () => {
      const markets = await program.account.playerMintConfig.all();
      console.log("markets", markets);
      return markets;
    },
  });

  const initialize = useMutation({
    mutationKey: ["markets", "initialize", { cluster }],
    mutationFn: (playerId: string) => {
      const timestamp = Date.now().toString();
      console.log("timestamp", timestamp);
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(baseToken, mintConfig, true);
      return program.methods
        .initMint(new BN(3), playerId, timestamp)
        .accountsStrict({
          payer: provider.publicKey,
          baseTokenMint: baseToken,
          vault,
          playerTokenMint: player_token_mint,
          config: mintConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  const timestamp = "1734806520656";

  return {
    markets,
    initialize,
  };
}

export function usePlayerMarket() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts, baseToken } = useBaseToken();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();

  const [playerMintPK, setPlayerMintPK] = useState<null | PublicKey>(null);
  const [timestamp, setTimestamp] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");

  const setPlayerMarket = async (mintAddress: PublicKey) => {
    const market = await program.account.playerMintConfig.fetch(mintAddress);
    setPlayerId(market.playerId);
    setTimestamp(market.timestamp);
    console.log("market", market);
    console.log("playerMintPK", market.playerTokenMint.toBase58());
    setPlayerMintPK(new PublicKey(market.playerTokenMint));
    queryClient.invalidateQueries({
      queryKey: ["market", { playerMintPK }],
    });
  };

  const bids = useQuery({
    queryKey: ["market", "bids", { playerMintPK }],
    queryFn: async () => {
      // console.log("bids", playerMintPK?.toBase58());
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: playerMintPK!,
      });
      const bids = await market.bids();
      return bids;
    },
  });

  const asks = useQuery({
    queryKey: ["market", "asks", { playerMintPK }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: playerMintPK!,
      });
      const asks = await market.asks();
      return asks;
    },
  });

  const mint = useMutation({
    mutationKey: ["market", "mint", { playerMintPK }],
    mutationFn: () => {
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(baseToken, mintConfig, true);
      const destination = getAssociatedTokenAddressSync(
        player_token_mint,
        provider.publicKey
      );
      return program.methods
        .mintTokens(new BN(300000000))
        .accountsPartial({
          payer: provider.publicKey,
          baseTokenMint: baseToken,
          vault,
          playerTokenMint: player_token_mint,
          destination,
          config: mintConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to mint tokens"),
  });

  const createMarket = useMutation({
    mutationKey: ["market", "create", { playerMintPK }],
    mutationFn: () => {
      const player_token_mint = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          Buffer.from(playerId),
          Buffer.from("1735852543216"),
        ],
        program.programId
      )[0];
      return createMarketTX(
        provider.connection,
        provider,
        baseToken,
        player_token_mint
      );
    },
    onSuccess: (signature) => {
      transactionToast(`Market created: ${signature.toBase58()}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to create market"),
  });

  const depositBase = useMutation({
    mutationKey: ["market", "deposit-base", { playerMintPK }],
    mutationFn: async (amount: number) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        playerMintPK!
      );
      const depositIx = client.depositIx(provider.publicKey, baseToken, amount);
      const transaction = new Transaction().add(depositIx);
      const signature = await provider.sendAndConfirm(transaction);
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited base: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit base"),
  });

  const depositQuote = useMutation({
    mutationKey: ["market", "deposit-quote", { playerMintPK }],
    mutationFn: async (amount: number) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        playerMintPK!
      );
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const depositIx = client.depositIx(
        provider.publicKey,
        player_token_mint,
        amount
      );
      const transaction = new Transaction().add(depositIx);
      const signature = await provider.sendAndConfirm(transaction);
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited base: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit base"),
  });

  const buy = useMutation({
    mutationKey: ["market", "sell-quote", { playerMintPK }],
    mutationFn: async ({
      numBaseTokens,
      tokenPrice,
    }: {
      numBaseTokens: number;
      tokenPrice: number;
    }) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        playerMintPK!
      );
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: true,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId: 0,
      });

      const transaction = new Transaction().add(orderIx);
      const signature = await provider.sendAndConfirm(transaction);
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited base: ${signature}`);
      queryClient.invalidateQueries({
        queryKey: ["market", "bids", { playerMintPK }],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", "asks", { playerMintPK }],
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit base"),
  });

  const sell = useMutation({
    mutationKey: ["market", "sell-quote", { playerMintPK }],
    mutationFn: async ({
      numBaseTokens,
      tokenPrice,
    }: {
      numBaseTokens: number;
      tokenPrice: number;
    }) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        playerMintPK!
      );
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: false,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId: 0,
      });

      const transaction = new Transaction().add(orderIx);
      const signature = await provider.sendAndConfirm(transaction);
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited base: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit base"),
  });

  const withdrawAll = useMutation({
    mutationKey: ["market", "withdraw-all", { playerMintPK }],
    mutationFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        playerMintPK!
      );
      const withdrawIx = await client.withdrawAllIx();
      const transaction = new Transaction().add(...withdrawIx);
      const signature = await provider.sendAndConfirm(transaction);
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited base: ${signature}`);
      queryClient.invalidateQueries({
        queryKey: ["market", "bids", { playerMintPK }],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", "asks", { playerMintPK }],
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit base"),
  });

  const printMarket = useMutation({
    mutationKey: ["market", "print", { playerMintPK }],
    mutationFn: async () => {
      const market: Market = await Market.loadFromAddress({
        connection: provider.connection,
        address: playerMintPK!,
      });
      market.prettyPrint();
    },
    onSuccess: () => {
      transactionToast(`Market printed`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to print market"),
  });

  const initPayout = useMutation({
    mutationKey: ["market", "init-payout", { playerMintPK }],
    mutationFn: () => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const payoutConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("payout"), mintConfig.toBuffer()],
        program.programId
      )[0];
      return program.methods
        .initPayout(new BN(20000))
        .accountsStrict({
          payer: provider.publicKey,
          mintConfig,
          payoutConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize payout account"),
  });

  const payout = useMutation({
    mutationKey: ["market", "init-payout", { playerMintPK }],
    mutationFn: () => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const payoutConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("payout"), mintConfig.toBuffer()],
        program.programId
      )[0];
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const playerTokenAccount = getAssociatedTokenAddressSync(
        player_token_mint,
        provider.publicKey
      );
      const baseTokenAccount = getAssociatedTokenAddressSync(
        baseToken,
        provider.publicKey
      );
      const baseConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("baseConfig")],
        program.programId
      )[0];

      const context = {
        payer: provider.publicKey,
        baseTokenMint: baseToken,
        playerTokenMint: player_token_mint,
        payerBaseTokenAccount: baseTokenAccount,
        payerPlayerTokenAccount: playerTokenAccount,
        mintConfig,
        payoutConfig,
        baseConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      };

      Object.entries(context).forEach(([key, value]) => {
        console.log(key, value.toBase58());
      });
      return program.methods.payout().accountsStrict(context).rpc({
        skipPreflight: true,
      });
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to payout"),
  });

  return {
    mint,
    createMarket,
    depositBase,
    depositQuote,
    buy,
    sell,
    withdrawAll,
    printMarket,
    initPayout,
    payout,
    bids,
    asks,
    setPlayerMarket,
  };
}
