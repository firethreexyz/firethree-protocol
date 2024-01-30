import { Program, Wallet } from '@coral-xyz/anchor'
import { Firethree } from '../types/firethree'
import { ShdwDrive } from '@shadow-drive/sdk'
import { PublicKey } from '@solana/web3.js'
import { Project } from '../types/project'
import { GENESYSGO_URL } from '../constants/storage'
import { v4 as uuidv4 } from 'uuid'
import GENESYS_API from '../utils/api'

export default class Storage {
  program: Program<Firethree>
  wallet: Wallet
  project: Project
  shdwDrive: ShdwDrive
  shdwKey: PublicKey

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
   * Add Multiple Files
   * @param folder Folder to upload files (e.g. 'images/users/user1')
   * @param files List of files to be uploaded
   */
  public async addMultipleFiles(folder: string, files: FileList) {
    const dataTransfer = new DataTransfer()

    const replaceFolder = folder.replace('/', '-')

    Array.from(files).map((file) => {
      const newFile = new File(
        [file],
        `${replaceFolder}-${uuidv4()}.${file.name}`,
        {
          type: file.type
        }
      )

      dataTransfer.items.add(newFile)
    })

    return this.shdwDrive.uploadMultipleFiles(this.shdwKey, dataTransfer.files)
  }

  /**
   * Add File
   * @param folder Folder to upload file (e.g. 'images/users/user1')
   * @param files File to be uploaded
   */
  public async addFile(folder: string, file: File) {
    const replaceFolder = folder.replace('/', '-')

    const newFile = new File(
      [file],
      `${replaceFolder}-${uuidv4()}.${file.name}`,
      {
        type: file.type
      }
    )

    return this.shdwDrive.uploadFile(this.shdwKey, newFile)
  }

  /**
   * Get File
   * @param filePath File Path
   */
  async getFile(filePath: string) {
    const response = await GENESYS_API.get(`/${this.project.shdw}/${filePath}`)

    if (!response.data) throw new Error('File not found')

    return {
      message: 'Document fetched successfully',
      file: response.data
    }
  }

  /**
   * Delete File
   * @param filePath File Path
   */
  async deleteFile(filePath: string) {
    if (!filePath) {
      throw new Error('You must provide an filePath to delete a document')
    }

    const response = await this.shdwDrive.deleteFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/${filePath}`
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
   * @param filePath File Path
   * @param newFile New File
   */
  async updateFile(filePath: string, newFile: File) {
    if (!filePath) {
      throw new Error('You must provide an filePath to edit a document')
    }

    const file = new File([newFile], `${filePath}`, {
      type: newFile.type
    })

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/${filePath}`,
      file
    )
  }
}
