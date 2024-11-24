import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { ManifestClient } from "../src/client";
import {
  mintTo,
  createAssociatedTokenAccountIdempotent,
  getMint,
  createMint,
} from "@solana/spl-token";
import { createMarket } from "./createMarket";
import { Market } from "../src/market";
import { assert } from "chai";
import { airdropSol } from "../src/utils/solana";

async function testDeposit(): Promise<void> {
  const connection: Connection = new Connection(
    "http://127.0.0.1:8899",
    "confirmed"
  );
  const payerKeypair: Keypair = Keypair.generate();
  await airdropSol(connection, payerKeypair.publicKey);

  const baseMint: PublicKey = await createMint(
    connection,
    payerKeypair,
    payerKeypair.publicKey,
    payerKeypair.publicKey,
    9
  );
  const quoteMint: PublicKey = await createMint(
    connection,
    payerKeypair,
    payerKeypair.publicKey,
    payerKeypair.publicKey,
    6
  );
  const marketAddress: PublicKey = await createMarket(
    connection,
    payerKeypair,
    baseMint,
    quoteMint
  );

  const market: Market = await Market.loadFromAddress({
    connection,
    address: marketAddress,
  });

  await deposit(connection, payerKeypair, marketAddress, market.baseMint(), 10);

  await market.reload(connection);
  assert(
    market.getWithdrawableBalanceTokens(payerKeypair.publicKey, true) == 10,
    "deposit withdrawable balance check base"
  );
  assert(
    market.getWithdrawableBalanceTokens(payerKeypair.publicKey, false) == 0,
    "deposit withdrawable balance check quote"
  );
  market.prettyPrint();
}

export async function deposit(
  connection: Connection,
  payerKeypair: Keypair,
  marketAddress: PublicKey,
  mint: PublicKey,
  amountTokens: number
): Promise<void> {
  const client: ManifestClient = await ManifestClient.getClientForMarket(
    connection,
    marketAddress,
    payerKeypair
  );
  const depositIx = client.depositIx(
    payerKeypair.publicKey,
    mint,
    amountTokens
  );

  const traderTokenAccount = await createAssociatedTokenAccountIdempotent(
    connection,
    payerKeypair,
    mint,
    payerKeypair.publicKey
  );
  // const mintDecimals = (await getMint(connection, mint)).decimals;
  // const amountAtoms = Math.ceil(amountTokens * 10 ** mintDecimals);
  // const mintSig = await mintTo(
  //   connection,
  //   payerKeypair,
  //   mint,
  //   traderTokenAccount,
  //   payerKeypair.publicKey,
  //   amountAtoms
  // );
  // console.log(
  //   `Minted ${amountTokens} tokens to ${traderTokenAccount} in ${mintSig}`
  // );

  const signature = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(depositIx),
    [payerKeypair]
  );
  console.log(`Deposited ${amountTokens} tokens in ${signature}`);
}

// describe("Deposit test", () => {
//   it("Deposit", async () => {
//     await testDeposit();
//   });
// });
