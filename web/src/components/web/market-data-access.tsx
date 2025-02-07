"use client";

import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { BN } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Cluster,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMarketTX } from "manifest/instructions/createMarket";
import { ManifestClient } from "manifest/src/client";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";
import { capsule } from "@/lib/capsule";
import { OrderType } from "manifest/src/manifest";
import { Market, Wrapper, WrapperMarketInfo, WrapperData } from "manifest/src";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { bignum } from "@metaplex-foundation/beet";
export function useQuoteToken() {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const { publicKey } = useWallet();
  const programId = useMemo(() => getTradetalkProgramId("mainnet-beta"), []);
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
  });

  let quoteTokenMint = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  );

  const quoteConfig = PublicKey.findProgramAddressSync(
    [Buffer.from("quoteConfig")],
    program.programId
  )[0];

  const capsulePubkey = useQuery({
    queryKey: ["capsule-pubkey"],
    queryFn: () => new PublicKey(capsule.getAddress()!),
  });

  const quoteTokenAccount = useQuery({
    queryKey: ["quote-token-account"],
    queryFn: async () => {
      if (!publicKey) {
        console.log("capsulePubkey.data!", capsulePubkey.data?.toBase58());
        return getAssociatedTokenAddressSync(
          quoteTokenMint,
          capsulePubkey.data!,
          true
        );
      } else {
        return getAssociatedTokenAddressSync(quoteTokenMint, publicKey);
      }
    },
    enabled: !!capsulePubkey.data || !!publicKey,
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
  });

  const faucetQuote = useMutation({
    mutationKey: ["quote-token", "faucet"],
    mutationFn: async () => {
      if (!publicKey) {
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );

        const ix = await program.methods
          .faucetQuote(new BN(10000000000000))
          .accountsStrict({
            payer: capsulePubkey.data!,
            quoteTokenMint,
            config: quoteConfig,
            destination: quoteTokenAccount.data!,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .instruction();

        const blockhash = await provider.connection.getLatestBlockhash();
        await provider.connection.getLatestBlockhash();

        const transaction = new Transaction({
          feePayer: capsulePubkey.data!,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
        }).add(ix);

        const signed = await solanaSigner.signTransaction(transaction);

        const signature = await connection.sendRawTransaction(
          signed.serialize()
        );
        return signature;
      } else {
        const signature = await program.methods
          .faucetQuote(new BN(10000000000000))
          .accountsStrict({
            payer: publicKey,
            quoteTokenMint,
            config: quoteConfig,
            destination: quoteTokenAccount.data!,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        return signature;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      quoteTokenBalance.refetch();
      return accounts.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
    quoteToken: quoteTokenMint,
    quoteTokenAccount,
    faucetQuote,
    quoteTokenBalance,
  };
}

export function useMarketAdmin() {
  const transactionToast = useTransactionToast();
  const { program, accounts, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const [playerId, setPlayerId] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string>("");
  const [playerTokenMint, setPlayerTokenMint] = useState<string>("");
  const createMint = api.mint.create.useMutation();
  const createMarketAPI = api.market.create.useMutation();
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
    }) => {
      const timestamp = Date.now().toString();
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(teamId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(teamId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const signature = await program.methods
        .initMint(playerId, timestamp)
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
        .rpc();
      setPlayerId(playerId);
      setTimestamp(timestamp);
      setPlayerTokenMint(player_token_mint.toBase58());
      return {
        signature,
        playerId,
        timestamp,
        player_token_mint,
        mintConfig,
        playerName,
        playerImage,
        playerPosition,
        teamId,
        mintSymbol,
        season,
        week,
        network,
        projection,
      };
    },
    onSuccess: async (data: {
      signature: string;
      playerId: string;
      timestamp: string;
      player_token_mint: PublicKey;
      playerName: string;
      playerImage: string;
      playerPosition: string;
      teamId: string;
      mintSymbol: string;
      season: string;
      week: string;
      network: string;
      projection: number;
      mintConfig: PublicKey;
    }) => {
      transactionToast(data.signature);
      await createMint.mutateAsync(
        {
          mintName: data.playerName,
          mintSymbol: data.mintSymbol,
          mintImage: data.playerImage,
          mintSlug: data.teamId,
          timestamp: data.timestamp,
          description: data.playerName,
          baseMint: data.player_token_mint.toBase58(),
          teamId: data.teamId,
          teamSportsdataId: data.teamId,
          position: data.playerPosition as
            | "QB"
            | "RB"
            | "WR"
            | "TE"
            | "K"
            | "DEF",
          playerName: data.playerName,
          playerSportsdataId: parseInt(data.playerId),
          playerImage: data.playerImage,
        },
        {
          onSuccess: async () => {
            toast.success("Mint created");
            const keyPair = await createMarketTX(
              provider.connection,
              provider,
              quoteToken,
              data.player_token_mint
            );

            createMarketAPI.mutateAsync(
              {
                marketName: data.playerName,
                description: data.playerName,
                address: keyPair.toBase58(),
                mintAddress: data.player_token_mint.toBase58(),
                network: data.network as "MAINNET" | "DEVNET",
                season: data.season,
                week: data.week,
              },
              {
                onSuccess: async () => {
                  const playerStats = PublicKey.findProgramAddressSync(
                    [
                      Buffer.from("player_stats"),
                      Buffer.from(data.teamId),
                      Buffer.from(data.timestamp),
                    ],
                    program.programId
                  )[0];
                  const initSignature = await program.methods
                    .initProjectionOracle()
                    .accountsStrict({
                      payer: provider.publicKey,
                      config: data.mintConfig,
                      playerStats,
                      tokenProgram: TOKEN_PROGRAM_ID,
                      systemProgram: SystemProgram.programId,
                      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    })
                    .rpc();
                  transactionToast(initSignature);

                  const updateSignature = await program.methods
                    .updateProjectionOracle(data.projection, true, true, false)
                    .accountsStrict({
                      authority: provider.publicKey,
                      config: data.mintConfig,
                      playerStats,
                    })
                    .rpc();
                  transactionToast(updateSignature);
                },
                onError: async (error) => {
                  toast.error(error.message);
                },
              }
            );

            return accounts.refetch();
          },
        }
      );
    },
    onError: async (error: SendTransactionError) => {
      toast.error(error.message);
      const logs = await error.getLogs(provider.connection);
      console.log("logs", logs);
    },
  });

  const initializeTeamMint = useMutation({
    mutationKey: ["markets", "initialize-team-mint"],
    mutationFn: async ({
      teamId,
      mintSymbol,
      season,
      week,
      network,
      projection,
    }: {
      teamId: string;
      mintSymbol: string;
      season: string;
      week: string;
      network: string;
      projection: number;
    }) => {
      const timestamp = Date.now().toString();
      const team_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(teamId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(teamId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const signature = await program.methods
        .initMint(teamId, timestamp)
        .accountsStrict({
          payer: provider.publicKey,
          quoteTokenMint: quoteToken,
          vault,
          playerTokenMint: team_token_mint,
          config: mintConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setPlayerId(playerId);
      setTimestamp(timestamp);
      setPlayerTokenMint(team_token_mint.toBase58());
      return {
        signature,
        teamId,
        timestamp,
        team_token_mint,
        mintConfig,
        mintSymbol,
        season,
        week,
        network,
        projection,
      };
    },
    onSuccess: async (data: {
      signature: string;
      teamId: string;
      timestamp: string;
      team_token_mint: PublicKey;
      mintSymbol: string;
      season: string;
      week: string;
      network: string;
      projection: number;
      mintConfig: PublicKey;
    }) => {
      transactionToast(data.signature);
      await createMint.mutateAsync(
        {
          mintSlug: data.teamId,
          timestamp: data.timestamp,
          description: data.teamId,
          baseMint: data.team_token_mint.toBase58(),
          // teamId: data.teamId,
          teamSportsdataId: data.teamId,
        },
        {
          onSuccess: async () => {
            toast.success("Mint created");
            const keyPair = await createMarketTX(
              provider.connection,
              provider,
              quoteToken,
              data.team_token_mint
            );

            createMarketAPI.mutateAsync(
              {
                marketName: data.teamId,
                description: data.teamId,
                address: keyPair.toBase58(),
                mintAddress: data.team_token_mint.toBase58(),
                network: data.network as "MAINNET" | "DEVNET",
                season: data.season,
                week: data.week,
                teamPointsProjected: data.projection,
              },
              {
                onSuccess: async () => {
                  const playerStats = PublicKey.findProgramAddressSync(
                    [
                      Buffer.from("player_stats"),
                      Buffer.from(data.teamId),
                      Buffer.from(data.timestamp),
                    ],
                    program.programId
                  )[0];
                  const initSignature = await program.methods
                    .initProjectionOracle()
                    .accountsStrict({
                      payer: provider.publicKey,
                      config: data.mintConfig,
                      playerStats,
                      tokenProgram: TOKEN_PROGRAM_ID,
                      systemProgram: SystemProgram.programId,
                      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    })
                    .rpc();
                  transactionToast(initSignature);

                  const updateSignature = await program.methods
                    .updateProjectionOracle(data.projection, true, true, false)
                    .accountsStrict({
                      authority: provider.publicKey,
                      config: data.mintConfig,
                      playerStats,
                    })
                    .rpc();
                  transactionToast(updateSignature);
                },
                onError: async (error) => {
                  toast.error(error.message);
                },
              }
            );

            return accounts.refetch();
          },
        }
      );
    },
    onError: async (error: SendTransactionError) => {
      toast.error(error.message);
      const logs = await error.getLogs(provider.connection);
      console.log("logs", logs);
    },
  });

  const finishCreatingMarket = useMutation({
    mutationKey: ["markets", "finish-creating-market"],
    mutationFn: async ({
      playerId,
      playerName,
      season,
      week,
      projection,
      marketAddress,
      mintAddress,
      mintTimestamp,
    }: {
      playerId: string;
      playerName: string;
      season: string;
      week: string;
      projection: number;
      mintTimestamp: string;
      marketAddress: string;
      mintAddress: string;
    }) => {
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId),
          Buffer.from(mintTimestamp),
        ],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId),
          Buffer.from(mintTimestamp),
        ],
        program.programId
      )[0];
      const initSignature = await program.methods
        .initProjectionOracle()
        .accountsStrict({
          payer: provider.publicKey,
          config: mintConfig,
          playerStats,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      transactionToast(initSignature);

      const updateSignature = await program.methods
        .updateProjectionOracle(projection, true, false, false)
        .accountsStrict({
          authority: provider.publicKey,
          config: mintConfig,
          playerStats,
        })
        .rpc();
      transactionToast(updateSignature);
    },
    onSuccess: async () => {
      toast.success("Market created");
    },
    onError: async (error: SendTransactionError) => {
      toast.error(error.message);
      const logs = await error.getLogs(provider.connection);
      console.log("logs", logs);
    },
  });

  const updateProjectionOracle = useMutation({
    mutationKey: ["markets", "update-projection-oracle"],
    mutationFn: async ({
      playerId,
      timestamp,
      projection,
      isProjected,
      isMintingEnabled,
      isPayoutEnabled,
    }: {
      playerId: string;
      timestamp: string;
      projection: number;
      isProjected: boolean;
      isMintingEnabled: boolean;
      isPayoutEnabled: boolean;
    }) => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId),
          Buffer.from(timestamp),
        ],
        program.programId
      )[0];
      const signature = await program.methods
        .updateProjectionOracle(
          projection,
          isProjected,
          isMintingEnabled,
          isPayoutEnabled
        )
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

  const closeMintAccounts = useMutation({
    mutationKey: ["markets", "close-mint-accounts"],
    mutationFn: async ({
      playerId,
      timestamp,
    }: {
      playerId: string;
      timestamp: string;
    }) => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const playerStats = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player_stats"),
          Buffer.from(playerId),
          Buffer.from(timestamp),
        ],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const context = {
        admin: provider.publicKey,
        quoteTokenMint: quoteToken,
        playerStats,
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
    finishCreatingMarket,
    initializeTeamMint,
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
          vaults.push(vault);
        } catch (error) {
          console.error(error);
        }
      }
      return vaults;
    },
    enabled: !!markets.data,
  });

  return {
    markets,
    vaults,
    allMarkets,
  };
}

export function usePlayerMarket({ marketAddress }: { marketAddress: string }) {
  const transactionToast = useTransactionToast();
  const { program, accounts, quoteToken } = useQuoteToken();
  const createOrder = api.order.create.useMutation();
  const provider = useAnchorProvider();
  const { publicKey, wallet } = useWallet();
  const queryClient = useQueryClient();

  const market = api.market.read.useQuery(
    {
      marketAddress: marketAddress,
    },
    {
      enabled: !!marketAddress,
    }
  );

  const lastTradePrice = api.market.lastTradePrice.useQuery(
    {
      marketAddress: marketAddress,
    },
    {
      enabled: !!marketAddress,
      refetchInterval: 10000,
    }
  );

  const marketPK = useQuery({
    queryKey: ["market-pk", { marketAddress }],
    queryFn: () => new PublicKey(marketAddress),
  });

  const timestamp = useQuery({
    queryKey: ["timestamp", { marketAddress }],
    queryFn: () => market.data?.baseMint.timestamp,
    enabled: !!market.data,
  });

  const playerId = useQuery({
    queryKey: ["playerId", { marketAddress }],
    queryFn: () => market.data?.baseMint.mintSlug,
    enabled: !!market.data,
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
  });

  const bids = useQuery({
    queryKey: ["market", "bids", { marketAddress }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      const bids = await market.bids();
      return bids;
    },
    refetchInterval: 10000,
  });

  const asks = useQuery({
    queryKey: ["market", "asks", { marketAddress }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      const asks = await market.asks();
      return asks;
    },
    refetchInterval: 10000,
  });

  const trades = api.trade.readForMarket.useQuery(
    {
      marketAddress: marketAddress,
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
  };
}

export const usePlayerToken = ({
  marketAddress,
}: {
  marketAddress: string;
}) => {
  const { program, accounts, quoteToken } = useQuoteToken();
  const createOrder = api.order.create.useMutation();
  const provider = useAnchorProvider();
  const { publicKey, wallet } = useWallet();
  const { capsulePubkey, solanaSigner } = useCapsuleWallet();
  const { playerId, timestamp } = usePlayerMarket({ marketAddress });
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
  });

  const playerTokenAccount = useQuery({
    queryKey: ["player-token-account"],
    queryFn: async () => {
      if (!publicKey) {
        const playerTokenAccount = getAssociatedTokenAddressSync(
          playerTokenMint.data!,
          capsulePubkey.data!,
          true
        );
        return playerTokenAccount;
      } else {
        return getAssociatedTokenAddressSync(playerTokenMint.data!, publicKey);
      }
    },
    enabled: !!capsulePubkey.data || !!publicKey,
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
  });

  const playerTokenMintAccount = useQuery({
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
  });

  return {
    playerTokenMint,
    playerTokenAccount,
    playerTokenBalance,
    playerTokenMintAccount,
  };
};

