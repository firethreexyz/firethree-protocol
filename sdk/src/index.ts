import { Connection } from '@solana/web3.js'
import Project from './project'
import { Wallet } from '@coral-xyz/anchor'

export default class Firethree {
  project: Project

  constructor(connection: Connection, wallet: Wallet) {
    this.project = new Project(connection, wallet)
  }
}
