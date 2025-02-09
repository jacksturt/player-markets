"use client";

import {
  getTradetalkProgram,
  getTradetalkProgramId,
  PlayerMintConfig,
  PlayerStats,
} from "@project/anchor";
import { BN, ProgramAccount } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  Account,
} from "@solana/spl-token";
import { createMarketTX } from "manifest/instructions/createMarket";
import { ManifestClient } from "manifest/src/client";
import { ParaSolanaWeb3Signer } from "@getpara/solana-web3.js-v1-integration";
import { para } from "@/lib/para";
import { OrderType } from "manifest/src/manifest";
import { Market, Wrapper, WrapperMarketInfo, WrapperData } from "manifest/src";
import { api, RouterOutputs } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { AskOrBidType } from "./web-ui";
import { getPercentGameRemaining } from "@/lib/utils";

export function useCurrentMarket() {
  const queryClient = useQueryClient();

  const marketAddress = useQuery<string | null>({
    // Add explicit type here
    queryKey: ["current-market-address"],
    queryFn: () => null,
    enabled: false,
  });

  const setMarketAddress = useCallback(
    (address: string) => {
      queryClient.setQueryData(["current-market-address"], address);
    },
    [queryClient]
  ); // Add queryClient to deps array

  // Convert to PublicKey if we have an address
  const marketPublicKey = useMemo(
    () => (marketAddress.data ? new PublicKey(marketAddress.data) : null),
    [marketAddress.data]
  );

  return {
    marketAddress: marketAddress.data,
    marketPublicKey,
    setMarketAddress,
  };
}

