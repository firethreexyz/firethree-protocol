import { Program, Wallet } from '@coral-xyz/anchor'
import { Firethree } from '../types/firethree'
import { ShdwDrive } from '@shadow-drive/sdk'
import { Project } from '../types/project'
import { PublicKey } from '@solana/web3.js'
import GENESYS_API from '../utils/api'

export default class Fv {
  program: Program<Firethree>
  wallet: Wallet
  project: Project
  shdwDrive: ShdwDrive

  constructor(
    program: Program<Firethree>,
    wallet: Wallet,
    shdwDrive: ShdwDrive,
    project: Project
  ) {
    this.program = program
    this.wallet = wallet
    this.project = project
    this.shdwDrive = shdwDrive
  }

  /**
   * Get a document from the cache
   * @param key Key of the cache
   *
   */
  private async getDoc(key: string) {
    const response = await GENESYS_API.get(`/${this.project.shdw}/${key}.json`)

    if (!response.data) {
      return null
    }

    return response.data
  }

  /**
   * Get a cache
   * @param key Key of the cache
   *
   */
  public async get<T>(key: string): Promise<T | null> {
    const response = (await this.getDoc(key)) as {
      data: string
      expireAt: number
    }

    if (!response) {
      throw new Error('Cache not found')
    }

    const date = new Date().getTime()

    if (response.expireAt < date) {
      this.del(key)

      return JSON.parse(response.data)
    }

    return JSON.parse(response.data)
  }

  /**
   * Create a new redis cache
   * @param key Key of the cache
   * @param data Data to add to the cache
   * @param expireAt Time in milliseconds to expire the cache
   *
   */
  public async set<T>(key: string, data: T, expireAt: number) {
    const doc = {
      data,
      expireAt
    }

    const getDoc = await this.getDoc(key)

    if (getDoc) {
      await this.del(key)
    }

    await this.shdwDrive.uploadFile(
      new PublicKey(this.project.shdw),
      new File([JSON.stringify(doc)], `${key}.json`, {
        type: 'application/json'
      })
    )
  }

  /**
   * Delete a cache
   * @param key Key of the cache
   *
   */
  public async del(key: string) {
    await this.shdwDrive.deleteFile(new PublicKey(this.project.shdw), key)
  }
}
