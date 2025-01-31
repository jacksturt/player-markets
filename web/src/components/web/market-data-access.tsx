"use client";

import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
import { BN } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
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
export function useQuoteToken() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
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

  let quoteTokenMint = PublicKey.findProgramAddressSync(
    [Buffer.from("quote")],
    program.programId
  )[0];

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
      return getAssociatedTokenAddressSync(
        quoteTokenMint,
        capsulePubkey.data!,
        true
      );
    },
    enabled: !!capsulePubkey.data,
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

      const signature = await connection.sendRawTransaction(signed.serialize());
      return signature;
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
      const playerName = "Jayden Daniels";
      await createMint.mutateAsync(
        {
          mintName: playerName,
          mintSymbol: "JAYDEN",
          mintImage:
            "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
          mintSlug: data.playerId,
          timestamp: data.timestamp,
          description: playerName,
          baseMint: data.player_token_mint.toBase58(),
          teamId: "cm6956n4l0000rcd8bwncqgxy",
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
                    .initProjectionOracle(data.playerId, data.timestamp)
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
    mutationFn: ({
      playerId,
      timestamp,
      projection,
    }: {
      playerId: string;
      timestamp: string;
      projection: number;
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
      return program.methods
        .updateProjectionOracle(projection)
        .accountsStrict({
          authority: provider.publicKey,
          config: mintConfig,
          playerStats,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });
  return {
    markets,
    initialize: initializeMint,
    updateProjectionOracle,
    createTeam,
  };
}

export function usePlayerMarket() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();
  const { marketAddress: marketAddressParam } = useParams();
  const marketAddress =
    typeof marketAddressParam === "string"
      ? marketAddressParam
      : marketAddressParam[0];

  const market = api.market.read.useQuery(
    {
      marketAddress: marketAddress,
    },
    {
      enabled: !!marketAddress,
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

  const quoteTokenAccount = useQuery({
    queryKey: ["quote-token-account", { cluster }],
    queryFn: async () => {
      return getAssociatedTokenAddressSync(
        quoteToken,
        capsulePubkey.data!,
        true
      );
    },
    enabled: !!capsulePubkey.data,
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
      console.log(
        "getting player token account",
        playerTokenMint.data?.toBase58(),
        capsulePubkey.data?.toBase58()
      );
      const playerTokenAccount = getAssociatedTokenAddressSync(
        playerTokenMint.data!,
        capsulePubkey.data!,
        true
      );
      console.log(playerTokenAccount.toBase58());
      return playerTokenAccount;
    },
    enabled: !!capsulePubkey.data,
  });

  const playerTokenBalance = useQuery({
    queryKey: ["market", "player-token-balance", { playerMintPK: marketPK }],
    queryFn: async () => {
      console.log(
        "getting player token balance",
        playerTokenAccount.data?.toBase58
      );
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
    queryKey: ["market", "bids", { playerMintPK: marketPK }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      const bids = await market.bids();
      return bids;
    },
  });

  const asks = useQuery({
    queryKey: ["market", "asks", { playerMintPK: marketPK }],
    queryFn: async () => {
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      const asks = await market.asks();
      return asks;
    },
  });

  const balances = useQuery({
    queryKey: ["market", "balances", { playerMintPK: marketPK }],
    queryFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!
      );
      const balances = await client.market.getBalances(capsulePubkey.data!);
      return balances;
    },
  });

  const mint = useMutation({
    mutationKey: ["market", "mint", { playerMintPK: marketPK }],
    mutationFn: async () => {
      if (
        !playerId.data ||
        !timestamp.data ||
        !capsulePubkey.data ||
        !playerTokenAccount.data
      ) {
        throw new Error("Player ID or timestamp not found");
      }
      console.log(
        "minting tokens",
        playerId.data,
        timestamp.data,
        capsulePubkey.data.toBase58(),
        playerTokenAccount.data.toBase58()
      );

      const mintConfig = PublicKey.findProgramAddressSync(
        [
          Buffer.from("config"),
          Buffer.from(playerId.data),
          Buffer.from(timestamp.data),
        ],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);

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
        .mintTokens(new BN(30000000000))
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
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      playerTokenBalance.refetch();
      return accounts.refetch();
    },
    onError: async (error: SendTransactionError) => {
      toast.error("Failed to mint tokens");
      const logs = await error.getLogs(provider.connection);
      console.log("logs", logs);
    },
  });

  const depositQuote = useMutation({
    mutationKey: ["market", "deposit-quote", { playerMintPK: marketPK }],
    mutationFn: async (amount: number) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!
      );
      const depositIx = client.depositIx(
        capsulePubkey.data!,
        quoteToken,
        amount
      );
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: capsulePubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(depositIx);
      const solanaSigner = new CapsuleSolanaWeb3Signer(
        capsule,
        provider.connection
      );
      const signed = await solanaSigner.signTransaction(transaction);
      const signature = await provider.connection.sendRawTransaction(
        signed.serialize()
      );
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited quote: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit quote"),
  });

  const depositBase = useMutation({
    mutationKey: ["market", "deposit-base", { playerMintPK: marketPK }],
    mutationFn: async (amount: number) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!
      );
      const player_token_mint = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          Buffer.from(playerId.data ?? ""),
          Buffer.from(timestamp.data ?? ""),
        ],
        program.programId
      )[0];
      const depositIx = client.depositIx(
        capsulePubkey.data!,
        player_token_mint,
        amount
      );
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: capsulePubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(depositIx);
      const solanaSigner = new CapsuleSolanaWeb3Signer(
        capsule,
        provider.connection
      );
      const signed = await solanaSigner.signTransaction(transaction);
      const signature = await provider.connection.sendRawTransaction(
        signed.serialize()
      );
      return signature;
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
        marketPK.data!
      );
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK.data!,
      });
      // const sequenceNumber = await market.
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: true,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId: 0,
      });

      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: capsulePubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(orderIx);
      const solanaSigner = new CapsuleSolanaWeb3Signer(
        capsule,
        provider.connection
      );
      const signed = await solanaSigner.signTransaction(transaction);
      const signature = await provider.connection.sendRawTransaction(
        signed.serialize()
      );
      return { signature, tokenPrice, numBaseTokens };
    },
    onSuccess: async ({ signature, tokenPrice, numBaseTokens }) => {
      transactionToast(`Deposited quote: ${signature}`);
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
    onError: () => toast.error("Failed to deposit quote"),
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
        marketPK.data!
      );
      const orderIx = client.placeOrderIx({
        numBaseTokens: numBaseTokens,
        tokenPrice: tokenPrice,
        isBid: false,
        lastValidSlot: 0,
        orderType: OrderType.Limit,
        clientOrderId: 0,
      });

      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: capsulePubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(orderIx);
      const solanaSigner = new CapsuleSolanaWeb3Signer(
        capsule,
        provider.connection
      );
      const signed = await solanaSigner.signTransaction(transaction);
      const signature = await provider.connection.sendRawTransaction(
        signed.serialize()
      );
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited quote: ${signature}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit quote"),
  });

  const withdrawAll = useMutation({
    mutationKey: ["market", "withdraw-all", { playerMintPK: marketPK }],
    mutationFn: async () => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK.data!
      );
      const withdrawIx = await client.withdrawAllIx();
      const blockhash = await provider.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: capsulePubkey.data!,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(...withdrawIx);
      const solanaSigner = new CapsuleSolanaWeb3Signer(
        capsule,
        provider.connection
      );
      const signed = await solanaSigner.signTransaction(transaction);
      const signature = await provider.connection.sendRawTransaction(
        signed.serialize()
      );
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(`Deposited quote: ${signature}`);
      queryClient.invalidateQueries({
        queryKey: ["market", "bids", { playerMintPK: marketPK }],
      });
      queryClient.invalidateQueries({
        queryKey: ["market", "asks", { playerMintPK: marketPK }],
      });
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to deposit quote"),
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
      const playerTokenAccount = getAssociatedTokenAddressSync(
        player_token_mint,
        capsulePubkey.data!
      );
      const quoteTokenAccount = getAssociatedTokenAddressSync(
        quoteToken,
        capsulePubkey.data!
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
          capsulePubkey.data!.toBuffer(),
        ],
        program.programId
      )[0];

      const context = {
        payer: capsulePubkey.data!,
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
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to payout"),
  });

  return {
    mint,
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
  };
}