export function useQuoteToken() {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(() => getTradetalkProgramId("mainnet-beta"), []);
  const myPK = useMyPubkey();
  const program = useMemo(
    () => getTradetalkProgram(provider, programId),
    [provider, programId]
  );

  const accounts = useQuery({
    queryKey: ["markets", "all"],
    queryFn: () => program.account.playerMintConfig.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account"],
    queryFn: () => connection.getParsedAccountInfo(programId),
    staleTime: 1000 * 10,
  });

  let quoteTokenMint = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  );

  const quoteConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("quoteConfig")],
    program.programId
  )[0];

  const quoteTokenAccount = useQuery({
    queryKey: ["quote-token-account"],
    queryFn: async () => {
      return getAssociatedTokenAddressSync(quoteTokenMint, myPK, true);
    },
    enabled: !!myPK,
    staleTime: 1000 * 10,
  });

  const initialize = useMutation({
    mutationKey: ["quote-token", "initialize"],
    mutationFn: () =>
      program.methods
        .initQuote()
        .accountsStrict({
          payer: provider.publicKey,
          quoteTokenMint,
          config: quoteConfig,
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

  const quoteTokenBalance = useQuery({
    queryKey: ["quote-token-balance", { quoteTokenAccount }],
    queryFn: async () => {
      try {
        if (!quoteTokenAccount.data) return "loading...";
        const account = await getAccount(connection, quoteTokenAccount.data);

        return account.amount.toString();
      } catch (error) {
        console.error(error);
        return 0;
      }
    },
    staleTime: 1000 * 10,
    enabled: !!quoteTokenAccount.data,
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
    quoteToken: quoteTokenMint,
    quoteTokenAccount,
    quoteTokenBalance,
  };
}

export function useMarketAdmin() {
  const transactionToast = useTransactionToast();
  const { playerId, timestamp } = usePlayerMarket();
  const { program, accounts, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const createMint = api.mint.create.useMutation();
  const createTeamAPI = api.team.create.useMutation();
  const createTeam = useMutation({
    mutationKey: ["markets", "create-team"],
    mutationFn: async ({
      teamName,
      teamImage,
      teamSportsdataId,
    }: {
      teamName: string;
      teamImage: string;
      teamSportsdataId: string;
    }) => {
      createTeamAPI.mutateAsync({
        teamName,
        teamImage,
        teamSportsdataId,
      });
    },
    onSuccess: () => {
      toast.success("Team created");
    },
  });

  const initializeMint = useMutation({
    mutationKey: ["markets", "initialize"],
    mutationFn: async ({
      teamSportsdataId,
      playerName,
      playerImage,
      playerPosition,
      teamId,
      mintSymbol,
      season,
      week,
      network,
      projection,
    }: {
      teamSportsdataId: string;
      playerName: string;
      playerImage: string;
      playerPosition: string;
      teamId: string;
      mintSymbol: string;
      season: string;
      week: string;
      network: string;
      projection: number;
    }) => {
      const timestamp = Date.now().toString();
      // const timestamp = "1739073331173";
      const player_token_mint = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          Buffer.from(teamSportsdataId),
          Buffer.from(timestamp),
        ],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(teamSportsdataId),
          Buffer.from(timestamp),
        ],
        program.programId
      )[0];
      console.log("mintConfig", mintConfig.toString());
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const createMintInstruction = await program.methods
        .initMint(teamSportsdataId, timestamp)
        .accountsStrict({
          payer: provider.publicKey,
          quoteTokenMint: quoteToken,
          vault,
          playerTokenMint: player_token_mint,
          config: mintConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(teamSportsdataId),
          Buffer.from(timestamp),
        ],
        program.programId
      )[0];
      const initProjectionOracleInstruction = await program.methods
        .initProjectionOracle()
        .accountsStrict({
          payer: provider.publicKey,
          config: mintConfig,
          playerStats,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();

      const updateProjectionOracleInstruction = await program.methods
        .updateProjectionOracle(projection, true)
        .accountsStrict({
          authority: provider.publicKey,
          config: mintConfig,
          playerStats,
        })
        .instruction();
      const [createAccountIx, createMarketIx, marketKeypair] =
        await createMarketTX(
          provider.connection,
          provider,
          quoteToken,
          player_token_mint
        );
      console.log("marketPK", marketKeypair.publicKey.toString());
      const recentBlockhash1 = await provider.connection.getLatestBlockhash();
      const tx1 = new Transaction({
        feePayer: provider.publicKey,
        blockhash: recentBlockhash1.blockhash,
        lastValidBlockHeight: recentBlockhash1.lastValidBlockHeight,
      });

      tx1.add(createMintInstruction);
      tx1.add(initProjectionOracleInstruction);
      tx1.add(updateProjectionOracleInstruction);
      const signature1 = await provider.sendAndConfirm(tx1);
      const recentBlockhash = await provider.connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: provider.publicKey,
        blockhash: recentBlockhash.blockhash,
        lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      });
      tx.add(createAccountIx);
      tx.add(createMarketIx);
      const signature = await provider.sendAndConfirm(tx, [marketKeypair], {
        commitment: "confirmed",
      });
      await createMint.mutateAsync({
        mintName: playerName,
        mintSymbol: mintSymbol,
        mintImage: playerImage,
        mintSlug: teamSportsdataId,
        timestamp: timestamp,
        description: "Market for " + playerName,
        baseMint: player_token_mint.toBase58(),
        teamSportsdataId: teamSportsdataId,
        position: playerPosition as "QB" | "RB" | "WR" | "TE" | "K" | "DEF",
        playerName: playerName,
        playerImage: playerImage,
        projectedPoints: projection,
        season: season,
        week: week,
        marketAddress: marketKeypair.publicKey.toString(),
        network: network as "MAINNET" | "DEVNET",
        marketName: playerName,
      });

      return signature;
    },
    onSuccess: async (signature: string) => {
      transactionToast(signature);
    },
    onError: async (error: SendTransactionError) => {
      toast.error(error.message);
      console.error(error);
      const logs = await error.getLogs(provider.connection);
      console.log("logs", logs);
    },
  });

  const initializeMintBE = useMutation({
    mutationKey: ["markets", "initialize"],
    mutationFn: async ({
      playerId,
      playerName,
      playerImage,
      playerPosition,
      teamId,
      mintSymbol,
      season,
      week,
      network,
      projection,
      timestamp,
      baseMint,
      marketAddress,
    }: {
      playerId: string;
      playerName: string;
      playerImage: string;
      playerPosition: string;
      teamId: string;
      mintSymbol: string;
      season: string;
      week: string;
      network: string;
      projection: number;
      timestamp: string;
      baseMint: string;
      marketAddress: string;
    }) => {
      await createMint.mutateAsync({
        mintName: playerName,
        mintSymbol: mintSymbol,
        mintImage: playerImage,
        mintSlug: playerId,
        timestamp: timestamp,
        description: "Market for " + playerName,
        baseMint: baseMint,
        teamId: teamId,
        teamSportsdataId: "",
        position: playerPosition as "QB" | "RB" | "WR" | "TE" | "K" | "DEF",
        playerName: playerName,
        playerSportsdataId: parseInt(playerId),
        playerImage: playerImage,
        projectedPoints: projection,
        season: season,
        week: week,
        marketAddress: marketAddress,
        network: network as "MAINNET" | "DEVNET",
        marketName: playerName,
      });
    },
    onError: async (error: SendTransactionError) => {
      toast.error(error.message);
      console.error(error);
      const logs = await error.getLogs(provider.connection);
      console.log("logs", logs);
    },
  });

  const updateProjectionOracle = useMutation({
    mutationKey: ["markets", "update-projection-oracle"],
    mutationFn: async ({
      projection,
      isProjected,
    }: {
      projection: number;
      isProjected: boolean;
    }) => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data!),
          Buffer.from(timestamp.data!),
        ],
        program.programId
      )[0];
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId.data!),
          Buffer.from(timestamp.data!),
        ],
        program.programId
      )[0];
      const signature = await program.methods
        .updateProjectionOracle(projection, isProjected)
        .accountsStrict({
          authority: provider.publicKey,
          config: mintConfig,
          playerStats,
        })
        .rpc();
      return { signature, playerStats };
    },
    onSuccess: async (data: { signature: string; playerStats: PublicKey }) => {
      transactionToast(data.signature);
      const playerStatsAccount = await program.account.playerStats.fetch(
        data.playerStats
      );
      console.log("playerStatsAccount", playerStatsAccount);

      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  const setMintingEnabled = useMutation({
    mutationKey: ["markets", "set-minting-enabled"],
    mutationFn: async ({ isMintingEnabled }: { isMintingEnabled: boolean }) => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data!),
          Buffer.from(timestamp.data!),
        ],
        program.programId
      )[0];
      const signature = await program.methods
        .setIsMintEnabled(isMintingEnabled)
        .accountsStrict({
          authority: provider.publicKey,
          config: mintConfig,
        })
        .rpc();
      return { signature, mintConfig };
    },
    onSuccess: async (data: { signature: string; mintConfig: PublicKey }) => {
      transactionToast(data.signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  const setPayoutEnabled = useMutation({
    mutationKey: ["markets", "set-payout-enabled"],
    mutationFn: async ({ isPayoutEnabled }: { isPayoutEnabled: boolean }) => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data!),
          Buffer.from(timestamp.data!),
        ],
        program.programId
      )[0];
      const signature = await program.methods
        .setIsPayoutEnabled(isPayoutEnabled)
        .accountsStrict({
          authority: provider.publicKey,
          config: mintConfig,
        })
        .rpc();
      return { signature, mintConfig };
    },
    onSuccess: async (data: { signature: string; mintConfig: PublicKey }) => {
      transactionToast(data.signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  const closeMintAccounts = useMutation({
    mutationKey: ["markets", "close-mint-accounts"],
    mutationFn: async () => {
      const playerId = { data: "19766" };
      const timestamp = { data: "1739054250215" };
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data!),
          Buffer.from(timestamp.data!),
        ],
        program.programId
      )[0];
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId.data!),
          Buffer.from(timestamp.data!),
        ],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const context = {
        admin: provider.publicKey,
        quoteTokenMint: quoteToken,
        playerStats: null,
        mintConfig,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      };
      const signature = await program.methods
        .closeAccounts()
        .accountsStrict(context)
        .rpc();
      return { signature, playerStats };
    },
    onSuccess: async (data: { signature: string; playerStats: PublicKey }) => {
      transactionToast(data.signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });
  return {
    initialize: initializeMint,
    updateProjectionOracle,
    createTeam,
    closeMintAccounts,
    setMintingEnabled,
    setPayoutEnabled,
    initializeMintBE,
  };
}