export const useCapsuleWallet = () => {
  const provider = useAnchorProvider();
  const { publicKey } = useWallet();
  const capsulePubkey = useQuery({
    queryKey: ["capsule-pubkey"],
    queryFn: () => new PublicKey(capsule.getAddress()!),
  });

  const solanaSigner = useQuery({
    queryKey: ["solana-signer"],
    queryFn: () => {
      if (!publicKey) {
        const signer = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        return signer;
      } else {
        return null;
      }
    },
  });

  return { capsulePubkey, solanaSigner };
};

export const useManifestClient = ({
  marketAddress,
}: {
  marketAddress: string;
}) => {
  const provider = useAnchorProvider();
  const { publicKey, wallet } = useWallet();
  const { capsulePubkey } = useCapsuleWallet();
  const marketPK = marketAddress ? new PublicKey(marketAddress) : null;

  const hasSeatBeenClaimed = useQuery({
    queryKey: ["has-seat-been-claimed", { marketAddress }],
    queryFn: async () => {
      const userWrapper = await ManifestClient.fetchFirstUserWrapper(
        provider.connection,
        publicKey ?? capsulePubkey.data!
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
  });

  return { manifestClient, hasSeatBeenClaimed, claimSeat };
};

export function useMyMarket({ marketAddress }: { marketAddress: string }) {
  const { playerId, timestamp, vault, mintConfigAccount, playerStatsAccount } =
    usePlayerMarket({ marketAddress });

  const { manifestClient, hasSeatBeenClaimed } = useManifestClient({
    marketAddress,
  });
  const client = manifestClient.data!;
  const {
    playerTokenMint,
    playerTokenAccount,
    playerTokenBalance,
    playerTokenMintAccount,
  } = usePlayerToken({ marketAddress });
  const { quoteTokenAccount } = useQuoteToken();
  const transactionToast = useTransactionToast();
  const lastOrderId = api.order.getLastOrderIdForUser.useQuery(
    {
      marketAddress: marketAddress,
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
  const { capsulePubkey, solanaSigner } = useCapsuleWallet();

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
      const pubkey = publicKey ?? capsulePubkey.data!;
      const mintRecordAddress = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_record"), mintConfig.toBuffer(), pubkey.toBuffer()],
        program.programId
      )[0];

      const mintRecord = await program.account.mintRecord.fetch(
        mintRecordAddress
      );

      return mintRecord;
    },
    enabled: !!playerId.data && !!timestamp.data,
  });

  const PRECISION = new BN(1_000_000); // 6 decimals of precision
  const currentMinterRewards = useQuery({
    queryKey: ["current-minter-rewards", { marketAddress }],
    queryFn: () => {
      const vaultAmount = new BN(vault.data!.amount.toString());
      console.log("vaultAmount", vaultAmount.toString());
      const playerTokenMintSupply = new BN(
        playerTokenMintAccount.data!.toString()
      );
      console.log("playerTokenMintSupply", playerTokenMintSupply.toString());
      console.log(playerStatsAccount.data!.actualPoints.valueOf());
      const playerStatsActualPoints = new BN(
        playerStatsAccount.data!.actualPoints.valueOf() * PRECISION.toNumber()
      );
      console.log(
        "playerStatsActualPoints",
        playerStatsActualPoints.toString()
      );
      const vaultRemaining = vaultAmount.sub(
        playerTokenMintSupply.mul(playerStatsActualPoints).div(PRECISION)
      );
      console.log("vaultRemaining", vaultRemaining.toString());
      const totalDepositedAmount = mintConfigAccount.data!.totalDepositedAmount;
      console.log("totalDepositedAmount", totalDepositedAmount.toString());
      const depositedByMe = mintRecord.data!.depositedAmount;
      console.log("depositedByMe", depositedByMe.toString());
      const percentDue = depositedByMe.mul(PRECISION).div(totalDepositedAmount);
      const percentDueDecimal = percentDue.toNumber() / PRECISION.toNumber();
      console.log("percentDue", percentDueDecimal);
      const minterRewards =
        (vaultRemaining.toNumber() * percentDueDecimal) / PRECISION.toNumber();
      console.log("minterRewards", minterRewards.toString());
      const rewards = parseFloat(minterRewards.toString());
      return rewards.toFixed(4);
    },
    enabled:
      !!mintRecord.data &&
      !!playerStatsAccount.data &&
      !!vault.data &&
      !!mintConfigAccount.data &&
      !!playerTokenMintAccount.data,
  });

  const myOrders = api.order.readOrdersForUserByMarket.useQuery(
    {
      marketAddress: marketAddress,
    },
    {
      enabled: !!marketAddress,
    }
  );

  const balances = useQuery({
    queryKey: ["market", "balances", { playerMintPK: marketPK }],
    queryFn: async () => {
      if (!hasSeatBeenClaimed.data) {
        return null;
      }
      const payer = publicKey ?? capsulePubkey.data!;
      const balances = await client.market.getBalances(payer);
      return balances;
    },
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
      const withdrawableQuote = balances.data?.quoteWithdrawableBalanceTokens;
      if (withdrawableQuote === undefined) {
        throw new Error("No withdrawable quote tokens");
      }
      const neededQuote = tokenPrice * numBaseTokens;
      console.log("neededQuote", neededQuote);
      console.log("withdrawableQuote", withdrawableQuote);
      const amountToDeposit =
        (neededQuote * 10 ** 6 - withdrawableQuote * 10 ** 6) / 10 ** 6;
      console.log("amountToDeposit", amountToDeposit);

      const feePayer = publicKey ?? capsulePubkey.data!;
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

      if (!publicKey && !capsulePubkey.data) {
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
            capsulePubkey.data!.toBuffer(),
          ],
          program.programId
        )[0];
        const blockhash = await provider.connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: capsulePubkey.data!,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
        });

        if (quantityToMint.gt(new BN(0))) {
          const ix = await program.methods
            .mintTokens(quantityToMint)
            .accountsStrict({
              payer: capsulePubkey.data!,
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
            capsulePubkey.data!,
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
        feePayer: publicKey ?? capsulePubkey.data!,
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
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to cancel all orders"),
  });

  const cancelOrder = useMutation({
    mutationKey: ["market", "cancel-order", { playerMintPK: marketPK }],
    mutationFn: async ({ clientOrderId }: { clientOrderId: number }) => {
      const cancelOrderIx = client.cancelOrderIx({
        clientOrderId,
      });
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: publicKey ?? capsulePubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(cancelOrderIx);
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
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to cancel order"),
  });

  const payout = useMutation({
    mutationKey: ["market", "init-payout", { playerMintPK: marketAddress }],
    mutationFn: async () => {
      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      const player_token_mint = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      const feePayer = publicKey ?? capsulePubkey.data!;
      const playerTokenAccount = getAssociatedTokenAddressSync(
        player_token_mint,
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

      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const mintRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_record"),
          mintConfig.toBuffer(),
          feePayer.toBuffer(),
        ],
        program.programId
      )[0];

      const context = {
        payer: feePayer,
        quoteTokenMint: quoteToken,
        playerTokenMint: player_token_mint,
        vault,
        mintRecord,
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
      const feePayer = publicKey ?? capsulePubkey.data!;
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

  return {
    withdrawAll,
    payout,
    cancelAllOrders,
    cancelOrder,
    depositAndPlaceBuyOrder,
    maybeMintDepositAndSell,

    balances,
    myOrders,
    mintRecord,
    currentMinterRewards,
  };
}

export function usePlayerMarketWithParams() {
  const { marketAddress: marketAddressParam } = useParams();
  const marketAddress =
    typeof marketAddressParam === "string"
      ? marketAddressParam
      : marketAddressParam[0];
  return usePlayerMarket({ marketAddress: marketAddress! });
}
