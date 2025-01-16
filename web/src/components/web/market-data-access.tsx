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
        .faucetQuote(new BN(100000000000))
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
      const playerStats = PublicKey.findProgramAddressSync(
        [Buffer.from("playerStats"), Buffer.from(playerId)],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      return program.methods
        .initMint(playerId, timestamp)
        .accountsStrict({
          payer: provider.publicKey,
          quoteTokenMint: quoteToken,
          vault,
          playerTokenMint: player_token_mint,
          config: mintConfig,
          playerStats,
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
        [Buffer.from("playerStats"), Buffer.from(playerId)],
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
    initialize,
    updateProjectionOracle,
  };
}

export function usePlayerMarket() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts, quoteToken } = useQuoteToken();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();

  const [marketPK, setMarketPK] = useState<null | PublicKey>(
    new PublicKey("2h4VgNWauwJ7zTp3dxjF3ztGTXXfrsnyRGTKBbXVAdMM")
  );
  const [timestamp, setTimestamp] = useState<string>("1735857860574");
  const [playerId, setPlayerId] = useState<string>("LAMAR");

  const capsulePubkey = useQuery({
    queryKey: ["capsule-pubkey", { cluster }],
    queryFn: () => new PublicKey(capsule.getAddress()!),
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

  const setPlayerMarket = async (mintAddress: PublicKey) => {
    const market = await program.account.playerMintConfig.fetch(mintAddress);
    setPlayerId(market.playerId);
    setTimestamp(market.timestamp);
    console.log("market", market);
    console.log("playerMintPK", market.playerTokenMint.toBase58());
    setMarketPK(new PublicKey(market.playerTokenMint));
    queryClient.invalidateQueries({
      queryKey: ["market", { playerMintPK: marketPK }],
    });
  };

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
      console.log("lastSignatureStatus", lastSignatureStatus);
      return lastSignatureStatus;
    },
  });

  const bids = useQuery({
    queryKey: ["market", "bids", { playerMintPK: marketPK }],
    queryFn: async () => {
      // console.log("bids", playerMintPK?.toBase58());
      const market = await Market.loadFromAddress({
        connection: provider.connection,
        address: marketPK!,
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
        address: marketPK!,
      });
      const asks = await market.asks();
      return asks;
    },
  });

  const mint = useMutation({
    mutationKey: ["market", "mint", { playerMintPK: marketPK }],
    mutationFn: () => {
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const mintConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const destination = getAssociatedTokenAddressSync(
        player_token_mint,
        provider.publicKey
      );
      const mintRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_record"),
          mintConfig.toBuffer(),
          provider.publicKey.toBuffer(),
        ],
        program.programId
      )[0];

      const playerStats = PublicKey.findProgramAddressSync(
        [Buffer.from("player_stats"), Buffer.from(playerId)],
        program.programId
      )[0];

      return program.methods
        .mintTokens(new BN(30000000000))
        .accountsStrict({
          payer: provider.publicKey,
          quoteTokenMint: quoteToken,
          vault,
          playerTokenMint: player_token_mint,
          destination,
          config: mintConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          playerStats,
          mintRecord,
          payerAtaQuote: quoteTokenAccount.data!,
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
    mutationKey: ["market", "create", { playerMintPK: marketPK }],
    mutationFn: () => {
      const player_token_mint = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(playerId), Buffer.from(timestamp)],
        program.programId
      )[0];
      return createMarketTX(
        provider.connection,
        provider,
        quoteToken,
        player_token_mint
      );
    },
    onSuccess: (signature) => {
      transactionToast(`Market created: ${signature.toBase58()}`);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to create market"),
  });

  const depositQuote = useMutation({
    mutationKey: ["market", "deposit-quote", { playerMintPK: marketPK }],
    mutationFn: async (amount: number) => {
      const client = await ManifestClient.getClientForMarket(
        provider,
        marketPK!
      );
      const depositIx = client.depositIx(
        provider.publicKey,
        quoteToken,
        amount
      );
      const transaction = new Transaction().add(depositIx);
      const signature = await provider.sendAndConfirm(transaction);
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
        marketPK!
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
        marketPK!
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
        marketPK!
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
        marketPK!
      );
      const withdrawIx = await client.withdrawAllIx();
      const transaction = new Transaction().add(...withdrawIx);
      const signature = await provider.sendAndConfirm(transaction);
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
        address: marketPK!,
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
      const quoteTokenAccount = getAssociatedTokenAddressSync(
        quoteToken,
        provider.publicKey
      );
      const quoteConfig = PublicKey.findProgramAddressSync(
        [Buffer.from("quoteConfig")],
        program.programId
      )[0];

      const playerStats = PublicKey.findProgramAddressSync(
        [Buffer.from("playerStats"), Buffer.from(playerId)],
        program.programId
      )[0];

      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      const mintRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mintRecord"),
          mintConfig.toBuffer(),
          provider.publicKey.toBuffer(),
        ],
        program.programId
      )[0];
      const mintRecordTaker = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mintRecord"),
          mintConfig.toBuffer(),
          provider.publicKey.toBuffer(),
        ],
        program.programId
      )[0];

      const context = {
        payer: provider.publicKey,
        quoteTokenMint: quoteToken,
        playerTokenMint: player_token_mint,
        vault,
        mintRecord,
        mintRecordTaker,
        payerQuoteTokenAccount: quoteTokenAccount,
        payerPlayerTokenAccount: playerTokenAccount,
        mintConfig,
        payoutConfig,
        quoteConfig,
        playerStats,
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
    payout,
    bids,
    asks,
    setPlayerMarket,
    latestTransaction,
  };
}
