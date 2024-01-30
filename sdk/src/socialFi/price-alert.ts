import { Program, Wallet } from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'
import { Firethree } from '../types/firethree'

export default class PriceAlert {
  program: Program<Firethree>
  connection: Connection
  wallet: Wallet

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection
    this.wallet = wallet
  }
}
