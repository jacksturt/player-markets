"use client";

import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { BN } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Cluster,
  Keypair,
  PublicKey,
  SendTransactionError,
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
import { ManifestClient } from "manifest/src/client";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";
import { capsule } from "@/lib/capsule";
import { OrderType } from "manifest/src/manifest";
import { Market } from "manifest/src";
import { api } from "@/trpc/react";
import { Position } from "@prisma/client";
import { useParams } from "next/navigation";
import { useActivePlayerMarketStore } from "@/lib/zustand";
export function useQuoteToken() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const { publicKey } = useWallet();
  const programId = useMemo(
    () => getTradetalkProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getTradetalkProgram(provider, programId),
    [provider, programId]
  );

  const accounts = useQuery({
    queryKey: ["markets", "all", { cluster }],
    queryFn: () => program.account.playerMintConfig.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
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
    queryKey: ["capsule-pubkey", { cluster }],
    queryFn: () => new PublicKey(capsule.getAddress()!),
  });

  const quoteTokenAccount = useQuery({
    queryKey: ["quote-token-account", { cluster }],
    queryFn: async () => {
      if (!publicKey) {
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
    mutationKey: ["quote-token", "initialize", { cluster }],
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
    queryKey: ["quote-token-balance", { cluster, quoteTokenAccount }],
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
    mutationKey: ["quote-token", "faucet", { cluster }],
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

export function useMarkets() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const [playerId, setPlayerId] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string>("");
  const [playerTokenMint, setPlayerTokenMint] = useState<string>("");
  const createMint = api.mint.create.useMutation();
  const createMarketAPI = api.market.create.useMutation();
  const createTeamAPI = api.team.create.useMutation();

  const markets = useQuery({
    queryKey: ["markets", "fetch", { cluster }],
    queryFn: async () => {
      const markets = await program.account.playerMintConfig.all();
      return markets;
    },
  });

  const createTeam = useMutation({
    mutationKey: ["markets", "create-team", { cluster }],
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
    mutationKey: ["markets", "initialize", { cluster }],
    mutationFn: async (playerId: string) => {
      const timestamp = Date.now().toString();
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
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
      return { signature, playerId, timestamp, player_token_mint, mintConfig };
    },
    onSuccess: async (data) => {
      transactionToast(data.signature);
      const playerName = "Jaylen Hurts";
      await createMint.mutateAsync(
        {
          mintName: playerName,
          mintSymbol: "JAYLEN",
          mintImage:
            "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
          mintSlug: data.playerId,
          timestamp: data.timestamp,
          description: playerName,
          baseMint: data.player_token_mint.toBase58(),
          teamId: "cm6l90r8j0000rcxnu1blil7n",
          position: "QB",
          playerName: playerName,
          playerSportsdataId: parseInt(data.playerId),
          playerImage:
            "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
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
                marketName: playerName,
                description: playerName,
                address: keyPair.toBase58(),
                mintAddress: data.player_token_mint.toBase58(),
                network: "MAINNET",
              },
              {
                onSuccess: async () => {
                  const playerStats = PublicKey.findProgramAddressSync(
                    [
                      Buffer.from("player_stats"),
                      Buffer.from(data.playerId),
                      Buffer.from(data.timestamp),
                    ],
                    program.programId
                  )[0];
                  return program.methods
                    .initProjectionOracle()
                    .accountsStrict({
                      payer: provider.publicKey,
                      config: data.mintConfig,
                      playerStats,
                      tokenProgram: TOKEN_PROGRAM_ID,
                      systemProgram: SystemProgram.programId,
                      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    })
                    .rpc()
                    .then((signature) => {
                      transactionToast(signature);
                    });
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

  const updateProjectionOracle = useMutation({
    mutationKey: ["markets", "update-projection-oracle", { cluster }],
    mutationFn: async ({
      playerId,
      timestamp,
      projection,
      isProjected,
      setMintingDisabled,
      setPayoutEnabled,
    }: {
      playerId: string;
      timestamp: string;
      projection: number;
      isProjected: boolean;
      setMintingDisabled: boolean;
      setPayoutEnabled: boolean;
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
          setMintingDisabled,
          setPayoutEnabled
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
    mutationKey: ["markets", "close-mint-accounts", { cluster }],
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
    markets,
    initialize: initializeMint,
    updateProjectionOracle,
    createTeam,
    closeMintAccounts,
  };
}

export function usePlayerMarket() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const { publicKey, wallet } = useWallet();
  const queryClient = useQueryClient();
  const { activePlayerMarket } = useActivePlayerMarketStore();
  let marketAddress;
  const { marketAddressParam } = useParams();
  if (marketAddressParam) {
    marketAddress =
      typeof marketAddressParam === "string"
        ? marketAddressParam
        : marketAddressParam[0];
  } else {
    marketAddress = activePlayerMarket;
  }

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

  const capsulePubkey = useQuery({
    queryKey: ["capsule-pubkey", { cluster }],
    queryFn: () => new PublicKey(capsule.getAddress()!),
  });

  const playerTokenMint = useQuery({
    queryKey: ["player-token-mint", { cluster }],
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

  const playerStatsAccount = useQuery({
    queryKey: ["player-stats-account", { cluster }],
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

  const quoteTokenAccount = useQuery({
    queryKey: ["quote-token-account", { cluster }],
    queryFn: async () => {
      if (!publicKey) {
        return getAssociatedTokenAddressSync(
          quoteToken,
          capsulePubkey.data!,
          true
        );
      } else {
        return getAssociatedTokenAddressSync(quoteToken, publicKey);
      }
    },
    enabled: !!capsulePubkey.data || !!publicKey,
  });

  const latestTransaction = useQuery({
    queryKey: ["latest-transaction", { playerMintPK: marketPK }],
    queryFn: async () => {
      const lastSignatureStatus = (
        await provider.connection.getSignaturesForAddress(
          new PublicKey("MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms"),
          { limit: 1 },
          "finalized"
        )
      )[0];
      return lastSignatureStatus;
    },
  });

  const playerTokenAccount = useQuery({
    queryKey: ["player-token-account", { cluster }],
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
    queryKey: ["market", "player-token-balance", { playerMintPK: marketPK }],
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

  const balances = useQuery({
    queryKey: ["market", "balances", { playerMintPK: marketPK }],
    queryFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!,
        wallet || undefined
      );
      const payer = publicKey ?? capsulePubkey.data!;
      const balances = await client.market.getBalances(payer);
      return balances;
    },
  });

  const mint = useMutation({
    mutationKey: ["market", "mint", { playerMintPK: marketPK }],
    mutationFn: async () => {
      if (!playerId.data || !timestamp.data) {
        throw new Error("Player ID or timestamp not found");
      }
      const quantity = new BN(1000 * 10 ** 6);

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

        const playerStats = PublicKey.findProgramAddressSync(
          [
            Buffer.from("player_stats"),
            Buffer.from(playerId.data ?? ""),
            Buffer.from(timestamp.data ?? ""),
          ],
          program.programId
        )[0];

        const ix = await program.methods
          .mintTokens(quantity)
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
        const blockhash = await provider.connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: capsulePubkey.data!,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
        }).add(ix);
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return signature;
      } else {
        const mintRecord = PublicKey.findProgramAddressSync(
          [
            Buffer.from("mint_record"),
            mintConfig.toBuffer(),
            publicKey.toBuffer(),
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

        const signature = await program.methods
          .mintTokens(quantity)
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
          .rpc();
        return signature;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      playerTokenBalance.refetch();
      return accounts.refetch();
    },
    onError: async (error: SendTransactionError) => {
      toast.error("Failed to mint tokens");
      console.error("error", error);
      try {
        const logs = await error.getLogs(provider.connection);
        console.log("logs", logs);
      } catch (error) {
        console.error("error", error);
      }
    },
  });

  const depositQuote = useMutation({
    mutationKey: ["market", "deposit-quote", { playerMintPK: marketPK }],
    mutationFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!,
        wallet || undefined
      );
      const feePayer = publicKey ?? capsulePubkey.data!;
      const amount = 100;
      console.log("depositPK", feePayer);
      const depositIx = client.depositIx(feePayer, quoteToken, amount);

      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(depositIx);

      if (!publicKey) {
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
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
      console.log("deposited quote", signature);
      transactionToast(`Deposited quote: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit quote"),
  });

  const depositBase = useMutation({
    mutationKey: ["market", "deposit-base", { playerMintPK: marketPK }],
    mutationFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!,
        wallet || undefined
      );
      const amount = 100;
      const player_token_mint = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      const feePayer = publicKey ?? capsulePubkey.data!;

      const depositIx = client.depositIx(feePayer, player_token_mint, amount);
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(depositIx);
      if (!publicKey) {
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
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
      transactionToast(`Deposited quote: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit base"),
  });

  const buy = useMutation({
    mutationKey: ["market", "buy-quote", { playerMintPK: marketPK }],
    mutationFn: async ({
      numBaseTokens,
      tokenPrice,
    }: {
      numBaseTokens: number;
      tokenPrice: number;
    }) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!,
        wallet || undefined
      );
      // const sequenceNumber = await market.
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: true,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId: 0,
      });
      const feePayer = publicKey ?? capsulePubkey.data!;

      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(orderIx);
      if (!publicKey) {
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
        const signature = await provider.connection.sendRawTransaction(
          signed.serialize()
        );
        return { signature, tokenPrice, numBaseTokens };
      } else {
        const signature = await wallet?.adapter.sendTransaction(
          transaction,
          provider.connection
        );
        return { signature, tokenPrice, numBaseTokens };
      }
    },
    onSuccess: async ({ signature, tokenPrice, numBaseTokens }) => {
      transactionToast(`Placed buy order: ${signature}`);
      queryClient.invalidateQueries({
        queryKey: ["market", "bids", { playerMintPK: marketPK }],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", "asks", { playerMintPK: marketPK }],
      });
      accounts.refetch();

      const market: Market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      const bids = await market.bids();
      const thisBid = bids.find(
        (bid) =>
          bid.trader.toBase58() === capsulePubkey.data!.toBase58() &&
          bid.tokenPrice === tokenPrice &&
          bid.numBaseTokens === numBaseTokens
      );
    },
    onError: () => toast.error("Failed to place buy order"),
  });

  const sell = useMutation({
    mutationKey: ["market", "sell-quote", { playerMintPK: marketPK }],
    mutationFn: async ({
      numBaseTokens,
      tokenPrice,
    }: {
      numBaseTokens: number;
      tokenPrice: number;
    }) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!,
        wallet || undefined
      );
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: false,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId: 0,
      });
      const feePayer = publicKey ?? capsulePubkey.data!;
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(orderIx);
      if (!publicKey) {
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
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
      transactionToast(`Placed sell order: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to place sell order"),
  });

  const withdrawAll = useMutation({
    mutationKey: ["market", "withdraw-all", { playerMintPK: marketPK }],
    mutationFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!,
        wallet || undefined
      );
      const withdrawIx = await client.withdrawAllIx();
      const feePayer = publicKey ?? capsulePubkey.data!;
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(...withdrawIx);
      if (!publicKey) {
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
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
      transactionToast(`Withdrew all: ${signature}`);
      queryClient.invalidateQueries({
        queryKey: ["market", "bids", { playerMintPK: marketPK }],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", "asks", { playerMintPK: marketPK }],
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to withdraw all"),
  });

  const printMarket = useMutation({
    mutationKey: ["market", "print", { playerMintPK: marketPK }],
    mutationFn: async () => {
      const market: Market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      market.prettyPrint();
    },
    onSuccess: () => {
      transactionToast(`Market printed`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to print market"),
  });

  const payout = useMutation({
    mutationKey: ["market", "init-payout", { playerMintPK: marketPK }],
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
        const solanaSigner = new CapsuleSolanaWeb3Signer(
          capsule,
          provider.connection
        );
        const signed = await solanaSigner.signTransaction(transaction);
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

  return {
    mint,
    market,
    depositBase,
    depositQuote,
    buy,
    sell,
    withdrawAll,
    printMarket,
    payout,
    bids,
    asks,
    balances,
    latestTransaction,
    playerTokenAccount,
    playerTokenBalance,
    trades,
    lastTradePrice,
    playerStatsAccount,
  };
}