export function useMarkets() {
  const { program, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();

  const markets = useQuery({
    queryKey: ["markets", "fetch"],
    queryFn: async () => {
      const markets = await program.account.playerMintConfig.all();
      return markets;
    },
    staleTime: 1000 * 10,
  });

  const allMarkets = api.market.readAllMarkets.useQuery();

  const vaults = useQuery({
    queryKey: ["vaults"],
    queryFn: async () => {
      const vaults = [];
      for (const market of markets.data ?? []) {
        const vaultAddress = getAssociatedTokenAddressSync(
          quoteToken,
          market.publicKey,
          true
        );
        try {
          const vault = await getAccount(provider.connection, vaultAddress);
          console.log("mintConfig", market.publicKey.toString());
          console.log("vault", vault.address.toString());
          console.log("playerId", market.account.playerId);
          console.log("timestamp", market.account.timestamp);
          vaults.push(vault);
        } catch (error) {
          console.error(error);
        }
      }
      return vaults;
    },
    enabled: !!markets.data,
    staleTime: 1000 * 10,
  });

  const playerMintAccounts = useQuery({
    queryKey: ["player-mint-accounts"],
    queryFn: async () => {
      const playerMintAccounts = [];
      for (const market of markets.data ?? []) {
        const player_token_mint = PublicKey.findProgramAddressSync(
          [
            Buffer.from("mint"),
            Buffer.from(market.account.playerId),
            Buffer.from(market.account.timestamp),
          ],
          program.programId
        )[0];
        try {
          const playerMint = await getMint(
            provider.connection,
            player_token_mint
          );
          console.log("playerMint", playerMint.address.toString());
          console.log("playerId", market.account.playerId);
          console.log("timestamp", market.account.timestamp);
          playerMintAccounts.push(playerMint);
        } catch (error) {
          console.error(error);
        }
      }
      return playerMintAccounts;
    },
    enabled: !!markets.data && !!vaults.data,
    staleTime: 1000 * 10,
  });

  const playerStats = useQuery({
    queryKey: ["player-stats"],
    queryFn: async () => {
      const playerStats = await program.account.playerStats.all();
      return playerStats;
    },
    staleTime: 1000 * 10,
    enabled: !!markets.data && !!vaults.data && !!playerMintAccounts.data,
  });

  const marketsWithPlayerStatsAndVaults = useQuery({
    queryKey: ["projection-accounts"],
    queryFn: async () => {
      const projectionAccounts = await program.account.playerStats.all();

      const projectionAccountsWithMarket = markets.data?.map((market) => {
        const expectedPlayerStatsAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from("player_stats"),
            Buffer.from(market.account.playerId),
            Buffer.from(market.account.timestamp),
          ],
          program.programId
        )[0];
        const vaultAddress = getAssociatedTokenAddressSync(
          quoteToken,
          market.publicKey,
          true
        );
        const marketDB = allMarkets.data?.find(
          (marketBE) => marketBE.baseMint.timestamp === market.account.timestamp
        );
        const playerMintAccount = playerMintAccounts.data?.find(
          (playerMint) =>
            playerMint.address.toString() ===
            market.account.playerTokenMint.toString()
        );
        const vault = vaults.data?.find(
          (vault) => vault.address.toString() === vaultAddress.toString()
        );
        const playerStats = projectionAccounts.find(
          (account) =>
            account.publicKey.toString() ===
            expectedPlayerStatsAddress.toString()
        );
        const playerMintAmount = Number(playerMintAccount?.supply!);
        const actualPoints = playerStats?.account.actualPoints ?? 0;
        const longPayout = (playerMintAmount * actualPoints) / 10 ** 6;
        const vaultAmount = Number(vault?.amount!);
        const shortPayout = vaultAmount / 10 ** 6 - longPayout;

        return {
          config: market,
          db: marketDB,
          playerStats: playerStats,
          vault: vault,
          longPayout: longPayout,
          shortPayout: shortPayout,
        };
      });
      return projectionAccountsWithMarket;
    },
    enabled:
      !!markets.data &&
      !!allMarkets.data &&
      !!playerStats.data &&
      !!vaults.data,
    staleTime: 1000 * 10,
  });

  return {
    markets,
    vaults,
    allMarkets,
    marketsWithPlayerStatsAndVaults,
  };
}

