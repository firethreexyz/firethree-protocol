import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { Wallet } from './types/wallet'
import { getProjectPDA } from './utils/helpers'
import { ShdwDrive } from '@shadow-drive/sdk'

export default class Hosting {
  program: Program<Firethree>
  wallet: Wallet
  projectName: string

  constructor(
    program: Program<Firethree>,
    wallet: Wallet,
    projectName: string
  ) {
    this.program = program
    this.wallet = wallet
    this.projectName = projectName
  }

  public async deploy(projectName: string) {
    const ProjectPDA = getProjectPDA(projectName, this.program.programId)

    const project = await this.program.account.project.fetch(ProjectPDA)

    const shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()

    // const projectShdw = await shdwDrive.uploadFile(project.shdw, {})

    // console.log(projectShdw)
  }
}
