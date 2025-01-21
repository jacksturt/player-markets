import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

export class EnvWallet {
  constructor() {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is required");
    }
    this._keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
  }

  private _keypair: Keypair;

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this._keypair);
      return tx as T;
    }
    throw new Error("Transaction is not an instance of Transaction");
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs.map((tx) => {
      if (tx instanceof Transaction) {
        tx.partialSign(this._keypair);
        return tx;
      }
      throw new Error("Transaction is not an instance of Transaction");
    });
  }

  get publicKey(): PublicKey {
    return this._keypair.publicKey;
  }
}