export function usePlayerMarket() {
  const { marketAddress, marketPublicKey } = useCurrentMarket();
  const { manifestClient } = useManifestClient();
  const { program, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const { data: session } = useSession();

  const orders = api.order.readOrdersForMarket.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
      staleTime: 1000 * 10,
    }
  );

  const market = api.market.read.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
      staleTime: 1000 * 10,
    }
  );

  const lastTradePrice = api.market.lastTradePrice.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
      refetchInterval: 10000,
      staleTime: 1000 * 10,
    }
  );

  const timestamp = useQuery({
    queryKey: ["timestamp", { marketAddress }],
    queryFn: () => market.data?.baseMint.timestamp,
    enabled: !!market.data,
    staleTime: 1000 * 10,
  });

  const playerId = useQuery({
    queryKey: ["playerId", { marketAddress }],
    queryFn: () => market.data?.baseMint.mintSlug,
    enabled: !!market.data,
    staleTime: 1000 * 10,
  });

  const mintConfig = useQuery({
    queryKey: ["mint-config", { marketAddress }],
    queryFn: () => {
      if (!playerId.data || !timestamp.data) return;
      console.log("playerId.data", playerId.data);
      console.log("timestamp.data", timestamp.data);
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      console.log("mintConfig", mintConfig.toBase58());
      return mintConfig;
    },
    enabled: !!playerId.data && !!timestamp.data,
    staleTime: 1000 * 10,
  });

  const playerStatsAccount = useQuery({
    queryKey: ["player-stats-account"],
    queryFn: () => {
      if (!playerId.data || !timestamp.data) return;

      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];
      const playerStatsAccount = program.account.playerStats.fetch(playerStats);
      return playerStatsAccount;
    },
    enabled: !!playerId.data && !!timestamp.data,
    staleTime: 1000 * 10,
  });

  const vault = useQuery({
    queryKey: ["vault", { marketAddress }],
    queryFn: async () => {
      if (!playerId.data || !timestamp.data) return;
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];
      const vaultAddress = getAssociatedTokenAddressSync(
        quoteToken,
        mintConfig,
        true
      );
      console.log("vaultAddress", vaultAddress.toBase58());

      const vault = await getAccount(provider.connection, vaultAddress);
      console.log("vault", vault);
      return vault;
    },
    enabled: !!playerId.data && !!timestamp.data,
    staleTime: 1000 * 10,
  });

  const mintConfigAccount = useQuery({
    queryKey: ["mint-config-account", { marketAddress }],
    queryFn: async () => {
      if (!playerId.data || !timestamp.data) return;
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];

      const mintConfigAccount = await program.account.playerMintConfig.fetch(
        mintConfig
      );

      return mintConfigAccount;
    },
    enabled: !!playerId.data && !!timestamp.data,
    staleTime: 1000 * 60,
  });

  const bids = useQuery<AskOrBidType[]>({
    queryKey: ["market", "bids", { marketAddress }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPublicKey!,
      });
      const bids = await market.bids();
      console.log("bids", bids);
      if (orders.data) {
        const compoundBids = bids.map((bid) => {
          const order = orders.data.find(
            (order) =>
              order.sequenceNumber?.toString() ===
              bid.sequenceNumber?.toString()
          );
          if (!order) return;
          return {
            ...bid,
            ...order,
            sequenceNumber: bid.sequenceNumber,
            isMyOrder: order?.userId === session?.user.id,
            market: order?.market,
            numBaseTokens: order?.numBaseTokens,
            createdAt: order.createdAt,
            user: {
              image: order.user.image,
            },
          };
        });
        return compoundBids.filter(
          (bid): bid is AskOrBidType => bid !== undefined
        );
      }
      return [];
    },
    enabled:
      !!marketPublicKey &&
      !!manifestClient.data &&
      !!orders.data &&
      !!session?.user.id,
    refetchInterval: 10000,
    staleTime: 1000 * 10,
  });

  const asks = useQuery({
    queryKey: ["market", "asks", { marketAddress }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPublicKey!,
      });
      const asks = await market.asks();
      console.log("asks", asks);
      if (orders.data) {
        const compoundAsks = asks.map((ask) => {
          const order = orders.data.find(
            (order) =>
              order.sequenceNumber?.toString() === ask.sequenceNumber.toString()
          );
          if (!order) return;
          return {
            ...order,
            ...ask,
            sequenceNumber: ask.sequenceNumber,
            isMyOrder: order?.userId === session?.user.id,
            market: order?.market,
            numBaseTokens: order?.numBaseTokens,
            createdAt: order.createdAt,
            user: {
              image: order.user.image,
            },
          };
        });
        return compoundAsks.filter(
          (ask): ask is AskOrBidType => ask !== undefined
        );
      }
      return [];
    },
    enabled:
      !!marketPublicKey &&
      !!manifestClient.data &&
      !!orders.data &&
      !!session?.user.id,
    refetchInterval: 10000,
    staleTime: 1000 * 10,
  });

  const trades = api.trade.readForMarket.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
      refetchInterval: 10000,
    }
  );

  return {
    market,
    marketAddress,
    bids,
    asks,
    lastTradePrice,
    playerStatsAccount,
    trades,
    playerId,
    timestamp,
    vault,
    mintConfigAccount,
    mintConfig,
  };
}

export const usePlayerToken = () => {
  const { marketAddress } = useCurrentMarket();
  const { program } = useQuoteToken();
  const provider = useAnchorProvider();
  const { playerId, timestamp } = usePlayerMarket();
  const myPK = useMyPubkey();
  const playerTokenMint = useQuery({
    queryKey: ["player-token-mint"],
    queryFn: () => {
      if (!playerId.data || !timestamp.data) return;
      const player_token_mint = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];
      return player_token_mint;
    },
    enabled: !!playerId.data && !!timestamp.data,
    staleTime: 1000 * 10,
  });

  const playerTokenAccount = useQuery({
    queryKey: ["player-token-account"],
    queryFn: async () => {
      const playerTokenAccount = getAssociatedTokenAddressSync(
        playerTokenMint.data!,
        myPK,
        true
      );
      return playerTokenAccount;
    },

    enabled: !!myPK,
    staleTime: 1000 * 10,
  });

  const playerTokenBalance = useQuery({
    queryKey: [
      "market",
      "player-token-balance",
      { playerMintPK: marketAddress },
    ],
    queryFn: async () => {
      if (!playerTokenAccount.data) return "loading...";
      const account = await getAccount(
        provider.connection,
        playerTokenAccount.data
      );
      return account.amount.toString();
    },
    enabled: !!playerTokenAccount.data,
    staleTime: 1000 * 10,
  });

  const playerTokenMintAccountSupply = useQuery({
    queryKey: ["player-token-mint-account", { marketAddress }],
    queryFn: async () => {
      if (!playerTokenMint.data) return;
      const playerTokenMintAccount = await getMint(
        provider.connection,
        playerTokenMint.data
      );
      return playerTokenMintAccount.supply;
    },
    enabled: !!playerTokenMint.data,
    staleTime: 1000 * 10,
  });

  return {
    playerTokenMint,
    playerTokenAccount,
    playerTokenBalance,
    playerTokenMintAccountSupply,
  };
};

export const useParaWallet = () => {
  const provider = useAnchorProvider();
  const { publicKey } = useWallet();
  const paraPubkey = useQuery({
    queryKey: ["para-pubkey"],
    queryFn: () => new PublicKey(para.getAddress()!),
    staleTime: 1000 * 10,
  });

  const solanaSigner = useQuery({
    queryKey: ["solana-signer"],
    queryFn: () => {
      if (!publicKey) {
        const signer = new ParaSolanaWeb3Signer(para, provider.connection);
        return signer;
      } else {
        return null;
      }
    },
    staleTime: 1000 * 10,
  });

  return { paraPubkey, solanaSigner };
};

