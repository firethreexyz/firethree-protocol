import { Connection } from '@solana/web3.js'
import Defi from './defi'
import Project from './project'
import { Wallet } from '@coral-xyz/anchor'

export default class Firethree {
  defi: Defi
  project: Project

  constructor(connection: Connection, wallet: Wallet) {
    this.project = new Project(connection, wallet)
    this.defi = new Defi(connection, wallet, this.project)
  }
}
