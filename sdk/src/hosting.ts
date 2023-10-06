import { ConfirmOptions, Connection } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Firethree, IDL } from './types/firethree'
import { FIRETHREE_PROGRAM_ID } from './constants/program'
import { getProjectPDA } from './utils/helpers'
import { ShdwDrive } from '@shadow-drive/sdk'
import { Wallet } from './types/wallet'

export default class Hosting {
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
      IDL,
      FIRETHREE_PROGRAM_ID,
      this.provider
    )
  }

  public async deploy(projectName: string) {
    const ProjectPDA = getProjectPDA(projectName, this.program.programId)

    const project = await this.program.account.project.fetch(ProjectPDA)

    const shdwDrive = await new ShdwDrive(this.connection, this.wallet).init()

    // const projectShdw = await shdwDrive.uploadFile(project.shdw, {})

    // console.log(projectShdw)
  }
}