export const useManifestClient = () => {
  const { marketAddress } = useCurrentMarket();
  const provider = useAnchorProvider();
  const { publicKey, wallet } = useWallet();
  const { paraPubkey } = useParaWallet();
  const marketPK = marketAddress ? new PublicKey(marketAddress) : null;

  const hasSeatBeenClaimed = useQuery({
    queryKey: ["has-seat-been-claimed", { marketAddress }],
    queryFn: async () => {
      console.log("has-seat-been-claimed", marketPK?.toBase58());
      const userWrapper = await ManifestClient.fetchFirstUserWrapper(
        provider.connection,
        publicKey ?? paraPubkey.data!
      );
      if (!userWrapper) {
        return false;
      }
      const wrapperData: WrapperData = Wrapper.deserializeWrapperBuffer(
        userWrapper.account.data
      );
      const existingMarketInfos: WrapperMarketInfo[] =
        wrapperData.marketInfos.filter((marketInfo: WrapperMarketInfo) => {
          return marketInfo.market.toBase58() == marketPK?.toBase58();
        });
      if (existingMarketInfos.length > 0) {
        return true;
      }
      return false;
    },
    enabled: !!marketPK,
    staleTime: 1000 * 10,
  });

  const claimSeat = useMutation({
    mutationKey: ["claim-seat", { marketAddress }],
    mutationFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK!,
        wallet || undefined
      );
    },
    onSuccess: () => {
      hasSeatBeenClaimed.refetch();
    },
  });

  const manifestClient = useQuery({
    queryKey: ["manifest-client", { marketAddress }],
    queryFn: async () => {
      if (!hasSeatBeenClaimed.data) {
        return null;
      }
      return await ManifestClient.getClientForMarket(
        provider,
        marketPK!,
        wallet || undefined
      );
    },
    enabled: !!hasSeatBeenClaimed.data,
    staleTime: 1000 * 10,
  });

  return { manifestClient, hasSeatBeenClaimed, claimSeat };
};

