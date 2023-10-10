import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { Wallet } from './types/wallet'
import { ShdwDrive } from '@shadow-drive/sdk'
import { ProjectConfig } from './types/project'
import { PublicKey } from '@solana/web3.js'

export default class Collection {
  program: Program<Firethree>
  wallet: Wallet
  project: ProjectConfig
  shdwDrive: ShdwDrive

  constructor(
    program: Program<Firethree>,
    wallet: Wallet,
    project: ProjectConfig
  ) {
    this.program = program
    this.wallet = wallet
    this.project = project

    this.init()
  }

  async init() {
    this.shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()
  }

  /**
   * Set a doc for a project
   * @param {Object} params
   */
  public async setDoc({}) {}

  /**
   * Set the structure of a collection
   * @param collectionName Collection name to set the structure for (e.g. 'posts')
   * @param structure Structure of the collection
   *
   * e.g.
   * ```
   * {
   *   title: "string",
   *   body: "string",
   *   image: "string",
   *   createdAt: "number",
   * }
   * ```
   */
  public async setStructure<T>({
    collectionName,
    structure
  }: {
    collectionName: string
    structure: T
  }) {
    if (!this.shdwDrive) throw new Error('Genesys Shadow Drive not initialized')

    const shdw = this.project.shdw

    if (!shdw)
      throw new Error('Project does not have a shdw drive associated with it')

    const file = new File(
      [JSON.stringify(structure)],
      `structure-${collectionName}.json`,
      {
        type: 'application/json'
      }
    )

    const response = await this.shdwDrive.uploadFile(new PublicKey(shdw), file)

    return response
  }
}
