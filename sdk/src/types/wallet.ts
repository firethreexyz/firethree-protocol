import {
  PublicKey,
  Transaction,
  TransactionVersion,
  VersionedTransaction
} from '@solana/web3.js'

export type SupportedTransactionVersions =
  | ReadonlySet<TransactionVersion>
  | null
  | undefined

export type TransactionOrVersionedTransaction<
  S extends SupportedTransactionVersions
> = S extends null | undefined
  ? Transaction
  : Transaction | VersionedTransaction

export interface Wallet {
  signTransaction<
    T extends TransactionOrVersionedTransaction<SupportedTransactionVersions>
  >(
    transaction: T
  ): Promise<T> | undefined
  signAllTransactions<
    T extends TransactionOrVersionedTransaction<SupportedTransactionVersions>
  >(
    transactions: T[]
  ): Promise<T[]> | undefined
  signMessage(message: Uint8Array): Promise<Uint8Array> | undefined
  publicKey: PublicKey
}
