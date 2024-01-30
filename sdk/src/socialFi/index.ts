import { FIRETHREE_PROGRAM_ID } from './../constants/program'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'
import { IDL, Firethree } from './../types/firethree'

export class socialFi {
  program: Program<Firethree>
  provider: AnchorProvider
  connection: Connection
  wallet: Wallet

  constructor(connection: Connection, wallet?: Wallet) {
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
}
