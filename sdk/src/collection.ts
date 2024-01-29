import { Program, Wallet } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { ShdwDrive } from '@shadow-drive/sdk'
import { Project } from './types/project'
import { PublicKey } from '@solana/web3.js'
import { AxiosResponse } from 'axios'
import { GENESYSGO_URL } from './constants/storage'
import verifyCollection from './utils/verifyCollection'
import GENESYS_API from './utils/api'
const UUID = require('uuid')

export default class Collection {
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
   * Get all files in a project
   */
  public async getAllFiles() {
    const response = await this.shdwDrive.listObjects(
      new PublicKey(this.project.shdw)
    )

    return response
  }

  /**
   * Create a new collection
   * @param name Collection name (e.g. 'posts')
   * @param structure Structure of the document - You can update this later if you want!
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
    const structureFile = new File(
      [
        JSON.stringify({
          ...structure,
          id: 'string'
        })
      ],
      `collection-${name}.json`,
      {
        type: 'application/json'
      }
    )

    let prefixes = name.split('.')

    const dataTransfer = new DataTransfer()

    if (prefixes.length === 1) {
      const emptyFile = new File([JSON.stringify([])], `doc-${name}.json`, {
        type: 'application/json'
      })

      dataTransfer.items.add(emptyFile)
    }

    dataTransfer.items.add(structureFile)

    await this.shdwDrive.uploadMultipleFiles(
      new PublicKey(this.project.shdw),
      dataTransfer.files
    )

    return {
      message: 'Collection created successfully',
      fileUrl: {
        collection: `${GENESYSGO_URL}/${this.project.shdw}/collection-${name}.json`,
        doc:
          prefixes.length === 1
            ? `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`
            : undefined
      }
    }
  }

  /**
   * Update the structure of a collection and migrate all data to the new structure
   * @param name Collection name (e.g. 'posts')
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
    const structureFile = new File(
      [
        JSON.stringify({
          ...structure,
          id: 'string'
        })
      ],
      `collection-${name}.json`,
      {
        type: 'application/json'
      }
    )

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/collection-${name}.json`,
      structureFile
    )

    return {
      message: 'Collection updated successfully',
      fileUrl: {
        collection: `${GENESYSGO_URL}/${this.project.shdw}/collection-${name}.json`,
        doc: `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`
      }
    }
  }

  /**
   * Add a new document to a collection
   * @param name Collection name (e.g. 'posts')
   * @param data Data to add to the collection
   *
   */
  public async addDoc<T>({ name, data }: { name: string; data: T }) {
    let prefixes = name.split('.')
    let newPrefixes = []

    prefixes.forEach((prefix) => {
      if (UUID.validate(prefix)) {
        newPrefixes.push('id')

        return
      }

      newPrefixes.push(prefix)
    })

    const collectionPrefix = newPrefixes.join('.')
    const collectionResponse: AxiosResponse<T> = await GENESYS_API.get(
      `/${this.project.shdw}/collection-${collectionPrefix}.json`
    )

    if (!collectionResponse.data) {
      throw new Error(
        'Collection does not exist, first create the collection trigger the createNewCollection()'
      )
    }

    const doc = {
      ...data,
      id: UUID.v4()
    }

    const isValidCollection = verifyCollection(collectionResponse.data, doc)

    if (!isValidCollection) return

    let docReponse

    try {
      docReponse = await GENESYS_API.get(
        `/${this.project.shdw}/doc-${name}.json`
      )
    } catch (error) {}

    const uploadFileResponse = await this.shdwDrive.uploadFile(
      new PublicKey(this.project.shdw),
      new File([JSON.stringify(doc)], `doc-${name}.${doc.id}.json`, {
        type: 'application/json'
      })
    )

    if (uploadFileResponse.upload_errors.length > 0) {
      throw new Error('Error to create new document')
    }

    if (docReponse) {
      await this.shdwDrive.editFile(
        new PublicKey(this.project.shdw),
        `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`,
        new File(
          [JSON.stringify([...docReponse.data, doc.id])],
          `doc-${name}.json`,
          {
            type: 'application/json'
          }
        )
      )
    }

    if (!docReponse) {
      await this.shdwDrive.uploadFile(
        new PublicKey(this.project.shdw),
        new File([JSON.stringify([doc.id])], `doc-${name}.json`, {
          type: 'application/json'
        })
      )
    }

    return {
      message: 'Document created successfully',
      doc,
      fileUrl: {
        collection: `${GENESYSGO_URL}/${this.project.shdw}/collection-${collectionPrefix}.json`,
        doc: `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`,
        docId: `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.${doc.id}.json`
      }
    }
  }

  /**
   * Get a document from a collection
   * @param name Collection name (e.g. 'posts')
   * @param id ID of the document to get if you want to get from a subcollection use (e.g. '1234.likes') or just (e.g. '1234') to get from the main collection
   *
   */
  public async getDoc({ name, id }: { name: string; id: string }) {
    const response = await GENESYS_API.get(
      `/${this.project.shdw}/doc-${name}.${id}.json`
    )

    return {
      message: 'Document fetched successfully',
      doc: response.data
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

    let prefixes = name.split('.')
    let newPrefixes = []

    prefixes.forEach((prefix) => {
      if (UUID.validate(prefix)) {
        newPrefixes.push('id')

        return
      }

      newPrefixes.push(prefix)
    })

    const collectionPrefix = newPrefixes.join('.')
    const collectionResponse: AxiosResponse<T> = await GENESYS_API.get(
      `/${this.project.shdw}/collection-${collectionPrefix}.json`
    )

    if (!collectionResponse.data) {
      throw new Error(
        'Collection does not exist, first create the collection trigger the createNewCollection()'
      )
    }

    const isValidCollection = verifyCollection(collectionResponse.data, data)

    if (!isValidCollection) return

    const dataReponse = await GENESYS_API.get(
      `/${this.project.shdw}/doc-${name}.${id}.json`
    )

    let doc = {
      ...dataReponse.data,
      ...data
    }

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.${id}.json`,
      new File([JSON.stringify(doc)], `doc-${name}.${id}.json`, {
        type: 'application/json'
      })
    )

    return {
      message: 'Document updated successfully',
      doc,
      fileUrl: {
        collection: `${GENESYSGO_URL}/${this.project.shdw}/collection-${collectionPrefix}.json`,
        doc: `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`,
        docId: `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.${doc.id}.json`
      }
    }
  }

  /**
   * Delete a document in a collection
   * @param name Collection name (e.g. 'posts')
   * @param id ID of the document to delete
   *
   */
  public async deleteDoc({ name, id }: { name: string; id: string }) {
    if (!id) {
      throw new Error('You must provide an ID to delete a document')
    }

    const dataReponse = await GENESYS_API.get(
      `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`
    )

    const response = await this.shdwDrive.deleteFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.${id}.json`
    )

    if (!response?.transaction_signature) {
      throw new Error('Error to delete document')
    }

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/doc-${name}.json`,
      new File(
        [JSON.stringify(dataReponse.data.filter((id: string) => id !== id))],
        `doc-${name}.json`,
        {
          type: 'application/json'
        }
      )
    )

    return {
      message: response.message || 'Document deleted successfully'
    }
  }
}
