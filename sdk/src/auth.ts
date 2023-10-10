import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { Wallet } from './types/wallet'

export default class Auth {
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
}
