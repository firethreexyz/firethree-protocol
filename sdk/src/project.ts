import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { encodeName, decodeName } from './utils/name'
import * as multisig from '@sqds/multisig'
import { Permission, Permissions } from '@sqds/multisig/lib/types'
import { ShdwDrive, StorageAccountV2 } from '@shadow-drive/sdk'
import { Wallet } from './types/wallet'

export default class Poject {
  program: Program<Firethree>
  wallet: Wallet

  constructor(program: Program<Firethree>, wallet: Wallet) {
    this.program = program
    this.wallet = wallet
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

    return {
      ...project,
      name: decodeName(project.name),
      ts: project.ts.toNumber()
    }
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
    shdwSize,
    image
  }: {
    name: string
    creator: PublicKey
    members: PublicKey[]
    threshold: number
    shdwSize: string
    image: File
  }) {
    const projectName = encodeName(name)

    let shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()
    let storageAcc: {
      publicKey: PublicKey
      account: StorageAccountV2
    }[] = []

    try {
      storageAcc = await shdwDrive?.getStorageAccounts()
    } catch {}

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

    const { blockhash } =
      await this.program.provider.connection.getLatestBlockhash()

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

    let shdw: PublicKey = null

    const hasStorage = storageAcc?.find(
      (acc) => acc.account.identifier === name
    )

    if (hasStorage) {
      shdw = new PublicKey(hasStorage.publicKey)
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
        payer: this.wallet.publicKey,
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

    await this.program.provider.connection.sendRawTransaction(
      setupProjecTransactionSigned.serialize()
    )

    const newFile = new File([image], `project.logo-${name}`)

    await shdwDrive.uploadFile(shdw, newFile)
  }

  public update() {}

  /**
   * Delete a project
   *  @param name Project name
   */
  public async requestToDelete({
    name
  }: {
    name: string
    creator: PublicKey
    members: PublicKey[]
    threshold: number
    shdwSize: string
  }) {
    const project = await this.get(name)
    const [MultisigPda] = multisig.getMultisigPda({
      createKey: project.createKey
    })
    const creator = project.authority
    const connection = this.program.provider.connection

    const { blockhash } = await connection.getLatestBlockhash()

    let multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      MultisigPda
    )

    const tx = multisig.transactions.proposalCreate({
      blockhash,
      feePayer: creator,
      multisigPda: MultisigPda,
      transactionIndex: BigInt(multisigAccount.transactionIndex.toString()),
      creator
    })

    const setupProjecTransactionSigned = await this.wallet.signTransaction(tx)

    await connection.sendRawTransaction(
      setupProjecTransactionSigned.serialize()
    )
  }
}
