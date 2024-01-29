import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { Program, Wallet } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { encodeName, decodeName } from './utils/name'
import * as multisig from '@sqds/multisig'
import { Permission, Permissions } from '@sqds/multisig/lib/types'
import { ShdwDrive, StorageAccountV2 } from '@shadow-drive/sdk'
import { getProjectPDA } from './utils/helpers'
import { GENESYSGO_URL } from './constants/storage'
import { Project as IProject } from './types/project'

export default class Poject {
  program: Program<Firethree>
  wallet: Wallet

  constructor(program: Program<Firethree>, wallet: Wallet) {
    this.program = program
    this.wallet = wallet
  }

  /**
   * Get a project by name
   *  @param name Project name
   */
  public async get(name: string): Promise<IProject> {
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

  public async getProjectsByUserPublicKey(publicKey: PublicKey) {
    const allProjects = await this.program.account.project.all()

    const projects = allProjects.filter((project) => {
      return project.account.authority.equals(publicKey)
    })

    if (!projects) {
      return []
    }

    return projects.map((project) => {
      const name = decodeName(project.account.name)

      return {
        ...project.account,
        name,
        ts: project.account.ts.toNumber(),
        publicKey: project.publicKey,
        image: `${GENESYSGO_URL}/${project.account.shdw.toBase58()}/project-${name}`
      }
    })
  }

  /**
   * Get all projects
   */
  public async getAll() {
    const projects = await this.program.account.project.all()

    return projects.map((project) => {
      const name = decodeName(project.account.name)

      return {
        ...project.account,
        name,
        ts: project.account.ts.toNumber(),
        publicKey: project.publicKey,
        image: `${GENESYSGO_URL}/${project.account.shdw.toBase58()}/project-${name}`
      }
    })
  }

  /**
   * Get a project by PDA
   *  @param pda Project PDA
   */
  public async getProjectByPDA(pda: PublicKey) {
    const project = await this.program.account.project.fetch(pda)

    const name = decodeName(project.name)

    return {
      ...project,
      name,
      ts: project.ts.toNumber(),
      image: `${GENESYSGO_URL}/${project.shdw.toBase58()}/project-${name}`
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
        shdw
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

    const newFile = new File([image], `project-${name}`)

    await shdwDrive.uploadFile(shdw, newFile)
  }

  /**
   * Delete a project
   *  @param name Project name
   */
  public async deleteProject({ name }: { name: string }) {
    const ProjectPDA = getProjectPDA(name, this.program.programId)

    const ix = await this.program.methods
      .projectDelete()
      .accounts({
        project: ProjectPDA,
        authority: this.wallet.publicKey
      })
      .instruction()

    const connection = this.program.provider.connection
    const { blockhash } = await connection.getLatestBlockhash()

    const message = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix]
    }).compileToV0Message()

    const txSigned = await this.wallet.signTransaction(
      new VersionedTransaction(message)
    )

    await connection.sendRawTransaction(txSigned.serialize())
  }
}
