import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js'
import { IDL, Firethree } from './../types/firethree'
import { FIRETHREE_PROGRAM_ID } from './../constants/program'
import Analytics from './analytics'
import Collection from './collection'
import Storage from './storage'
import { encodeName, decodeName } from '../utils/name'
import { ShdwDrive, StorageAccountV2 } from '@shadow-drive/sdk'
import { getProjectPDA } from '../utils/helpers'
import { GENESYSGO_URL } from '../constants/storage'
import { Project as IProject } from '../types/project'
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'

export default class Project {
  analytics: Analytics
  collection: Collection
  storage: Storage
  program: Program<Firethree>
  provider: AnchorProvider
  connection: Connection
  wallet: Wallet

  constructor(connection: Connection, wallet: Wallet) {
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

  async init(projectName: string) {
    const project = await this.get(projectName)

    const shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()

    this.collection = new Collection(
      this.program,
      this.wallet,
      shdwDrive,
      project
    )
    this.storage = new Storage(this.program, this.wallet, shdwDrive, project)
    this.analytics = new Analytics(
      this.program,
      this.wallet,
      shdwDrive,
      project
    )

    return this
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
    shdwSize,
    image
  }: {
    name: string
    creator: PublicKey
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

    const { blockhash } =
      await this.program.provider.connection.getLatestBlockhash()

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
      .createProject({
        name: projectName,
        shdw
      })
      .accounts({
        signer: this.wallet.publicKey,
        project: ProjectPDA
      })
      .instruction()

    const recipientWalletAddress =
      'EpsNMWpC8LPWXcdfxa7TowZZx9rZFp98Ku5tranqu4eW'

    const message = new TransactionMessage({
      payerKey: creator,
      recentBlockhash: blockhash,
      instructions: [
        setupProjectIx,
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: new PublicKey(recipientWalletAddress),
          lamports: 0.004 * LAMPORTS_PER_SOL
        })
      ]
    }).compileToV0Message()

    const setupProjecTransactionSigned = await this.wallet.signTransaction(
      new VersionedTransaction(message)
    )

    await this.program.provider.connection.sendRawTransaction(
      setupProjecTransactionSigned.serialize()
    )

    const newFile = new File([image], `project-${name}.jpg`)

    await shdwDrive.uploadFile(shdw, newFile)
  }

  /**
   * Delete a project
   *  @param name Project name
   */
  public async deleteProject({ name }: { name: string }) {
    const ProjectPDA = getProjectPDA(name, this.program.programId)

    const ix = await this.program.methods
      .deleteProject()
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
