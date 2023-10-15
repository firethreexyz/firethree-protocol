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
import { Project as IProject } from './types/project'
import { getProjectPDA } from './utils/helpers'

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

  /**
   * Add new Member
   *  @param name Project name
   */
  public async addMember(name: string, member: PublicKey) {
    const project = await this.get(name)

    const connection = this.program.provider.connection
    const { blockhash } = await connection.getLatestBlockhash()

    const tx = multisig.transactions.multisigAddMember({
      blockhash,
      feePayer: this.wallet.publicKey,
      multisigPda: new PublicKey(project.multisig),
      configAuthority: this.wallet.publicKey,
      rentPayer: this.wallet.publicKey,
      newMember: {
        key: member,
        permissions: Permissions.all()
      }
    })

    const txSigned = await this.wallet.signTransaction(tx)

    await connection.sendRawTransaction(txSigned.serialize())
  }

  /**
   * Delete a project
   *  @param name Project name
   */
  public async deleteProject({
    name
  }: {
    name: string
    creator: PublicKey
    members: PublicKey[]
    threshold: number
    shdwSize: string
  }) {
    const project = await this.get(name)

    const ProjectPDA = getProjectPDA(name, this.program.programId)

    const [MultisigPda] = multisig.getMultisigPda({
      createKey: project.createKey
    })
    const [VaultPda] = multisig.getVaultPda({
      multisigPda: MultisigPda,
      index: 0
    })

    const ix = await this.program.methods
      .projectDelete()
      .accounts({
        project: ProjectPDA,
        authority: this.wallet.publicKey
      })
      .instruction()

    const connection = this.program.provider.connection
    const { blockhash } = await connection.getLatestBlockhash()

    const txMessage = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix]
    })

    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      MultisigPda
    )

    const lastTransactionIndex = multisig.utils.toBigInt(
      multisigAccount.transactionIndex
    )

    const txIndex = BigInt(Number(lastTransactionIndex.toString()) + 1)
    const vaultIx = multisig.instructions.vaultTransactionCreate({
      multisigPda: MultisigPda,
      transactionIndex: txIndex,
      creator: this.wallet.publicKey,
      vaultIndex: 0,
      ephemeralSigners: 0,
      transactionMessage: txMessage,
      memo: 'Resquest and delete project'
    })

    const proposalIx = multisig.instructions.proposalCreate({
      multisigPda: MultisigPda,
      transactionIndex: txIndex,
      creator: this.wallet.publicKey
    })

    const message = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [vaultIx, proposalIx]
    }).compileToV0Message()

    const txSigned = await this.wallet.signTransaction(
      new VersionedTransaction(message)
    )

    await connection.sendRawTransaction(txSigned.serialize())
  }
}
