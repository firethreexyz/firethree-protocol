import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction
} from '@solana/web3.js'

export interface IWallet {
  signTransaction(tx: Transaction): Promise<Transaction>
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
  publicKey: PublicKey
}

export interface IVersionedWallet {
  signVersionedTransaction(
    tx: VersionedTransaction
  ): Promise<VersionedTransaction>
  signAllVersionedTransactions(
    txs: VersionedTransaction[]
  ): Promise<VersionedTransaction[]>
  publicKey: PublicKey
}

export class Wallet implements IWallet, IVersionedWallet {
  constructor(readonly payer: Keypair) {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    tx.partialSign(this.payer)
    return tx
  }

  async signVersionedTransaction(
    tx: VersionedTransaction
  ): Promise<VersionedTransaction> {
    tx.sign([this.payer])
    return tx
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs.map((t) => {
      t.partialSign(this.payer)
      return t
    })
  }

  async signAllVersionedTransactions(
    txs: VersionedTransaction[]
  ): Promise<VersionedTransaction[]> {
    return txs.map((t) => {
      t.sign([this.payer])
      return t
    })
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey
  }
}
