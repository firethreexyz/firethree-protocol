import { Program, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { Firethree } from '../types/firethree'
import {
  PythConnection,
  getPythProgramKeyForCluster
} from '@pythnetwork/client'
import { PythVerbosePriceCallback } from '@pythnetwork/client/lib/PythConnection'
import Project from './../project'
const UUID = require('uuid')

export default class PriceAlert {
  program: Program<Firethree>
  connection: Connection
  pythConnection: PythConnection
  project: Project

  constructor(connection: Connection, project: Project) {
    this.connection = connection
    this.project = project

    this.pythConnection = new PythConnection(
      connection,
      getPythProgramKeyForCluster('mainnet-beta'),
      'confirmed'
    )
  }

  /**
   * Price Changes
   * @param callback Callback function to be called when the price changes
   */
  onPriceChange(callback: PythVerbosePriceCallback) {
    this.pythConnection.onPriceChangeVerbose(callback)
  }

  setupPriceAlerts() {
    return this.project.collection.createNewCollection({
      name: 'price-alerts',
      structure: {
        id: 'string',
        asset: 'string',
        user: 'string',
        price: 'number',
        isNear: 'boolean',
        telegram: 'string',
        email: 'string'
      }
    })
  }

  async subscribe() {
    await this.pythConnection.start()
  }

  async unsubscribe() {
    await this.pythConnection.stop()
  }

  /**
   * Create a new price alert
   * @param user The user who is creating the alert
   * @param config The alert configuration
   *
   */
  async create(user: PublicKey, config: AlertConfig) {
    const alerts = [config]

    const currentAlerts = await this.project.collection.getDoc({
      collection: 'price-alerts',
      id: user.toBase58()
    })

    if (currentAlerts.doc) {
      alerts.push(...currentAlerts.doc)

      await this.project.collection.editDoc({
        collection: 'price-alerts',
        id: user.toBase58(),
        data: alerts
      })

      return 'Alert created successfully'
    }

    await this.project.collection.addDoc({
      collection: 'price-alerts',
      id: user.toBase58(),
      data: alerts
    })

    return 'Alert created successfully'
  }
}

//
// Utils
//

type AlertConfig = {
  id: string
  asset: string
  price: number
  isNear: boolean
  telegram?: string
  email?: string
}
