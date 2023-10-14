import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { Wallet } from './types/wallet'
import { ShdwDrive } from '@shadow-drive/sdk'
import { PublicKey } from '@solana/web3.js'
import { Project } from './types/project'
import shadowVerifyAccount from './utils/shadowVerifyAccount'
import axios from 'axios'
import { GENESYSGO_URL } from './constants/storage'
const UUID = require('uuid')

export default class Storage {
  program: Program<Firethree>
  wallet: Wallet
  project: Project
  shdwDrive: ShdwDrive
  shdwKey: PublicKey

  constructor(program: Program<Firethree>, wallet: Wallet, project: Project) {
    this.program = program
    this.wallet = wallet
    this.project = project
    this.shdwKey = new PublicKey(this.project.shdw)

    this.init()
  }

  private async init() {
    this.shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()
  }

  /**
   * Add Multiple Files
   * @param files List of files to be uploaded
   */
  public async addMultipleFiles(files: FileList) {
    shadowVerifyAccount(this.shdwDrive, this.shdwKey)

    const dataTransfer = new DataTransfer()

    Array.from(files).map((file) => {
      const newFile = new File([file], `${UUID.v4()}-${file.name}`, {
        type: file.type
      })

      dataTransfer.items.add(newFile)
    })

    return this.shdwDrive.uploadMultipleFiles(this.shdwKey, dataTransfer.files)
  }

  /**
   * Add File
   * @param files File to be uploaded
   */
  public async addFile(file: File) {
    shadowVerifyAccount(this.shdwDrive, this.shdwKey)

    const newFile = new File([file], `${UUID.v4()}-${file.name}`, {
      type: file.type
    })

    return this.shdwDrive.uploadFile(this.shdwKey, newFile)
  }

  /**
   * Get File
   * @param id File ID
   */
  async getFile(id: string) {
    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const response = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/${id}.json`
    )

    if (!response.data) throw new Error('File not found')

    return {
      message: 'Document fetched successfully',
      file: response.data
    }
  }

  /**
   * Delete File
   * @param id File ID
   */
  async deleteFile(id: File) {
    if (!id) {
      throw new Error('You must provide an ID to delete a document')
    }

    const response = await this.shdwDrive.deleteFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/${id}.json`
    )

    if (!response?.transaction_signature) {
      throw new Error('Error to delete document')
    }

    return {
      message: response.message || 'Document deleted successfully'
    }
  }

  /**
   * Update File
   * @param id File ID
   * @param newFile New File
   */
  async updateFile(id: string, newFile: File) {
    if (!id) {
      throw new Error('You must provide an ID to edit a document')
    }

    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const file = new File([newFile], `${UUID.v4()}-${newFile.name}`, {
      type: newFile.type
    })

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/${id}.json`,
      file
    )
  }
}
