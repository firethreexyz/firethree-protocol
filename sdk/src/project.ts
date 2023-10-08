import {
  ConfirmOptions,
  Connection,
  Keypair,
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
    this.provider = new AnchorProvider(this.connection, this.wallet, this.opts)
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

    const shdwDrive = await new ShdwDrive(this.connection, this.wallet).init()

    const [ProjectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('project'), Buffer.from(projectName)],
      this.program.programId
    )

    try {
      const account = await this.get(name)

      if (account.authority) {
        throw Error('Project already exists')
      }
    } catch (e) {
      if (e.message === 'Project already exists') {
        throw e
      }
    }

    const createKey = new Keypair()

    const [MultisigPda] = multisig.getMultisigPda({
      createKey: createKey.publicKey
    })

    const { blockhash } = await this.connection.getLatestBlockhash()

    const membersPermissions = members.map((member) => ({
      key: member,
      permissions: Permissions.fromPermissions([Permission.Vote])
    }))

    const multisigIx = multisig.instructions.multisigCreate({
      createKey: createKey.publicKey,
      creator,
      multisigPda: MultisigPda,
      configAuthority: null,
      timeLock: 0,
      members: [
        {
          key: creator,
          permissions: Permissions.all()
        },
        ...membersPermissions
      ],
      threshold,
      memo: name
    })

    const storageAcc = await shdwDrive.getStorageAccounts()
    let shdw = null

    const hasStorage = storageAcc.find((acc) => acc.account.identifier === name)

    if (hasStorage) {
      shdw = new PublicKey(hasStorage.account.storage)
    }

    if (!hasStorage) {
      const { shdw_bucket } = await shdwDrive.createStorageAccount(
        name,
        shdwSize
      )

      shdw = new PublicKey(shdw_bucket)
    }

    const setupProjectIx = await this.program.methods
      .projectCreate({
        name: projectName,
        shdw,
        multisig: MultisigPda,
        createKey: createKey.publicKey
      })
      .accounts({
        payer: this.provider.wallet.publicKey,
        project: ProjectPDA
      })
      .instruction()

    const message = new TransactionMessage({
      payerKey: creator,
      recentBlockhash: blockhash,
      instructions: [multisigIx, setupProjectIx]
    }).compileToV0Message()

    const setupProjecTransactionSigned = await this.wallet.signTransaction(
      new VersionedTransaction(message)
    )

    setupProjecTransactionSigned.sign([createKey])

    await this.connection.sendRawTransaction(
      setupProjecTransactionSigned.serialize(),
      this.opts
    )
  }

  public update() {}

  public delete() {}

  public createShadowDriveAccount() {}
}
