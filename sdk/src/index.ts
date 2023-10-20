import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { ConfirmOptions, Connection } from '@solana/web3.js'
import { Wallet } from './types/wallet'
import { Project as IProject } from './types/project'
import { Firethree as IFirethree } from './types/firethree'
import IDL from './idl/firethree.json'
import { FIRETHREE_PROGRAM_ID } from './constants/program'
import Auth from './auth'
import Analytics from './analytics'
import Collection from './collection'
import Storage from './storage'
import Project from './project'
import { ShdwDrive } from '@shadow-drive/sdk'

export default class Firethree {
  auth: Auth
  analytics: Analytics
  collection: Collection
  storage: Storage
  project: Project
  program: Program<IFirethree>
  provider: AnchorProvider
  connection: Connection
  wallet: Wallet
  opts: ConfirmOptions

  constructor(connection: Connection, wallet?: Wallet, opts?: ConfirmOptions) {
    this.connection = connection
    this.wallet = wallet
    this.opts = opts || AnchorProvider.defaultOptions()
    this.provider = new AnchorProvider(this.connection, this.wallet, this.opts)
    this.program = new Program<IFirethree>(
      IDL as IFirethree,
      FIRETHREE_PROGRAM_ID,
      this.provider
    )

    this.project = new Project(this.program, this.wallet)
  }

  async init(projectName: string) {
    const project = await this.project.get(projectName)

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
}
