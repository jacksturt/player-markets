// import {
//   ActionPostResponse,
//   createPostResponse,
//   ActionGetResponse,
//   ActionPostRequest,
//   createActionHeaders,
// } from "@solana/actions";
// import {
//   clusterApiUrl,
//   ComputeBudgetProgram,
//   Connection,
//   Keypair,
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SystemProgram,
//   SYSVAR_INSTRUCTIONS_PUBKEY,
//   Transaction,
// } from "@solana/web3.js";
// import * as anchor from "@coral-xyz/anchor";
// import prisma from '@/lib/db';
// import { buyBanger } from "@/lib/on-chain/buySell";
// import { AnchorProvider, Program, type Wallet } from "@coral-xyz/anchor";
// import Decimal from "decimal.js";
// import { AUTHORITY_PK, BANGER_FEE_PCT, BANGER_PROGRAM_PK, CREATOR_FEE_PCT, CURVE_PK, TOKEN_METADATA_PROGRAM_ID, TREASURY_PK } from "@/lib/on-chain/constants";
// import { BangerProgram } from "@/types/program";
// import BangerProgramIDL from "@/lib/on-chain/idl.json";
// import { getMetadata } from "@/lib/on-chain/utils";
// import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { min } from "lodash";
// import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
// import { getDefaultDevnetQueue, getProgramId, Queue, Randomness, sleep } from "@switchboard-xyz/on-demand";

import { NextResponse } from "next/server";

// //import { DEFAULT_SOL_ADDRESS, DEFAULT_SOL_AMOUNT } from "./const";

// // create the standard headers for this route (including CORS)
// const headers = createActionHeaders();

// export const GET = async (req: Request) => {
//   try {
//     const requestUrl = new URL(req.url);
//     const { tweetId } = await validatedQueryParams(requestUrl);

//     const baseHref = new URL(
//       `/api/actions/buy?tweetId=${tweetId}`,
//       requestUrl.origin,
//     ).toString();

//     const payload: ActionGetResponse = {
//       title: "Buy Banger",
//       icon: new URL("/banger_logo_pink.png", requestUrl.origin).toString(),
//       description: "Buy a tokenized tweet",
//       label: "Buy", // this value will be ignored since `links.actions` exists
//       links: {
//         actions: [
//           {
//             label: "Buy 1 bangers", // button text
//             href: `${baseHref}&amount=${"1"}`,
//           },
//           {
//             label: "Buy 5 bangers", // button text
//             href: `${baseHref}&amount=${"5"}`,
//           },
//           {
//             label: "Buy 10 bangers", // button text
//             href: `${baseHref}&amount=${"10"}`,
//           },
//           {
//             label: "Buy bangers", // button text
//             href: `${baseHref}&amount={amount}`, // this href will have a text input
//             parameters: [
//               {
//                 name: "amount", // parameter name in the `href` above
//                 label: "Enter the # of bangers to buy", // placeholder of the text input
//                 required: true,
//               },
//             ],
//           },
//         ],
//       },
//     };

//     return Response.json(payload, {
//       headers,
//     });
//   } catch (err) {
//     console.log(err);
//     let message = "An unknown error occurred";
//     if (typeof err == "string") message = err;
//     return new Response(message, {
//       status: 400,
//       headers,
//     });
//   }
// };

// // DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// // THIS WILL ENSURE CORS WORKS FOR BLINKS
// export const OPTIONS = async (req: Request) => {
//   return new Response(null, { headers });
// };

// export const POST = async (req: Request) => {
//   try {
//     const requestUrl = new URL(req.url);
//     const { tweetId, amount } = await validatedQueryParams(requestUrl);

//     const body: ActionPostRequest = await req.json();

//     // validate the client provided input
//     let account: PublicKey;
//     try {
//       account = new PublicKey(body.account);
//     } catch (err) {
//       return new Response('Invalid "account" provided', {
//         status: 400,
//         headers,
//       });
//     }

//     const connection = new Connection(
//       process.env.SOLANA_RPC! || clusterApiUrl("devnet"),
//     );

//     const market = await prisma.market.findFirst({
//       where: {
//         metadata: {
//           path: ['sourceId'],
//           equals: tweetId,
//         }
//       }
//     });

//     if (!market) {
//       return new Response("No market for tweetId", {
//         status: 400,
//         headers,
//       });
//     }

//     const prices = Array.from({ length: amount }, (_, i) => {
//       const supply = new Decimal(market.supply);
//       const index = new Decimal(i);
//       return supply.plus(index).pow(2).dividedBy(new Decimal(32000));
//     });

//     const subtotal = (prices.reduce((prev, curr) => prev.plus(curr), new Decimal(0))).toNumber();
//     const creator_fee = subtotal * CREATOR_FEE_PCT;
//     const banger_fee = subtotal * BANGER_FEE_PCT;
//     const total = subtotal + creator_fee + banger_fee;
//     const max_lamports_in = total * LAMPORTS_PER_SOL * (1 + 5 / 100);
//     console.log("MAX LAMPORTS IN", max_lamports_in);

