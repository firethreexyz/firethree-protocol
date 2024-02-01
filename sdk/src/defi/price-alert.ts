import { Program, Wallet } from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'
import { Firethree } from '../types/firethree'
import {
  PythConnection,
  getPythProgramKeyForCluster
} from '@pythnetwork/client'
import { PythVerbosePriceCallback } from '@pythnetwork/client/lib/PythConnection'

export default class PriceAlert {
  program: Program<Firethree>
  connection: Connection
  wallet: Wallet
  pythConnection: PythConnection

  constructor(connection: Connection, wallet?: Wallet) {
    this.connection = connection
    this.wallet = wallet

    this.pythConnection = new PythConnection(
      connection,
      getPythProgramKeyForCluster('mainnet-beta'),
      'confirmed'
    )
  }

  onPriceChange(callback: PythVerbosePriceCallback) {
    this.pythConnection.onPriceChangeVerbose(callback)
  }

  async subscribe() {
    await this.pythConnection.start()
  }

  async unsubscribe() {
    await this.pythConnection.stop()
  }
}
