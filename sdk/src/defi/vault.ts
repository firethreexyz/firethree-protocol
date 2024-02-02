import { FIRETHREE_PROGRAM_ID } from '../constants/program'
import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { IDL, Firethree } from '../types/firethree'
import { decodeName, encodeName } from '../utils/name'
import {
  getVaultAddressSync,
  getTokenVaultAddressSync,
  getVaultDepositorAddressSync
} from '../utils/helpers'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import formatNumber from '../utils/formatNumber'
import { mockLogs } from '../utils/logs'

export default class Vault {
  program: Program<Firethree>
  provider: AnchorProvider
  connection: Connection
  wallet: Wallet

  constructor(connection: Connection, wallet?: Wallet) {
    this.connection = connection
    this.wallet = wallet
    this.provider = new AnchorProvider(
      this.connection,
      this.wallet,
      AnchorProvider.defaultOptions()
    )
    this.program = new Program<Firethree>(
      IDL,
      FIRETHREE_PROGRAM_ID,
      this.provider
    )
  }

  /**
   * Create a new vault
   *  @param name - The vault's name
   *  @param mint - Token mint for the vault (e.g. USDC)
   *  @param maxTokens - Maximum number of tokens in the vault
   *  @param minDepositAmount - Minimum deposit amount
   *  @param profitShare - Profit share percentage
   *
   */
  public async createVault({
    name,
    mint,
    maxTokens,
    minDepositAmount,
    profitShare
  }: {
    name: string
    mint: PublicKey
    maxTokens: BN
    minDepositAmount: BN
    profitShare: number
  }) {
    const vaultName = encodeName(name)

    const VaultPDA = getVaultAddressSync(this.program.programId, vaultName)
    const TokenAccountPDA = getTokenVaultAddressSync(
      this.program.programId,
      VaultPDA
    )

    return this.program.methods
      .createVault({
        name: vaultName,
        minDepositAmount,
        maxTokens,
        profitShare
      })
      .accounts({
        signer: this.wallet.publicKey,
        vault: VaultPDA,
        tokenAccount: TokenAccountPDA,
        payerTokenMint: mint
      })
      .rpc()
  }

  /**
   * Get all vaults
   */
  async getVaults() {
    const vaults = await this.program.account.vault.all()

    return vaults.map((vault) => ({
      name: decodeName(vault.account.name),
      tokenAccount: vault.account.tokenAccount
    }))
  }

  /**
   * Get vault by name
   */
  public async getVaultByName(vaultName: string) {
    const encodeVaultName = encodeName(vaultName)
    const VaultPDA = getVaultAddressSync(
      this.program.programId,
      encodeVaultName
    )

    try {
      const vault = await this.program.account.vault.fetch(VaultPDA)

      const tokenAcc = await getAccount(this.connection, vault.tokenAccount)

      return {
        name: decodeName(vault.name),
        tokenAccount: vault.tokenAccount,
        tvl: formatNumber(tokenAcc.amount)
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Get Depositor
   */
  public async getDepositor(vaultName: string) {
    const encodeVaultName = encodeName(vaultName)
    const VaultPDA = getVaultAddressSync(
      this.program.programId,
      encodeVaultName
    )

    const DepositorPDA = getVaultDepositorAddressSync(
      this.program.programId,
      VaultPDA,
      this.wallet.publicKey
    )

    try {
      const depositor =
        await this.program.account.vaultDepositor.fetch(DepositorPDA)

      return {
        authority: depositor.authority.toBase58(),
        vault: depositor.vault.toBase58(),
        bump: depositor.bump,
        totalDeposit: formatNumber(depositor.totalDeposits),
        totalWithdraws: formatNumber(depositor.totalWithdraws),
        lpShares: formatNumber(depositor.lpShares),
        netDeposits: formatNumber(depositor.netDeposits),
        netWithdraws: formatNumber(depositor.netWithdraws)
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  /**
   * Create a new vault
   *  @param vault - The vault's name
   *  @param amount - The amount to deposit
   *  @param mint - Token mint for the vault (e.g. USDC)
   */
  public async deposit({
    vault,
    amount,
    mint
  }: {
    vault: string
    amount: string
    mint: PublicKey
  }) {
    const vaultName = encodeName(vault)

    const VaultPDA = getVaultAddressSync(this.program.programId, vaultName)

    const VaultDepositorPDA = getVaultDepositorAddressSync(
      this.program.programId,
      VaultPDA,
      this.wallet.publicKey
    )

    let hasDepositor = true
    try {
      await this.program.account.vaultDepositor.fetch(VaultDepositorPDA)
    } catch {
      hasDepositor = false
    }

    let ix: TransactionInstruction[] = []

    if (!hasDepositor) {
      const depositorIx = await this.program.methods
        .createVaultDepositor()
        .accounts({
          vault: VaultPDA,
          vaultDepositor: VaultDepositorPDA
        })
        .instruction()

      ix.push(depositorIx)
    }

    const VaultTokenAccountPDA = getTokenVaultAddressSync(
      this.program.programId,
      VaultPDA
    )

    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    )

    const depositIx = await this.program.methods
      .deposit(new BN(amount))
      .accounts({
        vaultDepositor: VaultDepositorPDA,
        vault: VaultPDA,
        vaultTokenAccount: VaultTokenAccountPDA,
        userTokenAccount
      })
      .instruction()

    ix.push(depositIx)

    const { blockhash } = await this.connection.getLatestBlockhash()

    const message = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: ix
    }).compileToV0Message()

    let tx = new VersionedTransaction(message)

    tx = await this.wallet.signTransaction(tx)

    return this.connection.sendRawTransaction(tx.serialize())
  }

  public async getHistoryByVaultDepositor() {}

  public async getLogsByVault(vaultName: string) {
    const encodeVaultName = encodeName(vaultName)
    const VaultPDA = getVaultAddressSync(
      this.program.programId,
      encodeVaultName
    )

    const logs = {
      data: {
        items: mockLogs
      }
    }

    return logs
  }

  public async getChatByVault(vaultName: string) {
    const encodeVaultName = encodeName(vaultName)
    const VaultPDA = getVaultAddressSync(
      this.program.programId,
      encodeVaultName
    )

    const charts = Array.from({ length: 1000 }, (_, i) => {
      return {
        t: new Date().getTime() - i * 24 * 60 * 60 * 1000,
        v: Math.random() * 1000
      }
    })

    return charts
  }

  public async withdraw() {}

  public async withdrawFees() {}
}