//     const wallet = account as unknown as Wallet;
//     const provider = new AnchorProvider(connection, wallet, {});
//     const program = anchor.workspace.BangerProgram as Program<BangerProgram>;
//     const mintKey = new PublicKey(market.mintPublicKey);

//     const { blockhash, lastValidBlockHeight } =
//       await provider.connection.getLatestBlockhash();
//     const txInfo = {
//       /** The transaction fee payer */
//       feePayer: wallet.publicKey,
//       /** A recent blockhash */
//       blockhash: blockhash,
//       /** the last block chain can advance to before tx is exportd expired */
//       lastValidBlockHeight: lastValidBlockHeight,
//     };

//     const tx = new Transaction(txInfo);

//     const metadata = await getMetadata(mintKey);

//     // Get randomness
//     const sbQueue = (await getDefaultDevnetQueue()).pubkey;
//     const sbProgramId = await getProgramId(connection);
//     const sbIdl = await anchor.Program.fetchIdl(sbProgramId, provider);
//     const sbProgram = new anchor.Program(sbIdl!, provider);
//     const queueAccount = new Queue(sbProgram, sbQueue);

//     const rngKp = Keypair.generate();
//     console.log(`rngKP : ${rngKp.publicKey}`);

//     const [randomness, sbIx] = await Randomness.create(sbProgram, rngKp, sbQueue);
//     console.log(randomness.pubkey);
//     const sbTx = await provider.sendAndConfirm(new Transaction()
//       .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }))
//       .add(sbIx), [wallet.payer, rngKp]);

//     let commitIx = undefined;
//     try {
//       commitIx = await randomness.commitIx(sbQueue);
//     } catch (error) {
//       await queueAccount.fetchFreshOracle();
//       console.log(error);
//       throw new Error("Failed to find an open oracle. Please check the queue configuration.");
//     }

//     let recentBlockhash = await provider.connection.getLatestBlockhash().then(res => res.blockhash);

//     const txId = await provider.sendAndConfirm(new Transaction()
//       .add(commitIx), [wallet.payer]);
//     console.log(`randomness tx id : ${txId}`);

//     let revealIx = undefined;
//     const tries = 5;
//     for (let i = 0; i < tries; ++i) {
//       try {
//         revealIx = await randomness.revealIx();
//         break;
//       } catch (error) {
//         if (i === tries - 1) {
//           throw error;
//         }
//         console.log("Waiting for the commitment to be locked...");
//         await sleep(1_000);
//       }
//     }

//     console.log("Committment found, revealing...")

//     const ix = await program.methods
//       .buy("Test", metadata.toString(), new anchor.BN(max_lamports_in), new anchor.BN(amount))
//       .accounts({
//         buyer: wallet.publicKey,
//         collection: market.collectionPublicKey,
//       })
//       .instruction();

//     tx.add(ix);

//     const payload: ActionPostResponse = await createPostResponse({
//       fields: {
//         transaction: tx,
//         message: `Buy ${amount} bangers of ${tweetId}`,
//       },
//       // note: no additional signers are needed
//       // signers: [],
//     });

//     return Response.json(payload, {
//       headers,
//     });
//   } catch (err) {
//     console.log(err);
//     let message = "An unknown error occurred";
//     if (typeof err == "string") message = err;
//     return new Response(message, {
//       status: 400,
//       headers,
//     });
//   }
// };

// async function validatedQueryParams(requestUrl: URL) {
//   let tweetId: string;
//   let amount: number;

//   try {
//     if (requestUrl.searchParams.get("tweetId")) {
//       tweetId = requestUrl.searchParams.get("tweetId")!;
//       const market = await prisma.market.findFirst({
//         where: {
//           metadata: {
//             path: ['sourceId'],
//             equals: tweetId,
//           }
//         }
//       });
//       if (!market) {
//         throw "No market for tweetId yet";
//       }
//     } else {
//       throw "Missing tweetId";
//     }
//   } catch (err) {
//     throw "Invalid input query parameter: tweetId";
//   }

//   try {
//     if (requestUrl.searchParams.get("amount")) {
//       const amountValue = Number(requestUrl.searchParams.get("amount"));
//       if (!Number.isInteger(amountValue)) {
//         throw "Invalid amount (must be an integer)";
//       }
//       if (amountValue <= 0) {
//         throw "Invalid amount (must be greater than 0)";
//       }
//       amount = amountValue;
//     } else {
//       throw "Missing amount";
//     }
//   } catch (err) {
//     throw "Invalid input query parameter: amount";
//   }

//   return {
//     tweetId,
//     amount,
//   };
// }

export const GET = async (req: Request) => {
  return NextResponse.json({ message: "Buy bangers is not available for now" }, { status: 400 });
};