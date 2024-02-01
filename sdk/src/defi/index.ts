import { FIRETHREE_PROGRAM_ID } from '../constants/program'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'
import { IDL, Firethree } from '../types/firethree'
import Vault from './vault'
import PriceAlert from './price-alert'

export default class Defi {
  program: Program<Firethree>
  provider: AnchorProvider
  connection: Connection
  wallet: Wallet
  vault: Vault
  priceAlert: PriceAlert

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
    this.vault = new Vault(this.connection, this.wallet)
    this.priceAlert = new PriceAlert(this.connection, this.wallet)
  }
}
