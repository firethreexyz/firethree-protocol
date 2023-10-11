import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { Wallet } from './types/wallet'
import { ShdwDrive } from '@shadow-drive/sdk'
import { ProjectConfig } from './types/project'
import { PublicKey } from '@solana/web3.js'
import axios, { AxiosResponse } from 'axios'
import { GENESYSGO_URL } from './constants/storage'
import shadowVerifyAccount from './utils/shadowVerifyAccount'
import { v4 as UUID } from 'uuid'
import verifyCollectionStructure from './utils/verifyCollectionStructure'

export default class Collection {
  program: Program<Firethree>
  wallet: Wallet
  project: ProjectConfig
  shdwDrive: ShdwDrive

  constructor(
    program: Program<Firethree>,
    wallet: Wallet,
    project: ProjectConfig
  ) {
    this.program = program
    this.wallet = wallet
    this.project = project

    this.init()
  }

  async init() {
    this.shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()
  }

  /**
   * Get all files in a project
   */
  public async getAllFiles() {
    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const response = await this.shdwDrive.listObjects(
      new PublicKey(this.project.shdw)
    )

    return response
  }

  /**
   * Create a new collection
   * @param name Collection name to set the structure for (e.g. 'posts')
   * @param structure Structure of the collection - You can update this later if you want!
   *
   * e.g.
   * ```
   * {
   *   title: "string",
   *   body: "string",
   *   image: "string",
   *   createdAt: "number",
   * }
   * ```
   */
  public async createNewCollection<T>({
    name,
    structure
  }: {
    name: string
    structure: T
  }) {
    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const structureFile = new File(
      [JSON.stringify(structure)],
      `structure-${name}.json`,
      {
        type: 'application/json'
      }
    )

    const emptyFile = new File([JSON.stringify([])], `data-${name}.json`, {
      type: 'application/json'
    })

    const dataTransfer = new DataTransfer()

    dataTransfer.items.add(structureFile)
    dataTransfer.items.add(emptyFile)

    this.shdwDrive.uploadMultipleFiles(
      new PublicKey(this.project.shdw),
      dataTransfer.files
    )

    return {
      message: 'Collection created successfully',
      fileUrl: {
        structure: `${GENESYSGO_URL}/${this.project.shdw}/structure-${name}.json`,
        data: `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.json`
      }
    }
  }

  /**
   * Update the structure of a collection and add missing keys to existing documents
   * @param name Collection name to set the structure for (e.g. 'posts')
   * @param structure New structure of the collection - `WARNING: This will overwrite the old structure!`
   * e.g.
   * ```
   * {
   *   title: "string",
   *   body: "string",
   * }
   * ```
   */
  public async updateCollection<T>({
    name,
    structure
  }: {
    name: string
    structure: T
  }) {
    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const structureFile = new File(
      [JSON.stringify(structure)],
      `structure-${name}.json`,
      {
        type: 'application/json'
      }
    )

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/structure-${name}.json`,
      structureFile
    )

    return {
      message: 'Collection updated successfully',
      fileUrl: {
        structure: `${GENESYSGO_URL}/${this.project.shdw}/structure-${name}.json`,
        data: `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.json`
      }
    }
  }

  /**
   * Add a new document to a collection
   * @param name Collection name to set the structure for (e.g. 'posts')
   * @param data Data to add to the collection
   *
   */
  public async addDoc<T>({ name, data }: { name: string; data: T }) {
    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const structureResponse: AxiosResponse<T> = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/structure-${name}.json`
    )

    const isValidStructure = verifyCollectionStructure(
      structureResponse.data,
      data
    )

    if (!isValidStructure) return

    const dataReponse = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.json`
    )

    const uuid = UUID()

    const uploadFileResponse = await this.shdwDrive.uploadFile(
      new PublicKey(this.project.shdw),
      new File(
        [
          JSON.stringify({
            ...data,
            uuid
          })
        ],
        `data-${name}.${uuid}.json`,
        {
          type: 'application/json'
        }
      )
    )

    if (uploadFileResponse.upload_errors.length > 0) {
      throw new Error('Error to create new document')
    }

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.json`,
      new File(
        [JSON.stringify([...dataReponse.data, uuid])],
        `data-${name}.json`,
        {
          type: 'application/json'
        }
      )
    )

    return {
      message: 'Document created successfully',
      data: {
        ...data,
        uuid
      },
      fileUrl: `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.${uuid}.json`
    }
  }

  /**
   * Edit a document in a collection
   * @param name Collection name to set the structure for (e.g. 'posts')
   * @param id ID of the document to edit
   * @param data New data to merge with the existing data (e.g. { title: "New Title" }) or all old data with the updated fields (e.g. { title: "New Title", body: "New Body" })
   *
   */
  public async editDoc<T>({
    name,
    id,
    data
  }: {
    name: string
    id: string
    data: T
  }) {
    if (!id) {
      throw new Error('You must provide an ID to edit a document')
    }

    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const structureResponse: AxiosResponse<T> = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/structure-${name}.json`
    )

    const isValidStructure = verifyCollectionStructure(
      structureResponse.data,
      data
    )

    if (!isValidStructure) return

    const dataReponse = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.${id}.json`
    )

    let newData: T = {
      ...dataReponse.data,
      ...data
    }

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.${id}.json`,
      new File([JSON.stringify(newData)], `data-${name}.${id}.json`, {
        type: 'application/json'
      })
    )

    return {
      message: 'Document updated successfully',
      data: newData,
      fileUrl: `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.${id}.json`
    }
  }

  /**
   * Delete a document in a collection
   * @param name Collection name to set the structure for (e.g. 'posts')
   * @param id ID of the document to delete
   *
   */
  public async deleteDoc({ name, id }: { name: string; id: string }) {
    if (!id) {
      throw new Error('You must provide an ID to edit a document')
    }

    const dataReponse = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.json`
    )

    await this.shdwDrive.deleteFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.${id}.json`
    )

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/data-${name}.json`,
      new File(
        [
          JSON.stringify(dataReponse.data.filter((uuid: string) => uuid !== id))
        ],
        `data-${name}.json`,
        {
          type: 'application/json'
        }
      )
    )

    return {
      message: 'Document deleted successfully'
    }
  }
}
