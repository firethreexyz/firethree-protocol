import {
  ConfirmOptions,
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import IDL from './idl/firethree.json'
import { FIRETHREE_PROGRAM_ID } from './constants/program'
import { encodeName } from './utils/name'
import * as multisig from '@sqds/multisig'
import { Permission, Permissions } from '@sqds/multisig/lib/types'
import { ShdwDrive } from '@shadow-drive/sdk'
import { Wallet } from './types/wallet'

export default class Poject {
  program: Program<Firethree>
  provider: AnchorProvider
  connection: Connection
  wallet: Wallet
  opts: ConfirmOptions

  constructor(connection: Connection, wallet: Wallet, opts?: ConfirmOptions) {
    this.connection = connection
    this.wallet = wallet
    this.opts = opts || AnchorProvider.defaultOptions()
    this.provider = new AnchorProvider(
      this.connection,
      // @ts-ignore
      this.wallet,
      this.opts
    )
    this.program = new Program<Firethree>(
      IDL as any,
      FIRETHREE_PROGRAM_ID,
      this.provider
    )
  }

  /**
   * Get a project
   *  @param name Project name
   */
  public async get(name: string) {
    const projectName = encodeName(name)

    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('project'), Buffer.from(projectName)],
      this.program.programId
    )

    const project = await this.program.account.project.fetch(ProjectPDA)

    return project
  }

  /**
   * Create a project
   *  @param name Project name
   *  @param creator Owner of the project
   *  @param members Members of the project
   *  @param threshold Votes for a transaction proposal to be approved (Muiltisig)
   *  @param shdwSize Amount of storage you are requesting to create. Should be in a string like '1KB', '1MB', '1GB'. Only KB, MB, and GB storage delineations are supported currently.
   */
  public async create({
    name,
    creator,
    members,
    threshold,
    shdwSize
  }: {
    name: string
    creator: PublicKey
    members: PublicKey[]
    threshold: number
    shdwSize: string
  }) {
    const projectName = encodeName(name)

    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('project'), Buffer.from(projectName)],
      this.program.programId
    )

    const [MultisigPda] = multisig.getMultisigPda({
      createKey: ProjectPDA
    })

    const { blockhash } = await this.connection.getLatestBlockhash()

    const multisigTransaction = multisig.transactions.multisigCreate({
      createKey: ProjectPDA,
      creator,
      blockhash,
      multisigPda: MultisigPda,
      configAuthority: null,
      timeLock: 0,
      members: [
        {
          key: creator,
          permissions: Permissions.all()
        },
        ...members.map((member) => ({
          key: member,
          permissions: Permissions.fromPermissions([Permission.Vote])
        }))
      ],
      threshold
    })

    const multisigTransactionSigned =
      await this.wallet.signVersionedTransaction(multisigTransaction)

    await this.connection.sendRawTransaction(
      multisigTransactionSigned.serialize(),
      this.opts
    )

    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      this.connection,
      MultisigPda
    )

    if (multisigAccount.createKey.toBase58() !== ProjectPDA.toBase58()) {
      throw new Error('Multisig account not created')
    }

    const shdwDrive = await new ShdwDrive(this.connection, this.wallet).init()

    const { shdw_bucket } = await shdwDrive.createStorageAccount(name, shdwSize)

    const setupProjectIx = await this.program.methods
      .projectCreate({
        name,
        multisigKey: MultisigPda,
        shdw: new PublicKey(shdw_bucket)
      })
      .accounts({
        payer: this.provider.wallet.publicKey,
        project: ProjectPDA,
        multisig: MultisigPda
      })
      .instruction()

    const message = new TransactionMessage({
      payerKey: creator,
      recentBlockhash: blockhash,
      instructions: [setupProjectIx]
    }).compileToV0Message()

    const setupProjecTransactionSigned =
      await this.wallet.signVersionedTransaction(
        new VersionedTransaction(message)
      )

    await this.connection.sendRawTransaction(
      setupProjecTransactionSigned.serialize(),
      this.opts
    )
  }

  public update() {}

  public delete() {}

  public createShadowDriveAccount() {}
}
