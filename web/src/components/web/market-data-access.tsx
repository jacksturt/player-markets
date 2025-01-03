"use client";

import { getTradetalkProgram, getTradetalkProgramId } from "@project/anchor";
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
import { ManifestClient } from "manifest/src/client";

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

  const quoteTokenAccount = useQuery({
    queryKey: ["quote-token-account", { cluster }],
    queryFn: () =>
      getAssociatedTokenAddress(quoteTokenMint, provider.publicKey),
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
    mutationFn: () =>
      program.methods
        .faucetQuote(new BN(100000000000))
        .accountsStrict({
          payer: provider.publicKey,
          quoteTokenMint,
          config: quoteConfig,
          destination: quoteTokenAccount.data!,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ skipPreflight: true }),
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
      const vault = getAssociatedTokenAddressSync(quoteToken, mintConfig, true);
      return program.methods
        .initMint(new BN(3), playerId, timestamp)
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
      return program.methods
        .mintTokens(new BN(30000000000))
        .accountsPartial({
          payer: provider.publicKey,
          quoteTokenMint: quoteToken,
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

  const initPayout = useMutation({
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

      const context = {
        payer: provider.publicKey,
        quoteTokenMint: quoteToken,
        playerTokenMint: player_token_mint,
        payerQuoteTokenAccount: quoteTokenAccount,
        payerPlayerTokenAccount: playerTokenAccount,
        mintConfig,
        payoutConfig,
        quoteConfig,
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
