import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Firethree, IDL } from './types/firethree'
import { FIRETHREE_PROGRAM_ID } from './constants/program'
import { encodeName } from './utils/name'
import * as multisig from '@sqds/multisig'
import { Permission, Permissions } from '@sqds/multisig/lib/types'

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
    this.provider = new AnchorProvider(this.connection, this.wallet, this.opts)
    this.program = new Program<Firethree>(
      IDL,
      FIRETHREE_PROGRAM_ID,
      this.provider
    )
  }

  public get(name: string) {
    const projectName = encodeName(name)

    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('project'), Buffer.from(projectName)],
      this.program.programId
    )
  }

  /**
   * Create a project
   *  @param name Project name
   *  @param creator Owner of the project
   *  @param members Members of the project
   *  @param threshold Votes for a transaction proposal to be approved (Muiltisig)
   */
  public async create({
    name,
    creator,
    members,
    threshold
  }: {
    name: string
    creator: PublicKey
    members: PublicKey[]
    threshold: number
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
      await this.wallet.signTransaction(multisigTransaction)

    await this.connection.sendRawTransaction(
      multisigTransactionSigned.serialize(),
      this.opts
    )

    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      this.connection,
      MultisigPda
    )

    const setupProjectIx = await this.program.methods
      .projectCreate({
        name,
        multisigKey: MultisigPda
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

    const setupProjecTransactionSigned = await this.wallet.signTransaction(
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