export function useMyMarket() {
  const { marketAddress } = useCurrentMarket();
  const {
    playerId,
    timestamp,
    vault,
    mintConfigAccount,
    playerStatsAccount,
    mintConfig,
  } = usePlayerMarket();

  const { manifestClient, hasSeatBeenClaimed } = useManifestClient();
  const client = manifestClient.data!;
  const {
    playerTokenMint,
    playerTokenAccount,
    playerTokenBalance,
    playerTokenMintAccountSupply: playerTokenMintAccount,
  } = usePlayerToken();
  const { quoteTokenAccount } = useQuoteToken();
  const transactionToast = useTransactionToast();
  const lastOrderId = api.order.getLastOrderIdForUser.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
    }
  );
  const marketPK = marketAddress ? new PublicKey(marketAddress) : null;
  const { program, accounts, quoteToken } = useQuoteToken();
  const createOrder = api.order.create.useMutation();
  const provider = useAnchorProvider();
  const { publicKey, wallet } = useWallet();
  const queryClient = useQueryClient();
  const { paraPubkey, solanaSigner } = useParaWallet();
  const cancelOrderDB = api.order.cancelOrderForMarketByUser.useMutation();
  const cancelAllOrdersDB =
    api.order.cancelAllOrdersForMarketByUser.useMutation();
  const myPK = useMyPubkey();

  const mintRecord = useQuery({
    queryKey: ["mint-record", { marketAddress }],
    queryFn: async () => {
      if (!playerId.data || !timestamp.data) return;
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];
      const mintRecordAddress = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_record"), mintConfig.toBuffer(), myPK.toBuffer()],
        program.programId
      )[0];

      const mintRecord = await program.account.mintRecord.fetch(
        mintRecordAddress
      );

      return mintRecord;
    },
    enabled: !!playerId.data && !!timestamp.data && !!myPK,
    staleTime: 1000 * 10,
  });

  const PRECISION = new BN(1_000_000); // 6 decimals of precision
  const currentMinterRewards = useQuery({
    queryKey: ["current-minter-rewards", { marketAddress }],
    queryFn: () => {
      const vaultAmount = new BN(vault.data!.amount.toString());
      const playerTokenMintSupply = new BN(
        playerTokenMintAccount.data!.toString()
      );
      const playerStatsActualPoints = new BN(
        playerStatsAccount.data!.actualPoints.valueOf() * PRECISION.toNumber()
      );
      const vaultRemaining = vaultAmount.sub(
        playerTokenMintSupply.mul(playerStatsActualPoints).div(PRECISION)
      );
      const totalDepositedAmount = mintConfigAccount.data!.totalDepositedAmount;
      const depositedByMe = mintRecord.data!.depositedAmount;
      const percentDue = depositedByMe.mul(PRECISION).div(totalDepositedAmount);
      const percentDueDecimal = percentDue.toNumber() / PRECISION.toNumber();
      const minterRewards =
        (vaultRemaining.toNumber() * percentDueDecimal) / PRECISION.toNumber();
      const rewards = parseFloat(minterRewards.toString());
      return rewards.toFixed(4);
    },
    enabled:
      !!mintRecord.data &&
      !!playerStatsAccount.data &&
      !!vault.data &&
      !!mintConfigAccount.data &&
      !!playerTokenMintAccount.data &&
      !!myPK,
    staleTime: 1000 * 10,
  });

  const myOrders = api.order.readOrdersForUserByMarket.useQuery(
    {
      marketAddress: marketAddress ?? "",
    },
    {
      enabled: !!marketAddress,
      staleTime: 1000 * 10,
    }
  );

  const balances = useQuery({
    queryKey: ["market", "balances", { playerMintPK: marketPK }],
    queryFn: async () => {
      if (!hasSeatBeenClaimed.data) {
        return null;
      }
      const balances = await client.market.getBalances(myPK);
      return balances;
    },
    staleTime: 1000 * 10,
    enabled: !!hasSeatBeenClaimed.data && !!myPK,
  });

  const depositAndPlaceBuyOrder = useMutation({
    mutationKey: [
      "market",
      "deposit-and-place-buy-order",
      { playerMintPK: marketPK },
    ],
    mutationFn: async ({
      numBaseTokens,
      tokenPrice,
    }: {
      numBaseTokens: number;
      tokenPrice: number;
    }) => {
      const withdrawableQuote =
        balances.data?.quoteWithdrawableBalanceTokens ?? 0;

      const neededQuote = tokenPrice * numBaseTokens;
      console.log("neededQuote", neededQuote);
      console.log("withdrawableQuote", withdrawableQuote);
      const amountToDeposit =
        (neededQuote * 10 ** 6 - withdrawableQuote * 10 ** 6) / 10 ** 6;
      console.log("amountToDeposit", amountToDeposit);

      const feePayer = publicKey ?? paraPubkey.data!;
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      });
      if (amountToDeposit > 0) {
        const depositIx = client.depositIx(
          feePayer,
          quoteToken,
          amountToDeposit
        );
        transaction.add(depositIx);
      }
      const clientOrderId = (lastOrderId.data ?? 0) + 1;
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: true,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId,
      });
      transaction.add(orderIx);
      if (!publicKey) {
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return {
          signature,
          numBaseTokens,
          tokenPrice,
          isBid: true,
          clientOrderId,
        };
      } else {
        const signature = await wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
        return {
          signature,
          numBaseTokens,
          tokenPrice,
          isBid: true,
          clientOrderId,
        };
      }
    },
    onSuccess: ({ signature, numBaseTokens, tokenPrice, clientOrderId }) => {
      console.log("deposited quote", signature);
      createOrder.mutate({
        marketAddress: marketPK!.toBase58(),
        signature: signature!,
        numBaseTokens: numBaseTokens,
        numQuoteTokens: numBaseTokens * tokenPrice,
        price: tokenPrice,
        isBid: true,
        clientOrderId,
      });
      transactionToast(`${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit quote"),
  });

  const maybeMintDepositAndSell = useMutation({
    mutationKey: [
      "market",
      "maybe-mint-deposit-and-sell",
      { playerMintPK: marketPK },
    ],
    mutationFn: async ({
      numBaseTokens,
      tokenPrice,
    }: {
      numBaseTokens: number;
      tokenPrice: number;
    }) => {
      if (!playerId.data || !timestamp.data) {
        throw new Error("Player ID or timestamp not found");
      }
      const numPlayerDeposited =
        balances.data?.baseWithdrawableBalanceTokens ?? 0;

      console.log(
        "difference",
        (numBaseTokens * 10 ** 6 - numPlayerDeposited * 10 ** 6) / 10 ** 6
      );
      const playerTokenBalanceSafe = playerTokenBalance.data ?? "0";
      const playerTokensHeld = parseInt(playerTokenBalanceSafe) / 10 ** 6;
      const quantityToDeposit =
        (numBaseTokens * 10 ** 6 - numPlayerDeposited * 10 ** 6) / 10 ** 6;
      const baseToMintSafe =
        quantityToDeposit * 10 ** 6 - playerTokensHeld * 10 ** 6;
      const quantityToMint = new BN(baseToMintSafe);
      console.log("quantityToMint", quantityToMint.toString());

      if (!publicKey && !paraPubkey.data) {
        throw new Error("No public key found");
      }
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      if (!publicKey) {
        const mintRecord = PublicKey.findProgramAddressSync(
          [
            Buffer.from("mint_record"),
            mintConfig.toBuffer(),
            paraPubkey.data!.toBuffer(),
          ],
          program.programId
        )[0];
        const blockhash = await provider.connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: paraPubkey.data!,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
        });

        if (quantityToMint.gt(new BN(0))) {
          const ix = await program.methods
            .mintTokens(quantityToMint)
            .accountsStrict({
              payer: paraPubkey.data!,
              quoteTokenMint: quoteToken,
              vault,
              playerTokenMint: playerTokenMint.data!,
              destination: playerTokenAccount.data!,
              config: mintConfig,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              playerStats,
              mintRecord,
              payerAtaQuote: quoteTokenAccount.data!,
            })
            .instruction();
          transaction.add(ix);
        }
        if (quantityToDeposit > 0) {
          const depositIx = client.depositIx(
            paraPubkey.data!,
            playerTokenMint.data!,
            quantityToDeposit
          );
          transaction.add(depositIx);
        }
        const clientOrderId = (lastOrderId.data ?? 0) + 1;
        const orderIx = client.placeOrderIx({
          numBaseTokens: numBaseTokens,
          tokenPrice: tokenPrice,
          isBid: false,
          lastValidSlot: 0,
          orderType: OrderType.Limit,
          clientOrderId,
        });
        transaction.add(orderIx);
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );

        return {
          signature,
          numBaseTokens,
          tokenPrice,
          clientOrderId,
        };
      } else {
        const mintRecord = PublicKey.findProgramAddressSync(
          [
            Buffer.from("mint_record"),
            mintConfig.toBuffer(),
            publicKey.toBuffer(),
          ],
          program.programId
        )[0];
        const blockhash = await provider.connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: publicKey,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
        });
        if (quantityToMint.gt(new BN(0))) {
          const mintIx = await program.methods
            .mintTokens(quantityToMint)
            .accountsStrict({
              payer: publicKey,
              quoteTokenMint: quoteToken,
              vault,
              playerTokenMint: playerTokenMint.data!,
              destination: playerTokenAccount.data!,
              config: mintConfig,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              playerStats,
              mintRecord,
              payerAtaQuote: quoteTokenAccount.data!,
            })
            .instruction();
          transaction.add(mintIx);
        }
        if (quantityToDeposit > 0) {
          console.log("quantityToDeposit", quantityToDeposit);

          const depositIx = client.depositIx(
            publicKey,
            playerTokenMint.data!,
            quantityToDeposit
          );
          transaction.add(depositIx);
        }
        const clientOrderId = (lastOrderId.data ?? 0) + 1;

        const orderIx = client.placeOrderIx({
          numBaseTokens: numBaseTokens,
          tokenPrice: tokenPrice,
          isBid: false,
          lastValidSlot: 0,
          orderType: OrderType.Limit,
          clientOrderId,
        });
        transaction.add(orderIx);
        const signature = await wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
        return {
          signature,
          numBaseTokens,
          tokenPrice,
          clientOrderId,
        };
      }
    },

    onSuccess: ({ signature, numBaseTokens, tokenPrice, clientOrderId }) => {
      console.log("deposited quote", signature);
      createOrder.mutate({
        marketAddress: marketPK!.toBase58(),
        signature: signature!,
        numBaseTokens: numBaseTokens,
        numQuoteTokens: numBaseTokens * tokenPrice,
        price: tokenPrice,
        isBid: false,
        clientOrderId,
      });
      transactionToast(`${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit quote"),
  });

  const cancelAllOrders = useMutation({
    mutationKey: ["market", "cancel-all-orders", { playerMintPK: marketPK }],
    mutationFn: async () => {
      const cancelAllOrdersIx = client.cancelAllIx();
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: publicKey ?? paraPubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(cancelAllOrdersIx);
      if (!publicKey) {
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return signature;
      } else {
        return wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
      }
    },
    onSuccess: (signature) => {
      transactionToast(`${signature}`);
      cancelAllOrdersDB.mutate({
        marketAddress: marketPK!.toBase58(),
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to cancel all orders"),
  });

  const cancelOrder = useMutation({
    mutationKey: ["market", "cancel-order", { playerMintPK: marketPK }],
    mutationFn: async ({
      clientOrderId,
      sequenceNumber,
    }: {
      clientOrderId: number;
      sequenceNumber: number;
    }) => {
      const cancelOrderIx = client.cancelOrderIx({
        clientOrderId,
      });
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: publicKey ?? paraPubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(cancelOrderIx);
      if (!publicKey) {
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return { signature, sequenceNumber };
      } else {
        const signature = await wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
        return { signature, sequenceNumber };
      }
    },
    onSuccess: ({ signature, sequenceNumber }) => {
      transactionToast(`${signature}`);
      cancelOrderDB.mutate({
        marketAddress: marketPK!.toBase58(),
        orderSequenceNumber: parseInt(sequenceNumber.toString()),
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to cancel order"),
  });

  const payout = useMutation({
    mutationKey: ["market", "init-payout", { playerMintPK: marketAddress }],
    mutationFn: async () => {
      const feePayer = publicKey ?? paraPubkey.data!;
      const playerTokenAccount = getAssociatedTokenAddressSync(
        playerTokenMint.data!,
        feePayer
      );
      const quoteTokenAccount = getAssociatedTokenAddressSync(
        quoteToken,
        feePayer
      );

      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];

      const vault = getAssociatedTokenAddressSync(
        quoteToken,
        mintConfig.data!,
        true
      );
      const mintRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_record"),
          mintConfig.data!.toBuffer(),
          feePayer.toBuffer(),
        ],
        program.programId
      )[0];

      const context = {
        payer: feePayer,
        quoteTokenMint: quoteToken,
        playerTokenMint: playerTokenMint.data!,
        vault,
        mintRecord,
        payerQuoteTokenAccount: quoteTokenAccount,
        payerPlayerTokenAccount: playerTokenAccount,
        mintConfig: mintConfig.data!,
        playerStats,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      };

      const ix = await program.methods
        .payout()
        .accountsStrict(context)
        .instruction();
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(ix);
      if (!publicKey) {
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return signature;
      } else {
        return await wallet!.adapter.sendTransaction(
          transaction,
          provider.connection,
          {
            skipPreflight: true,
          }
        );
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to payout"),
  });

  const withdrawAll = useMutation({
    mutationKey: ["market", "withdraw-all", { playerMintPK: marketAddress }],
    mutationFn: async () => {
      const withdrawIx = await client.withdrawAllIx();
      const feePayer = publicKey ?? paraPubkey.data!;
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(...withdrawIx);
      if (!publicKey) {
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return signature;
      } else {
        return wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
      }
    },
    onSuccess: (signature) => {
      transactionToast(`${signature}`);
      queryClient.invalidateQueries({
        queryKey: ["market", "bids", { playerMintPK: marketAddress }],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", "asks", { playerMintPK: marketAddress }],
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to withdraw all"),
  });

  const cancelAndWithdrawAllToPayout = useMutation({
    mutationKey: [
      "market",
      "cancel-and-withdraw-all-to-payout",
      { playerMintPK: marketPK },
    ],
    mutationFn: async () => {
      const cancelAllOrdersIx = client.cancelAllIx();
      const withdrawAllIx = await client.withdrawAllIx();
      const blockhash = await provider.connection.getLatestBlockhash();
      const feePayer = publicKey ?? paraPubkey.data!;
      const playerTokenAccount = getAssociatedTokenAddressSync(
        playerTokenMint.data!,
        feePayer,
        true
      );
      console.log("playerTokenAccount", playerTokenAccount.toBase58());

      const quoteTokenAccount = getAssociatedTokenAddressSync(
        quoteToken,
        feePayer
      );
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      console.log("mintConfig", mintConfig.toBase58());
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];

      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const mintRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_record"),
          mintConfig.toBuffer(),
          feePayer.toBuffer(),
        ],
        program.programId
      )[0];
      let doesMintRecordExist = false;
      try {
        const mintRecordInfo = await program.account.mintRecord.fetch(
          mintRecord
        );
        console.log("mintRecordInfo", mintRecordInfo);
        doesMintRecordExist = true;
      } catch (e) {
        console.log("error", e);
      }

      const context = {
        payer: feePayer,
        quoteTokenMint: quoteToken,
        playerTokenMint: playerTokenMint.data!,
        vault,
        mintRecord: doesMintRecordExist ? mintRecord : null,
        payerQuoteTokenAccount: quoteTokenAccount,
        payerPlayerTokenAccount: playerTokenAccount,
        mintConfig,
        playerStats,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      };

      const ix = await program.methods
        .payout()
        .accountsStrict(context)
        .instruction();
      const transaction = new Transaction({
        feePayer: publicKey ?? paraPubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      });

      try {
        const playerTokenAccountInfo = await getAccount(
          provider.connection,
          playerTokenAccount
        );
        console.log("playerTokenAccount", playerTokenAccountInfo);
      } catch (e) {
        console.log("error", e);
        const createAccountIx = createAssociatedTokenAccountInstruction(
          feePayer,
          playerTokenAccount,
          feePayer,
          playerTokenMint.data!
        );
        transaction.add(createAccountIx);
      }

      transaction.add(cancelAllOrdersIx, ...withdrawAllIx, ix);
      if (!publicKey) {
        const signed = await solanaSigner.data!.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return signature;
      } else {
        return wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
      }
    },
    onSuccess: (signature) => {
      transactionToast(`${signature}`);
      cancelAllOrdersDB.mutate({
        marketAddress: marketPK!.toBase58(),
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to fully cash out"),
  });

  return {
    withdrawAll,
    payout,
    cancelAllOrders,
    cancelOrder,
    depositAndPlaceBuyOrder,
    maybeMintDepositAndSell,
    cancelAndWithdrawAllToPayout,
    balances,
    myOrders,
    mintRecord,
    currentMinterRewards,
  };
}

export const useMyPubkey = () => {
  const { publicKey } = useWallet();
  const { paraPubkey } = useParaWallet();
  return publicKey ?? paraPubkey.data!;
};

export function useMyBags() {
  const { markets, allMarkets } = useMarkets();
  const myTrades = api.trade.readMyTrades.useQuery();
  const myOpenOrders = api.order.getAllMyOpenOrders.useQuery();
  const { program } = useQuoteToken();
  const provider = useAnchorProvider();
  const pubkey = useMyPubkey();
  const myPositions = useQuery({
    queryKey: ["my-mint-records"],
    queryFn: async () => {
      const mintRecordAddresses = markets.data!.map((market) => {
        const mintRecordAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from("mint_record"),
            market.publicKey.toBuffer(),
            pubkey.toBuffer(),
          ],
          program.programId
        )[0];
        return mintRecordAddress;
      });
      const mintRecords = await program.account.mintRecord.fetchMultiple(
        mintRecordAddresses
      );
      const playerStatsAddresses = markets.data!.map((market) => {
        const playerStatsAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from("player_stats"),
            Buffer.from(market.account.playerId),
            Buffer.from(market.account.timestamp),
          ],
          program.programId
        )[0];
        return playerStatsAddress;
      });
      const playerStats = await program.account.playerStats.fetchMultiple(
        playerStatsAddresses
      );

      const positions: {
        shortPositionPayout: number;
        shortPositionMinted: number;
        longPositionPayout: number;
        longPositionHeld: number;
        marketInfo: MarketRouterObject;
      }[] = [];

      const promiseMap = markets.data!.map(async (market, index) => {
        const playerTokenAccountAddress = getAssociatedTokenAddressSync(
          market.account.playerTokenMint,
          pubkey,
          true
        );
        const actualPoints = playerStats[index]?.actualPoints ?? 0;
        const totalDeposited = Number(mintRecords[index]?.depositedAmount) ?? 0;
        const amountMinted = Number(mintRecords[index]?.mintedAmount) ?? 0;

        const shortPositionPayout =
          totalDeposited - amountMinted * actualPoints;
        const marketInfo = allMarkets.data?.find(
          (m) => m.baseMint.timestamp === market.account.timestamp
        );
        if (!marketInfo) return;

        try {
          const playerTokenAccount = await getAccount(
            provider.connection,
            playerTokenAccountAddress
          );
          const playerTokenSupply =
            (Number(playerTokenAccount.amount) ?? 0) / 10 ** 6;
          const longPositionPayout = playerTokenSupply * actualPoints;
          positions.push({
            shortPositionPayout,
            shortPositionMinted: amountMinted,
            longPositionPayout,
            longPositionHeld: playerTokenSupply,
            marketInfo,
          });
        } catch (e) {
          console.log("error", e);
          positions.push({
            shortPositionPayout,
            shortPositionMinted: amountMinted,
            longPositionPayout: 0,
            longPositionHeld: 0,
            marketInfo,
          });
        }
      });
      await Promise.all(promiseMap);
      return positions;
    },
    enabled: markets.data !== undefined && allMarkets.data !== undefined,
    staleTime: 1000 * 10,
  });

  return {
    myTrades,
    myOpenOrders,
    myPositions,
  };
}

type MarketRouterObject = RouterOutputs["market"]["readAllMarkets"][number];

export type LargestPool = {
  config: ProgramAccount<PlayerMintConfig>;
  db: MarketRouterObject | undefined;
  playerStats: ProgramAccount<PlayerStats> | undefined;
  vault: Account | undefined;
  longPayout: number;
  shortPayout: number;
};

export const useLeaderboards = () => {
  const biggestTrades = api.trade.readBiggestTrades.useQuery();
  const { marketsWithPlayerStatsAndVaults } = useMarkets();
  const largestPools = useQuery({
    queryKey: ["largest-pools"],
    queryFn: async () => {
      const sortedMarkets = marketsWithPlayerStatsAndVaults.data?.sort(
        (a, b) => Number(b.vault?.amount) - Number(a.vault?.amount)
      );
      console.log("sortedMarkets", sortedMarkets);
      return sortedMarkets?.filter(
        (market) => market.vault?.amount !== BigInt(0)
      );
    },
    enabled: !!marketsWithPlayerStatsAndVaults.data,
  });

  return {
    biggestTrades,
    largestPools,
  };
};

export const useLivePlays = () => {
  const { market, playerStatsAccount } = usePlayerMarket();
  const latestPlay = api.plays.latestPlay.useQuery();
  const playsByTeam = api.plays.playsByTeam.useQuery(
    market?.data?.team?.id ?? market?.data?.player?.teamId ?? ""
  );
  const playsByPlayer = api.plays.playsByPlayer.useQuery(
    market?.data?.player?.id ?? ""
  );

  const liveProjectedScore = useQuery({
    queryKey: ["live-projected-score"],
    queryFn: async () => {
      const actualPoints = playerStatsAccount?.data?.actualPoints ?? 0;
      const projectedPoints = playerStatsAccount?.data?.projectedPoints ?? 0;
      const percentRemaining = getPercentGameRemaining(
        latestPlay.data?.quarterId ?? 0,
        latestPlay.data?.timeRemainingMinutes ?? 0,
        latestPlay.data?.timeRemainingSeconds ?? 0
      );
      return actualPoints + projectedPoints * percentRemaining;
    },
  });

  return {
    latestPlay,
    playsByTeam,
    playsByPlayer,
    liveProjectedScore,
  };
};
